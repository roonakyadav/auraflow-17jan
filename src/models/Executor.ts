import { Workflow } from './Workflow';
import { Context, Message } from './Context';
import { Agent } from './Agent';



/**
 * Responsible for executing workflows.
 * This class handles the actual execution of workflow steps using agents.
 */
export class Executor {
  /**
   * Executes a workflow using the provided agents and context
   * @param workflow - The workflow to execute
   * @param agents - Array of agents available for the workflow
   * @param context - Shared context for the workflow
   */
  async execute(workflow: Workflow, agents: Agent[], context: Context): Promise<void> {
    console.log('Starting workflow execution...');
    console.log(`Workflow ID: ${workflow.id}`);
    console.log(`Workflow Type: ${workflow.type}`);
    
    if (workflow.type === 'sequential') {
      console.log(`Number of Steps: ${workflow.steps.length}`);
      await this.executeSequential(workflow, agents, context);
    } else if (workflow.type === 'parallel') {
      console.log(`Number of Branches: ${workflow.branches.length}`);
      if (workflow.then) {
        console.log(`Then Agent: ${workflow.then.agent}`);
      }
      await this.executeParallel(workflow, agents, context);
    } else {
      console.log(`Execution for workflow type '${workflow.type}' not implemented yet`);
    }
  }
  
  /**
   * Executes a sequential workflow
   * @param workflow - The sequential workflow to execute
   * @param agents - Array of agents available for the workflow
   * @param context - Shared context for the workflow
   */
  private async executeSequential(workflow: Workflow, agents: Agent[], context: Context): Promise<void> {
    console.log('\nExecuting sequential workflow...');
    console.log('Execution order:');
    
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      const stepName = step.id ?? `step-${i + 1}`;
      const actionName = step.action ?? "execute";
      console.log(`\n[${i + 1}/${workflow.steps.length}] Executing ${stepName} (Agent: ${step.agent}, Action: ${actionName})`);
      
      // Find the agent for this step
      const agent = agents.find(a => a.id === step.agent);
      if (!agent) {
        throw new Error(`Agent with ID '${step.agent}' not found for step '${step.id}'`);
      }
      
      console.log(`Running agent: ${agent.id} (${agent.role})`);
      
      // Execute the agent with the current context
      const output = await agent.run(context);
      
      // Append the agent's output to the context as a new message
      context.addMessage(agent.id, output);
      
      console.log("\n--- AGENT OUTPUT START ---\n");
      console.log(output);
      console.log("\n--- AGENT OUTPUT END ---\n");
    }
    
    console.log('\nSequential workflow execution completed!');
    
    // Print the final context messages
    console.log('\nFinal Results:');
    console.log('--------------------------------');
    
    // Group messages by agent ID
    const messages = context.getMessages();
    const messagesByAgent: { [key: string]: string[] } = {};
    messages.forEach(msg => {
      if (!messagesByAgent[msg.agentId]) {
        messagesByAgent[msg.agentId] = [];
      }
      messagesByAgent[msg.agentId].push(msg.content);
    });
    
    // Print each agent's outputs
    Object.entries(messagesByAgent).forEach(([agentId, contents]) => {
      console.log(`[${agentId}]`);
      contents.forEach(content => {
        console.log(content);
        console.log(); // Empty line between outputs from the same agent
      });
    });
    
    console.log('--------------------------------');
  }
  
  /**
   * Executes a parallel workflow
   * @param workflow - The parallel workflow to execute
   * @param agents - Array of agents available for the workflow
   * @param context - Shared context for the workflow
   */
  private async executeParallel(workflow: Workflow, agents: Agent[], context: Context): Promise<void> {
    console.log('\nExecuting parallel workflow...');
    console.log('Branches:');
    
    // Execute all branches concurrently
    const branchPromises = workflow.branches.map(async (branch, index) => {
      const branchName = branch.id ?? `branch-${index + 1}`;
      const actionName = branch.action ?? "execute";
      console.log(`\n[${index + 1}/${workflow.branches.length}] Executing ${branchName} (Agent: ${branch.agent}, Action: ${actionName})`);
      
      // Find the agent for this branch
      const agent = agents.find(a => a.id === branch.agent);
      if (!agent) {
        throw new Error(`Agent with ID '${branch.agent}' not found for branch '${branch.id}'`);
      }
      
      console.log(`Running agent: ${agent.id} (${agent.role})`);
      
      // Execute the agent with the current context
      const output = await agent.run(context);
      
      // Append the agent's output to the context as a new message
      context.addMessage(agent.id, output);
      
      console.log("\n--- BRANCH OUTPUT START ---\n");
      console.log(output);
      console.log("\n--- BRANCH OUTPUT END ---\n");
      
      return { branch, output };
    });
    
    // Wait for all branches to complete
    const branchResults = await Promise.all(branchPromises);
    
    console.log('\nAll branches completed!');
    
    // If there's a 'then' step, execute it with the aggregated context
    if (workflow.then) {
      const thenAction = workflow.then.action ?? "execute";
      console.log(`\nExecuting 'then' step: Agent: ${workflow.then.agent}, Action: ${thenAction}`);
      
      // Find the 'then' agent
      const thenAgent = agents.find(a => a.id === workflow.then!.agent);
      if (!thenAgent) {
        throw new Error(`'Then' agent with ID '${workflow.then!.agent}' not found`);
      }
      
      console.log(`Running 'then' agent: ${thenAgent.id} (${thenAgent.role})`);
      
      // Execute the 'then' agent with the aggregated context
      const finalOutput = await thenAgent.run(context);
      
      // Append the final agent's output to the context
      context.addMessage(thenAgent.id, finalOutput);
      
      console.log("\n--- THEN AGENT OUTPUT START ---\n");
      console.log(finalOutput);
      console.log("\n--- THEN AGENT OUTPUT END ---\n");
    }
    
    console.log('\nParallel workflow execution completed!');
    
    // Print the final context messages
    console.log('\nFinal Results:');
    console.log('--------------------------------');
    
    // Group messages by agent ID
    const messages = context.getMessages();
    const messagesByAgent: { [key: string]: string[] } = {};
    messages.forEach(msg => {
      if (!messagesByAgent[msg.agentId]) {
        messagesByAgent[msg.agentId] = [];
      }
      messagesByAgent[msg.agentId].push(msg.content);
    });
    
    // Print each agent's outputs
    Object.entries(messagesByAgent).forEach(([agentId, contents]) => {
      console.log(`[${agentId}]`);
      contents.forEach(content => {
        console.log(content);
        console.log(); // Empty line between outputs from the same agent
      });
    });
    
    console.log('--------------------------------');
  }
}