/**
 * ⚓ CONTEXT ANCHOR SYSTEM
 * "Save Game" за съзнанието на AI.
 * Гарантира, че дори при рестарт, мисията продължава.
 * 
 * @department INTELLIGENCE 🧠
 * @priority CRITICAL
 * @author QAntum Empire
 */

import * as fs from 'fs';
import * as path from 'path';

interface MindState {
    taskId: string;
    taskDescription: string;
    stepIndex: number;
    totalSteps: number;
    shortTermMemory: string[];
    activeTools: string[];
    lastAction: string;
    errors: string[];
    timestamp: number;
    sessionId: string;
}

interface AnchorHistory {
    anchors: MindState[];
    totalAnchorsDropped: number;
    totalResumes: number;
    lastCleanup: number;
}

export class ContextAnchor {
    private static readonly ANCHOR_DIR = path.join(process.cwd(), 'data/memoryals');
    private static readonly ANCHOR_FILE = path.join(this.ANCHOR_DIR, 'context-anchor.json');
    private static readonly HISTORY_FILE = path.join(this.ANCHOR_DIR, 'anchor-history.json');
    private static readonly MAX_ANCHOR_AGE = 3600000; // 1 час
    private static readonly MAX_HISTORY = 100;

    /**
     * ⚓ ХВЪРЛЯНЕ НА КОТВА (Save State)
     * Записва текущото състояние на мисията
     */
    static dropAnchor(state: Partial<MindState>): boolean {
        try {
            this.ensureDir();
            
            const fullState: MindState = {
                taskId: state.taskId || `task-${Date.now()}`,
                taskDescription: state.taskDescription || 'Unknown task',
                stepIndex: state.stepIndex || 0,
                totalSteps: state.totalSteps || 1,
                shortTermMemory: state.shortTermMemory || [],
                activeTools: state.activeTools || [],
                lastAction: state.lastAction || 'none',
                errors: state.errors || [],
                timestamp: Date.now(),
                sessionId: state.sessionId || this.generateSessionId()
            };

            fs.writeFileSync(this.ANCHOR_FILE, JSON.stringify(fullState, null, 2));
            this.recordHistory(fullState);
            
            console.log(`⚓ Anchor dropped at step ${fullState.stepIndex}/${fullState.totalSteps} | Task: ${fullState.taskId}`);
            return true;
        } catch (error) {
            console.error("⚠️ Failed to drop anchor:", error);
            return false;
        }
    }

    /**
     * ⚓ ВДИГАНЕ НА КОТВА (Load State)
     * Възстановява последното записано състояние
     */
    static raiseAnchor(): MindState | null {
        if (!fs.existsSync(this.ANCHOR_FILE)) {
            console.log("⚓ No anchor found. Starting fresh.");
            return null;
        }

        try {
            const data = fs.readFileSync(this.ANCHOR_FILE, 'utf-8');
            const state = JSON.parse(data) as MindState;
            
            // Проверка за "ръждясала" котва
            const age = Date.now() - state.timestamp;
            if (age > this.MAX_ANCHOR_AGE) {
                console.log(`⚓ Old anchor found (${Math.round(age / 60000)} min old). Ignoring.`);
                this.liftAnchor();
                return null;
            }

            // Запис на resume в историята
            this.incrementResumes();

            console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  ⚓ ANCHOR RAISED! RESUMING MISSION                           ║
╠═══════════════════════════════════════════════════════════════╣
║  Task:     ${state.taskId.padEnd(47)}║
║  Step:     ${state.stepIndex}/${state.totalSteps}                                            ║
║  Action:   ${state.lastAction.substring(0, 45).padEnd(47)}║
║  Age:      ${Math.round(age / 1000)} seconds                                       ║
╚═══════════════════════════════════════════════════════════════╝
            `);
            
            return state;
        } catch (error) {
            console.error("⚠️ Failed to raise anchor:", error);
            return null;
        }
    }

    /**
     * ⚓ ПОЧИСТВАНЕ (Mission Complete)
     * Премахва котвата след успешно завършване
     */
    static liftAnchor(): void {
        if (fs.existsSync(this.ANCHOR_FILE)) {
            fs.unlinkSync(this.ANCHOR_FILE);
            console.log("⚓ Mission Complete. Anchor lifted. 🎯");
        }
    }

    /**
     * ⚓ БЪРЗ CHECKPOINT
     * За бързо записване по време на изпълнение
     */
    static checkpoint(stepIndex: number, memory: string): boolean {
        const existing = this.peekAnchor();
        if (existing) {
            existing.stepIndex = stepIndex;
            existing.shortTermMemory.push(memory);
            existing.timestamp = Date.now();
            return this.dropAnchor(existing);
        }
        return false;
    }

    /**
     * ⚓ ПОГЛЕД КЪМ КОТВАТА (без вдигане)
     */
    static peekAnchor(): MindState | null {
        if (!fs.existsSync(this.ANCHOR_FILE)) return null;
        try {
            const data = fs.readFileSync(this.ANCHOR_FILE, 'utf-8');
            return JSON.parse(data) as MindState;
        } catch {
            return null;
        }
    }

    /**
     * ⚓ СТАТУС
     */
    static status(): void {
        const anchor = this.peekAnchor();
        const history = this.getHistory();

        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║              ⚓ CONTEXT ANCHOR STATUS                          ║
╠═══════════════════════════════════════════════════════════════╣
║  Current Anchor:  ${anchor ? '✅ ACTIVE' : '❌ NONE'}                                  ║
${anchor ? `║  Task:            ${anchor.taskId.substring(0, 40).padEnd(42)}║
║  Progress:        ${anchor.stepIndex}/${anchor.totalSteps} steps                                      ║
║  Memory Items:    ${anchor.shortTermMemory.length}                                           ║` : ''}
║  ─────────────────────────────────────────────────────────────║
║  HISTORY                                                      ║
║  Total Anchors:   ${history.totalAnchorsDropped.toString().padEnd(42)}║
║  Total Resumes:   ${history.totalResumes.toString().padEnd(42)}║
╚═══════════════════════════════════════════════════════════════╝
        `);
    }

    // ═══════════════════════════════════════════════════════════════
    // PRIVATE METHODS
    // ═══════════════════════════════════════════════════════════════

    private static ensureDir(): void {
        if (!fs.existsSync(this.ANCHOR_DIR)) {
            fs.mkdirSync(this.ANCHOR_DIR, { recursive: true });
        }
    }

    private static generateSessionId(): string {
        return `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }

    private static getHistory(): AnchorHistory {
        if (!fs.existsSync(this.HISTORY_FILE)) {
            return {
                anchors: [],
                totalAnchorsDropped: 0,
                totalResumes: 0,
                lastCleanup: Date.now()
            };
        }
        try {
            return JSON.parse(fs.readFileSync(this.HISTORY_FILE, 'utf-8'));
        } catch {
            return {
                anchors: [],
                totalAnchorsDropped: 0,
                totalResumes: 0,
                lastCleanup: Date.now()
            };
        }
    }

    private static recordHistory(state: MindState): void {
        const history = this.getHistory();
        history.anchors.push(state);
        history.totalAnchorsDropped++;
        
        // Ограничаване на историята
        if (history.anchors.length > this.MAX_HISTORY) {
            history.anchors = history.anchors.slice(-this.MAX_HISTORY);
        }
        
        fs.writeFileSync(this.HISTORY_FILE, JSON.stringify(history, null, 2));
    }

    private static incrementResumes(): void {
        const history = this.getHistory();
        history.totalResumes++;
        fs.writeFileSync(this.HISTORY_FILE, JSON.stringify(history, null, 2));
    }
}

// ═══════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════
if (require.main === module) {
    const arg = process.argv[2];
    
    switch (arg) {
        case '--status':
            ContextAnchor.status();
            break;
        case '--raise':
            const state = ContextAnchor.raiseAnchor();
            if (state) {
                console.log('State:', JSON.stringify(state, null, 2));
            }
            break;
        case '--lift':
            ContextAnchor.liftAnchor();
            break;
        case '--test':
            // Тестово хвърляне
            ContextAnchor.dropAnchor({
                taskId: 'test-mission-001',
                taskDescription: 'Test the anchor system',
                stepIndex: 3,
                totalSteps: 10,
                shortTermMemory: ['Step 1 done', 'Step 2 done', 'Step 3 in progress'],
                activeTools: ['grep_search', 'read_file'],
                lastAction: 'Reading configuration files'
            });
            console.log('\n✅ Test anchor dropped!');
            ContextAnchor.status();
            break;
        default:
            console.log(`
⚓ CONTEXT ANCHOR - Usage:
  --status    Show anchor status
  --raise     Raise (load) anchor
  --lift      Lift (clear) anchor
  --test      Drop a test anchor
            `);
    }
}
