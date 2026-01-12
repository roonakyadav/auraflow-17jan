import { LLMClient } from '../services/LLMClient';
import { Context } from './Context';

/**
 * Represents an agent in the orchestration system.
 * An agent has a specific role, goal, and set of tools it can use.
 */
export class Agent {
  /**
   * Unique identifier for the agent
   */
  id: string;

  /**
   * Role of the agent - describes what the agent is responsible for
   */
  role: string;

  /**
   * Goal that the agent is trying to achieve
   */
  goal: string;

  /**
   * Array of tools that the agent can use to accomplish its goal
   */
  tools: string[];

  private llmClient: LLMClient | null = null;

  /**
   * Creates a new Agent instance
   * @param id - Unique identifier for the agent
   * @param role - Role of the agent
   * @param goal - Goal that the agent is trying to achieve
   * @param tools - Array of tools available to the agent
   */
  constructor(id: string, role: string, goal: string, tools: string[]) {
    this.id = id;
    this.role = role;
    this.goal = goal;
    this.tools = tools;
    // LLMClient will be initialized lazily when needed
  }

  /**
   * Runs the agent with the given context
   * @param context - The shared context containing messages
   * @returns Promise resolving to the agent's output
   */
  async run(context: Context): Promise<string> {
    // Initialize the LLM client if not already done
    if (!this.llmClient) {
      this.llmClient = new LLMClient();
    }
    
    // Construct a prompt using the agent's role, goal, and the current context
    const prompt = this.buildPrompt(context);
    
    // Call the LLM client to generate a response
    const response = await this.llmClient.generate(prompt);
    
    return response;
  }

  /**
   * Builds a prompt for the LLM using the agent's role, goal, and context
   * @param context - The shared context containing messages
   * @returns Formatted prompt string
   */
  private buildPrompt(context: Context): string {
    // Get all messages from the context
    const messages = context.getMessages().map(msg => `[${msg.timestamp.toISOString()}] Agent ${msg.agentId}: ${msg.content}`).join('\n');
    
    // Construct the full prompt
    const prompt = `You are an AI agent with the following role: ${this.role}

Your goal is: ${this.goal}

Current context:
${messages}

Do not ask questions. Complete the task independently and return a final answer.`;
    
    return prompt;
  }
}