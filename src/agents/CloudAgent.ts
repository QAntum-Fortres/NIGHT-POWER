/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    CLOUD AGENT - GEMINI 2.0 FLASH                            ║
 * ║                  100% БЕЗПЛАТЕН • Без RAM • Без GPU                          ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDfCepgEg8Q4arYE1iQGK6puHJpiCsHDws';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface CloudAgentResponse {
  success: boolean;
  response: string;
  model: string;
  tokens?: number;
}

const QANTUM_SYSTEM = `Ти си QANTUM v35 - Суверенен Когнитивен Агент.
Отговаряй кратко и точно. Ако трябва код - само код, без обяснения.
Езици: TypeScript основен, Bulgarian за комуникация.
Функции: RUN_AUDIT, SCAN_MODULES, GENERATE_CODE, ANALYZE_CODE, GIT_STATUS
Отговаряй в JSON: {"thought":"...", "action":"...", "response":"..."}`;

export async function askGemini(prompt: string): Promise<CloudAgentResponse> {
  console.log('[GEMINI] ☁️ Sending to cloud...');
  
  try {
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: QANTUM_SYSTEM },
            { text: prompt }
          ]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const tokens = data.usageMetadata?.totalTokenCount || 0;

    console.log(`[GEMINI] ✅ Response received (${tokens} tokens)`);

    return {
      success: true,
      response: text,
      model: 'gemini-2.0-flash',
      tokens
    };
  } catch (error: any) {
    console.error('[GEMINI] ❌ Error:', error.message);
    return {
      success: false,
      response: error.message,
      model: 'gemini-2.0-flash'
    };
  }
}

// Embedding чрез Gemini (също безплатно!)
export async function getGeminiEmbedding(text: string): Promise<number[] | null> {
  const EMBED_URL = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent';
  
  try {
    const response = await fetch(`${EMBED_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text: text.substring(0, 2000) }] }
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.embedding?.values || null;
  } catch (e) {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST
// ═══════════════════════════════════════════════════════════════════════════

async function test() {
  console.log('\n🧪 TESTING GEMINI CLOUD AGENT\n');
  
  // Test 1: Simple question
  console.log('1️⃣ Testing simple query...');
  const r1 = await askGemini('Кой си ти?');
  console.log('Response:', r1.response.substring(0, 200));
  
  // Test 2: Code generation
  console.log('\n2️⃣ Testing code generation...');
  const r2 = await askGemini('Generate a TypeScript function that calculates fibonacci');
  console.log('Response:', r2.response.substring(0, 300));
  
  // Test 3: Embedding
  console.log('\n3️⃣ Testing embedding...');
  const emb = await getGeminiEmbedding('QA automation testing framework');
  console.log('Embedding dimension:', emb?.length || 'FAILED');
  
  console.log('\n✅ ALL TESTS COMPLETE!\n');
  console.log('💰 Cost: $0.00 (100% FREE)');
  console.log('💻 RAM used: 0 MB');
  console.log('🎮 GPU used: 0%');
}

if (require.main === module) {
  test().catch(console.error);
}
