/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VITARA SERVER - The Sovereign Pulse
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * "Предава пулса на системата в реално време."
 * 
 * This server provides:
 * - Real-time WebSocket broadcasting (Port 8765).
 * - Biometric integration with HardwareBridge.
 * - Hallucination alerts from VeritasProtocol.
 * - System telemetry and hardware stats.
 * 
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 */

import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';
import { HardwareBridge } from '../omega/HardwareBridge';
import { VeritasProtocol } from '../intelligence/veritas';
import { SovereignNucleus } from '../omega/SovereignNucleus';
import { vortex } from '../core/sys/VortexAI';
import * as os from 'os';


export class VitaraServer {
    private wss: WebSocketServer | null = null;
    private server: http.Server | null = null;
    private activeClients: Set<WebSocket> = new Set();

    private readonly bridge = HardwareBridge.getInstance();
    private readonly veritas = VeritasProtocol.getInstance();
    private readonly nucleus = SovereignNucleus.getInstance();

    private updateInterval: NodeJS.Timeout | null = null;

    constructor(private readonly port: number = 8765) { }

    public start(): void {
        this.server = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('VITARA_SERVER_ONLINE');
        });

        this.wss = new WebSocketServer({ server: this.server });

        this.wss.on('connection', (ws) => {
            this.activeClients.add(ws);
            console.log('🔗 [VITARA] Dashboard connected.');

            ws.on('close', () => {
                this.activeClients.delete(ws);
                console.log('🔌 [VITARA] Dashboard disconnected.');
            });

            // Send initial state
            this.broadcastState();
        });

        this.server.listen(this.port, () => {
            console.log(`🚀 [VITARA] Server active on ws://localhost:${this.port}`);
        });

        // Start heartbeat
        this.updateInterval = setInterval(() => this.broadcastState(), 1000);

        // Listen for Veritas violations
        this.veritas.on('violation', (data) => {
            this.broadcast('VERITAS_ALERT', data);
        });

        // Listen for Biometric changes
        this.bridge.on('stateUpdated', (state) => {
            this.broadcast('BIO_PULSE', state);
        });
    }

    private broadcastState() {
        const state = {
            timestamp: Date.now(),
            system: {
                cpu: os.loadavg()[0],
                memory: (os.totalmem() - os.freemem()) / os.totalmem(),
                uptime: os.uptime()
            },
            biometrics: (this.bridge as any).creatorState || { heartRate: 72, stress: 15, focus: 85 },
            veritas: this.veritas.getStats(),
            vortex: {
                isRunning: (vortex as any).getStatus(),
                stats: (vortex as any).getStats ? (vortex as any).getStats() : { status: 'ONLINE' }
            },

            version: '1.0.0-VITARA'
        };

        this.broadcast('SYSTEM_PULSE', state);
    }

    private broadcast(type: string, data: any) {
        const message = JSON.stringify({ type, data });
        this.activeClients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    public stop() {
        if (this.updateInterval) clearInterval(this.updateInterval);
        this.server?.close();
        this.wss?.close();
    }
}

// Auto-start if run directly
if (require.main === module) {
    const vitara = new VitaraServer();
    vitara.start();
}
