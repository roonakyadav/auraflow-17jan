import { Context } from './Context';
/**
 * Represents an agent in the orchestration system.
 * An agent has a specific role, goal, and set of tools it can use.
 */
export declare class Agent {
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
    private llmClient;
    /**
     * Creates a new Agent instance
     * @param id - Unique identifier for the agent
     * @param role - Role of the agent
     * @param goal - Goal that the agent is trying to achieve
     * @param tools - Array of tools available to the agent
     */
    constructor(id: string, role: string, goal: string, tools: string[]);
    /**
     * Runs the agent with the given context
     * @param context - The shared context containing messages
     * @returns Promise resolving to the agent's output
     */
    run(context: Context): Promise<string>;
    /**
     * Builds a prompt for the LLM using the agent's role, goal, and context
     * @param context - The shared context containing messages
     * @returns Formatted prompt string
     */
    private buildPrompt;
}
