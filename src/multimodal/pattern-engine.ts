import * as fs from 'fs';
import * as path from 'path';
import { EventBus } from '../core/event-bus';

/**
 * @class PatternEngine
 * @description Analyzes the Entropy Vault to detect "The Signal" (High-Volatility Breach).
 * Performs Time-Series Analysis on harvested network markers.
 */
export class PatternEngine {
  private vaultPath: string;
  private bus: EventBus;
  private readonly SIGNAL_THRESHOLD = 8.5;

  constructor() {
    this.vaultPath = path.join(__dirname, '../_VAULT_/entropy_harvest.json');
    this.bus = EventBus.getInstance();
  }

  public async analyze(): Promise<void> {
    if (!fs.existsSync(this.vaultPath)) return;

    try {
      const fileContent = fs.readFileSync(this.vaultPath, 'utf8');
      const history = JSON.parse(fileContent);

      if (!Array.isArray(history) || history.length < 5) return; // Need a baseline

      const latest = history[history.length - 1];

      // Calculate Moving Average (SMA-5)
      const averageEntropy =
        history
          .slice(-5)
          .reduce((acc: number, h: any) => acc + parseFloat(h.entropy_score || 0), 0) / 5;

      // Only log if significant or periodically (to reduce noise)
      if (Math.random() > 0.9) {
        console.log(
          `[\x1b[34mPATTERN-ENGINE\x1b[0m] Entropy Analysis: Current [${latest.entropy_score}] | Avg [${averageEntropy.toFixed(2)}]`
        );
      }

      // DETECT THE SIGNAL
      if (parseFloat(latest.entropy_score) > this.SIGNAL_THRESHOLD) {
        console.log(
          `[\x1b[31mSIGNAL-DETECTED\x1b[0m] ⚠️ THRESHOLD BREACH! Entropy: ${latest.entropy_score}`
        );

        // Emit Critical Event
        await this.bus.emit('SIGNAL_BREACH', {
          slot: latest.slot,
          entropy: latest.entropy_score,
          timestamp: latest.timestamp,
          type: 'HIGH_VOLATILITY_STRIKE_READY',
        });
      }
    } catch (error) {
      console.error('[\x1b[31mPATTERN-ENGINE\x1b[0m] Analysis Failed:', error);
    }
  }
}
