/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                     GEMINI CLOUD AGENT v1.0                                  ║
 * ║             100% БЕЗПЛАТЕН • Не товари RAM/CPU                               ║
 * ║                   Google Gemini 2.0 Flash                                    ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDfCkzaLwOf0qr3_V90o_qz0ONni9m4Kgk';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
  error?: { message: string; code: number };
}

export class GeminiCloudAgent {
  private apiKey: string;
  private retryDelay: number = 2000;
  private maxRetries: number = 5;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || GEMINI_API_KEY;
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    GEMINI CLOUD AGENT v1.0                                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ Model: gemini-2.0-flash                                                      ║
║ Cost: 🆓 FREE                                                                ║
║ RAM Usage: 0 MB (Cloud)                                                      ║
║ Status: READY                                                                ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async chat(prompt: string, systemPrompt?: string): Promise<string> {
    const fullPrompt = systemPrompt 
      ? `${systemPrompt}\n\nUser: ${prompt}`
      : prompt;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: fullPrompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048
            }
          })
        });

        if (response.status === 429) {
          // Rate limited - wait and retry
          const waitTime = this.retryDelay * (attempt + 1);
          console.log(`[GEMINI] ⏳ Rate limited. Waiting ${waitTime}ms...`);
          await this.sleep(waitTime);
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json() as GeminiResponse;
        
        if (data.error) {
          throw new Error(data.error.message);
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new Error('Empty response');
        }

        console.log(`[GEMINI] ✅ Response received (${text.length} chars)`);
        return text;

      } catch (error: any) {
        if (attempt === this.maxRetries - 1) {
          console.error(`[GEMINI] ❌ All retries failed: ${error.message}`);
          throw error;
        }
        
        console.log(`[GEMINI] ⚠️ Attempt ${attempt + 1} failed, retrying...`);
        await this.sleep(this.retryDelay);
      }
    }

    throw new Error('Max retries exceeded');
  }

  async generateCode(description: string, language: string = 'TypeScript'): Promise<string> {
    const prompt = `Generate ${language} code for: ${description}

Rules:
1. Return ONLY the code, no explanations
2. Use modern syntax and best practices
3. Include error handling
4. Add brief comments

Code:`;

    return this.chat(prompt);
  }

  async analyzeCode(code: string): Promise<string> {
    const prompt = `Analyze this code and provide:
1. What it does
2. Potential bugs or issues
3. Suggestions for improvement

Code:
\`\`\`
${code}
\`\`\``;

    return this.chat(prompt);
  }

  async embedText(text: string): Promise<number[]> {
    // Gemini embedding endpoint
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: { parts: [{ text }] }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json() as { embedding?: { values: number[] } };
      return data.embedding?.values || [];
    } catch (error: any) {
      console.error(`[GEMINI] Embedding failed: ${error.message}`);
      return [];
    }
  }
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                              TEST                                            ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

async function testGemini() {
  console.log('\n🧪 TESTING GEMINI CLOUD AGENT\n');
  
  const agent = new GeminiCloudAgent();
  
  // Wait a bit to avoid rate limit
  console.log('Waiting 5 seconds to avoid rate limit...\n');
  await new Promise(r => setTimeout(r, 5000));
  
  try {
    // Test chat
    console.log('1️⃣ Testing chat...');
    const response = await agent.chat('Кажи "Здравей" на български');
    console.log(`   Response: ${response.substring(0, 100)}...\n`);
    
    // Test code generation
    console.log('2️⃣ Testing code generation...');
    const code = await agent.generateCode('function that calculates factorial');
    console.log(`   Generated: ${code.substring(0, 100)}...\n`);
    
    console.log('✅ ALL TESTS PASSED!\n');
  } catch (error: any) {
    console.log(`❌ Test failed: ${error.message}`);
    console.log('   This might be due to rate limiting. Try again in a minute.');
  }
}

// Export singleton
export const geminiAgent = new GeminiCloudAgent();

// Run test if main
if (require.main === module) {
  testGemini();
}
