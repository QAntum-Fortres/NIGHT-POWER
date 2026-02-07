/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    DEEPSEEK CLOUD AGENT v1.0                                 ║
 * ║              $0.001/заявка • 128K контекст • Без RAM/GPU                     ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-1e710d677e3440aaad3440928bb15d64';
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

export interface DeepSeekResponse {
  success: boolean;
  response: string;
  model: string;
  tokens?: number;
  cost?: string;
}

const QANTUM_SYSTEM = `Ти си QANTUM v35 - Суверенен Когнитивен Агент на QAntum Empire.

ОСНОВНИ ПРАВИЛА:
1. Отговаряй КРАТКО и ТОЧНО
2. Код = само код, без излишни обяснения
3. TypeScript е основен език
4. Bulgarian за комуникация

ФУНКЦИИ (изпълнявай като JSON):
- RUN_AUDIT: Системна диагностика
- SCAN_MODULES: Сканиране на модули  
- GENERATE_CODE: Генериране на код (params: type, name)
- ANALYZE_CODE: Анализ на код (params: file)
- GIT_STATUS: Git състояние
- GIT_COMMIT: Commit (params: message)
- HEAL_SYSTEM: Автоматична поправка
- EXECUTE_COMMAND: Терминална команда (params: cmd)

OUTPUT FORMAT:
{"thought":"вътрешно разсъждение","action":"FUNCTION_NAME","parameters":{},"response":"отговор"}`;

export async function askDeepSeek(prompt: string): Promise<DeepSeekResponse> {
  console.log('[DEEPSEEK] ☁️ Sending to cloud...');
  const startTime = Date.now();
  
  try {
    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: QANTUM_SYSTEM },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const data = await response.json();
    const elapsed = Date.now() - startTime;
    const text = data.choices?.[0]?.message?.content || '';
    const tokens = data.usage?.total_tokens || 0;
    
    // DeepSeek pricing: ~$0.14/1M input, $0.28/1M output tokens
    const cost = (tokens * 0.00000028).toFixed(6);

    console.log(`[DEEPSEEK] ✅ ${tokens} tokens in ${elapsed}ms ($${cost})`);

    return {
      success: true,
      response: text,
      model: 'deepseek-chat',
      tokens,
      cost: `$${cost}`
    };
  } catch (error: any) {
    console.error('[DEEPSEEK] ❌ Error:', error.message);
    return {
      success: false,
      response: error.message,
      model: 'deepseek-chat'
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERACTIVE AGENT
// ═══════════════════════════════════════════════════════════════════════════

export class DeepSeekAgent {
  private conversationHistory: { role: string; content: string }[] = [];
  private totalTokens = 0;
  private totalCost = 0;

  constructor() {
    this.conversationHistory.push({ role: 'system', content: QANTUM_SYSTEM });
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    DEEPSEEK CLOUD AGENT INITIALIZED                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ Model: deepseek-chat (128K context)                                          ║
║ Cost: ~$0.001 per request                                                    ║
║ RAM: 0 MB (cloud)                                                            ║
║ GPU: 0% (cloud)                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `);
  }

  async chat(message: string): Promise<string> {
    this.conversationHistory.push({ role: 'user', content: message });
    
    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: this.conversationHistory,
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'Грешка';
    const tokens = data.usage?.total_tokens || 0;
    
    this.totalTokens += tokens;
    this.totalCost += tokens * 0.00000028;
    
    this.conversationHistory.push({ role: 'assistant', content: text });
    
    return text;
  }

  getStats() {
    return {
      messages: this.conversationHistory.length - 1,
      tokens: this.totalTokens,
      cost: `$${this.totalCost.toFixed(6)}`
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST
// ═══════════════════════════════════════════════════════════════════════════

async function test() {
  console.log('\n🧪 TESTING DEEPSEEK CLOUD AGENT\n');
  
  // Test 1: Simple question
  console.log('1️⃣ Testing identity...');
  const r1 = await askDeepSeek('Кой си ти? Отговори кратко на български.');
  console.log('Response:', r1.response.substring(0, 300));
  console.log('');
  
  // Test 2: Code generation
  console.log('2️⃣ Testing code generation...');
  const r2 = await askDeepSeek('Напиши TypeScript функция за quicksort. Само код.');
  console.log('Response:', r2.response.substring(0, 500));
  console.log('');
  
  // Test 3: Function call
  console.log('3️⃣ Testing function detection...');
  const r3 = await askDeepSeek('Провери състоянието на системата');
  console.log('Response:', r3.response);
  
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                         TEST COMPLETE                                        ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ 💰 Total Cost: ${(r1.cost || '$0') + ' + ' + (r2.cost || '$0') + ' + ' + (r3.cost || '$0')}                                          ║
║ 💻 RAM Used: 0 MB                                                            ║
║ 🎮 GPU Used: 0%                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
  `);
}

if (require.main === module) {
  test().catch(console.error);
}
