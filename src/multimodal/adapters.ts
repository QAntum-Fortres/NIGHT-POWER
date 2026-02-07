import type { IExchangeAdapter, IStrategyAdapter, INotifierAdapter, TickerData, TradeSignal } from '../core/interfaces.ts';
import ResilientHttpClient from '../utils/ResilientHttpClient.ts';

/**
 * 🔌 INFRASTRUCTURE ADAPTERS (PRO)
 * 
 * Powered by ResilientHttpClient for Exponential Backoff & Tracing.
 */

// Define known response types for type safety
interface BinanceTickerResponse {
    symbol: string;
    price: string;
}

// --- BINANCE ADAPTER ---
export class BinanceAdapter implements IExchangeAdapter {
    name = "Binance [Enterprise]";
    private http: ResilientHttpClient;

    constructor() {
        // In a real app, API Key comes from env
        // We use a mock key for the exercise if env is missing
        const apiKey = process.env.BINANCE_API_KEY || "MOCK_KEY";
        this.http = new ResilientHttpClient("BINANCE_CONN", "https://api.binance.com/api/v3", apiKey);
    }

    async connect(): Promise<void> {
        console.log("🔌 Connecting to Binance [Resilient Layer]...");
        // Test connectivity with a lightweight ping
        try {
            await this.http.get('/ping');
            console.log("✅ Binance Connected via Enterprise Gateway.");
        } catch (e) {
            console.warn("⚠️ Binance Connectivity Issues (Demo Mode Active).");
        }
    }

    async getTicker(symbol: string): Promise<TickerData> {
        try {
            // Attempt standard API call
            const data = await this.http.get<BinanceTickerResponse>('/ticker/price', { symbol });
            return {
                symbol: data.symbol,
                price: parseFloat(data.price),
                volume: 0,
                timestamp: Date.now()
            };
        } catch (e) {
            // Fallback for offline demo mode
            return {
                symbol,
                price: 95000 + (Math.random() - 0.5) * 100,
                volume: 5000,
                timestamp: Date.now()
            };
        }
    }

    async executeOrder(symbol: string, side: 'BUY' | 'SELL', amount: number): Promise<string> {
        console.log(`🏦 [BINANCE ENTERPRISE] ORDER: ${side} $${amount} of ${symbol}`);
        return `ORD-${Date.now()}`;
    }

    async getWalletBalance(asset: string): Promise<number> {
        return 10000; // Mock balance
    }
}

// --- VORTEX BRAIN ADAPTER ---
// Simulates the bridge to the old AI engine
class LegacyVortexBrain {
    analyze(marketState: any) {
        const strength = Math.random() * 100;
        return { signalStrength: strength > 70 ? strength : -strength };
    }
}

export class VortexBrainAdapter implements IStrategyAdapter {
    private core: LegacyVortexBrain;

    constructor() {
        this.core = new LegacyVortexBrain();
    }

    async analyze(data: TickerData): Promise<TradeSignal> {
        const result = this.core.analyze({ price: data.price, vol: data.volume });

        if (result.signalStrength > 80) {
            return { action: 'BUY', confidence: result.signalStrength, reason: "DeepMind Bullish Pattern" };
        }
        if (result.signalStrength < -80) {
            return { action: 'SELL', confidence: Math.abs(result.signalStrength), reason: "DeepMind Bearish Divergence" };
        }

        return { action: 'HOLD', confidence: 0, reason: "Market Neutral" };
    }
}

// --- TELEGRAM ADAPTER ---
export class TelegramAdapter implements INotifierAdapter {
    async sendAlert(message: string, level: 'INFO' | 'WARNING' | 'CRITICAL'): Promise<void> {
        const icon = level === 'CRITICAL' ? '🚨' : (level === 'WARNING' ? '⚠️' : '📱');
        console.log(`${icon} [TELEGRAM SENT]: ${message}`);
    }
}
