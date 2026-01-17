"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Agent = void 0;
const LLMClient_1 = require("../services/LLMClient");
/**
 * Represents an agent in the orchestration system.
 * An agent has a specific role, goal, and set of tools it can use.
 */
class Agent {
    /**
     * Unique identifier for the agent
     */
    id;
    /**
     * Role of the agent - describes what the agent is responsible for
     */
    role;
    /**
     * Goal that the agent is trying to achieve
     */
    goal;
    /**
     * Array of tools that the agent can use to accomplish its goal
     */
    tools;
    llmClient = null;
    /**
     * Creates a new Agent instance
     * @param id - Unique identifier for the agent
     * @param role - Role of the agent
     * @param goal - Goal that the agent is trying to achieve
     * @param tools - Array of tools available to the agent
     */
    constructor(id, role, goal, tools) {
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
    async run(context) {
        // Initialize the LLM client if not already done
        if (!this.llmClient) {
            this.llmClient = new LLMClient_1.LLMClient();
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
    buildPrompt(context) {
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
exports.Agent = Agent;
//# sourceMappingURL=Agent.js.map