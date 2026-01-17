import { Context } from './Context';
import { ToolRegistry } from '../tools/ToolRegistry';
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
    subAgents: Agent[];
    private toolRegistry;
    private llmClient;
    /**
     * Creates a new Agent instance
     * @param id - Unique identifier for the agent
     * @param role - Role of the agent
     * @param goal - Goal that the agent is trying to achieve
     * @param tools - Array of tools available to the agent
     * @param subAgents - Array of sub-agents
     * @param toolRegistry - Tool registry for executing tools
     */
    constructor(id: string, role: string, goal: string, tools: string[], subAgents?: Agent[], toolRegistry?: ToolRegistry | null);
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
    /**
     * Checks if the agent's output contains a delegation instruction
     * @param output - The agent's output
     * @returns The delegation instruction if found, null otherwise
     */
    parseDelegation(output: string): {
        subAgentId: string;
        task: string;
    } | null;
    /**
     * Runs the agent with the given context, handling potential sub-agent delegations
     * @param context - The shared context containing messages
     * @returns Promise resolving to the agent's output
     */
    runWithSubAgents(context: Context): Promise<string>;
}
