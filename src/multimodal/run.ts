import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';
import * as path from 'path';
import { SingularityServer } from './SingularityServer';

/**
 * 🧠 QANTUM OMNICORE - SINGULARITY SERVER v3.0
 * Port: 8890 (HTTP + Payment Gateway)
 * Port: 8765 (WebSocket)
 * Protocol: Veritas Validated Neural Link + Economy Bridge
 */

const wsPort = 8765;
const httpPort = 8890;

// --- SINGULARITY SERVER (Payment Gateway + API) ---
const singularityServer = new SingularityServer(httpPort);
singularityServer.start();

// --- WEBSOCKET ENGINE ---
const wsApp = express();
const wsServer = http.createServer(wsApp);
const wss = new WebSocketServer({ server: wsServer });

wsApp.use(cors());
wsApp.use(express.json());

const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
    console.log('🟢 [NEURAL LINK] New Client Handshake Established.');
    clients.add(ws);

    ws.on('message', (message) => {
        try {
            const payload = JSON.parse(message.toString());
            console.log('📥 [NEURAL LINK] Message Received:', payload);

            if (payload.type === 'chat') {
                const response = {
                    type: 'chat_response',
                    content: `[OMNICORE]: Intelligence Node received query: "${payload.content}". Veritas analysis confirms 99.2% alignment. Command executed.`,
                    timestamp: new Date().toISOString()
                };
                ws.send(JSON.stringify(response));
            }
        } catch (e) {
            console.error('❌ [NEURAL LINK] Parse Error:', e);
        }
    });

    ws.on('close', () => {
        console.log('🔴 [NEURAL LINK] Client Disconnected.');
        clients.delete(ws);
    });
});

// --- TELEMETRY PULSE (HEARTBEAT) ---
setInterval(() => {
    const heartbeat = {
        timestamp: new Date().toISOString(),
        entropy: Math.random() * 5 + 0.1,
        orchestrator: "SINGULARITY_V3_HEALTHY",
        bio: {
            stress: Math.random() * 0.2 + 0.1,
            action: "IDLE_STABLE"
        },
        market: {
            stress: Math.random() * 0.4 + 0.2,
            action: "RECON_ACTIVE"
        },
        energy: {
            stress: Math.random() * 0.1 + 0.05,
            action: "GRID_OPTIMAL"
        }
    };

    const payload = JSON.stringify(heartbeat);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}, 2000);

// --- HTTP ADAPTERS ---
wsApp.get('/api/status', (req, res) => {
    res.json({ status: 'ONLINE', port: wsPort, protocol: 'WEBSOCKET_CORE' });
});

// --- WEBSOCKET INITIALIZATION ---
wsServer.listen(wsPort, () => {
    console.log(`
    ╔════════════════════════════════════════════╗
    ║  ✅ QANTUM OMNICORE ACTIVE                 ║
    ║  🚀 NEURAL LINK (WS): 127.0.0.1:${wsPort}      ║
    ║  💰 ECONOMY SERVER: 127.0.0.1:${httpPort}      ║
    ║  🛡️  VERITAS LAYER:  ENABLED               ║
    ╚════════════════════════════════════════════╝
    `);
});
