// [PURIFIED_BY_AETERNA: cc2ca27a-25e9-45f2-85fe-900bc27fdc47]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 1eca40a0-a0a8-40e1-90d9-be5733fe27ee]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 60a4014b-0fc7-4edd-8b1a-fc0e0c55bdce]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 60a4014b-0fc7-4edd-8b1a-fc0e0c55bdce]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 677cfecb-eb05-4273-8e8f-869dec3c1510]
// Suggestion: Review and entrench stable logic.
import express from 'express';
import cors from 'cors';
import * as http from 'http';
import { DepartmentEngine } from './DepartmentEngine';
import { Telemetry } from './telemetry/Telemetry';
import { Logger } from './telemetry/Logger';
import { PaymentGateway } from './economy/PaymentGateway';
import { getVortexOrchestrator, VortexOrchestrator } from './vortex/index.js';
import { HardwareAnchor } from './telemetry/HardwareAnchor';
import * as path from 'path';

/**
 * 🌌 QANTUM SINGULARITY SERVER
 * The ultimate backend server that unifies all departments and services.
 */
export class SingularityServer {
  private app: express.Application;
  private server: http.Server;
  private port: number;
  private engine: DepartmentEngine;
  private telemetry: Telemetry;
  private logger: Logger;
  private paymentGateway: PaymentGateway;
  private vortex: VortexOrchestrator;
  private hardware: HardwareAnchor;

  constructor(port: number = 8890) {
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.engine = DepartmentEngine.getInstance();
    this.telemetry = Telemetry.getInstance();
    this.logger = Logger.getInstance();
    this.paymentGateway = new PaymentGateway();
    this.vortex = getVortexOrchestrator();
    this.hardware = HardwareAnchor.getInstance();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json({ limit: '50mb' }));

    // Performance Tracking Middleware
    this.app.use((req: any, res: any, next: any) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.telemetry.trackApiRequest(req.path, req.method, res.statusCode, duration);
        this.logger.debug('HTTP', `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
      });
      next();
    });
  }

  private setupRoutes() {
    // --- Core Status Endpoints ---
    this.app.get('/api/status', async (req: any, res: any) => {
      const status = await this.engine.getOverallStatus();
      const vortexStatus = this.vortex.getStatus();
      const hardwareStatus = this.hardware.getLatest();
      res.json({ ...status, vortex: vortexStatus, hardware: hardwareStatus });
    });

    // --- Department Management ---
    this.app.get('/api/departments/:name', async (req: any, res: any) => {
      try {
        const dept = this.engine.getDepartment(req.params.name);
        const health = await dept.getHealth();
        res.json(health);
      } catch (err: any) {
        res.status(404).json({ error: err.message });
      }
    });

    this.app.post('/api/departments/:name/action', async (req: any, res: any) => {
      const { name } = req.params;
      const { action, params } = req.body;

      try {
        const dept = this.engine.getDepartment(name);
        // Type-safe dispatching would go here. For now, we mock the execution.
        this.logger.info('ENGINE', `Executing ${action} in ${name}`, params);

        // Example of real dispatch
        if (name === 'intelligence' && action === 'query') {
          const result = await (dept as any).processQuery(params.query);
          return res.json(result);
        }

        res.json({ success: true, message: `Action ${action} initiated in ${name}` });
      } catch (err: any) {
        this.logger.error('ENGINE', `Action ${action} failed in ${name}`, err);
        res.status(500).json({ error: err.message });
      }
    });

    // --- LwaS Resonance Bridge ---
    this.app.post('/api/lwas/resonance-scan', async (req: any, res: any) => {
      try {
        const { manifoldId } = req.body;
        this.logger.info('BRIDGE', `Initiating Resonance Scan for manifold: ${manifoldId}`);

        // Mocking the call to the Rust binary/FFI for now
        // In a real scenario, this calls lwas_core::omega::oracle::initiate_resonance_scan
        const scanResult = {
          manifoldId,
          criticalNodes: Array.from({ length: 5 }, () => Math.floor(Math.random() * 2000000000)),
          timestamp: Date.now()
        };

        res.json(scanResult);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    // --- Intelligence Bridge ---
    this.app.post('/api/ask', async (req: any, res: any) => {
      const { prompt } = req.body;
      const intel = this.engine.getDepartment<any>('intelligence');
      const result = await intel.processQuery(prompt);
      res.json({
        response: `[Intelligence Node] Analyzed query: ${result.processed}. Confidence: ${result.confidence.toFixed(2)}`,
      });
    });

    // --- Static Files ---
    const dashboardDir = path.join(process.cwd(), 'dashboard');
    this.app.use(express.static(dashboardDir));

    this.app.get('(.*)', (req: any, res: any) => {
      res.sendFile(path.join(dashboardDir, 'qantum-singular-interface.html'));
    });

    // --- Economy & Payments ---
    this.app.post('/api/economy/pay', async (req: any, res: any) => {
      const { amount, provider, metadata } = req.body;
      try {
        const payment = await this.paymentGateway.createPayment(amount, 'usd', provider, metadata);
        res.json(payment);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    this.app.get('/api/economy/stats', (req: any, res: any) => {
      res.json(this.paymentGateway.getStats());
    });

    // --- Vortex API ---
    this.app.get('/api/vortex/status', (req: any, res: any) => {
      res.json(this.vortex.getStatus());
    });

    this.app.get('/api/vortex/report', (req: any, res: any) => {
      res.send(this.vortex.generateDiagnosticReport());
    });
  }

  private setupErrorHandling() {
    this.app.use(
      (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
        this.logger.error('SERVER', 'Unhandled Exception', err);
        res.status(500).json({
          error: 'Internal Server Error',
          traceId: (err as any).traceId || 'unknown',
        });
      }
    );
  }

  public async start() {
    this.logger.info('SERVER', `Starting Singularity Server on port ${this.port}...`);

    await this.engine.initializeAll();
    await this.vortex.start();
    this.hardware.start(1000);

    this.server.listen(this.port, () => {
      this.logger.info('SERVER', 'SINGULARITY CORE ACTIVE AND LISTENING');
      this.telemetry.trackMemory();
    });

    // Start background tasks
    setInterval(() => this.telemetry.trackMemory(), 30000);
  }

  public async stop() {
    this.logger.warn('SERVER', 'Stopping Singularity Server...');
    this.telemetry.stop();
    this.hardware.stop();
    await this.vortex.stop();
    await this.engine.shutdownAll();
    this.server.close();
  }
}
