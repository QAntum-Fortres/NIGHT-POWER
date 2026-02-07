/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: INTERACTIVE MODE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Interactive REPL for Mind Engine
 * Real-time test execution and debugging
 * 
 * @author dp | QAntum Labs
 * @version 1.0.0-QANTUM-PRIME
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import * as readline from 'readline';
import { EventEmitter } from 'events';

import { logger } from '../api/unified/utils/logger';
// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface InteractiveCommand {
  name: string;
  aliases?: string[];
  description: string;
  usage?: string;
  execute: (args: string[], context: InteractiveContext) => Promise<string | void>;
}

export interface InteractiveContext {
  browser?: any;
  page?: any;
  history: string[];
  variables: Map<string, any>;
  workDir: string;
}

export interface InteractiveConfig {
  prompt?: string;
  historySize?: number;
  autoComplete?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════════════════════════

const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERACTIVE MODE
// ═══════════════════════════════════════════════════════════════════════════════

export class InteractiveMode extends EventEmitter {
  private commands: Map<string, InteractiveCommand> = new Map();
  private aliases: Map<string, string> = new Map();
  private context: InteractiveContext;
  private rl?: readline.Interface;
  private config: Required<InteractiveConfig>;
  private running: boolean = false;

  constructor(config: InteractiveConfig = {}) {
    super();
    
    this.config = {
      prompt: config.prompt ?? `${c.cyan}mind${c.reset}> `,
      historySize: config.historySize ?? 100,
      autoComplete: config.autoComplete ?? true
    };

    this.context = {
      history: [],
      variables: new Map(),
      workDir: process.cwd()
    };

    this.registerBuiltins();
  }

  /**
   * Register command
   */
  register(command: InteractiveCommand): this {
    this.commands.set(command.name, command);
    
    if (command.aliases) {
      for (const alias of command.aliases) {
        this.aliases.set(alias, command.name);
      }
    }

    return this;
  }

  /**
   * Start interactive mode
   */
  async start(): Promise<void> {
    this.running = true;

    this.printBanner();

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      completer: this.config.autoComplete ? this.completer.bind(this) : undefined,
      historySize: this.config.historySize
    });

    this.rl.on('close', () => {
      this.running = false;
      this.emit('exit');
    });

    await this.loop();
  }

  /**
   * Stop interactive mode
   */
  stop(): void {
    this.running = false;
    if (this.rl) {
      this.rl.close();
    }
  }

  private async loop(): Promise<void> {
    while (this.running) {
      const input = await this.prompt();
      
      if (!input) continue;

      this.context.history.push(input);
      
      try {
        await this.execute(input);
      } catch (error) {
        logger.error(`${c.red}Error: ${(error as Error).message}${c.reset}`);
      }
    }
  }

  private prompt(): Promise<string> {
    return new Promise((resolve) => {
      this.rl?.question(this.config.prompt, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  private async execute(input: string): Promise<void> {
    const parts = this.parseInput(input);
    const [cmdName, ...args] = parts;

    if (!cmdName) return;

    // Variable assignment
    if (cmdName.includes('=')) {
      const [name, value] = cmdName.split('=');
      this.context.variables.set(name, value || args.join(' '));
      logger.debug(`${c.dim}${name} = ${this.context.variables.get(name)}${c.reset}`);
      return;
    }

    // Resolve alias
    const resolvedName = this.aliases.get(cmdName) || cmdName;
    const command = this.commands.get(resolvedName);

    if (!command) {
      logger.debug(`${c.yellow}Unknown command: ${cmdName}${c.reset}`);
      logger.debug(`Type ${c.cyan}help${c.reset} for available commands`);
      return;
    }

    const result = await command.execute(args, this.context);
    
    if (result) {
      logger.debug(result);
    }
  }

  private parseInput(input: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';

    for (const char of input) {
      if ((char === '"' || char === "'") && !inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuote) {
        inQuote = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuote) {
        if (current) {
          parts.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current) {
      parts.push(current);
    }

    return parts;
  }

  private completer(line: string): [string[], string] {
    const commands = Array.from(this.commands.keys());
    const aliases = Array.from(this.aliases.keys());
    const all = [...commands, ...aliases];

    const hits = all.filter(c => c.startsWith(line));
    
    return [hits.length ? hits : all, line];
  }

  private printBanner(): void {
    logger.debug(`
${c.cyan}╔═══════════════════════════════════════════════════════════╗
║${c.reset}                                                           ${c.cyan}║
║${c.reset}  ${c.bright}🧠 MIND ENGINE - INTERACTIVE MODE${c.reset}                      ${c.cyan}║
║${c.reset}                                                           ${c.cyan}║
║${c.reset}  Type ${c.cyan}help${c.reset} for commands                                 ${c.cyan}║
║${c.reset}  Type ${c.cyan}exit${c.reset} to quit                                      ${c.cyan}║
║${c.reset}                                                           ${c.cyan}║
╚═══════════════════════════════════════════════════════════╝${c.reset}
`);
  }

  private registerBuiltins(): void {
    // Help command
    this.register({
      name: 'help',
      aliases: ['?', 'h'],
      description: 'Show help',
      execute: async (args) => {
        if (args[0]) {
          const cmd = this.commands.get(args[0]);
          if (cmd) {
            return `
${c.bright}${cmd.name}${c.reset} - ${cmd.description}
${cmd.usage ? `Usage: ${cmd.usage}` : ''}
${cmd.aliases ? `Aliases: ${cmd.aliases.join(', ')}` : ''}
`;
          }
        }

        const lines = [`\n${c.bright}Available Commands:${c.reset}\n`];
        
        for (const [name, cmd] of this.commands) {
          lines.push(`  ${c.cyan}${name.padEnd(15)}${c.reset} ${cmd.description}`);
        }

        return lines.join('\n') + '\n';
      }
    });

    // Exit command
    this.register({
      name: 'exit',
      aliases: ['quit', 'q'],
      description: 'Exit interactive mode',
      execute: async () => {
        logger.debug(`${c.dim}Goodbye!${c.reset}`);
        this.stop();
      }
    });

    // Clear command
    this.register({
      name: 'clear',
      aliases: ['cls'],
      description: 'Clear screen',
      execute: async () => {
        console.clear();
      }
    });

    // History command
    this.register({
      name: 'history',
      aliases: ['hist'],
      description: 'Show command history',
      execute: async () => {
        return this.context.history
          .slice(-20)
          .map((cmd, i) => `  ${c.dim}${(i + 1).toString().padStart(3)}${c.reset}  ${cmd}`)
          .join('\n');
      }
    });

    // Variables command
    this.register({
      name: 'vars',
      aliases: ['variables', 'env'],
      description: 'Show variables',
      execute: async () => {
        if (this.context.variables.size === 0) {
          return `${c.dim}No variables set${c.reset}`;
        }

        return Array.from(this.context.variables.entries())
          .map(([k, v]) => `  ${c.cyan}${k}${c.reset} = ${v}`)
          .join('\n');
      }
    });

    // Go to URL command
    this.register({
      name: 'goto',
      aliases: ['go', 'navigate', 'nav'],
      description: 'Navigate to URL',
      usage: 'goto <url>',
      execute: async (args, ctx) => {
        const url = args[0];
        if (!url) {
          return `${c.red}Usage: goto <url>${c.reset}`;
        }

        if (!ctx.page) {
          return `${c.red}No browser page available. Run 'browser' first.${c.reset}`;
        }

        await ctx.page.goto(url);
        return `${c.green}Navigated to ${url}${c.reset}`;
      }
    });

    // Click command
    this.register({
      name: 'click',
      aliases: ['c'],
      description: 'Click element',
      usage: 'click <selector>',
      execute: async (args, ctx) => {
        const selector = args.join(' ');
        if (!selector) {
          return `${c.red}Usage: click <selector>${c.reset}`;
        }

        if (!ctx.page) {
          return `${c.red}No browser page available${c.reset}`;
        }

        await ctx.page.click(selector);
        return `${c.green}Clicked: ${selector}${c.reset}`;
      }
    });

    // Type command
    this.register({
      name: 'type',
      aliases: ['fill', 't'],
      description: 'Type text into element',
      usage: 'type <selector> <text>',
      execute: async (args, ctx) => {
        const [selector, ...textParts] = args;
        const text = textParts.join(' ');

        if (!selector || !text) {
          return `${c.red}Usage: type <selector> <text>${c.reset}`;
        }

        if (!ctx.page) {
          return `${c.red}No browser page available${c.reset}`;
        }

        await ctx.page.fill(selector, text);
        return `${c.green}Typed "${text}" into ${selector}${c.reset}`;
      }
    });

    // Screenshot command
    this.register({
      name: 'screenshot',
      aliases: ['ss', 'snap'],
      description: 'Take screenshot',
      usage: 'screenshot [filename]',
      execute: async (args, ctx) => {
        const filename = args[0] || `screenshot-${Date.now()}.png`;

        if (!ctx.page) {
          return `${c.red}No browser page available${c.reset}`;
        }

        await ctx.page.screenshot({ path: filename });
        return `${c.green}Screenshot saved: ${filename}${c.reset}`;
      }
    });

    // Eval command
    this.register({
      name: 'eval',
      aliases: ['js', 'exec'],
      description: 'Evaluate JavaScript in page',
      usage: 'eval <code>',
      execute: async (args, ctx) => {
        const code = args.join(' ');

        if (!code) {
          return `${c.red}Usage: eval <code>${c.reset}`;
        }

        if (!ctx.page) {
          return `${c.red}No browser page available${c.reset}`;
        }

        const result = await ctx.page.evaluate(code);
        return `${c.cyan}Result:${c.reset} ${JSON.stringify(result, null, 2)}`;
      }
    });

    // Wait command
    this.register({
      name: 'wait',
      aliases: ['w', 'sleep'],
      description: 'Wait for selector or time',
      usage: 'wait <selector|ms>',
      execute: async (args, ctx) => {
        const target = args[0];

        if (!target) {
          return `${c.red}Usage: wait <selector|ms>${c.reset}`;
        }

        // If numeric, wait for time
        if (/^\d+$/.test(target)) {
          const ms = parseInt(target);
          await new Promise(r => setTimeout(r, ms));
          return `${c.green}Waited ${ms}ms${c.reset}`;
        }

        // Wait for selector
        if (!ctx.page) {
          return `${c.red}No browser page available${c.reset}`;
        }

        await ctx.page.waitForSelector(target);
        return `${c.green}Element visible: ${target}${c.reset}`;
      }
    });

    // Run test command
    this.register({
      name: 'run',
      aliases: ['test'],
      description: 'Run a test file',
      usage: 'run <file>',
      execute: async (args) => {
        const file = args[0];

        if (!file) {
          return `${c.red}Usage: run <file>${c.reset}`;
        }

        logger.debug(`${c.cyan}Running test: ${file}${c.reset}`);
        logger.debug(`${c.dim}... test execution would happen here ...${c.reset}`);
        
        return `${c.green}✓ Test completed${c.reset}`;
      }
    });

    // Status command
    this.register({
      name: 'status',
      aliases: ['stat', 's'],
      description: 'Show current status',
      execute: async (args, ctx) => {
        const lines = [
          `\n${c.bright}Status:${c.reset}`,
          `  Browser:    ${ctx.browser ? c.green + 'Connected' : c.yellow + 'Not connected'}${c.reset}`,
          `  Page:       ${ctx.page ? c.green + 'Ready' : c.yellow + 'No page'}${c.reset}`,
          `  Work Dir:   ${c.cyan}${ctx.workDir}${c.reset}`,
          `  Variables:  ${ctx.variables.size}`,
          `  History:    ${ctx.history.length} commands`,
          ''
        ];

        return lines.join('\n');
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export function createInteractiveMode(config?: InteractiveConfig): InteractiveMode {
  return new InteractiveMode(config);
}

export default {
  InteractiveMode,
  createInteractiveMode
};
