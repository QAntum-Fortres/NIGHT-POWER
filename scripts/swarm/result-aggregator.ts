/**
 * 🐝 THE SWARM - Result Aggregator with WebSocket
 *
 * Real-time aggregation of distributed test results
 * with WebSocket streaming to dashboard.
 *
 * Features:
 * - Real-time result streaming
 * - Metric aggregation
 * - Live dashboard updates
 * - Historical data storage
 *
 * @version 1.0.0-QANTUM-PRIME
 * @phase 79-80
 */

import { EventEmitter } from 'events';
import * as http from 'http';
import * as crypto from 'crypto';

// UNIVERSAL SYNTHESIS: PHYSICS layer uses PHYSICS layer logger
import { logger } from '../layers/physics/logger';
// ============================================================
// TYPES
// ============================================================
interface AggregatedMetrics {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    passRate: number;
    avgDuration: number;
    totalDuration: number;
    testsPerSecond: number;
    peakConcurrency: number;
    memoryUsed: number;
}

interface SwarmEvent {
    type: 'task:complete' | 'task:error' | 'worker:start' | 'worker:done' | 'swarm:progress' | 'swarm:complete';
    timestamp: number;
    data: any;
}

interface WebSocketClient {
    id: string;
    socket: any;
    subscriptions: string[];
}

interface DashboardUpdate {
    type: 'metrics' | 'result' | 'progress' | 'alert';
    payload: any;
}

// ============================================================
// RESULT AGGREGATOR
// ============================================================
export class ResultAggregator extends EventEmitter {
    private results: Map<string, any> = new Map();
    private metrics: AggregatedMetrics;
    private timeline: SwarmEvent[] = [];
    private startTime: number = 0;

    constructor() {
        super();
        this.metrics = this.initializeMetrics();
    }

    /**
     * Add result from worker
     */
    addResult(result: any): void {
        this.results.set(result.taskId, result);
        this.updateMetrics(result);

        const event: SwarmEvent = {
            type: 'task:complete',
            timestamp: Date.now(),
            data: result
        };

        this.timeline.push(event);
        this.emit('result', event);
    }

    /**
     * Add error from worker
     */
    addError(error: any): void {
        const event: SwarmEvent = {
            type: 'task:error',
            timestamp: Date.now(),
            data: error
        };

        this.timeline.push(event);
        this.emit('error', event);

        this.metrics.failedTests++;
        this.metrics.totalTests++;
        this.recalculatePassRate();
    }

    /**
     * Get current aggregated metrics
     */
    getMetrics(): AggregatedMetrics {
        return { ...this.metrics };
    }

    /**
     * Get all results
     */
    getResults(): any[] {
        return Array.from(this.results.values());
    }

    /**
     * Get timeline of events
     */
    getTimeline(): SwarmEvent[] {
        return [...this.timeline];
    }

    /**
     * Generate summary report
     */
    generateSummary(): object {
        const duration = Date.now() - this.startTime;

        return {
            swarmId: crypto.randomBytes(8).toString('hex'),
            timestamp: new Date().toISOString(),
            duration,
            metrics: this.metrics,
            topFailures: this.getTopFailures(10),
            slowestTests: this.getSlowestTests(10),
            workerPerformance: this.getWorkerPerformance()
        };
    }

    /**
     * Start aggregation session
     */
    startSession(): void {
        this.startTime = Date.now();
        this.results.clear();
        this.timeline = [];
        this.metrics = this.initializeMetrics();

        logger.debug('📊 [AGGREGATOR] Session started');
    }

    /**
     * End aggregation session
     */
    endSession(): object {
        const summary = this.generateSummary();
        logger.debug('📊 [AGGREGATOR] Session ended');
        this.emit('session:end', summary);
        return summary;
    }

    // ============================================================
    // PRIVATE METHODS
    // ============================================================

    private initializeMetrics(): AggregatedMetrics {
        return {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            skippedTests: 0,
            passRate: 0,
            avgDuration: 0,
            totalDuration: 0,
            testsPerSecond: 0,
            peakConcurrency: 0,
            memoryUsed: 0
        };
    }

    private updateMetrics(result: any): void {
        this.metrics.totalTests++;
        this.metrics.totalDuration += result.duration || 0;
        this.metrics.avgDuration = this.metrics.totalDuration / this.metrics.totalTests;

        if (result.status === 'passed') {
            this.metrics.passedTests++;
        } else if (result.status === 'failed' || result.status === 'error') {
            this.metrics.failedTests++;
        } else {
            this.metrics.skippedTests++;
        }

        this.recalculatePassRate();

        // Calculate tests per second
        const elapsed = (Date.now() - this.startTime) / 1000;
        this.metrics.testsPerSecond = this.metrics.totalTests / Math.max(elapsed, 1);

        // Update memory usage
        if (result.metrics?.memoryUsed) {
            this.metrics.memoryUsed = Math.max(this.metrics.memoryUsed, result.metrics.memoryUsed);
        }
    }

    private recalculatePassRate(): void {
        const total = this.metrics.passedTests + this.metrics.failedTests;
        this.metrics.passRate = total > 0
            ? (this.metrics.passedTests / total) * 100
            : 0;
    }

    private getTopFailures(limit: number): any[] {
        return Array.from(this.results.values())
            .filter(r => r.status === 'failed' || r.status === 'error')
            .slice(0, limit)
            .map(r => ({
                testFile: r.output?.testFile,
                testName: r.output?.testName,
                error: r.error
            }));
    }

    private getSlowestTests(limit: number): any[] {
        return Array.from(this.results.values())
            .sort((a, b) => (b.duration || 0) - (a.duration || 0))
            .slice(0, limit)
            .map(r => ({
                testFile: r.output?.testFile,
                testName: r.output?.testName,
                duration: r.duration
            }));
    }

    private getWorkerPerformance(): object {
        const workerStats = new Map<string, { count: number; totalDuration: number }>();

        for (const result of this.results.values()) {
            const workerId = result.workerId || 'unknown';
            const stats = workerStats.get(workerId) || { count: 0, totalDuration: 0 };
            stats.count++;
            stats.totalDuration += result.duration || 0;
            workerStats.set(workerId, stats);
        }

        return Object.fromEntries(
            Array.from(workerStats.entries()).map(([id, stats]) => [
                id,
                {
                    tasksCompleted: stats.count,
                    avgDuration: stats.totalDuration / stats.count
                }
            ])
        );
    }
}

// ============================================================
// WEBSOCKET SERVER
// ============================================================
export class SwarmWebSocketServer {
    private server: http.Server | null = null;
    private clients: Map<string, WebSocketClient> = new Map();
    private aggregator: ResultAggregator;
    private port: number;

    constructor(aggregator: ResultAggregator, port: number = 3001) {
        this.aggregator = aggregator;
        this.port = port;
        this.setupAggregatorListeners();
    }

    /**
     * Start WebSocket server
     */
    start(): void {
        this.server = http.createServer((req, res) => {
            // Handle upgrade manually for WebSocket
            if (req.headers.upgrade !== 'websocket') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok', clients: this.clients.size }));
            }
        });

        this.server.on('upgrade', (request, socket, head) => {
            this.handleUpgrade(request, socket, head);
        });

        this.server.listen(this.port, () => {
            logger.debug(`🔌 [WEBSOCKET] Server running on ws://localhost:${this.port}`);
        });
    }

    /**
     * Stop WebSocket server
     */
    stop(): void {
        for (const client of this.clients.values()) {
            this.closeClient(client);
        }
        this.clients.clear();

        if (this.server) {
            this.server.close();
            logger.debug('🔌 [WEBSOCKET] Server stopped');
        }
    }

    /**
     * Broadcast message to all clients
     */
    broadcast(update: DashboardUpdate): void {
        const message = JSON.stringify(update);

        for (const client of this.clients.values()) {
            this.sendToClient(client, message);
        }
    }

    /**
     * Send to specific subscribed clients
     */
    broadcastToSubscribers(channel: string, update: DashboardUpdate): void {
        const message = JSON.stringify(update);

        for (const client of this.clients.values()) {
            if (client.subscriptions.includes(channel) || client.subscriptions.includes('*')) {
                this.sendToClient(client, message);
            }
        }
    }

    // ============================================================
    // PRIVATE METHODS
    // ============================================================

    private handleUpgrade(request: http.IncomingMessage, socket: any, head: Buffer): void {
        // Simple WebSocket handshake
        const key = request.headers['sec-websocket-key'];
        if (!key) {
            socket.destroy();
            return;
        }

        const acceptKey = crypto
            .createHash('sha1')
            .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
            .digest('base64');

        const responseHeaders = [
            'HTTP/1.1 101 Switching Protocols',
            'Upgrade: websocket',
            'Connection: Upgrade',
            `Sec-WebSocket-Accept: ${acceptKey}`,
            '',
            ''
        ].join('\r\n');

        socket.write(responseHeaders);

        const clientId = crypto.randomBytes(8).toString('hex');
        const client: WebSocketClient = {
            id: clientId,
            socket,
            subscriptions: ['*']
        };

        this.clients.set(clientId, client);
        logger.debug(`🔌 [WEBSOCKET] Client connected: ${clientId}`);

        // Handle messages
        socket.on('data', (buffer: Buffer) => {
            this.handleMessage(client, buffer);
        });

        socket.on('close', () => {
            this.clients.delete(clientId);
            logger.debug(`🔌 [WEBSOCKET] Client disconnected: ${clientId}`);
        });

        socket.on('error', (error: Error) => {
            logger.error(`🔌 [WEBSOCKET] Error for ${clientId}:`, error.message);
            this.clients.delete(clientId);
        });

        // Send initial state
        this.sendToClient(client, JSON.stringify({
            type: 'metrics',
            payload: this.aggregator.getMetrics()
        }));
    }

    private handleMessage(client: WebSocketClient, buffer: Buffer): void {
        try {
            // Decode WebSocket frame (simplified)
            const firstByte = buffer[0];
            const secondByte = buffer[1];
            const isMasked = (secondByte & 0x80) !== 0;
            let payloadLength = secondByte & 0x7f;
            let maskOffset = 2;

            if (payloadLength === 126) {
                payloadLength = buffer.readUInt16BE(2);
                maskOffset = 4;
            } else if (payloadLength === 127) {
                payloadLength = Number(buffer.readBigUInt64BE(2));
                maskOffset = 10;
            }

            if (!isMasked) return;

            const mask = buffer.slice(maskOffset, maskOffset + 4);
            const payload = buffer.slice(maskOffset + 4, maskOffset + 4 + payloadLength);

            // Unmask
            for (let i = 0; i < payload.length; i++) {
                payload[i] ^= mask[i % 4];
            }

            const message = JSON.parse(payload.toString());

            // Handle subscription requests
            if (message.type === 'subscribe') {
                client.subscriptions = message.channels || ['*'];
                logger.debug(`🔌 [WEBSOCKET] ${client.id} subscribed to:`, client.subscriptions);
            }

        } catch (error) {
            // Ignore parse errors
        }
    }

    private sendToClient(client: WebSocketClient, message: string): void {
        try {
            const payload = Buffer.from(message);
            let frame: Buffer;

            if (payload.length < 126) {
                frame = Buffer.alloc(2 + payload.length);
                frame[0] = 0x81; // Text frame
                frame[1] = payload.length;
                payload.copy(frame, 2);
            } else if (payload.length < 65536) {
                frame = Buffer.alloc(4 + payload.length);
                frame[0] = 0x81;
                frame[1] = 126;
                frame.writeUInt16BE(payload.length, 2);
                payload.copy(frame, 4);
            } else {
                frame = Buffer.alloc(10 + payload.length);
                frame[0] = 0x81;
                frame[1] = 127;
                frame.writeBigUInt64BE(BigInt(payload.length), 2);
                payload.copy(frame, 10);
            }

            client.socket.write(frame);
        } catch (error) {
            // Client disconnected
        }
    }

    private closeClient(client: WebSocketClient): void {
        try {
            const closeFrame = Buffer.from([0x88, 0x00]);
            client.socket.write(closeFrame);
            client.socket.end();
        } catch {
            // Already closed
        }
    }

    private setupAggregatorListeners(): void {
        this.aggregator.on('result', (event: SwarmEvent) => {
            this.broadcast({
                type: 'result',
                payload: event.data
            });

            // Also send updated metrics
            this.broadcast({
                type: 'metrics',
                payload: this.aggregator.getMetrics()
            });
        });

        this.aggregator.on('error', (event: SwarmEvent) => {
            this.broadcast({
                type: 'alert',
                payload: {
                    level: 'error',
                    message: event.data.error,
                    testFile: event.data.output?.testFile
                }
            });
        });

        this.aggregator.on('session:end', (summary: any) => {
            this.broadcast({
                type: 'progress',
                payload: {
                    status: 'complete',
                    summary
                }
            });
        });
    }
}

// ============================================================
// DASHBOARD INTEGRATION
// ============================================================
export class DashboardConnector {
    private wsServer: SwarmWebSocketServer;
    private aggregator: ResultAggregator;

    constructor(port: number = 3001) {
        this.aggregator = new ResultAggregator();
        this.wsServer = new SwarmWebSocketServer(this.aggregator, port);
    }

    /**
     * Start dashboard connection
     */
    start(): void {
        this.wsServer.start();
        this.aggregator.startSession();

        logger.debug(`
╔═══════════════════════════════════════════════════════════════╗
║  📊 SWARM DASHBOARD CONNECTOR                                 ║
║                                                               ║
║  WebSocket: ws://localhost:3001                               ║
║  Dashboard: http://localhost:3000/dashboard-new.html          ║
╚═══════════════════════════════════════════════════════════════╝
`);
    }

    /**
     * Stop dashboard connection
     */
    stop(): void {
        const summary = this.aggregator.endSession();
        this.wsServer.stop();
        return summary as any;
    }

    /**
     * Get aggregator for adding results
     */
    getAggregator(): ResultAggregator {
        return this.aggregator;
    }

    /**
     * Manual broadcast
     */
    broadcast(update: DashboardUpdate): void {
        this.wsServer.broadcast(update);
    }
}

// ============================================================
// EXPORTS
// ============================================================
export function createSwarmDashboard(port?: number): DashboardConnector {
    return new DashboardConnector(port);
}
