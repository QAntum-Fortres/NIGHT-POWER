/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                     GROQ CLOUD AGENT v1.0                                    ║
 * ║             100% БЕЗПЛАТЕН • Най-бързият AI                                  ║
 * ║                   Llama 3.3 70B • 500+ tok/sec                               ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Groq предлага БЕЗПЛАТЕН API с:
 * - 30 заявки/минута
 * - 14,400 заявки/ден
 * - Llama 3.3 70B модел
 * 
 * Вземи ключ от: https://console.groq.com/keys
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface GroqResponse {
  choices?: Array<{
    message: { content: string };
  }>;
  error?: { message: string };
}

export class GroqCloudAgent {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || GROQ_API_KEY;
    
    if (!this.apiKey) {
      console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    GROQ CLOUD AGENT - SETUP NEEDED                           ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ ⚠️  No API key found!                                                        ║
║                                                                              ║
║ Get your FREE key at: https://console.groq.com/keys                          ║
║ Then add to .env: GROQ_API_KEY=gsk_your_key_here                             ║
║                                                                              ║
║ FREE Limits:                                                                 ║
║   • 30 requests/minute                                                       ║
║   • 14,400 requests/day                                                      ║
║   • Llama 3.3 70B model                                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝
      `);
      return;
    }

    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    GROQ CLOUD AGENT v1.0                                     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ Model: llama-3.3-70b-versatile                                               ║
║ Speed: ⚡ 500+ tokens/sec                                                    ║
║ Cost: 🆓 FREE (30 req/min, 14,400 req/day)                                   ║
║ RAM Usage: 0 MB (Cloud)                                                      ║
║ Status: READY                                                                ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `);
  }

  async chat(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY not set. Get free key at: https://console.groq.com/keys');
    }

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as GroqResponse;
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('Empty response from Groq');
    }

    console.log(`[GROQ] ⚡ Response: ${text.length} chars`);
    return text;
  }

  async generateCode(description: string, language: string = 'TypeScript'): Promise<string> {
    return this.chat(
      `Generate ${language} code: ${description}. Return ONLY code, no explanations.`,
      'You are a code generator. Output only valid code.'
    );
  }
}

// Test
async function testGroq() {
  console.log('\n🧪 TESTING GROQ CLOUD AGENT\n');
  
  const agent = new GroqCloudAgent();
  
  if (!process.env.GROQ_API_KEY) {
    console.log('❌ No GROQ_API_KEY set. Get one free at https://console.groq.com/keys');
    return;
  }
  
  try {
    const response = await agent.chat('Say "Hello" in Bulgarian');
    console.log(`✅ Response: ${response}`);
  } catch (e: any) {
    console.log(`❌ Error: ${e.message}`);
  }
}

export const groqAgent = new GroqCloudAgent();

if (require.main === module) {
  testGroq();
}
