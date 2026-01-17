#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const yargs = __importStar(require("yargs"));
const helpers_1 = require("yargs/helpers");
const fs = __importStar(require("fs"));
const yaml = __importStar(require("js-yaml"));
const chalk_1 = __importDefault(require("chalk"));
const Agent_1 = require("./models/Agent");
const Workflow_1 = require("./models/Workflow");
const WorkflowVisualization_1 = require("./visualization/WorkflowVisualization");
const ToolRegistry_1 = require("./tools/ToolRegistry");
// Function to display the AURAFLOW banner
function displayBanner() {
    console.log(chalk_1.default.blue('  █████╗ ██╗      ██████╗  █████╗ ███╗   ██╗ █████╗ ██╗     ███████╗███████╗'));
    console.log(chalk_1.default.blue(' ██╔══██╗██║     ██╔════╝ ██╔══██╗████╗  ██║██╔══██╗██║     ██╔════╝██╔════╝'));
    console.log(chalk_1.default.blue(' ███████║██║     ██║  ███╗███████║██╔██╗ ██║███████║██║     █████╗  ███████╗'));
    console.log(chalk_1.default.blue(' ██╔══██║██║     ██║   ██║██╔══██║██║╚██╗██║██╔══██║██║     ██╔══╝  ╚════██║'));
    console.log(chalk_1.default.blue(' ██║  ██║███████╗╚██████╔╝██║  ██║██║ ╚████║██║  ██║███████╗███████╗███████║'));
    console.log(chalk_1.default.blue(' ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝'));
    console.log();
}
// Show banner before processing commands
displayBanner();
yargs.default((0, helpers_1.hideBin)(process.argv));
function validateWorkflow(rootYamlData) {
    const errors = [];
    // Validate agents
    if (!rootYamlData.agents || !Array.isArray(rootYamlData.agents) || rootYamlData.agents.length === 0) {
        errors.push('Workflow must have a non-empty agents array');
    }
    else {
        const agentIds = new Set();
        // Helper function to validate agent structure
        const validateAgent = (agent, prefix) => {
            if (typeof agent.id !== 'string' || !agent.id.trim()) {
                errors.push(`${prefix} must have a valid id`);
            }
            else if (agentIds.has(agent.id)) {
                errors.push(`${prefix} id '${agent.id}' is not unique`);
            }
            else {
                agentIds.add(agent.id);
            }
            if (typeof agent.role !== 'string' || !agent.role.trim()) {
                errors.push(`${prefix} must have a valid role`);
            }
            if (typeof agent.goal !== 'string' || !agent.goal.trim()) {
                errors.push(`${prefix} must have a valid goal`);
            }
            // Validate sub-agents if they exist
            if (agent.subAgents) {
                if (!Array.isArray(agent.subAgents)) {
                    errors.push(`${prefix} subAgents must be an array`);
                }
                else {
                    agent.subAgents.forEach((subAgent, index) => {
                        validateAgent(subAgent, `${prefix}.subAgents[${index}]`);
                    });
                }
            }
        };
        for (const agent of rootYamlData.agents) {
            validateAgent(agent, `Agent '${agent.id || 'unknown'}'`);
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
        }
        else {
            for (const step of rootYamlData.workflow.steps) {
                if (typeof step.agent !== 'string' || !step.agent.trim()) {
                    errors.push(`Each step must define an 'agent' field`);
                }
                else if (rootYamlData.agents && !rootYamlData.agents.some(agent => agent.id === step.agent)) {
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
    }
    else if (normalizedType === 'parallel') {
        if (!rootYamlData.workflow.branches || !Array.isArray(rootYamlData.workflow.branches) || rootYamlData.workflow.branches.length === 0) {
            errors.push('Parallel workflow must have a non-empty branches array');
        }
        else {
            for (const branch of rootYamlData.workflow.branches) {
                if (typeof branch.agent !== 'string' || !branch.agent.trim()) {
                    errors.push(`Each branch must define an 'agent' field`);
                }
                else if (rootYamlData.agents && !rootYamlData.agents.some(agent => agent.id === branch.agent)) {
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
                }
                else if (rootYamlData.agents && !rootYamlData.agents.some(agent => agent.id === thenStep.agent)) {
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
    }
    else if (normalizedType === 'conditional') {
        if (!rootYamlData.workflow.steps || !Array.isArray(rootYamlData.workflow.steps) || rootYamlData.workflow.steps.length === 0) {
            errors.push('Conditional workflow must have a non-empty steps array');
        }
        else {
            for (const step of rootYamlData.workflow.steps) {
                if (typeof step.agent !== 'string' || !step.agent.trim()) {
                    errors.push(`Each step must define an 'agent' field`);
                }
                else if (rootYamlData.agents && !rootYamlData.agents.some(agent => agent.id === step.agent)) {
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
        }
        else {
            const condition = rootYamlData.workflow.condition;
            if (!condition.stepId || typeof condition.stepId !== 'string') {
                errors.push("Conditional workflow must have 'condition.stepId' to specify which step's output will be evaluated");
            }
            else {
                // Check that the stepId exists in the steps array
                const stepExists = rootYamlData.workflow.steps?.some(step => step.id === condition.stepId);
                if (!stepExists) {
                    errors.push(`Condition stepId '${condition.stepId}' does not match any step in the workflow`);
                }
            }
            if (!condition.cases || !Array.isArray(condition.cases) || condition.cases.length === 0) {
                errors.push("Conditional workflow must have 'condition.cases' as an array of conditional branches");
            }
            else {
                for (const c of condition.cases) {
                    if (!c.condition || typeof c.condition !== 'string') {
                        errors.push("Each condition case must have a 'condition' string to match against agent output");
                    }
                    if (!c.step) {
                        errors.push("Each condition case must have a 'step' configuration");
                    }
                    else {
                        if (!c.step.agent || typeof c.step.agent !== 'string' || !c.step.agent.trim()) {
                            errors.push(`Condition case step must reference a valid agent id`);
                        }
                        else if (rootYamlData.agents && !rootYamlData.agents.some(agent => agent.id === c.step.agent)) {
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
                }
                else if (rootYamlData.agents && !rootYamlData.agents.some(agent => agent.id === defaultStep.agent)) {
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
async function loadWorkflowFromFile(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const yamlData = yaml.load(fileContent);
        // Validate the workflow
        const validation = validateWorkflow(yamlData);
        if (!validation.isValid) {
            console.error('Validation errors found in workflow file:');
            for (const error of validation.errors) {
                console.error(`- ${error}`);
            }
            process.exit(1);
        }
        // Create tool registry
        const toolRegistry = new ToolRegistry_1.ToolRegistry();
        // Create Agent instances
        const agents = yamlData.agents.map(agentData => {
            // Create sub-agents if they exist
            const subAgents = agentData.subAgents ? agentData.subAgents.map(subAgentData => new Agent_1.Agent(subAgentData.id, subAgentData.role, subAgentData.goal, subAgentData.tools || [], [], toolRegistry)) : [];
            return new Agent_1.Agent(agentData.id, agentData.role, agentData.goal, agentData.tools || [], subAgents, toolRegistry);
        });
        // Normalize workflow type
        const rawType = yamlData.workflow.type;
        const normalizedType = String(rawType).trim().toLowerCase();
        // Get stopOnError value, defaulting to true
        const stopOnError = yamlData.workflow.stopOnError ?? true;
        // Create Workflow instance based on normalized type
        let workflowSteps = [];
        let workflowBranches = [];
        let workflowThen = undefined;
        let workflowCondition = undefined;
        if (normalizedType === 'sequential') {
            workflowSteps = yamlData.workflow.steps?.map(step => ({
                id: step.id,
                agent: step.agent,
                action: step.action,
                dependsOn: step.dependsOn,
                inputs: step.inputs,
                outputs: step.outputs
            })) || [];
        }
        else if (normalizedType === 'parallel') {
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
        else if (normalizedType === 'conditional') {
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
                    cases: yamlData.workflow.condition.cases?.map((c) => ({
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
        const workflow = new Workflow_1.Workflow(yamlData.id || 'default-workflow', normalizedType, // Use normalized type
        workflowSteps, workflowBranches, workflowThen, workflowCondition, stopOnError // Pass the stopOnError value
        );
        return { agents, workflow };
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            console.error(`Error: File not found - ${filePath}`);
        }
        else {
            console.error(`Error parsing YAML file: ${error.message}`);
        }
        process.exit(1);
    }
}
yargs.default((0, helpers_1.hideBin)(process.argv))
    .usage(chalk_1.default.bold.blue('┌─────────────────────────────────────────────────────────┐\n') +
    chalk_1.default.bold.blue('│                    ') + chalk_1.default.bold.bgBlue.white('  AURAFLOW  ') + chalk_1.default.bold.blue('                         │\n') +
    chalk_1.default.bold.blue('├─────────────────────────────────────────────────────────┤\n') +
    chalk_1.default.bold.blue('│              ') + chalk_1.default.reset('Declarative Multi-Agent Orchestration  ') + chalk_1.default.bold.blue('    │\n') +
    chalk_1.default.bold.blue('└─────────────────────────────────────────────────────────┘\n\n') +
    chalk_1.default.bold('USAGE:') + '\n  $0 ' + chalk_1.default.cyan('<command> [options]') + '\n\n' +
    chalk_1.default.bold('DESCRIPTION:') + '\n  ' + chalk_1.default.reset('AuraFlow is a declarative multi-agent orchestration platform that allows you to define and run complex AI workflows using YAML configuration files.') + '\n\n')
    .command('run <file>', chalk_1.default.cyan('run') + ' ' + chalk_1.default.dim('Execute a multi-agent workflow defined in a YAML file'), (yargs) => {
    return yargs
        .example([
        [chalk_1.default.italic.dim('$0 run examples/sample-workflow.yaml'), chalk_1.default.dim('Run a workflow from a YAML file')],
        [chalk_1.default.italic.dim('$0 run examples/sample-workflow.yaml --dry-run'), chalk_1.default.dim('Validate workflow without executing')]
    ])
        .positional('file', {
        describe: chalk_1.default.dim('YAML file containing the workflow definition (required)'),
        type: 'string',
        demandOption: true
    })
        .option('dry-run', {
        alias: 'n',
        type: 'boolean',
        description: chalk_1.default.dim('Parse and validate config, but do not execute agents'),
        default: false
    })
        .option('enable-web-search', {
        type: 'boolean',
        description: chalk_1.default.dim('Enable web search without prompting (for testing)'),
        default: false
    });
}, async (argv) => {
    console.log(`Loading workflow from file: ${argv.file}`);
    const { agents, workflow } = await loadWorkflowFromFile(argv.file);
    // Check if any agent uses web_search tool
    const hasWebSearch = agents.some(agent => agent.tools.includes('web_search'));
    // Interactive prompt for web search
    let enableWebSearch = argv.enableWebSearch || false;
    if (hasWebSearch && !argv.dryRun && !argv.enableWebSearch) {
        const readline = require('readline-sync');
        console.log('\n🔍 WEB SEARCH DETECTED');
        console.log('This workflow includes agents that can use web search.');
        const answer = readline.question('Do you want to enable web search for this execution? (y/N): ');
        enableWebSearch = answer.toLowerCase().startsWith('y');
        if (enableWebSearch) {
            console.log(chalk_1.default.green('✓ Web search enabled for this execution'));
        }
        else {
            console.log(chalk_1.default.yellow('⚠ Web search disabled - agents will work with available context only'));
        }
    }
    else if (argv.enableWebSearch) {
        console.log(chalk_1.default.blue('🔧 WEB SEARCH FORCED ENABLED (test mode)'));
        enableWebSearch = true;
    }
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
        console.log('\n' + WorkflowVisualization_1.WorkflowVisualization.generateVisualization(workflow));
        console.log('\n>>> EXECUTION PLAN <<<');
        if (workflow.type === 'sequential') {
            for (const step of workflow.steps) {
                const stepName = step.id ?? `step-${workflow.steps.indexOf(step) + 1}`;
                const actionName = step.action ?? "execute";
                console.log('  ' + stepName + ' → ' + step.agent + ' (' + actionName + ')');
            }
        }
        else if (workflow.type === 'parallel') {
            if (workflow.branches.length > 0) {
                const branchNames = workflow.branches.map(branch => branch.agent).join(' → ');
                console.log('  ' + branchNames + (workflow.then ? ' → ' + workflow.then.agent : ''));
            }
        }
        console.log('\n>>> EXECUTION GRAPH <<<');
        if (workflow.type === 'sequential') {
            const agentSequence = workflow.steps.map(step => step.agent).join(' → ');
            console.log('  ' + agentSequence);
        }
        else if (workflow.type === 'parallel') {
            if (workflow.branches.length > 0) {
                const branchAgents = workflow.branches.map(branch => branch.agent);
                if (workflow.then) {
                    console.log('  ' + branchAgents.join(' → ') + ' → ' + workflow.then.agent);
                }
                else {
                    console.log('  ' + branchAgents.join(' → '));
                }
            }
        }
        console.log('\n>>> VALIDATION COMPLETE <<<');
        console.log('No agents executed.');
        process.exit(0);
    }
    if (workflow.type === 'sequential') {
        console.log('\n' + WorkflowVisualization_1.WorkflowVisualization.generateVisualization(workflow));
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
        const ContextClass = (await Promise.resolve().then(() => __importStar(require('./models/Context')))).Context;
        const context = new ContextClass();
        // Create executor and run the workflow
        const ExecutorClass = (await Promise.resolve().then(() => __importStar(require('./models/Executor')))).Executor;
        const executor = new ExecutorClass();
        try {
            await executor.execute(workflow, agents, context);
        }
        catch (error) {
            console.error(chalk_1.default.red('Execution error:'), error.message);
            process.exit(2);
        }
    }
    else if (workflow.type === 'parallel') {
        console.log('\n' + WorkflowVisualization_1.WorkflowVisualization.generateVisualization(workflow));
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
        }
        else {
            console.log('  ' + branchAgents.join(' → '));
        }
        console.log('\n>>> EXECUTION STARTED <<<');
        console.log('Starting parallel execution...');
        // Create a new context for execution
        const ContextClass = (await Promise.resolve().then(() => __importStar(require('./models/Context')))).Context;
        const context = new ContextClass();
        // Create executor and run the workflow
        const ExecutorClass = (await Promise.resolve().then(() => __importStar(require('./models/Executor')))).Executor;
        const executor = new ExecutorClass();
        try {
            await executor.execute(workflow, agents, context);
        }
        catch (error) {
            console.error(chalk_1.default.red('Execution error:'), error.message);
            process.exit(2);
        }
    }
    else if (workflow.type === 'conditional') {
        console.log('\n' + WorkflowVisualization_1.WorkflowVisualization.generateVisualization(workflow));
        console.log('\n>>> CONDITIONAL EXECUTION PLAN <<<');
        console.log('\n>>> EXECUTION STARTED <<<');
        console.log('Starting conditional execution...');
        // Create a new context for execution
        const ContextClass = (await Promise.resolve().then(() => __importStar(require('./models/Context')))).Context;
        const context = new ContextClass();
        // Create executor and run the workflow
        const ExecutorClass = (await Promise.resolve().then(() => __importStar(require('./models/Executor')))).Executor;
        const executor = new ExecutorClass();
        try {
            await executor.execute(workflow, agents, context);
        }
        catch (error) {
            console.error(chalk_1.default.red('Execution error:'), error.message);
            process.exit(2);
        }
    }
    console.log('\n>>> WORKFLOW COMPLETED SUCCESSFULLY <<<');
    console.log('Execution finished. Results shown above.');
})
    .command('test-agent <agent-id> <file>', chalk_1.default.cyan('test-agent') + ' ' + chalk_1.default.dim('Test a specific agent from a workflow YAML file'), (yargs) => {
    return yargs
        .example([
        [chalk_1.default.italic.dim('$0 test-agent researcher examples/sample-workflow.yaml'), chalk_1.default.dim('Test the researcher agent')]
    ])
        .positional('agent-id', {
        describe: chalk_1.default.dim('ID of the agent to test (required)'),
        type: 'string',
        demandOption: true
    })
        .positional('file', {
        describe: chalk_1.default.dim('YAML file containing the workflow definition (required)'),
        type: 'string',
        demandOption: true
    });
}, async (argv) => {
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
    const ContextClass = (await Promise.resolve().then(() => __importStar(require('./models/Context')))).Context;
    const context = new ContextClass();
    try {
        // Run the agent
        const output = await agent.run(context);
        console.log('\nAGENT OUTPUT');
        console.log('------------');
        console.log(output);
        console.log('------------');
        console.log(chalk_1.default.green('Agent test completed successfully!'));
    }
    catch (error) {
        console.log('\nERROR OCCURRED');
        console.log('--------------');
        console.error(chalk_1.default.red('Error during agent execution:'));
        console.error(chalk_1.default.red(error.message));
        console.log('--------------');
        process.exit(1);
    }
})
    .command('configure', chalk_1.default.cyan('configure') + ' ' + chalk_1.default.dim('Add or update AI model and API key configuration'), (yargs) => {
    return yargs
        .example([
        [chalk_1.default.italic.dim('$0 configure'), chalk_1.default.dim('Change AI model and API key')]
    ])
        .option('model', {
        alias: 'm',
        type: 'string',
        description: chalk_1.default.dim('AI model name to use'),
        demandOption: false
    })
        .option('api-key', {
        alias: 'k',
        type: 'string',
        description: chalk_1.default.dim('API key for the AI service'),
        demandOption: false
    })
        .option('name', {
        alias: 'n',
        type: 'string',
        description: chalk_1.default.dim('Name for this API key configuration'),
        demandOption: false
    });
}, async (argv) => {
    console.log(chalk_1.default.bold('AI Model Configuration'));
    console.log('========================');
    let modelName = argv.model;
    let apiKey = argv.apiKey;
    let keyName = argv.name || 'unnamed';
    // If not provided as arguments, prompt for input
    if (!modelName) {
        const readline = require('readline-sync');
        modelName = readline.question('Enter AI model name (e.g., llama-3.1-8b-instant): ');
    }
    if (!apiKey) {
        const readline = require('readline-sync');
        apiKey = readline.question('Enter API key: ', { hideEchoBack: true });
    }
    if (!argv.name) {
        const readline = require('readline-sync');
        keyName = readline.question('Enter a name for this key (e.g., groq-main, gemini-test): ');
    }
    // Load existing API keys config
    let apiKeysConfig = { default: 'default-key', keys: {} };
    try {
        const configContent = fs.readFileSync('config/api-keys.json', 'utf8');
        apiKeysConfig = JSON.parse(configContent);
    }
    catch (err) {
        // If config file doesn't exist, use default
        console.log(chalk_1.default.yellow('Creating new API keys configuration...'));
    }
    // Add/update the key in our config
    apiKeysConfig.keys[keyName] = {
        provider: argv.provider || 'groq',
        model: modelName,
        apiKey: apiKey
    };
    apiKeysConfig.default = keyName;
    // Save the updated config
    fs.writeFileSync('config/api-keys.json', JSON.stringify(apiKeysConfig, null, 2));
    // Also update the .env file for immediate use
    try {
        let envContent = '';
        try {
            envContent = fs.readFileSync('.env', 'utf8');
        }
        catch (err) {
            // If .env file doesn't exist, create an empty content
            envContent = '';
        }
        // Replace or add the GROQ_API_KEY line
        const apiKeyRegex = /^GROQ_API_KEY=.*/gm;
        if (apiKeyRegex.test(envContent)) {
            envContent = envContent.replace(apiKeyRegex, `GROQ_API_KEY=${apiKey}`);
        }
        else {
            envContent += `\nGROQ_API_KEY=${apiKey}`;
        }
        // Add model as a comment
        const modelComment = `# Current AI model: ${modelName}`;
        const modelCommentRegex = /^# Current AI model:.*/gm;
        if (modelCommentRegex.test(envContent)) {
            envContent = envContent.replace(modelCommentRegex, modelComment);
        }
        else {
            envContent = modelComment + '\n' + envContent;
        }
        // Also add as environment variable
        const modelEnvRegex = /^CURRENT_AI_MODEL=.*/gm;
        if (modelEnvRegex.test(envContent)) {
            envContent = envContent.replace(modelEnvRegex, `CURRENT_AI_MODEL=${modelName}`);
        }
        else {
            envContent = `CURRENT_AI_MODEL=${modelName}\n` + envContent;
        }
        fs.writeFileSync('.env', envContent);
        console.log(chalk_1.default.green('\n✓ Configuration updated successfully!'));
        console.log(chalk_1.default.green(`Model: ${modelName}`));
        console.log(chalk_1.default.green(`API Key has been saved with name: ${keyName}`));
        console.log(chalk_1.default.green(`API Key has been updated in .env file`));
        console.log(chalk_1.default.yellow('\nNote: You need to restart the application for changes to take effect.'));
    }
    catch (error) {
        console.error(chalk_1.default.red('Error updating configuration:'), error.message);
        process.exit(1);
    }
})
    .command('switch', chalk_1.default.cyan('switch') + ' ' + chalk_1.default.dim('Switch between saved AI model configurations'), (yargs) => {
    return yargs
        .example([
        [chalk_1.default.italic.dim('$0 switch'), chalk_1.default.dim('List and select from saved API keys')],
        [chalk_1.default.italic.dim('$0 switch my-gemini-key'), chalk_1.default.dim('Switch to a specific key by name')]
    ])
        .positional('keyName', {
        describe: chalk_1.default.dim('Name of the API key to switch to (optional)'),
        type: 'string',
        demandOption: false
    });
}, async (argv) => {
    console.log(chalk_1.default.bold('API Key Switcher'));
    console.log('==================');
    // Load API keys config
    let apiKeysConfig = { default: '', keys: {} };
    try {
        const configContent = fs.readFileSync('config/api-keys.json', 'utf8');
        apiKeysConfig = JSON.parse(configContent);
    }
    catch (err) {
        console.error(chalk_1.default.red('No API keys configuration found. Please configure at least one key first using:'), chalk_1.default.cyan('auraflow configure'));
        process.exit(1);
    }
    const keyNames = Object.keys(apiKeysConfig.keys);
    if (keyNames.length === 0) {
        console.log(chalk_1.default.yellow('No API keys saved yet. Use configure command to add keys.'));
        return;
    }
    let selectedKeyName = argv.keyName;
    if (!selectedKeyName) {
        // Show list and prompt for selection
        console.log(chalk_1.default.bold.blue('\n📋 Available API Keys:'));
        console.log(chalk_1.default.dim('────────────────────────────────'));
        keyNames.forEach((name, index) => {
            const keyInfo = apiKeysConfig.keys[name];
            const indicator = name === apiKeysConfig.default ? chalk_1.default.green(' [ACTIVE]') : '';
            console.log(`${index + 1}. ${chalk_1.default.cyan(name)} ${indicator}`);
            console.log(`   Model: ${keyInfo.model}`);
            console.log(`   Provider: ${keyInfo.provider}\n`);
        });
        const readline = require('readline-sync');
        const selection = readline.question(chalk_1.default.bold('Enter the name of the key you want to use: '));
        selectedKeyName = selection;
    }
    // Validate the selected key exists
    if (!apiKeysConfig.keys[selectedKeyName]) {
        console.error(chalk_1.default.red(`API key '${selectedKeyName}' not found.`));
        console.log('Available keys:', keyNames.join(', '));
        process.exit(1);
    }
    // Update the .env file with the selected key
    const selectedKey = apiKeysConfig.keys[selectedKeyName];
    try {
        let envContent = '';
        try {
            envContent = fs.readFileSync('.env', 'utf8');
        }
        catch (err) {
            // If .env file doesn't exist, create an empty content
            envContent = '';
        }
        // Replace or add the GROQ_API_KEY line
        const apiKeyRegex = /^GROQ_API_KEY=.*/gm;
        if (apiKeyRegex.test(envContent)) {
            envContent = envContent.replace(apiKeyRegex, `GROQ_API_KEY=${selectedKey.apiKey}`);
        }
        else {
            envContent += `\nGROQ_API_KEY=${selectedKey.apiKey}`;
        }
        // Add model as a comment
        const modelComment = `# Current AI model: ${selectedKey.model}`;
        const modelCommentRegex = /^# Current AI model:.*/gm;
        if (modelCommentRegex.test(envContent)) {
            envContent = envContent.replace(modelCommentRegex, modelComment);
        }
        else {
            envContent = modelComment + '\n' + envContent;
        }
        // Also add as environment variable
        const modelEnvRegex = /^CURRENT_AI_MODEL=.*/gm;
        if (modelEnvRegex.test(envContent)) {
            envContent = envContent.replace(modelEnvRegex, `CURRENT_AI_MODEL=${selectedKey.model}`);
        }
        else {
            envContent = `CURRENT_AI_MODEL=${selectedKey.model}\n` + envContent;
        }
        fs.writeFileSync('.env', envContent);
        // Update the default key in config
        apiKeysConfig.default = selectedKeyName;
        fs.writeFileSync('config/api-keys.json', JSON.stringify(apiKeysConfig, null, 2));
        console.log(chalk_1.default.green('\n✓ Successfully switched to API key:'), chalk_1.default.cyan(selectedKeyName));
        console.log(chalk_1.default.green(`Model: ${selectedKey.model}`));
        console.log(chalk_1.default.green(`Provider: ${selectedKey.provider}`));
        console.log(chalk_1.default.yellow('\nNote: You need to restart the application for changes to take effect.'));
    }
    catch (error) {
        console.error(chalk_1.default.red('Error switching API key:'), error.message);
        process.exit(1);
    }
})
    .epilogue('\n' + chalk_1.default.bold.blue('💡 QUICK START GUIDE') + '\n' +
    chalk_1.default.dim('┌─────────────────────────────────────────────────────────────┐\n') +
    chalk_1.default.dim('│ ') + chalk_1.default.green('1. ') + chalk_1.default.reset('Configure your AI model: ') + chalk_1.default.cyan('auraflow configure') + chalk_1.default.dim('                    │\n') +
    chalk_1.default.dim('│ ') + chalk_1.default.green('2. ') + chalk_1.default.reset('Save multiple configs: ') + chalk_1.default.cyan('auraflow configure -n my-gemini -m gemini-pro') + chalk_1.default.dim(' │\n') +
    chalk_1.default.dim('│ ') + chalk_1.default.green('3. ') + chalk_1.default.reset('Switch between configs: ') + chalk_1.default.cyan('auraflow switch') + chalk_1.default.dim('                          │\n') +
    chalk_1.default.dim('│ ') + chalk_1.default.green('4. ') + chalk_1.default.reset('Run workflows: ') + chalk_1.default.cyan('auraflow run examples/demo-workflow.yaml') + chalk_1.default.dim('       │\n') +
    chalk_1.default.dim('└─────────────────────────────────────────────────────────────┘\n\n') +
    chalk_1.default.gray('For more information, visit: ') + chalk_1.default.italic('https://github.com/your-repo/auraflow'))
    .wrap(Math.min(100, yargs.terminalWidth()))
    .help()
    .alias('h', 'help')
    .argv;
//# sourceMappingURL=cli.js.map