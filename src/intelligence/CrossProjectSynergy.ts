/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                  CROSS-PROJECT SYNERGY - THE TRIDENT ENGINE                   ║
 * ║                                                                               ║
 * ║     "Когато MisteMind промени API, MrMindQATool автоматично генерира тест,    ║
 * ║      а MisterMindPage актуализира документацията."                            ║
 * ║                                                                               ║
 * ║  Тризъбецът на властта:                                                       ║
 * ║  • MisteMind (The Core) - Открива нова бизнес логика                          ║
 * ║  • MrMindQATool (The Shield) - Автоматично генерира тестове                   ║
 * ║  • MisterMindPage (The Voice) - Публикува Case Studies                        ║
 * ║                                                                               ║
 * ║  Created: 2026-01-01 | QAntum Prime v28.1.0 SUPREME - Empire Architect        ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import DeepSeekLink, { getDeepSeekLink } from './DeepSeekLink';
import VectorSync from './VectorSync';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface SynergyConfig {
  enableAutoTest: boolean;
  enableAutoDoc: boolean;
  enableAutoCaseStudy: boolean;
  coreProject: ProjectInfo;
  shieldProject: ProjectInfo;
  voiceProject: ProjectInfo;
}

export interface ProjectInfo {
  name: string;
  path: string;
  role: 'core' | 'shield' | 'voice';
}

export interface ChangeEvent {
  project: string;
  file: string;
  type: 'function' | 'class' | 'interface' | 'api' | 'module';
  name: string;
  changeType: 'added' | 'modified' | 'deleted';
  content: string;
  timestamp: number;
}

export interface SynergyAction {
  id: string;
  trigger: ChangeEvent;
  targetProject: string;
  actionType: 'generate_test' | 'update_doc' | 'create_case_study' | 'update_api_ref';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
  generatedFile?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CROSS-PROJECT SYNERGY ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class CrossProjectSynergy extends EventEmitter {
  private config: SynergyConfig;
  private ai: DeepSeekLink;
  private vectorDB: VectorSync;
  private actionQueue: SynergyAction[] = [];
  private isProcessing: boolean = false;

  constructor(config?: Partial<SynergyConfig>) {
    super();

    this.config = {
      enableAutoTest: config?.enableAutoTest ?? true,
      enableAutoDoc: config?.enableAutoDoc ?? true,
      enableAutoCaseStudy: config?.enableAutoCaseStudy ?? false,
      coreProject: config?.coreProject || {
        name: 'MisteMind',
        path: 'C:/MisteMind',
        role: 'core',
      },
      shieldProject: config?.shieldProject || {
        name: 'MrMindQATool',
        path: 'C:/MrMindQATool',
        role: 'shield',
      },
      voiceProject: config?.voiceProject || {
        name: 'MisterMindPage',
        path: 'C:/MisterMindPage',
        role: 'voice',
      },
    };

    this.ai = getDeepSeekLink();
    this.vectorDB = new VectorSync();

    this.log('⚔️ CrossProjectSynergy (Trident Engine) initialized');
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Обработва промяна в Core проекта
   */
  public async handleCoreChange(event: ChangeEvent): Promise<SynergyAction[]> {
    this.log(`\n⚡ CORE CHANGE DETECTED: ${event.name}`);
    this.log(`   File: ${event.file}`);
    this.log(`   Type: ${event.changeType}`);

    const actions: SynergyAction[] = [];

    // 1. Generate test in Shield (MrMindQATool)
    if (this.config.enableAutoTest) {
      const testAction = await this.queueTestGeneration(event);
      actions.push(testAction);
    }

    // 2. Update documentation in Voice (MisterMindPage)
    if (this.config.enableAutoDoc) {
      const docAction = await this.queueDocUpdate(event);
      actions.push(docAction);
    }

    // 3. Create Case Study if significant change
    if (this.config.enableAutoCaseStudy && this.isSignificantChange(event)) {
      const caseStudyAction = await this.queueCaseStudy(event);
      actions.push(caseStudyAction);
    }

    // Process queue
    await this.processActionQueue();

    return actions;
  }

  /**
   * Генерира тест за нова функционалност
   */
  public async generateTestForFunction(functionName: string, sourceFile: string): Promise<string> {
    this.log(`\n🧪 Generating test for: ${functionName}`);

    // Read source file
    const sourceContent = fs.readFileSync(sourceFile, 'utf-8');

    // Extract function
    const functionRegex = new RegExp(`(export\\s+)?(?:async\\s+)?function\\s+${functionName}[^{]*\\{[\\s\\S]*?\\n\\}`, 'g');
    const match = sourceContent.match(functionRegex);

    if (!match) {
      return `// Could not find function ${functionName} in ${sourceFile}`;
    }

    const functionCode = match[0];

    // Generate test using AI
    const response = await this.ai.askEmpire({
      query: `Генерирай Jest тест за следната функция от QAntum Prime.
      
Функция:
\`\`\`typescript
${functionCode}
\`\`\`

Изисквания:
1. Използвай Jest describe/it/expect синтаксис
2. Тествай happy path и edge cases
3. Mock-ни external dependencies
4. Следвай naming convention: ${functionName}.spec.ts
5. Включи коментари на български

Върни САМО кода, без обяснения.`,
      temperature: 0.3,
    });

    return this.extractCodeFromResponse(response.answer);
  }

  /**
   * Актуализира документацията
   */
  public async updateDocumentation(event: ChangeEvent): Promise<string> {
    this.log(`\n📝 Updating documentation for: ${event.name}`);

    const response = await this.ai.askEmpire({
      query: `Генерирай Markdown документация за следната промяна в QAntum Prime.

Промяна:
- Име: ${event.name}
- Тип: ${event.type}
- Файл: ${event.file}
- Съдържание:
\`\`\`typescript
${event.content.slice(0, 2000)}
\`\`\`

Формат:
1. Заглавие (## ${event.name})
2. Описание (какво прави)
3. Използване (примери)
4. Параметри (ако има)
5. Връщана стойност

Пиши на български.`,
      temperature: 0.4,
    });

    return response.answer;
  }

  /**
   * Създава Case Study за значителна промяна
   */
  public async createCaseStudy(event: ChangeEvent): Promise<string> {
    this.log(`\n📊 Creating case study for: ${event.name}`);

    const response = await this.ai.askEmpire({
      query: `Създай Case Study за следната значителна промяна в QAntum Prime v28.1.0.

Промяна:
- Компонент: ${event.name}
- Тип: ${event.type}
- Проект: ${event.project}

Структура на Case Study:
1. **Проблем**: Какъв проблем решава тази промяна?
2. **Решение**: Как го решава?
3. **Резултат**: Какво подобрение носи?
4. **Технически детайли**: Кратко обяснение на имплементацията
5. **Метрики**: Примерни подобрения (ако е възможно да се предположат)

Формат: Markdown, професионален тон, на български.`,
      temperature: 0.5,
    });

    return response.answer;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ACTION QUEUE
  // ═══════════════════════════════════════════════════════════════════════════════

  private async queueTestGeneration(event: ChangeEvent): Promise<SynergyAction> {
    const action: SynergyAction = {
      id: `test-${Date.now()}`,
      trigger: event,
      targetProject: 'MrMindQATool',
      actionType: 'generate_test',
      status: 'pending',
    };

    this.actionQueue.push(action);
    return action;
  }

  private async queueDocUpdate(event: ChangeEvent): Promise<SynergyAction> {
    const action: SynergyAction = {
      id: `doc-${Date.now()}`,
      trigger: event,
      targetProject: 'MisterMindPage',
      actionType: 'update_doc',
      status: 'pending',
    };

    this.actionQueue.push(action);
    return action;
  }

  private async queueCaseStudy(event: ChangeEvent): Promise<SynergyAction> {
    const action: SynergyAction = {
      id: `case-${Date.now()}`,
      trigger: event,
      targetProject: 'MisterMindPage',
      actionType: 'create_case_study',
      status: 'pending',
    };

    this.actionQueue.push(action);
    return action;
  }

  private async processActionQueue(): Promise<void> {
    if (this.isProcessing || this.actionQueue.length === 0) return;

    this.isProcessing = true;

    while (this.actionQueue.length > 0) {
      const action = this.actionQueue.shift()!;
      action.status = 'in_progress';

      try {
        switch (action.actionType) {
          case 'generate_test':
            action.result = await this.executeTestGeneration(action);
            break;
          case 'update_doc':
            action.result = await this.executeDocUpdate(action);
            break;
          case 'create_case_study':
            action.result = await this.executeCaseStudy(action);
            break;
        }
        action.status = 'completed';
        this.emit('action:completed', action);
      } catch (error) {
        action.status = 'failed';
        action.result = `Error: ${error}`;
        this.emit('action:failed', action);
      }
    }

    this.isProcessing = false;
  }

  private async executeTestGeneration(action: SynergyAction): Promise<string> {
    const testCode = await this.generateTestForFunction(
      action.trigger.name,
      path.join(this.config.coreProject.path, action.trigger.file)
    );

    // Save test file
    const testDir = path.join(this.config.shieldProject.path, 'tests/auto-generated');
    const testFile = path.join(testDir, `${action.trigger.name}.spec.ts`);

    try {
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(testFile, testCode);
      action.generatedFile = testFile;
      this.log(`   ✅ Test saved: ${testFile}`);
    } catch (error) {
      this.log(`   ⚠️ Could not save test: ${error}`);
    }

    return testCode;
  }

  private async executeDocUpdate(action: SynergyAction): Promise<string> {
    const docContent = await this.updateDocumentation(action.trigger);

    // Save or update documentation
    const docDir = path.join(this.config.voiceProject.path, 'docs/api-updates');
    const docFile = path.join(docDir, `${action.trigger.name}.md`);

    try {
      fs.mkdirSync(docDir, { recursive: true });
      fs.writeFileSync(docFile, docContent);
      action.generatedFile = docFile;
      this.log(`   ✅ Doc saved: ${docFile}`);
    } catch (error) {
      this.log(`   ⚠️ Could not save doc: ${error}`);
    }

    return docContent;
  }

  private async executeCaseStudy(action: SynergyAction): Promise<string> {
    const caseStudy = await this.createCaseStudy(action.trigger);

    // Save case study
    const caseDir = path.join(this.config.voiceProject.path, 'case-studies');
    const caseFile = path.join(caseDir, `case-${Date.now()}-${action.trigger.name}.md`);

    try {
      fs.mkdirSync(caseDir, { recursive: true });
      fs.writeFileSync(caseFile, caseStudy);
      action.generatedFile = caseFile;
      this.log(`   ✅ Case study saved: ${caseFile}`);
    } catch (error) {
      this.log(`   ⚠️ Could not save case study: ${error}`);
    }

    return caseStudy;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════════

  private isSignificantChange(event: ChangeEvent): boolean {
    // A change is significant if:
    // - It's a new class or module
    // - It affects API endpoints
    // - It's in core business logic
    const significantPatterns = [
      /class\s+\w+/,
      /export\s+default/,
      /api|endpoint|route/i,
      /security|auth|payment/i,
    ];

    return significantPatterns.some(pattern => pattern.test(event.content));
  }

  private extractCodeFromResponse(response: string): string {
    const match = response.match(/```(?:typescript|ts|javascript|js)?\n?([\s\S]*?)```/);
    return match ? match[1].trim() : response;
  }

  private log(message: string): void {
    console.log(message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & CLI
// ═══════════════════════════════════════════════════════════════════════════════

let synergyInstance: CrossProjectSynergy | null = null;

export function getCrossProjectSynergy(): CrossProjectSynergy {
  if (!synergyInstance) {
    synergyInstance = new CrossProjectSynergy();
  }
  return synergyInstance;
}

if (require.main === module) {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    ⚔️ CROSS-PROJECT SYNERGY - TRIDENT ENGINE                  ║
║                                                                               ║
║                    QAntum Prime v28.1.0 - Empire Architect                    ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);

  const synergy = getCrossProjectSynergy();

  // Demo: Simulate a core change
  const demoEvent: ChangeEvent = {
    project: 'MisteMind',
    file: 'src/math/quantum-algo.ts',
    type: 'function',
    name: 'calculateQuantumEntropy',
    changeType: 'added',
    content: `export function calculateQuantumEntropy(state: QuantumState): number {
  // Calculate von Neumann entropy
  return -state.density.map(p => p * Math.log2(p)).reduce((a, b) => a + b, 0);
}`,
    timestamp: Date.now(),
  };

  console.log('📡 Simulating core change...\n');
  synergy.handleCoreChange(demoEvent).then(actions => {
    console.log(`\n✅ Generated ${actions.length} synergy actions`);
    actions.forEach(a => {
      console.log(`   • ${a.actionType}: ${a.status}`);
    });
  }).catch(console.error);
}

export default CrossProjectSynergy;
