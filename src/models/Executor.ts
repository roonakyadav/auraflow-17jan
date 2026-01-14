import { Workflow } from './Workflow';
import { Context, Message } from './Context';
import { Agent } from './Agent';
import chalk from 'chalk';



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
    console.log('\nEXECUTION LOGS');
    console.log('--------------');
    console.log(`ID: ${workflow.id}`);
    console.log(`Type: ${workflow.type}`);
    console.log(`Stop on error: ${workflow.stopOnError}`);
    
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
    console.log('\nSEQUENTIAL EXECUTION');
    console.log('-------------------');
    
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      const stepName = step.id ?? `step-${i + 1}`;
      const actionName = step.action ?? "execute";
      console.log(`\n${chalk.green('▶')} ${chalk.yellow(stepName)} [${step.agent}] (Action: ${actionName}) [${i + 1}/${workflow.steps.length}]`);
      
      // Find the agent for this step
      const agent = agents.find(a => a.id === step.agent);
      if (!agent) {
        const errorMsg = `Agent with ID '${step.agent}' not found for step '${stepName}'`;
        console.error(chalk.red(errorMsg));
        if (workflow.stopOnError) {
          throw new Error(errorMsg);
        } else {
          console.log(chalk.yellow('Continuing execution (stopOnError=false)...'));
          continue;
        }
      }
      
      console.log(`  ${chalk.gray('Running:')} ${chalk.yellow(agent.id)} (${agent.role})`);
      
      try {
        // Execute the agent with the current context
        const output = await agent.run(context);
        
        // Append the agent's output to the context as a new message
        context.addMessage(agent.id, output);
        
        console.log('\nAGENT OUTPUT');
        console.log('------------');
        console.log(output);
        console.log('------------');
      } catch (error: any) {
        const errorMsg = `Error executing agent '${agent.id}': ${error.message}`;
        console.error(chalk.red(errorMsg));
        if (workflow.stopOnError) {
          throw new Error(errorMsg);
        } else {
          console.log(chalk.yellow('Continuing execution (stopOnError=false)...'));
          continue;
        }
      }
    }
    
    console.log('\nSEQUENTIAL EXECUTION COMPLETED');
    console.log('------------------------------');
    
    // Print the final context messages
    console.log('\nFINAL RESULT');
    console.log('------------');
    
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
      console.log(`${chalk.yellow('AGENT: ' + agentId)}`);
      console.log('-------------');
      contents.forEach(content => {
        console.log(content);
        console.log(); // Empty line between outputs from the same agent
      });
    });
  }
  
  /**
   * Executes a parallel workflow
   * @param workflow - The parallel workflow to execute
   * @param agents - Array of agents available for the workflow
   * @param context - Shared context for the workflow
   */
  private async executeParallel(workflow: Workflow, agents: Agent[], context: Context): Promise<void> {
    console.log('\nPARALLEL EXECUTION');
    console.log('-----------------');
    
    // Execute all branches concurrently
    const branchPromises = workflow.branches.map(async (branch, index) => {
      const branchName = branch.id ?? `branch-${index + 1}`;
      const actionName = branch.action ?? "execute";
      console.log(`\n${chalk.green('▶')} ${chalk.yellow(branchName)} [${branch.agent}] (Action: ${actionName}) [${index + 1}/${workflow.branches.length}]`);
      
      // Find the agent for this branch
      const agent = agents.find(a => a.id === branch.agent);
      if (!agent) {
        const errorMsg = `Agent with ID '${branch.agent}' not found for branch '${branchName}'`;
        console.error(chalk.red(errorMsg));
        if (workflow.stopOnError) {
          throw new Error(errorMsg);
        } else {
          console.log(chalk.yellow('Continuing execution (stopOnError=false)...'));
          return { branch, output: null, error: errorMsg };
        }
      }
      
      console.log(`  ${chalk.gray('Running:')} ${chalk.yellow(agent.id)} (${agent.role})`);
      
      try {
        // Execute the agent with the current context
        const output = await agent.run(context);
        
        // Append the agent's output to the context as a new message
        context.addMessage(agent.id, output);
        
        console.log('\nBRANCH OUTPUT');
        console.log('-------------');
        console.log(output);
        console.log('-------------');
        
        return { branch, output };
      } catch (error: any) {
        const errorMsg = `Error executing agent '${agent.id}': ${error.message}`;
        console.error(chalk.red(errorMsg));
        if (workflow.stopOnError) {
          throw new Error(errorMsg);
        } else {
          console.log(chalk.yellow('Continuing execution (stopOnError=false)...'));
          return { branch, output: null, error: errorMsg };
        }
      }
    });
    
    // Wait for all branches to complete
    const branchResults = await Promise.all(branchPromises);
    
    console.log('\nAll branches completed!');
    
    // If there's a 'then' step, execute it with the aggregated context
    if (workflow.then) {
      const thenAction = workflow.then.action ?? "execute";
      console.log(`\n${chalk.green('▶ Then:')} [${workflow.then.agent}] (Action: ${thenAction})`);
      
      // Find the 'then' agent
      const thenAgent = agents.find(a => a.id === workflow.then!.agent);
      if (!thenAgent) {
        const errorMsg = `'Then' agent with ID '${workflow.then!.agent}' not found`;
        console.error(chalk.red(errorMsg));
        if (workflow.stopOnError) {
          throw new Error(errorMsg);
        } else {
          console.log(chalk.yellow('Continuing execution (stopOnError=false)...'));
        }
      } else {
        console.log(`  ${chalk.gray('Running:')} ${chalk.yellow(thenAgent.id)} (${thenAgent.role})`);
        
        try {
          // Execute the 'then' agent with the aggregated context
          const finalOutput = await thenAgent.run(context);
          
          // Append the final agent's output to the context
          context.addMessage(thenAgent.id, finalOutput);
          
          console.log('\nTHEN AGENT OUTPUT');
          console.log('-----------------');
          console.log(finalOutput);
          console.log('-----------------');
        } catch (error: any) {
          const errorMsg = `Error executing 'then' agent '${thenAgent.id}': ${error.message}`;
          console.error(chalk.red(errorMsg));
          if (workflow.stopOnError) {
            throw new Error(errorMsg);
          } else {
            console.log(chalk.yellow('Continuing execution (stopOnError=false)...'));
          }
        }
      }
    }
    
    console.log('\nPARALLEL EXECUTION COMPLETED');
    console.log('----------------------------');
    
    // Print the final context messages
    console.log('\nFINAL RESULT');
    console.log('------------');
    
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
      console.log(`${chalk.yellow('AGENT: ' + agentId)}`);
      console.log('-------------');
      contents.forEach(content => {
        console.log(content);
        console.log(); // Empty line between outputs from the same agent
      });
    });
  }
}