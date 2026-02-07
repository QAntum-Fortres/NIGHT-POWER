/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  QAntum Prime v28.1 - EXCHANGE CONNECTORS                                 ║
 * ║  "Вратата към борсите" - Binance + Kraken + More                          ║
 * ║                                                                           ║
 * ║  🏦 Real exchange API integration with Fortress encryption                ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import { liveWalletManager } from './LiveWalletManager';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase?: string; // For exchanges that require it (Coinbase, OKX)
}

export interface OrderParams {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: number;
  price?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
}

export interface Order {
  id: string;
  exchange: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  status: 'new' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected';
  quantity: number;
  filledQuantity: number;
  price: number;
  avgFillPrice: number;
  fee: number;
  feeCurrency: string;
  createdAt: number;
  updatedAt: number;
}

export interface Balance {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

export interface Ticker {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  volume24h: number;
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// BINANCE CONNECTOR
// ═══════════════════════════════════════════════════════════════════════════

class BinanceConnector extends EventEmitter {
  private apiKey: string = '';
  private apiSecret: string = '';
  private baseUrl = 'https://api.binance.com';
  private wsUrl = 'wss://stream.binance.com:9443/ws';
  
  private isConfigured = false;
  
  configure(credentials: ExchangeCredentials): void {
    this.apiKey = credentials.apiKey;
    this.apiSecret = credentials.apiSecret;
    this.isConfigured = true;
    console.log('[Binance] ✅ Configured');
  }
  
  private sign(queryString: string): string {
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(queryString)
      .digest('hex');
  }
  
  private async request(
    endpoint: string, 
    method: string = 'GET', 
    params: Record<string, any> = {},
    signed: boolean = false
  ): Promise<any> {
    if (!this.isConfigured) throw new Error('Binance not configured');
    
    const headers: Record<string, string> = {
      'X-MBX-APIKEY': this.apiKey,
    };
    
    let url = `${this.baseUrl}${endpoint}`;
    let body: string | undefined;
    
    if (signed) {
      params.timestamp = Date.now();
      params.recvWindow = 5000;
    }
    
    const queryString = new URLSearchParams(params).toString();
    
    if (signed) {
      params.signature = this.sign(queryString);
    }
    
    const finalQueryString = new URLSearchParams(params).toString();
    
    if (method === 'GET' || method === 'DELETE') {
      url += `?${finalQueryString}`;
    } else {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      body = finalQueryString;
    }
    
    try {
      const response = await fetch(url, { method, headers, body });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.msg || `Binance API error: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('[Binance] API error:', error);
      throw error;
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // PUBLIC ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════
  
  async getTicker(symbol: string): Promise<Ticker> {
    const data = await this.request('/api/v3/ticker/bookTicker', 'GET', { symbol });
    
    return {
      symbol: data.symbol,
      bid: parseFloat(data.bidPrice),
      ask: parseFloat(data.askPrice),
      last: parseFloat(data.bidPrice), // Will update from 24hr
      volume24h: 0,
      timestamp: Date.now(),
    };
  }
  
  async getAllTickers(): Promise<Ticker[]> {
    const data = await this.request('/api/v3/ticker/bookTicker');
    
    return data.map((t: any) => ({
      symbol: t.symbol,
      bid: parseFloat(t.bidPrice),
      ask: parseFloat(t.askPrice),
      last: parseFloat(t.bidPrice),
      volume24h: 0,
      timestamp: Date.now(),
    }));
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE ENDPOINTS (Signed)
  // ═══════════════════════════════════════════════════════════════════════
  
  async getBalances(): Promise<Balance[]> {
    const data = await this.request('/api/v3/account', 'GET', {}, true);
    
    return data.balances
      .filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
      .map((b: any) => ({
        asset: b.asset,
        free: parseFloat(b.free),
        locked: parseFloat(b.locked),
        total: parseFloat(b.free) + parseFloat(b.locked),
      }));
  }
  
  async createOrder(params: OrderParams): Promise<Order> {
    const orderParams: Record<string, any> = {
      symbol: params.symbol,
      side: params.side.toUpperCase(),
      type: params.type.toUpperCase(),
      quantity: params.quantity.toString(),
    };
    
    if (params.type === 'limit') {
      orderParams.price = params.price!.toString();
      orderParams.timeInForce = params.timeInForce || 'GTC';
    }
    
    const data = await this.request('/api/v3/order', 'POST', orderParams, true);
    
    return this.mapOrder(data);
  }
  
  async cancelOrder(symbol: string, orderId: string): Promise<Order> {
    const data = await this.request('/api/v3/order', 'DELETE', {
      symbol,
      orderId,
    }, true);
    
    return this.mapOrder(data);
  }
  
  async getOpenOrders(symbol?: string): Promise<Order[]> {
    const params = symbol ? { symbol } : {};
    const data = await this.request('/api/v3/openOrders', 'GET', params, true);
    return data.map((o: any) => this.mapOrder(o));
  }
  
  private mapOrder(data: any): Order {
    return {
      id: data.orderId.toString(),
      exchange: 'binance',
      symbol: data.symbol,
      side: data.side.toLowerCase() as 'buy' | 'sell',
      type: data.type.toLowerCase() as 'market' | 'limit',
      status: this.mapStatus(data.status),
      quantity: parseFloat(data.origQty),
      filledQuantity: parseFloat(data.executedQty),
      price: parseFloat(data.price),
      avgFillPrice: parseFloat(data.cummulativeQuoteQty) / parseFloat(data.executedQty) || 0,
      fee: 0, // Would need trade endpoint for fills
      feeCurrency: '',
      createdAt: data.time || data.transactTime,
      updatedAt: data.updateTime || data.transactTime,
    };
  }
  
  private mapStatus(status: string): Order['status'] {
    const map: Record<string, Order['status']> = {
      'NEW': 'new',
      'FILLED': 'filled',
      'PARTIALLY_FILLED': 'partially_filled',
      'CANCELED': 'cancelled',
      'REJECTED': 'rejected',
      'EXPIRED': 'cancelled',
    };
    return map[status] || 'new';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// KRAKEN CONNECTOR
// ═══════════════════════════════════════════════════════════════════════════

class KrakenConnector extends EventEmitter {
  private apiKey: string = '';
  private apiSecret: string = '';
  private baseUrl = 'https://api.kraken.com';
  
  private isConfigured = false;
  
  configure(credentials: ExchangeCredentials): void {
    this.apiKey = credentials.apiKey;
    this.apiSecret = credentials.apiSecret;
    this.isConfigured = true;
    console.log('[Kraken] ✅ Configured');
  }
  
  private sign(path: string, nonce: string, postData: string): string {
    const message = nonce + postData;
    const sha256 = crypto.createHash('sha256').update(message).digest();
    const hmac = crypto.createHmac('sha512', Buffer.from(this.apiSecret, 'base64'));
    hmac.update(Buffer.concat([Buffer.from(path), sha256]));
    return hmac.digest('base64');
  }
  
  private async request(
    endpoint: string,
    params: Record<string, any> = {},
    isPrivate: boolean = false
  ): Promise<any> {
    if (isPrivate && !this.isConfigured) throw new Error('Kraken not configured');
    
    const path = isPrivate ? `/0/private/${endpoint}` : `/0/public/${endpoint}`;
    const url = `${this.baseUrl}${path}`;
    
    let options: RequestInit;
    
    if (isPrivate) {
      const nonce = Date.now().toString() + '000';
      params.nonce = nonce;
      
      const postData = new URLSearchParams(params).toString();
      const signature = this.sign(path, nonce, postData);
      
      options = {
        method: 'POST',
        headers: {
          'API-Key': this.apiKey,
          'API-Sign': signature,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: postData,
      };
    } else {
      const queryString = new URLSearchParams(params).toString();
      options = {
        method: 'GET',
      };
      const fullUrl = queryString ? `${url}?${queryString}` : url;
      
      const response = await fetch(fullUrl, options);
      const data = await response.json();
      
      if (data.error && data.error.length > 0) {
        throw new Error(data.error.join(', '));
      }
      
      return data.result;
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (data.error && data.error.length > 0) {
      throw new Error(data.error.join(', '));
    }
    
    return data.result;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // PUBLIC ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════
  
  async getTicker(pair: string): Promise<Ticker> {
    const data = await this.request('Ticker', { pair });
    const key = Object.keys(data)[0];
    const ticker = data[key];
    
    return {
      symbol: pair,
      bid: parseFloat(ticker.b[0]),
      ask: parseFloat(ticker.a[0]),
      last: parseFloat(ticker.c[0]),
      volume24h: parseFloat(ticker.v[1]),
      timestamp: Date.now(),
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════
  
  async getBalances(): Promise<Balance[]> {
    const data = await this.request('Balance', {}, true);
    
    return Object.entries(data).map(([asset, balance]) => ({
      asset,
      free: parseFloat(balance as string),
      locked: 0,
      total: parseFloat(balance as string),
    }));
  }
  
  async createOrder(params: OrderParams): Promise<Order> {
    const orderParams: Record<string, any> = {
      pair: params.symbol,
      type: params.side,
      ordertype: params.type,
      volume: params.quantity.toString(),
    };
    
    if (params.type === 'limit') {
      orderParams.price = params.price!.toString();
    }
    
    const data = await this.request('AddOrder', orderParams, true);
    
    return {
      id: data.txid[0],
      exchange: 'kraken',
      symbol: params.symbol,
      side: params.side,
      type: params.type,
      status: 'new',
      quantity: params.quantity,
      filledQuantity: 0,
      price: params.price || 0,
      avgFillPrice: 0,
      fee: 0,
      feeCurrency: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
  
  async cancelOrder(orderId: string): Promise<void> {
    await this.request('CancelOrder', { txid: orderId }, true);
  }
  
  async getOpenOrders(): Promise<Order[]> {
    const data = await this.request('OpenOrders', {}, true);
    
    return Object.entries(data.open || {}).map(([id, order]: [string, any]) => ({
      id,
      exchange: 'kraken',
      symbol: order.descr.pair,
      side: order.descr.type as 'buy' | 'sell',
      type: order.descr.ordertype as 'market' | 'limit',
      status: 'new' as const,
      quantity: parseFloat(order.vol),
      filledQuantity: parseFloat(order.vol_exec),
      price: parseFloat(order.descr.price),
      avgFillPrice: parseFloat(order.avg_price) || 0,
      fee: parseFloat(order.fee) || 0,
      feeCurrency: '',
      createdAt: order.opentm * 1000,
      updatedAt: Date.now(),
    }));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// COINBASE CONNECTOR
// ═══════════════════════════════════════════════════════════════════════════

class CoinbaseConnector extends EventEmitter {
  private apiKey: string = '';
  private apiSecret: string = '';
  private passphrase: string = '';
  private baseUrl = 'https://api.exchange.coinbase.com';
  
  private isConfigured = false;
  
  configure(credentials: ExchangeCredentials): void {
    this.apiKey = credentials.apiKey;
    this.apiSecret = credentials.apiSecret;
    this.passphrase = credentials.passphrase || '';
    this.isConfigured = true;
    console.log('[Coinbase] ✅ Configured');
  }
  
  private sign(timestamp: string, method: string, path: string, body: string = ''): string {
    const message = timestamp + method + path + body;
    const hmac = crypto.createHmac('sha256', Buffer.from(this.apiSecret, 'base64'));
    hmac.update(message);
    return hmac.digest('base64');
  }
  
  private async request(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<any> {
    if (!this.isConfigured) throw new Error('Coinbase not configured');
    
    const timestamp = (Date.now() / 1000).toString();
    const bodyStr = body ? JSON.stringify(body) : '';
    const signature = this.sign(timestamp, method, endpoint, bodyStr);
    
    const headers: Record<string, string> = {
      'CB-ACCESS-KEY': this.apiKey,
      'CB-ACCESS-SIGN': signature,
      'CB-ACCESS-TIMESTAMP': timestamp,
      'CB-ACCESS-PASSPHRASE': this.passphrase,
      'Content-Type': 'application/json',
    };
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      ...(body && { body: bodyStr }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Coinbase API error: ${response.status}`);
    }
    
    return data;
  }
  
  async getTicker(productId: string): Promise<Ticker> {
    const data = await this.request(`/products/${productId}/ticker`);
    
    return {
      symbol: productId,
      bid: parseFloat(data.bid),
      ask: parseFloat(data.ask),
      last: parseFloat(data.price),
      volume24h: parseFloat(data.volume),
      timestamp: Date.now(),
    };
  }
  
  async getBalances(): Promise<Balance[]> {
    const data = await this.request('/accounts');
    
    return data
      .filter((a: any) => parseFloat(a.balance) > 0)
      .map((a: any) => ({
        asset: a.currency,
        free: parseFloat(a.available),
        locked: parseFloat(a.hold),
        total: parseFloat(a.balance),
      }));
  }
  
  async createOrder(params: OrderParams): Promise<Order> {
    const orderParams: any = {
      product_id: params.symbol,
      side: params.side,
      type: params.type,
      size: params.quantity.toString(),
    };
    
    if (params.type === 'limit') {
      orderParams.price = params.price!.toString();
      orderParams.time_in_force = params.timeInForce || 'GTC';
    }
    
    const data = await this.request('/orders', 'POST', orderParams);
    
    return {
      id: data.id,
      exchange: 'coinbase',
      symbol: data.product_id,
      side: data.side,
      type: data.type,
      status: 'new',
      quantity: parseFloat(data.size),
      filledQuantity: parseFloat(data.filled_size) || 0,
      price: parseFloat(data.price) || 0,
      avgFillPrice: 0,
      fee: 0,
      feeCurrency: '',
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: Date.now(),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXCHANGE HUB - UNIFIED INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

export class ExchangeHub extends EventEmitter {
  private binance: BinanceConnector;
  private kraken: KrakenConnector;
  private coinbase: CoinbaseConnector;
  
  private configuredExchanges: Set<string> = new Set();
  
  constructor() {
    super();
    this.binance = new BinanceConnector();
    this.kraken = new KrakenConnector();
    this.coinbase = new CoinbaseConnector();
    
    console.log('[ExchangeHub] 🏦 Initialized');
  }
  
  /**
   * Configure an exchange with credentials from Fortress vault
   */
  async configureFromVault(exchangeId: string): Promise<boolean> {
    const credentials = liveWalletManager.getCredentials(exchangeId);
    
    if (!credentials) {
      console.error(`[ExchangeHub] ❌ No credentials found for ${exchangeId}`);
      return false;
    }
    
    return this.configure(exchangeId, {
      apiKey: credentials.apiKey,
      apiSecret: credentials.apiSecret,
      passphrase: credentials.passphrase,
    });
  }
  
  /**
   * Configure an exchange directly
   */
  configure(exchangeId: string, credentials: ExchangeCredentials): boolean {
    try {
      switch (exchangeId.toLowerCase()) {
        case 'binance':
          this.binance.configure(credentials);
          break;
        case 'kraken':
          this.kraken.configure(credentials);
          break;
        case 'coinbase':
          this.coinbase.configure(credentials);
          break;
        default:
          console.error(`[ExchangeHub] ❌ Unknown exchange: ${exchangeId}`);
          return false;
      }
      
      this.configuredExchanges.add(exchangeId.toLowerCase());
      console.log(`[ExchangeHub] ✅ ${exchangeId} configured`);
      return true;
      
    } catch (error) {
      console.error(`[ExchangeHub] ❌ Failed to configure ${exchangeId}:`, error);
      return false;
    }
  }
  
  private getConnector(exchangeId: string): BinanceConnector | KrakenConnector | CoinbaseConnector {
    switch (exchangeId.toLowerCase()) {
      case 'binance': return this.binance;
      case 'kraken': return this.kraken;
      case 'coinbase': return this.coinbase;
      default: throw new Error(`Unknown exchange: ${exchangeId}`);
    }
  }
  
  /**
   * Get ticker from specific exchange
   */
  async getTicker(exchangeId: string, symbol: string): Promise<Ticker> {
    const connector = this.getConnector(exchangeId);
    return connector.getTicker(symbol);
  }
  
  /**
   * Get tickers from all configured exchanges
   */
  async getAllTickers(symbol: string): Promise<Map<string, Ticker>> {
    const results = new Map<string, Ticker>();
    
    const promises = Array.from(this.configuredExchanges).map(async (exchange) => {
      try {
        const ticker = await this.getTicker(exchange, symbol);
        results.set(exchange, ticker);
      } catch (error) {
        console.warn(`[ExchangeHub] Failed to get ticker from ${exchange}:`, error);
      }
    });
    
    await Promise.all(promises);
    return results;
  }
  
  /**
   * Get balances from specific exchange
   */
  async getBalances(exchangeId: string): Promise<Balance[]> {
    const connector = this.getConnector(exchangeId);
    return connector.getBalances();
  }
  
  /**
   * Get balances from all configured exchanges
   */
  async getAllBalances(): Promise<Map<string, Balance[]>> {
    const results = new Map<string, Balance[]>();
    
    const promises = Array.from(this.configuredExchanges).map(async (exchange) => {
      try {
        const balances = await this.getBalances(exchange);
        results.set(exchange, balances);
      } catch (error) {
        console.warn(`[ExchangeHub] Failed to get balances from ${exchange}:`, error);
      }
    });
    
    await Promise.all(promises);
    return results;
  }
  
  /**
   * Create order on specific exchange
   */
  async createOrder(exchangeId: string, params: OrderParams): Promise<Order> {
    console.log(`[ExchangeHub] Creating ${params.side} ${params.type} order on ${exchangeId}: ${params.quantity} ${params.symbol}`);
    const connector = this.getConnector(exchangeId);
    const order = await connector.createOrder(params);
    this.emit('order-created', { exchange: exchangeId, order });
    return order;
  }
  
  /**
   * Cancel order on specific exchange
   */
  async cancelOrder(exchangeId: string, symbol: string, orderId: string): Promise<void> {
    console.log(`[ExchangeHub] Cancelling order ${orderId} on ${exchangeId}`);
    const connector = this.getConnector(exchangeId);
    
    if (connector instanceof KrakenConnector) {
      await connector.cancelOrder(orderId);
    } else if (connector instanceof BinanceConnector) {
      await connector.cancelOrder(symbol, orderId);
    }
    
    this.emit('order-cancelled', { exchange: exchangeId, orderId });
  }
  
  /**
   * Get open orders from all exchanges
   */
  async getAllOpenOrders(): Promise<Order[]> {
    const allOrders: Order[] = [];
    
    for (const exchange of this.configuredExchanges) {
      try {
        const connector = this.getConnector(exchange);
        const orders = await connector.getOpenOrders();
        allOrders.push(...orders);
      } catch (error) {
        console.warn(`[ExchangeHub] Failed to get open orders from ${exchange}:`, error);
      }
    }
    
    return allOrders;
  }
  
  /**
   * Execute arbitrage trade between two exchanges
   */
  async executeArbitrage(
    buyExchange: string,
    sellExchange: string,
    symbol: string,
    quantity: number,
    buyPrice: number,
    sellPrice: number
  ): Promise<{ buyOrder: Order; sellOrder: Order }> {
    console.log(`[ExchangeHub] 🔄 Executing arbitrage: Buy on ${buyExchange}, Sell on ${sellExchange}`);
    
    // Execute both orders in parallel for speed
    const [buyOrder, sellOrder] = await Promise.all([
      this.createOrder(buyExchange, {
        symbol,
        side: 'buy',
        type: 'limit',
        quantity,
        price: buyPrice,
        timeInForce: 'IOC', // Immediate or Cancel for speed
      }),
      this.createOrder(sellExchange, {
        symbol,
        side: 'sell',
        type: 'limit',
        quantity,
        price: sellPrice,
        timeInForce: 'IOC',
      }),
    ]);
    
    this.emit('arbitrage-executed', { buyOrder, sellOrder });
    
    return { buyOrder, sellOrder };
  }
  
  /**
   * Get configured exchanges
   */
  getConfiguredExchanges(): string[] {
    return Array.from(this.configuredExchanges);
  }
  
  /**
   * Check if exchange is configured
   */
  isConfigured(exchangeId: string): boolean {
    return this.configuredExchanges.has(exchangeId.toLowerCase());
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════
export default ExchangeHub;
