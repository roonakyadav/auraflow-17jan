"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMClient = void 0;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const chalk_1 = __importDefault(require("chalk"));
// Track if the client has been initialized to prevent duplicate logs
let isInitialized = false;
/**
 * Model-agnostic LLM client using Groq API
 */
class LLMClient {
    client;
    DEFAULT_MODEL = process.env.CURRENT_AI_MODEL || 'llama-3.1-8b-instant';
    constructor() {
        // Check environment variable first, fallback to hardcoded
        const GROQ_API_KEY = process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY';
        // Only log once when the first client is initialized
        if (!isInitialized) {
            console.log(chalk_1.default.green('INITIALIZATION'));
            console.log(chalk_1.default.green('-------------'));
            console.log(chalk_1.default.green('✓ Groq client initialized'));
            console.log(chalk_1.default.green(`✓ Using model: ${this.DEFAULT_MODEL}`));
            isInitialized = true;
        }
        this.client = new groq_sdk_1.default({ apiKey: GROQ_API_KEY });
    }
    /**
     * Generates a response from the LLM based on the provided prompt
     * @param prompt - The input prompt for the LLM
     * @returns Promise resolving to the generated text
     */
    async generate(prompt) {
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
        }
        catch (error) {
            console.error(chalk_1.default.red('Error calling LLM:'), error);
            throw error;
        }
    }
}
exports.LLMClient = LLMClient;
//# sourceMappingURL=LLMClient.js.map