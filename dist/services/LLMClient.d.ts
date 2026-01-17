/**
 * Model-agnostic LLM client using Groq API
 */
export declare class LLMClient {
    private client;
    private readonly DEFAULT_MODEL;
    constructor();
    /**
     * Generates a response from the LLM based on the provided prompt
     * @param prompt - The input prompt for the LLM
     * @returns Promise resolving to the generated text
     */
    generate(prompt: string): Promise<string>;
}
