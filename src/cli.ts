#!/usr/bin/env node

import * as yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import chalk from 'chalk';


import { Agent } from './models/Agent';
import { Workflow } from './models/Workflow';
import { WorkflowVisualization } from './visualization/WorkflowVisualization';

// Simple header - following user preference for UI simplicity
console.log(chalk.bold('AuraFlow - Declarative Multi-Agent Orchestration'));
console.log('Version 0.1.0\n');

interface YamlWorkflow {
  id?: string;
  agents: {
    id: string;
    role: string;
    goal: string;
    tools?: string[];
  }[];
  workflow: {
    type: 'sequential' | 'parallel' | 'parallel_then' | 'conditional';
    stopOnError?: boolean;
    steps?: Array<{
      id: string;
      agent: string;
      action: string;
      dependsOn?: string[];
      inputs?: {
        required: string[]; // Required input keys
        optional?: string[]; // Optional input keys
      };
      outputs?: {
        produced: string[]; // Output keys this step produces
      };
    }>;
    branches?: Array<{
      id: string;
      agent: string;
      action: string;
      inputs?: {
        required: string[]; // Required input keys
        optional?: string[]; // Optional input keys
      };
      outputs?: {
        produced: string[]; // Output keys this branch produces
      };
    }>;
    then?: {
      agent: string;
      action: string;
      inputs?: {
        required: string[]; // Required input keys
        optional?: string[]; // Optional input keys
      };
      outputs?: {
        produced: string[]; // Output keys this step produces
      };
    };
    condition?: {
      stepId: string; // ID of the step whose output will be evaluated
      cases: Array<{
        condition: string; // Condition to match (e.g., 'success', 'failure', specific output)
        step: {
          id: string;
          agent: string;
          action: string;
          inputs?: {
            required: string[]; // Required input keys
            optional?: string[]; // Optional input keys
          };
          outputs?: {
            produced: string[]; // Output keys this step produces
          };
        };
      }>;
      default?: {
        id: string;
        agent: string;
        action: string;
        inputs?: {
          required: string[]; // Required input keys
          optional?: string[]; // Optional input keys
        };
        outputs?: {
          produced: string[]; // Output keys this step produces
        };
      };
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
  
  if (normalizedType !== 'sequential' && normalizedType !== 'parallel' && normalizedType !== 'parallel_then' && normalizedType !== 'conditional') {
    errors.push(`Invalid workflow type. Received: '${rawType}', normalized: '${normalizedType}'. Valid types: 'sequential', 'parallel', 'parallel_then', 'conditional'`);
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
        
        // Validate inputs structure
        if (step.inputs) {
          if (!step.inputs.required || !Array.isArray(step.inputs.required)) {
            errors.push(`Step '${step.id}' must have 'inputs.required' as an array of required input keys`);
          }
          if (step.inputs.optional && !Array.isArray(step.inputs.optional)) {
            errors.push(`Step '${step.id}' 'inputs.optional' must be an array of optional input keys`);
          }
        }
        
        // Validate outputs structure
        if (step.outputs) {
          if (!step.outputs.produced || !Array.isArray(step.outputs.produced)) {
            errors.push(`Step '${step.id}' must have 'outputs.produced' as an array of output keys`);
          }
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
        
        // Validate inputs structure
        if (branch.inputs) {
          if (!branch.inputs.required || !Array.isArray(branch.inputs.required)) {
            errors.push(`Branch '${branch.id}' must have 'inputs.required' as an array of required input keys`);
          }
          if (branch.inputs.optional && !Array.isArray(branch.inputs.optional)) {
            errors.push(`Branch '${branch.id}' 'inputs.optional' must be an array of optional input keys`);
          }
        }
        
        // Validate outputs structure
        if (branch.outputs) {
          if (!branch.outputs.produced || !Array.isArray(branch.outputs.produced)) {
            errors.push(`Branch '${branch.id}' must have 'outputs.produced' as an array of output keys`);
          }
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
        
        // Validate inputs structure
        if (thenStep.inputs) {
          if (!thenStep.inputs.required || !Array.isArray(thenStep.inputs.required)) {
            errors.push("'Then' step must have 'inputs.required' as an array of required input keys");
          }
          if (thenStep.inputs.optional && !Array.isArray(thenStep.inputs.optional)) {
            errors.push("'Then' step 'inputs.optional' must be an array of optional input keys");
          }
        }
        
        // Validate outputs structure
        if (thenStep.outputs) {
          if (!thenStep.outputs.produced || !Array.isArray(thenStep.outputs.produced)) {
            errors.push("'Then' step must have 'outputs.produced' as an array of output keys");
          }
        }
      }
    }
  } else if (normalizedType === 'conditional') {
    if (!rootYamlData.workflow.steps || !Array.isArray(rootYamlData.workflow.steps) || rootYamlData.workflow.steps.length === 0) {
      errors.push('Conditional workflow must have a non-empty steps array');
    } else {
      for (const step of rootYamlData.workflow.steps) {
        if (typeof step.agent !== 'string' || !step.agent.trim()) {
          errors.push(`Each step must define an 'agent' field`);
        } else if (rootYamlData.agents && !rootYamlData.agents.some(agent => agent.id === step.agent)) {
          errors.push(`Step with agent '${step.agent}' must reference a valid agent id`);
        }
        
        // Validate inputs structure
        if (step.inputs) {
          if (!step.inputs.required || !Array.isArray(step.inputs.required)) {
            errors.push(`Step '${step.id}' must have 'inputs.required' as an array of required input keys`);
          }
          if (step.inputs.optional && !Array.isArray(step.inputs.optional)) {
            errors.push(`Step '${step.id}' 'inputs.optional' must be an array of optional input keys`);
          }
        }
        
        // Validate outputs structure
        if (step.outputs) {
          if (!step.outputs.produced || !Array.isArray(step.outputs.produced)) {
            errors.push(`Step '${step.id}' must have 'outputs.produced' as an array of output keys`);
          }
        }
      }
    }
    
    // Validate condition configuration
    if (!rootYamlData.workflow.condition) {
      errors.push('Conditional workflow must have a condition configuration');
    } else {
      const condition = rootYamlData.workflow.condition;
      
      if (!condition.stepId || typeof condition.stepId !== 'string') {
        errors.push("Conditional workflow must have 'condition.stepId' to specify which step's output will be evaluated");
      } else {
        // Check that the stepId exists in the steps array
        const stepExists = rootYamlData.workflow.steps?.some(step => step.id === condition.stepId);
        if (!stepExists) {
          errors.push(`Condition stepId '${condition.stepId}' does not match any step in the workflow`);
        }
      }
      
      if (!condition.cases || !Array.isArray(condition.cases) || condition.cases.length === 0) {
        errors.push("Conditional workflow must have 'condition.cases' as an array of conditional branches");
      } else {
        for (const c of condition.cases) {
          if (!c.condition || typeof c.condition !== 'string') {
            errors.push("Each condition case must have a 'condition' string to match against agent output");
          }
          
          if (!c.step) {
            errors.push("Each condition case must have a 'step' configuration");
          } else {
            if (!c.step.agent || typeof c.step.agent !== 'string' || !c.step.agent.trim()) {
              errors.push(`Condition case step must reference a valid agent id`);
            } else if (rootYamlData.agents && !rootYamlData.agents.some(agent => agent.id === c.step.agent)) {
              errors.push(`Condition case step references non-existent agent id '${c.step.agent}'`);
            }
            
            // Validate inputs structure
            if (c.step.inputs) {
              if (!c.step.inputs.required || !Array.isArray(c.step.inputs.required)) {
                errors.push(`Condition case step must have 'inputs.required' as an array of required input keys`);
              }
              if (c.step.inputs.optional && !Array.isArray(c.step.inputs.optional)) {
                errors.push(`Condition case step 'inputs.optional' must be an array of optional input keys`);
              }
            }
            
            // Validate outputs structure
            if (c.step.outputs) {
              if (!c.step.outputs.produced || !Array.isArray(c.step.outputs.produced)) {
                errors.push(`Condition case step must have 'outputs.produced' as an array of output keys`);
              }
            }
          }
        }
      }
      
      // Validate default step if it exists
      const defaultStep = condition.default;
      if (defaultStep) {
        if (!defaultStep.agent || typeof defaultStep.agent !== 'string' || !defaultStep.agent.trim()) {
          errors.push("Default condition step must reference a valid agent id");
        } else if (rootYamlData.agents && !rootYamlData.agents.some(agent => agent.id === defaultStep.agent)) {
          errors.push(`Default condition step references non-existent agent id '${defaultStep.agent}'`);
        }
        
        // Validate inputs structure
        if (defaultStep.inputs) {
          if (!defaultStep.inputs.required || !Array.isArray(defaultStep.inputs.required)) {
            errors.push("Default condition step must have 'inputs.required' as an array of required input keys");
          }
          if (defaultStep.inputs.optional && !Array.isArray(defaultStep.inputs.optional)) {
            errors.push("Default condition step 'inputs.optional' must be an array of optional input keys");
          }
        }
        
        // Validate outputs structure
        if (defaultStep.outputs) {
          if (!defaultStep.outputs.produced || !Array.isArray(defaultStep.outputs.produced)) {
            errors.push("Default condition step must have 'outputs.produced' as an array of output keys");
          }
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
    const normalizedType = String(rawType).trim().toLowerCase() as 'sequential' | 'parallel' | 'parallel_then' | 'conditional';
    
    // Get stopOnError value, defaulting to true
    const stopOnError = yamlData.workflow.stopOnError ?? true;
    
    // Create Workflow instance based on normalized type
    let workflowSteps: any[] = [];
    let workflowBranches: any[] = [];
    let workflowThen: any = undefined;
    let workflowCondition: any = undefined;
    
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
    } else if (normalizedType === 'conditional') {
      workflowSteps = yamlData.workflow.steps?.map(step => ({
        id: step.id,
        agent: step.agent,
        action: step.action,
        dependsOn: step.dependsOn,
        inputs: step.inputs,
        outputs: step.outputs
      })) || [];
      
      if (yamlData.workflow.condition) {
        workflowCondition = {
          stepId: yamlData.workflow.condition.stepId,
          cases: yamlData.workflow.condition.cases?.map((c: any) => ({
            condition: c.condition,
            step: {
              id: c.step.id,
              agent: c.step.agent,
              action: c.step.action,
              inputs: c.step.inputs,
              outputs: c.step.outputs
            }
          })) || [],
          default: yamlData.workflow.condition.default ? {
            id: yamlData.workflow.condition.default.id,
            agent: yamlData.workflow.condition.default.agent,
            action: yamlData.workflow.condition.default.action,
            inputs: yamlData.workflow.condition.default.inputs,
            outputs: yamlData.workflow.condition.default.outputs
          } : undefined
        };
      }
    }

    const workflow = new Workflow(
      yamlData.id || 'default-workflow',
      normalizedType,  // Use normalized type
      workflowSteps,
      workflowBranches,
      workflowThen,
      workflowCondition,
      stopOnError  // Pass the stopOnError value
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
  .usage(chalk.bold('USAGE:') + '\n  $0 ' + chalk.cyan('<command> [options]'))
  .command('run <file>', 
    chalk.cyan('run') + ' ' + chalk.dim('Run a workflow from a YAML file'),
    (yargs: any) => {
    return yargs
      .example([
        [chalk.italic.dim('$0 run examples/sample-workflow.yaml'), chalk.dim('Run a workflow from a YAML file')],
        [chalk.italic.dim('$0 run examples/sample-workflow.yaml --dry-run'), chalk.dim('Validate workflow without executing')]
      ])
      .positional('file', {
        describe: chalk.dim('YAML file containing the workflow definition (required)'),
        type: 'string',
        demandOption: true
      })
      .option('dry-run', {
        alias: 'n',
        type: 'boolean',
        description: chalk.dim('Parse and validate config, but do not execute agents'),
        default: false
      });
  }, async (argv: any) => {
    console.log(`Loading workflow from file: ${argv.file}`);
    
    const { agents, workflow } = await loadWorkflowFromFile(argv.file);
    
    // Print structured summary
    console.log('\n>>> WORKFLOW INFO <<<');
    console.log('ID:', workflow.id);
    console.log('Type:', workflow.type);
    
    console.log('\n>>> AGENTS (${agents.length}) <<<');
    
    for (const agent of agents) {
      console.log('- ' + agent.id + ' (' + agent.role + ')');
    }
    
    // Check if dry-run mode is enabled
    if (argv.dryRun) {
      console.log('\n>>> DRY RUN MODE <<<');
      console.log('Workflow Type:', workflow.type);
      
      // Add visualization
      console.log('\n' + WorkflowVisualization.generateVisualization(workflow));
      
      console.log('\n>>> EXECUTION PLAN <<<');
      if (workflow.type === 'sequential') {
        for (const step of workflow.steps) {
          const stepName = step.id ?? `step-${workflow.steps.indexOf(step) + 1}`;
          const actionName = step.action ?? "execute";
          console.log('  ' + stepName + ' → ' + step.agent + ' (' + actionName + ')');
        }
      } else if (workflow.type === 'parallel') {
        if (workflow.branches.length > 0) {
          const branchNames = workflow.branches.map(branch => branch.agent).join(' → ');
          console.log('  ' + branchNames + (workflow.then ? ' → ' + workflow.then.agent : ''));
        }
      }
      
      console.log('\n>>> EXECUTION GRAPH <<<');
      if (workflow.type === 'sequential') {
        const agentSequence = workflow.steps.map(step => step.agent).join(' → ');
        console.log('  ' + agentSequence);
      } else if (workflow.type === 'parallel') {
        if (workflow.branches.length > 0) {
          const branchAgents = workflow.branches.map(branch => branch.agent);
          if (workflow.then) {
            console.log('  ' + branchAgents.join(' → ') + ' → ' + workflow.then.agent);
          } else {
            console.log('  ' + branchAgents.join(' → '));
          }
        }
      }
      
      console.log('\n>>> VALIDATION COMPLETE <<<');
      console.log('No agents executed.');
      process.exit(0);
    }
    
    if (workflow.type === 'sequential') {
      console.log('\n' + WorkflowVisualization.generateVisualization(workflow));
      
      console.log('\n>>> EXECUTION PLAN <<<');
      for (const step of workflow.steps) {
        const stepName = step.id ?? `step-${workflow.steps.indexOf(step) + 1}`;
        const actionName = step.action ?? "execute";
        console.log('  ' + stepName + ' → ' + step.agent + ' (' + actionName + ')');
      }
      
      console.log('\n>>> EXECUTION GRAPH <<<');
      const agentSequence = workflow.steps.map(step => step.agent).join(' → ');
      console.log('  ' + agentSequence);
      
      console.log('\n>>> EXECUTION STARTED <<<');
      console.log('Starting sequential execution...');
      
      // Create a new context for execution
      const ContextClass = (await import('./models/Context')).Context;
      const context = new ContextClass();
      
      // Create executor and run the workflow
      const ExecutorClass = (await import('./models/Executor')).Executor;
      const executor = new ExecutorClass();
      
      try {
        await executor.execute(workflow, agents, context);
      } catch (error: any) {
        console.error(chalk.red('Execution error:'), error.message);
        process.exit(2);
      }
    } else if (workflow.type === 'parallel') {
      console.log('\n' + WorkflowVisualization.generateVisualization(workflow));
      
      console.log('\n>>> BRANCHES <<<');
      for (const branch of workflow.branches) {
        const branchName = branch.id ?? `branch-${workflow.branches.indexOf(branch) + 1}`;
        const actionName = branch.action ?? "execute";
        console.log('  ' + branchName + ' → ' + branch.agent + ' (' + actionName + ')');
      }
      
      if (workflow.then) {
        console.log('\n>>> THEN STEP <<<');
        const thenAction = workflow.then.action ?? "execute";
        console.log('  Then: ' + workflow.then.agent + ' (' + thenAction + ')');
      }
      
      console.log('\n>>> EXECUTION GRAPH <<<');
      const branchAgents = workflow.branches.map(branch => branch.agent);
      if (workflow.then) {
        console.log('  ' + branchAgents.join(' → ') + ' → ' + workflow.then.agent);
      } else {
        console.log('  ' + branchAgents.join(' → '));
      }
      
      console.log('\n>>> EXECUTION STARTED <<<');
      console.log('Starting parallel execution...');
      
      // Create a new context for execution
      const ContextClass = (await import('./models/Context')).Context;
      const context = new ContextClass();
      
      // Create executor and run the workflow
      const ExecutorClass = (await import('./models/Executor')).Executor;
      const executor = new ExecutorClass();
      
      try {
        await executor.execute(workflow, agents, context);
      } catch (error: any) {
        console.error(chalk.red('Execution error:'), error.message);
        process.exit(2);
      }
    }
    else if (workflow.type === 'conditional') {
      console.log('\n' + WorkflowVisualization.generateVisualization(workflow));
          
      console.log('\n>>> CONDITIONAL EXECUTION PLAN <<<');
          
      console.log('\n>>> EXECUTION STARTED <<<');
      console.log('Starting conditional execution...');
          
      // Create a new context for execution
      const ContextClass = (await import('./models/Context')).Context;
      const context = new ContextClass();
          
      // Create executor and run the workflow
      const ExecutorClass = (await import('./models/Executor')).Executor;
      const executor = new ExecutorClass();
          
      try {
        await executor.execute(workflow, agents, context);
      } catch (error: any) {
        console.error(chalk.red('Execution error:'), error.message);
        process.exit(2);
      }
    }
        
    console.log('\n>>> WORKFLOW COMPLETED SUCCESSFULLY <<<');
    console.log('Execution finished. Results shown above.');
  })
  .command('test-agent <agent-id> <file>', 
    chalk.cyan('test-agent') + ' ' + chalk.dim('Test a single agent from a YAML file'),
    (yargs: any) => {
    return yargs
      .example([
        [chalk.italic.dim('$0 test-agent researcher examples/sample-workflow.yaml'), chalk.dim('Test the researcher agent')]
      ])
      .positional('agent-id', {
        describe: chalk.dim('ID of the agent to test (required)'),
        type: 'string',
        demandOption: true
      })
      .positional('file', {
        describe: chalk.dim('YAML file containing the workflow definition (required)'),
        type: 'string',
        demandOption: true
      });
  }, async (argv: any) => {
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
      
      console.log('\nAGENT OUTPUT');
      console.log('------------');
      console.log(output);
      console.log('------------');
      console.log(chalk.green('Agent test completed successfully!'));
    } catch (error: any) {
      console.log('\nERROR OCCURRED');
      console.log('--------------');
      console.error(chalk.red('Error during agent execution:'));
      console.error(chalk.red(error.message));
      console.log('--------------');
      process.exit(1);
    }
  })

  .epilogue('\n' + chalk.gray('For more information, visit: ') + chalk.italic('https://github.com/your-repo/auraflow'))
  .wrap(Math.min(100, yargs.terminalWidth()))
  .help()
  .alias('h', 'help')
  .argv;