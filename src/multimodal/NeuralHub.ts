import { Assimilator, getAssimilator } from '../../scripts/assimilator';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface NeuralSignature {
  symbol: string;
  type: string;
  path: string;
  hash: string;
}

export class NeuralHub {
  private static instance: NeuralHub;
  private assimilator: Assimilator;
  private signatures: Map<string, NeuralSignature> = new Map();
  private REGISTRY_FILE = './data/neural-signatures.json';

  private constructor() {
    this.assimilator = getAssimilator({
      targetFolder: process.cwd(),
      recursive: true,
    });
    this.ensureDataDir();
  }

  private ensureDataDir() {
    if (!existsSync('./data')) {
      mkdirSync('./data', { recursive: true });
    }
  }

  public static getInstance(): NeuralHub {
    if (!NeuralHub.instance) {
      NeuralHub.instance = new NeuralHub();
    }
    return NeuralHub.instance;
  }

  /**
   * Re-scan the entire project and update signatures
   */
  async scan(): Promise<void> {
    console.log('🧠 [NEURAL_HUB] Scanning project for symbol signatures...');
    const result = await this.assimilator.assimilate();

    this.signatures.clear();

    for (const file of result.files) {
      // Register all exports as signatures
      for (const exp of file.exports) {
        this.signatures.set(exp.name, {
          symbol: exp.name,
          type: exp.type,
          path: file.path,
          hash: file.hash,
        });
      }
    }

    this.saveRegistry();
    console.log(`🧠 [NEURAL_HUB] Registered ${this.signatures.size} signatures.`);
  }

  /**
   * Find a file by its "beleg" (signature/symbol name)
   */
  resolvePath(symbol: string): string | null {
    const sig = this.signatures.get(symbol);
    if (sig && existsSync(sig.path)) {
      return sig.path;
    }

    // If not found or path moved, try to find it by re-verifying
    const verification = this.assimilator.verify(symbol);
    if (verification.valid && verification.file) {
      return verification.file;
    }

    return null;
  }

  private saveRegistry() {
    const data = Array.from(this.signatures.entries());
    writeFileSync(
      this.REGISTRY_FILE,
      JSON.stringify(
        {
          updated: new Date().toISOString(),
          count: data.length,
          signatures: Object.fromEntries(data),
        },
        null,
        2
      )
    );
  }
}

export const neuralHub = NeuralHub.getInstance();
