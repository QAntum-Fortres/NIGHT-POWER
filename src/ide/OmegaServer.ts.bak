/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * OMEGA SERVER - The IDE Bridge
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * "Мостът между VS Code и Суверенния Мозък на QAntum.
 *  HTTP + WebSocket за real-time комуникация."
 * 
 * Features:
 * 1. REST API за команди (/ask, /heal, /audit, /swap, /synthesize)
 * 2. WebSocket за real-time status updates
 * 3. Biometric sync endpoint (/sync)
 * 4. Ghost Text endpoint за Neural Overlay (/ghost)
 * 
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 30.4.0 - THE SOVEREIGN SIDEBAR
 */

import * as http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { OmegaNexus } from '../omega/OmegaNexus';
import { AIAgentExpert } from '../intelligence/AIAgentExpert';
import { FailoverAgent } from '../intelligence/FailoverAgent';
import { HardwareBridge } from '../omega/HardwareBridge';
import { SovereignGuard } from '../fortress/SovereignGuard';
import { OmegaCycle } from '../omega/OmegaCycle';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ServerConfig {
  port: number;
  enableWebSocket: boolean;
  corsOrigin: string;
}

export interface ApiRequest {
  command?: string;
  prompt?: string;
  file?: string;
  mode?: 'analyze' | 'fix' | 'generate' | 'evolve' | 'audit';
  focus?: number;
  context?: string;
}

export interface ApiResponse {
  success: boolean;
  response?: string;
  status?: SystemStatus;
  error?: string;
  timestamp: number;
  latency?: number;
}

export interface SystemStatus {
  led: 'green' | 'purple' | 'red' | 'yellow';
  ledLabel: string;
  awakened: boolean;
  health: number;
  inactivityMinutes: number;
  guardLevel: number;
  activeModel: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// OMEGA SERVER
// ═══════════════════════════════════════════════════════════════════════════════

export class OmegaServer {
  private static instance: OmegaServer;
  
  private server: http.Server | null = null;
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  
  private readonly config: ServerConfig;
  private isRunning = false;

  // Singletons
  private nexus = OmegaNexus.getInstance();
  private expert = AIAgentExpert.getInstance();
  private failover = FailoverAgent.getInstance();
  private guard = SovereignGuard.getInstance();
  private cycle = OmegaCycle.getInstance();

  private constructor(config?: Partial<ServerConfig>) {
    this.config = {
      port: config?.port || 3848,
      enableWebSocket: config?.enableWebSocket ?? true,
      corsOrigin: config?.corsOrigin || '*',
    };
  }

  static getInstance(config?: Partial<ServerConfig>): OmegaServer {
    if (!OmegaServer.instance) {
      OmegaServer.instance = new OmegaServer(config);
    }
    return OmegaServer.instance;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SERVER LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ [IDE-BRIDGE] Server already running.');
      return;
    }

    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => this.handleRequest(req, res));

      // WebSocket server
      if (this.config.enableWebSocket) {
        this.wss = new WebSocketServer({ server: this.server });
        this.setupWebSocket();
      }

      this.server.listen(this.config.port, () => {
        this.isRunning = true;
        console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    📡 OMEGA IDE BRIDGE ACTIVATED 📡                            ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  REST API:    http://localhost:${this.config.port}                                      ║
║  WebSocket:   ws://localhost:${this.config.port}                                        ║
║                                                                               ║
║  Endpoints:                                                                   ║
║    POST /ask       - Ask AIAgentExpert                                        ║
║    POST /heal      - Omega Heal (fix current file)                            ║
║    POST /audit     - Ghost Protocol security audit                            ║
║    POST /swap      - Failover to local agent                                  ║
║    POST /synthesize - Binary synthesis from intent                            ║
║    POST /sync      - Biometric focus sync                                     ║
║    POST /ghost     - Get ghost text completion                                ║
║    GET  /status    - System status (LED, health)                              ║
║                                                                               ║
║  "Мостът към Суверенния Мозък е отворен."                                     ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
        `);
        resolve();
      });

      this.server.on('error', (err) => {
        console.error('❌ [IDE-BRIDGE] Server error:', err);
        reject(err);
      });
    });
  }

  stop(): void {
    if (this.wss) {
      this.clients.forEach(client => client.close());
      this.wss.close();
    }
    
    if (this.server) {
      this.server.close();
      this.isRunning = false;
      console.log('🛑 [IDE-BRIDGE] Server stopped.');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HTTP REQUEST HANDLER
  // ═══════════════════════════════════════════════════════════════════════════

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', this.config.corsOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const startTime = Date.now();
    const url = req.url || '/';

    try {
      let response: ApiResponse;

      // Parse body for POST requests
      let body: ApiRequest = {};
      if (req.method === 'POST') {
        body = await this.parseBody(req);
      }

      // Route to handler
      switch (url) {
        case '/ask':
          response = await this.handleAsk(body);
          break;

        case '/heal':
          response = await this.handleHeal(body);
          break;

        case '/audit':
          response = await this.handleAudit(body);
          break;

        case '/swap':
          response = await this.handleSwap(body);
          break;

        case '/synthesize':
          response = await this.handleSynthesize(body);
          break;

        case '/sync':
          response = await this.handleSync(body);
          break;

        case '/ghost':
          response = await this.handleGhost(body);
          break;

        case '/status':
          response = await this.handleStatus();
          break;

        default:
          response = {
            success: false,
            error: `Unknown endpoint: ${url}`,
            timestamp: Date.now(),
          };
      }

      // Add latency
      response.latency = Date.now() - startTime;

      // Send response
      res.writeHead(response.success ? 200 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));

    } catch (error) {
      const errorResponse: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
        latency: Date.now() - startTime,
      };
      
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(errorResponse));
    }
  }

  private parseBody(req: http.IncomingMessage): Promise<ApiRequest> {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => {
        try {
          resolve(data ? JSON.parse(data) : {});
        } catch {
          resolve({});
        }
      });
      req.on('error', reject);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENDPOINT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  private async handleAsk(body: ApiRequest): Promise<ApiResponse> {
    const { prompt, command, file, mode = 'analyze', context } = body;
    const query = prompt || command || '';

    if (!query) {
      return { success: false, error: 'No prompt provided', timestamp: Date.now() };
    }

    const result = await this.expert.executeDirective({
      command: query,
      filePath: file,
      context,
      mode,
      precision: 'balanced',
    });

    // Broadcast status update
    this.broadcastStatus();

    return {
      success: result.success,
      response: result.result,
      timestamp: Date.now(),
    };
  }

  private async handleHeal(body: ApiRequest): Promise<ApiResponse> {
    const { file } = body;

    if (!file) {
      return { success: false, error: 'No file path provided', timestamp: Date.now() };
    }

    const result = await this.expert.fix(file, 'OMEGA_HEAL: Fix all issues and optimize');

    this.broadcastStatus();

    return {
      success: true,
      response: result,
      timestamp: Date.now(),
    };
  }

  private async handleAudit(body: ApiRequest): Promise<ApiResponse> {
    const { file } = body;

    const result = await this.expert.executeDirective({
      command: 'GHOST_AUDIT: Perform security analysis with zero detection footprint',
      filePath: file,
      mode: 'audit',
      precision: 'opus',
    });

    this.broadcastStatus();

    return {
      success: result.success,
      response: result.result,
      timestamp: Date.now(),
    };
  }

  private async handleSwap(body: ApiRequest): Promise<ApiResponse> {
    const { prompt, command, file } = body;
    const query = prompt || command || 'Continue from where we left off';

    const result = await this.failover.takeOver('RATE_LIMIT', query, file);

    // Update LED to purple (ghost mode)
    this.broadcastStatus();

    return {
      success: true,
      response: result.response,
      timestamp: Date.now(),
    };
  }

  private async handleSynthesize(body: ApiRequest): Promise<ApiResponse> {
    const { prompt, command } = body;
    const intent = prompt || command || '';

    if (!intent) {
      return { success: false, error: 'No intent provided', timestamp: Date.now() };
    }

    // Use Binary Synthesis if nexus is awakened
    if (this.nexus.isAwakened()) {
      const result = await this.nexus.synthesizeBinary(intent, 'x64', 'MAXIMUM', 'PARANOID');
      return {
        success: true,
        response: `Binary synthesized: ${JSON.stringify(result)}`,
        timestamp: Date.now(),
      };
    }

    // Fallback to expert
    const result = await this.expert.executeDirective({
      command: intent,
      mode: 'generate',
      precision: 'opus',
    });

    return {
      success: result.success,
      response: result.result,
      timestamp: Date.now(),
    };
  }

  private async handleSync(body: ApiRequest): Promise<ApiResponse> {
    const { focus } = body;

    if (typeof focus === 'number') {
      await HardwareBridge.syncFocus(focus);
    }

    return {
      success: true,
      response: `Focus synced: ${focus || 'default'}`,
      timestamp: Date.now(),
    };
  }

  private async handleGhost(body: ApiRequest): Promise<ApiResponse> {
    const { context, file } = body;

    if (!context) {
      return { success: false, error: 'No context provided', timestamp: Date.now() };
    }

    // Get ghost text (inline completion)
    const ghostText = await this.expert.ask(
      `CONTINUE_CODE: Complete this code naturally, output ONLY the continuation:\n${context}`,
      file
    );

    // Extract just the continuation (not the full response)
    const lines = ghostText.split('\n');
    const codeStart = lines.findIndex(l => l.includes('```'));
    const suggestion = codeStart >= 0 
      ? lines.slice(codeStart + 1).join('\n').replace(/```$/, '').trim()
      : ghostText.slice(0, 100);

    return {
      success: true,
      response: suggestion,
      timestamp: Date.now(),
    };
  }

  private async handleStatus(): Promise<ApiResponse> {
    const status = this.getSystemStatus();

    return {
      success: true,
      status,
      timestamp: Date.now(),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SYSTEM STATUS
  // ═══════════════════════════════════════════════════════════════════════════

  private getSystemStatus(): SystemStatus {
    const failoverState = this.failover.getState();
    const guardStatus = this.guard.getStatus();
    const inactivityMs = this.expert.getInactivityDuration();
    const inactivityMinutes = Math.floor(inactivityMs / 60000);

    // Determine LED color
    let led: 'green' | 'purple' | 'red' | 'yellow' = 'green';
    let ledLabel = 'SYNCED';

    if (guardStatus.level >= 3) {
      led = 'red';
      ledLabel = 'GUARD LEVEL 3';
    } else if (failoverState.isActive) {
      led = 'purple';
      ledLabel = 'GHOST MODE';
    } else if (inactivityMinutes >= 180) {
      led = 'yellow';
      ledLabel = 'EVOLUTION PENDING';
    }

    return {
      led,
      ledLabel,
      awakened: this.nexus.isAwakened(),
      health: this.nexus.getStatus().systemHealth,
      inactivityMinutes,
      guardLevel: guardStatus.level,
      activeModel: failoverState.isActive ? 'LOCAL' : 'CLOUD',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WEBSOCKET
  // ═══════════════════════════════════════════════════════════════════════════

  private setupWebSocket(): void {
    if (!this.wss) return;

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('🔗 [IDE-BRIDGE] WebSocket client connected');
      this.clients.add(ws);

      // Send initial status
      ws.send(JSON.stringify({
        type: 'status',
        data: this.getSystemStatus(),
      }));

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('🔌 [IDE-BRIDGE] WebSocket client disconnected');
      });

      ws.on('message', async (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          
          if (data.type === 'command') {
            const result = await this.handleAsk({ prompt: data.prompt, file: data.file });
            ws.send(JSON.stringify({ type: 'response', data: result }));
          }
        } catch (error) {
          ws.send(JSON.stringify({ type: 'error', error: 'Invalid message' }));
        }
      });
    });
  }

  private broadcastStatus(): void {
    const status = this.getSystemStatus();
    const message = JSON.stringify({ type: 'status', data: status });

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  broadcast(type: string, data: any): void {
    const message = JSON.stringify({ type, data });
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const omegaServer = OmegaServer.getInstance();
export default OmegaServer;
