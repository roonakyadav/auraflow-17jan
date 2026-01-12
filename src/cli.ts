#!/usr/bin/env node

import * as yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { Agent } from './models/Agent';
import { Workflow } from './models/Workflow';

interface YamlWorkflow {
  id?: string;
  agents: {
    id: string;
    role: string;
    goal: string;
    tools?: string[];
  }[];
  workflow: {
    type: 'sequential' | 'parallel';
    steps?: Array<{
      id: string;
      agent: string;
      action: string;
      dependsOn?: string[];
      inputs?: Record<string, any>;
      outputs?: string[];
    }>;
    branches?: Array<{
      id: string;
      agent: string;
      action: string;
      inputs?: Record<string, any>;
      outputs?: string[];
    }>;
    then?: {
      agent: string;
      action: string;
      inputs?: Record<string, any>;
      outputs?: string[];
    };
  };
}

function validateWorkflow(rootYamlData: YamlWorkflow): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate agents
  if (!rootYamlData.agents || !Array.isArray(rootYamlData.agents) || rootYamlData.agents.length === 0) {
    errors.push('Workflow must have a non-empty agents array');
  } else {
    const agentIds = new Set<string>();
    for (const agent of rootYamlData.agents) {
      if (typeof agent.id !== 'string' || !agent.id.trim()) {
        errors.push('Each agent must have a valid id');
      } else if (agentIds.has(agent.id)) {
        errors.push(`Agent id '${agent.id}' is not unique`);
      } else {
        agentIds.add(agent.id);
      }

      if (typeof agent.role !== 'string' || !agent.role.trim()) {
        errors.push(`Agent '${agent.id || 'unknown'}' must have a valid role`);
      }

      if (typeof agent.goal !== 'string' || !agent.goal.trim()) {
        errors.push(`Agent '${agent.id || 'unknown'}' must have a valid goal`);
      }
    }
  }

  // Validate rootYamlData object exists
  if (!rootYamlData) {
    errors.push("Missing workflow configuration in YAML");
    return { isValid: errors.length === 0, errors };
  }
  
  // Validate rootYamlData.workflow exists
  if (!rootYamlData.workflow) {
    errors.push("Missing 'workflow' block in YAML");
    console.error("Parsed workflow object:", rootYamlData);
    return { isValid: errors.length === 0, errors };
  }
  
  // Validate workflow.type exists
  if (!('type' in rootYamlData.workflow)) {
    errors.push("Missing 'workflow.type' field in YAML");
    console.error("Parsed workflow object:", rootYamlData);
    return { isValid: errors.length === 0, errors };
  }
  
  // Normalize workflow type only after confirming it exists
  const rawType = rootYamlData.workflow.type;
  const normalizedType = String(rawType).trim().toLowerCase();
  
  if (normalizedType !== 'sequential' && normalizedType !== 'parallel') {
    errors.push(`Invalid workflow type. Received: '${rawType}', normalized: '${normalizedType}'`);
  }

  // Validate workflow based on normalized type
  if (normalizedType === 'sequential') {
    if (!rootYamlData.workflow.steps || !Array.isArray(rootYamlData.workflow.steps) || rootYamlData.workflow.steps.length === 0) {
      errors.push('Sequential workflow must have a non-empty steps array');
    } else {
      for (const step of rootYamlData.workflow.steps) {
        if (typeof step.agent !== 'string' || !step.agent.trim()) {
          errors.push(`Each step must define an 'agent' field`);
        } else if (rootYamlData.agents && !rootYamlData.agents.some(agent => agent.id === step.agent)) {
          errors.push(`Step with agent '${step.agent}' must reference a valid agent id`);
        }
      }
    }
  } else if (normalizedType === 'parallel') {
    if (!rootYamlData.workflow.branches || !Array.isArray(rootYamlData.workflow.branches) || rootYamlData.workflow.branches.length === 0) {
      errors.push('Parallel workflow must have a non-empty branches array');
    } else {
      for (const branch of rootYamlData.workflow.branches) {
        if (typeof branch.agent !== 'string' || !branch.agent.trim()) {
          errors.push(`Each branch must define an 'agent' field`);
        } else if (rootYamlData.agents && !rootYamlData.agents.some(agent => agent.id === branch.agent)) {
          errors.push(`Branch with agent '${branch.agent}' must reference a valid agent id`);
        }
      }

      // Validate 'then' step if it exists
      if (rootYamlData.workflow.then) {
        const thenStep = rootYamlData.workflow.then;
        if (!thenStep.agent || typeof thenStep.agent !== 'string' || !thenStep.agent.trim()) {
          errors.push("'Then' step must reference a valid agent id");
        } else if (rootYamlData.agents && !rootYamlData.agents.some(agent => agent.id === thenStep.agent)) {
          errors.push(`'Then' step references non-existent agent id '${thenStep.agent}'`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

async function loadWorkflowFromFile(filePath: string): Promise<{ agents: Agent[], workflow: Workflow }> {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const yamlData = yaml.load(fileContent) as YamlWorkflow;

    // Validate the workflow
    const validation = validateWorkflow(yamlData);
    if (!validation.isValid) {
      console.error('Validation errors found in workflow file:');
      for (const error of validation.errors) {
        console.error(`- ${error}`);
      }
      process.exit(1);
    }

    // Create Agent instances
    const agents = yamlData.agents.map(agentData => 
      new Agent(agentData.id, agentData.role, agentData.goal, agentData.tools || [])
    );

    // Normalize workflow type
    const rawType = yamlData.workflow.type;
    const normalizedType = String(rawType).trim().toLowerCase();
    
    // Create Workflow instance based on normalized type
    let workflowSteps: any[] = [];
    let workflowBranches: any[] = [];
    let workflowThen: any = undefined;
    
    if (normalizedType === 'sequential') {
      workflowSteps = yamlData.workflow.steps?.map(step => ({
        id: step.id,
        agent: step.agent,
        action: step.action,
        dependsOn: step.dependsOn,
        inputs: step.inputs,
        outputs: step.outputs
      })) || [];
    } else if (normalizedType === 'parallel') {
      workflowBranches = yamlData.workflow.branches?.map(branch => ({
        id: branch.id,
        agent: branch.agent,
        action: branch.action,
        inputs: branch.inputs,
        outputs: branch.outputs
      })) || [];
      
      if (yamlData.workflow.then) {
        workflowThen = {
          agent: yamlData.workflow.then.agent,
          action: yamlData.workflow.then.action,
          inputs: yamlData.workflow.then.inputs,
          outputs: yamlData.workflow.then.outputs
        };
      }
    }

    const workflow = new Workflow(
      yamlData.id || 'default-workflow',
      normalizedType as 'sequential' | 'parallel' | 'parallel_then',  // Use normalized type
      workflowSteps,
      workflowBranches,
      workflowThen
    );

    return { agents, workflow };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.error(`Error: File not found - ${filePath}`);
    } else {
      console.error(`Error parsing YAML file: ${error.message}`);
    }
    process.exit(1);
  }
}

(yargs.default as any)(hideBin(process.argv))
  .usage('Usage: $0 <command> [options]')
  .command('run <file>', 'Run a workflow from a YAML file', (yargs: any) => {
    return yargs
      .positional('file', {
        describe: 'YAML file containing the workflow definition',
        type: 'string',
        demandOption: true
      });
  }, async (argv: any) => {
    console.log('Auraflow v0.1.0');
    console.log(`Loading workflow from file: ${argv.file}`);
    
    const { agents, workflow } = await loadWorkflowFromFile(argv.file);
    
    // Print summary
    console.log('\nWorkflow loaded successfully!');
    console.log(`Workflow type: ${workflow.type}`);
    console.log(`Agents loaded: ${agents.length}`);
    
    console.log('\nAgents:');
    for (const agent of agents) {
      console.log(`  - ${agent.id} (${agent.role})`);
    }
    
    if (workflow.type === 'sequential') {
      console.log('\nExecution order:');
      for (const step of workflow.steps) {
        console.log(`  - Step: ${step.id}, Agent: ${step.agent}, Action: ${step.action}`);
      }
      
      console.log('\nStarting sequential execution...');
      
      // Create a new context for execution
      const ContextClass = (await import('./models/Context')).Context;
      const context = new ContextClass();
      
      // Create executor and run the workflow
      const ExecutorClass = (await import('./models/Executor')).Executor;
      const executor = new ExecutorClass();
      
      await executor.execute(workflow, agents, context);
    } else if (workflow.type === 'parallel') {
      console.log('\nBranches:');
      for (const branch of workflow.branches) {
        console.log(`  - Branch: ${branch.id}, Agent: ${branch.agent}, Action: ${branch.action}`);
      }
      
      if (workflow.then) {
        console.log('\nThen step:');
        console.log(`  - Agent: ${workflow.then.agent}, Action: ${workflow.then.action}`);
      }
      
      console.log('\nStarting parallel execution...');
      
      // Create a new context for execution
      const ContextClass = (await import('./models/Context')).Context;
      const context = new ContextClass();
      
      // Create executor and run the workflow
      const ExecutorClass = (await import('./models/Executor')).Executor;
      const executor = new ExecutorClass();
      
      await executor.execute(workflow, agents, context);
    }
    
    console.log('\nWorkflow execution completed.');
  })
  .command('test-agent <agent-id> <file>', 'Test a single agent from a YAML file', (yargs: any) => {
    return yargs
      .positional('agent-id', {
        describe: 'ID of the agent to test',
        type: 'string',
        demandOption: true
      })
      .positional('file', {
        describe: 'YAML file containing the workflow definition',
        type: 'string',
        demandOption: true
      });
  }, async (argv: any) => {
    console.log('Auraflow v0.1.0');
    console.log(`Testing agent '${argv['agent-id']}' from file: ${argv.file}`);
    
    const { agents, workflow } = await loadWorkflowFromFile(argv.file);
    
    // Find the specified agent
    const agent = agents.find(a => a.id === argv['agent-id']);
    if (!agent) {
      console.error(`Error: Agent with ID '${argv['agent-id']}' not found in the workflow.`);
      process.exit(1);
    }
    
    console.log(`\nFound agent: ${agent.id} (${agent.role})`);
    console.log('Initializing agent execution...');
    
    // Create a new context for this test
    const ContextClass = (await import('./models/Context')).Context;
    const context = new ContextClass();
    
    try {
      // Run the agent
      const output = await agent.run(context);
      
      console.log('\n--- AGENT OUTPUT ---');
      console.log(output);
      console.log('--- END OUTPUT ---\n');
      
      console.log('Agent test completed successfully!');
    } catch (error: any) {
      console.error('\nError during agent execution:');
      console.error(error.message);
      process.exit(1);
    }
  })
  .help()
  .argv;