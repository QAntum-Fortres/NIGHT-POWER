import type { IStrategyAdapter, TickerData, TradeSignal } from '../core/interfaces.ts';
import VortexDeepMind, { type ICandle } from '../core/VortexDeepMind.ts';
import ResilientHttpClient from '../utils/ResilientHttpClient.ts';
import Logger from '../utils/Logger.ts'; // Assuming Logger is available in utils or reusing Engine logger

/**
 * 🧠 DEEP MIND ADAPTER
 * 
 * Bridges the gap between:
 * 1. The Hexagonal Engine (which speaks 'TickerData')
 * 2. The VortexDeepMind Math Core (which speaks 'Candles' and 'RSI')
 * 
 * Feature: AUTOMATIC WARMUP
 * Before trading, it pulls 300 minutes of history to prime the indicators.
 */
export default class DeepMindAdapter implements IStrategyAdapter {
    private brain: VortexDeepMind;
    private http: ResilientHttpClient;
    private symbol: string;

    constructor(symbol: string, apiKey: string) {
        this.symbol = symbol;
        this.brain = new VortexDeepMind();
        // Dedicated HTTP client for historical data fetching
        this.http = new ResilientHttpClient(`HIST-${symbol.replace('/', '')}`, 'https://api.binance.com/api/v3', apiKey);
    }

    /**
     * 🔥 WARMUP: Downloads history to prime RSI/MACD
     */
    public async warmup() {
        // Use console directly if Logger not fully set up in this context, or use standard Logger
        console.log(`[${this.symbol}] ⏳ Downloading historical market data (300m)...`);

        try {
            // Fetch last 300 candles (1m interval)
            // Endpoint: /api/v3/klines?symbol=BTCUSDT&interval=1m&limit=300
            const symbolClean = this.symbol.replace('/', '');
            const klines: any[] = await this.http.get('/klines', {
                symbol: symbolClean,
                interval: '1m',
                limit: 300
            });

            // Feed the Brain
            klines.forEach(k => {
                const candle: ICandle = {
                    timestamp: k[0],
                    open: parseFloat(k[1]),
                    high: parseFloat(k[2]),
                    low: parseFloat(k[3]),
                    close: parseFloat(k[4]),
                    volume: parseFloat(k[5])
                };
                this.brain.ingest(candle);
            });

            console.log(`[${this.symbol}] 🧠 Brain fully charged with ${klines.length} historical candles.`);
        } catch (error) {
            console.error(`[${this.symbol}] ❌ Warmup Failed! Indicators will be inaccurate initially.`, error);
        }
    }

    /**
     * ⚡ ANALYZE: Real-time processing
     */
    async analyze(ticker: TickerData): Promise<TradeSignal> {
        // 1. Convert Ticker to Candle (Approximation for HFT)
        const currentCandle: ICandle = {
            timestamp: ticker.timestamp,
            open: ticker.price,
            high: ticker.price,
            low: ticker.price,
            close: ticker.price,
            volume: ticker.volume
        };

        // 2. Feed the Beast
        this.brain.ingest(currentCandle);

        // 3. Get Analysis
        const analysis = this.brain.analyze(this.symbol);

        if (!analysis) {
            return { action: 'HOLD', confidence: 0, reason: "Insufficient Data" };
        }

        // 4. Translate Score (-100 to +100) to Signal
        const score = analysis.signalStrength;

        if (score >= 75) {
            return {
                action: 'BUY',
                confidence: score,
                reason: `STRONG BUY | RSI: ${analysis.indicators.rsi.toFixed(1)}`
            };
        }

        if (score <= -75) {
            return {
                action: 'SELL',
                confidence: Math.abs(score),
                reason: `STRONG SELL | MACD Divergence`
            };
        }

        // Logic for Stop Loss could go here if we tracked position state in the adapter
        // but for now, we leave it to the Engine/Exit logic.

        return { action: 'HOLD', confidence: 0, reason: `Neutral (${score.toFixed(1)})` };
    }
}
