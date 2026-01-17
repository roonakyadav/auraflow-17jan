import { LLMClient } from '../services/LLMClient';
import { Context } from './Context';
import { ToolRegistry } from '../tools/ToolRegistry';

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

  // Sub-agents that this agent can delegate to
  subAgents: Agent[];

  // Tool registry for executing tools
  private toolRegistry: ToolRegistry | null = null;

  private llmClient: LLMClient | null = null;

  /**
   * Creates a new Agent instance
   * @param id - Unique identifier for the agent
   * @param role - Role of the agent
   * @param goal - Goal that the agent is trying to achieve
   * @param tools - Array of tools available to the agent
   * @param subAgents - Array of sub-agents
   * @param toolRegistry - Tool registry for executing tools
   */
  constructor(
    id: string, 
    role: string, 
    goal: string, 
    tools: string[], 
    subAgents: Agent[] = [],
    toolRegistry: ToolRegistry | null = null
  ) {
    this.id = id;
    this.role = role;
    this.goal = goal;
    this.tools = tools;
    this.subAgents = subAgents;
    this.toolRegistry = toolRegistry;
    // LLMClient will be initialized lazily when needed
  }

  /**
   * Runs the agent with the given context
   * @param context - The shared context containing messages
   * @returns Promise resolving to the agent's output
   */
  async run(context: Context): Promise<string> {
    // Use the enhanced method that supports sub-agents
    return this.runWithSubAgents(context);
  }

  /**
   * Builds a prompt for the LLM using the agent's role, goal, and context
   * @param context - The shared context containing messages
   * @returns Formatted prompt string
   */
  private buildPrompt(context: Context): string {
    // Get all messages from the context
    const messages = context.getMessages().map(msg => `[${msg.timestamp.toISOString()}] Agent ${msg.agentId}: ${msg.content}`).join('\n');
    
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

Your goal is: ${this.goal}${subAgentsInfo}${toolsInfo}

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
  public parseDelegation(output: string): { subAgentId: string; task: string } | null {
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
  async runWithSubAgents(context: Context): Promise<string> {
    // Initialize the LLM client if not already done
    if (!this.llmClient) {
      this.llmClient = new LLMClient();
    }
    
    // Construct a prompt using the agent's role, goal, and the current context
    const prompt = this.buildPrompt(context);
    
    // Call the LLM client to generate a response
    let response = await this.llmClient.generate(prompt);
    
    // Check if the response contains a delegation instruction
    const delegation = this.parseDelegation(response);
    if (delegation) {
      // Find the sub-agent to delegate to
      const subAgent = this.subAgents.find(sa => sa.id === delegation.subAgentId);
      if (subAgent) {
        // Create a temporary context for the sub-agent with the delegation task
        const subAgentContext = new (await import('./Context')).Context();
        
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
      } else {
        // If sub-agent not found, return the original response without delegation
        response = `ERROR: Sub-agent ${delegation.subAgentId} not found. Original response: ${response}`;
      }
    }
    
    return response;
  }
}