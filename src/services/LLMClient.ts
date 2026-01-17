import Groq from 'groq-sdk';
import chalk from 'chalk';

// Track if the client has been initialized to prevent duplicate logs
let isInitialized = false;

/**
 * Model-agnostic LLM client using Groq API
 */
export class LLMClient {
  private client: Groq;
  private readonly DEFAULT_MODEL = process.env.CURRENT_AI_MODEL || 'llama-3.1-8b-instant';

  constructor() {
    // Check environment variable first, fallback to hardcoded
    const GROQ_API_KEY = process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY';
    
    // Only log once when the first client is initialized
    if (!isInitialized) {
      console.log(chalk.green('INITIALIZATION'));
      console.log(chalk.green('-------------'));
      console.log(chalk.green('✓ Groq client initialized'));
      console.log(chalk.green(`✓ Using model: ${this.DEFAULT_MODEL}`));
      isInitialized = true;
    }
    
    this.client = new Groq({ apiKey: GROQ_API_KEY });
  }

  /**
   * Generates a response from the LLM based on the provided prompt
   * @param prompt - The input prompt for the LLM
   * @returns Promise resolving to the generated text
   */
  async generate(prompt: string): Promise<string> {
    try {
      const chatCompletion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: this.DEFAULT_MODEL,
      });

      return chatCompletion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error(chalk.red('Error calling LLM:'), error);
      throw error;
    }
  }
}