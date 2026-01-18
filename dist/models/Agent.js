"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Agent = void 0;
const LLMClient_1 = require("../services/LLMClient");
const Context_1 = require("./Context");
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
    // Sub-agents that this agent can delegate to
    subAgents;
    // Tool registry for executing tools
    toolRegistry = null;
    llmClient = null;
    networkLogger = null;
    persistentMemory = null;
    vectorMemory = null; // Optional vector memory
    /**
     * Creates a new Agent instance
     * @param id - Unique identifier for the agent
     * @param role - Role of the agent
     * @param goal - Goal that the agent is trying to achieve
     * @param tools - Array of tools available to the agent
     * @param subAgents - Array of sub-agents
     * @param toolRegistry - Tool registry for executing tools
     * @param networkLogger - Network logger for tracking API calls
     */
    constructor(id, role, goal, tools, subAgents = [], toolRegistry = null, networkLogger, persistentMemory) {
        this.id = id;
        this.role = role;
        this.goal = goal;
        this.tools = tools;
        this.subAgents = subAgents;
        this.toolRegistry = toolRegistry;
        this.networkLogger = networkLogger || null;
        this.persistentMemory = persistentMemory || null;
        // LLMClient will be initialized lazily when needed
    }
    /**
     * Sets the persistent memory for this agent
     * @param persistentMemory - The persistent memory instance
     */
    setPersistentMemory(persistentMemory) {
        this.persistentMemory = persistentMemory;
    }
    /**
     * Sets the vector memory for this agent
     * @param vectorMemory - The vector memory instance
     */
    setVectorMemory(vectorMemory) {
        this.vectorMemory = vectorMemory;
    }
    /**
     * Runs the agent with the given context
     * @param context - The shared context containing messages
     * @returns Promise resolving to the agent's output
     */
    async run(context) {
        // Use the enhanced method that supports sub-agents
        return this.runWithSubAgents(context);
    }
    /**
     * Builds a prompt for the LLM using the agent's role, goal, and context
     * @param context - The shared context containing messages
     * @returns Formatted prompt string
     */
    async buildPrompt(context) {
        // Get all messages from the context
        const messages = context.getMessages().map(msg => `[${msg.timestamp.toISOString()}] Agent ${msg.agentId}: ${msg.content}`).join('\n');
        // Get relevant persistent memory for this agent
        let persistentMemoryContext = "";
        if (this.persistentMemory) {
            // Get recent chronological memories (existing behavior)
            const recentMemories = this.persistentMemory.getByAgent(this.id, 5);
            // Get semantically relevant memories if vector memory is enabled
            let semanticMemories = [];
            if (this.vectorMemory) {
                // Use current context as search query for semantic similarity
                const contextQuery = messages.substring(0, 500); // Limit query length
                semanticMemories = await this.vectorMemory.search(contextQuery, this.id);
            }
            // Combine memories - chronological first, then semantic (avoiding duplicates)
            const allUniqueMemories = [...recentMemories];
            const recentIds = new Set(recentMemories.map(m => m.id));
            for (const semMem of semanticMemories) {
                if (!recentIds.has(semMem.id)) {
                    allUniqueMemories.push(semMem);
                }
            }
            if (allUniqueMemories.length > 0) {
                const memoryEntries = allUniqueMemories.map((mem, index) => {
                    const isSemantic = index >= recentMemories.length;
                    const prefix = isSemantic ? '[SEMANTIC]' : '[CHRONOLOGICAL]';
                    return `[${new Date(mem.timestamp).toISOString()}] ${prefix} Previous experience: ${mem.content.substring(0, 200)}${mem.content.length > 200 ? '...' : ''}`;
                }).join('\n');
                persistentMemoryContext = `

Your past experiences (chronological + semantic):
${memoryEntries}

Use these experiences to inform your current task. Chronological memories are recent, semantic memories are conceptually relevant.`;
            }
        }
        // Format available sub-agents if they exist
        let subAgentsInfo = "";
        if (this.subAgents && this.subAgents.length > 0) {
            const subAgentList = this.subAgents.map(sa => `  - ${sa.id}: ${sa.role} (Goal: ${sa.goal})`).join('\n');
            subAgentsInfo = `

Available sub-agents you can delegate to:
${subAgentList}

If you need to delegate part of your task to a sub-agent, respond with: DELEGATE_TO:<sub_agent_id>:<task_description_for_sub_agent>`;
        }
        // Format available tools if they exist
        let toolsInfo = "";
        if (this.tools && this.tools.length > 0) {
            const toolList = this.tools.map(tool => `  - ${tool}`).join('\n');
            toolsInfo = `

[INTERNET ACCESS AVAILABLE]
Available tools:
${toolList}

You can use web_search to gather current information from the internet.`;
        }
        // Construct the full prompt
        const prompt = `You are an AI agent with the following role: ${this.role}

Your goal is: ${this.goal}${subAgentsInfo}${toolsInfo}${persistentMemoryContext}

Current context:
${messages}

Do not ask questions. Complete the task independently and return a final answer.`;
        return prompt;
    }
    /**
     * Checks if the agent's output contains a delegation instruction
     * @param output - The agent's output
     * @returns The delegation instruction if found, null otherwise
     */
    parseDelegation(output) {
        // Match DELEGATE_TO with flexible spacing
        const delegationMatch = output.match(/^\s*DELEGATE_TO:\s*(.+?)\s*:\s*(.+)/m);
        if (delegationMatch) {
            return {
                subAgentId: delegationMatch[1].trim(),
                task: delegationMatch[2].trim()
            };
        }
        return null;
    }
    /**
     * Runs the agent with the given context, handling potential sub-agent delegations
     * @param context - The shared context containing messages
     * @returns Promise resolving to the agent's output
     */
    async runWithSubAgents(context) {
        // Initialize the LLM client if not already done
        if (!this.llmClient) {
            this.llmClient = new LLMClient_1.LLMClient(this.networkLogger || undefined);
        }
        // Construct a prompt using the agent's role, goal, and the current context
        const prompt = await this.buildPrompt(context);
        // Call the LLM client to generate a response
        let response = await this.llmClient.generate(prompt);
        // Check if the response contains a delegation instruction
        const delegation = this.parseDelegation(response);
        if (delegation) {
            // Find the sub-agent to delegate to
            const subAgent = this.subAgents.find(sa => sa.id === delegation.subAgentId);
            if (subAgent) {
                // Create a temporary context for the sub-agent with the delegation task
                const subAgentContext = new Context_1.Context();
                // Add the delegation task to the sub-agent's context
                subAgentContext.addMessage(this.id, `Task delegated from parent agent: ${delegation.task}`);
                // Run the sub-agent with its own context
                const subAgentResponse = await subAgent.run(subAgentContext);
                // Add the sub-agent's response to the main context
                context.addMessage(subAgent.id, subAgentResponse);
                // Now have the parent agent respond to the original prompt with the sub-agent's result
                const followUpPrompt = `${prompt}

The sub-agent ${delegation.subAgentId} has completed the delegated task with the following result:
${subAgentResponse}

Now please continue with your original task using this information.`;
                response = await this.llmClient.generate(followUpPrompt);
            }
            else {
                // If sub-agent not found, return the original response without delegation
                response = `ERROR: Sub-agent ${delegation.subAgentId} not found. Original response: ${response}`;
            }
        }
        return response;
    }
}
exports.Agent = Agent;
//# sourceMappingURL=Agent.js.map