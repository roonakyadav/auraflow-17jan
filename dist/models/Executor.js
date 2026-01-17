"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Executor = void 0;
/**
 * Responsible for executing workflows.
 * This class handles the actual execution of workflow steps using agents.
 */
class Executor {
    /**
     * Executes a workflow using the provided agents and context
     * @param workflow - The workflow to execute
     * @param agents - Array of agents available for the workflow
     * @param context - Shared context for the workflow
     */
    async execute(workflow, agents, context) {
        console.log('\n>>> EXECUTING WORKFLOW: ' + workflow.id + ' (' + workflow.type + ') <<<');
        console.log('Stop on error: ' + workflow.stopOnError);
        if (workflow.type === 'sequential') {
            console.log(`Steps: ${workflow.steps.length}`);
            await this.executeSequential(workflow, agents, context);
        }
        else if (workflow.type === 'parallel') {
            console.log(`Branches: ${workflow.branches.length}`);
            if (workflow.then) {
                console.log(`Final Step: ${workflow.then.agent}`);
            }
            await this.executeParallel(workflow, agents, context);
        }
        else if (workflow.type === 'conditional') {
            await this.executeConditional(workflow, agents, context);
        }
        else {
            console.log(`Execution for workflow type '${workflow.type}' not implemented yet`);
        }
    }
    /**
     * Executes a sequential workflow
     * @param workflow - The sequential workflow to execute
     * @param agents - Array of agents available for the workflow
     * @param context - Shared context for the workflow
     */
    async executeSequential(workflow, agents, context) {
        console.log('\n>>> SEQUENTIAL EXECUTION STARTED <<<');
        for (let i = 0; i < workflow.steps.length; i++) {
            const step = workflow.steps[i];
            const stepName = step.id ?? `step-${i + 1}`;
            const actionName = step.action ?? "execute";
            console.log(`\n[${i + 1}/${workflow.steps.length}] ${stepName} → ${step.agent} (${actionName})`);
            // Find the agent for this step
            const agent = agents.find(a => a.id === step.agent);
            if (!agent) {
                const errorMsg = `Agent with ID '${step.agent}' not found for step '${stepName}'`;
                console.error('ERROR:', errorMsg);
                if (workflow.stopOnError) {
                    throw new Error(errorMsg);
                }
                else {
                    console.log('INFO: Continuing execution (stopOnError=false)...');
                    continue;
                }
            }
            console.log(`  Running: ${agent.id} (${agent.role})`);
            try {
                // Prepare context information before execution
                this.logContextPassing(agent, context, step);
                // Execute the agent with the current context
                const output = await agent.run(context);
                // Append the agent's output to the context as a new message
                context.addMessage(agent.id, output);
                // Store outputs in the context if specified
                if (step.outputs && step.outputs.produced) {
                    for (const outputKey of step.outputs.produced) {
                        context.setOutput(outputKey, output);
                    }
                }
                console.log('  Output:', output.substring(0, 200) + (output.length > 200 ? '...' : ''));
                // Log what was added to the context
                this.logContextUpdate(agent, output, step.outputs?.produced || []);
            }
            catch (error) {
                const errorMsg = `Error executing agent '${agent.id}': ${error.message}`;
                console.error('ERROR:', errorMsg);
                if (workflow.stopOnError) {
                    throw new Error(errorMsg);
                }
                else {
                    console.log('INFO: Continuing execution (stopOnError=false)...');
                    continue;
                }
            }
        }
        console.log('\n>>> SEQUENTIAL EXECUTION COMPLETED <<<');
        // Print the final context messages
        console.log('\n>>> FINAL RESULTS <<<');
        // Group messages by agent ID
        const messages = context.getMessages();
        const messagesByAgent = {};
        messages.forEach(msg => {
            if (!messagesByAgent[msg.agentId]) {
                messagesByAgent[msg.agentId] = [];
            }
            messagesByAgent[msg.agentId].push(msg.content);
        });
        // Print each agent's outputs
        Object.entries(messagesByAgent).forEach(([agentId, contents]) => {
            console.log(`\n${agentId}:`);
            contents.forEach(content => {
                console.log('  ' + content);
            });
        });
    }
    /**
     * Validates that required inputs are available in the context before executing a step
     * @param inputs - Input requirements for the step
     * @param context - Shared context to check for required values
     * @returns true if all required inputs are available
     */
    validateInputs(inputs, context) {
        if (!inputs || !inputs.required) {
            return true; // No inputs required
        }
        for (const requiredInput of inputs.required) {
            if (context.getOutput(requiredInput) === undefined) {
                return false; // Required input not available
            }
        }
        return true; // All required inputs are available
    }
    /**
     * Logs the context being passed to an agent
     * @param agent - The agent that will receive the context
     * @param context - The current context being passed
     * @param step - The step configuration
     */
    logContextPassing(agent, context, step) {
        console.log(`\n┌─────────────────────────────────────────────────────────┐`);
        console.log(`│ CONTEXT PASSING TO AGENT: ${agent.id.padEnd(30)} │`);
        console.log(`│ ROLE: ${agent.role.substring(0, 46).padEnd(50)} │`);
        // Show required inputs if specified
        if (step?.inputs?.required && step.inputs.required.length > 0) {
            console.log(`│ Required inputs: ${step.inputs.required.join(', ').substring(0, 30).padEnd(30)} │`);
            // Check and show the actual values of required inputs
            for (const inputKey of step.inputs.required) {
                const inputValue = context.getOutput(inputKey);
                if (inputValue !== undefined) {
                    const displayValue = typeof inputValue === 'string' ? inputValue.substring(0, 30) : JSON.stringify(inputValue).substring(0, 30);
                    console.log(`│   → ${inputKey}: ${displayValue.padEnd(45)} │`);
                }
                else {
                    console.log(`│   → ${inputKey}: [NOT FOUND - WILL FAIL]              │`);
                }
            }
        }
        // Show recent messages in context
        const messages = context.getMessages();
        if (messages.length > 0) {
            const recentMessages = messages.slice(-2); // Show last 2 messages
            console.log(`│ Recent context messages:                               │`);
            for (const msg of recentMessages) {
                const contentPreview = msg.content.substring(0, 25).replace(/\n/g, ' ').padEnd(25);
                console.log(`│   ← From ${msg.agentId} (${contentPreview}) │`);
            }
        }
        console.log(`└─────────────────────────────────────────────────────────┘`);
    }
    /**
     * Logs the context update after an agent executes
     * @param agent - The agent that just executed
     * @param output - The output from the agent
     * @param outputKeys - Keys under which the output is stored
     */
    logContextUpdate(agent, output, outputKeys) {
        console.log(`\n┌─────────────────────────────────────────────────────────┐`);
        console.log(`│ CONTEXT UPDATE FROM AGENT: ${agent.id.padEnd(25)} │`);
        console.log(`│ ROLE: ${agent.role.substring(0, 46).padEnd(50)} │`);
        // Show the output that was added to the context
        const outputPreview = output.substring(0, 50).replace(/\n/g, ' ').padEnd(50);
        console.log(`│ Output added to context:                                  │`);
        console.log(`│   → ${outputPreview.substring(0, 48)} │`);
        // Show where the output was stored
        if (outputKeys.length > 0) {
            console.log(`│ Stored under keys: ${outputKeys.join(', ').substring(0, 35).padEnd(35)} │`);
            for (const key of outputKeys) {
                console.log(`│   → ${key}                                           │`);
            }
        }
        console.log(`└─────────────────────────────────────────────────────────┘`);
    }
    /**
     * Executes a conditional workflow based on agent output
     * @param workflow - The conditional workflow to execute
     * @param agents - Array of agents available for the workflow
     * @param context - Shared context for the workflow
     */
    async executeConditional(workflow, agents, context) {
        console.log('\n>>> CONDITIONAL EXECUTION STARTED <<<');
        if (!workflow.condition) {
            console.log('ERROR: No condition configuration found for conditional workflow');
            return;
        }
        const { stepId, cases, default: defaultStep } = workflow.condition;
        // Find and execute the initial step
        const initialStep = workflow.steps.find(step => step.id === stepId);
        if (!initialStep) {
            console.log(`ERROR: Initial step with ID '${stepId}' not found`);
            return;
        }
        const agent = agents.find(a => a.id === initialStep.agent);
        if (!agent) {
            console.log(`ERROR: Agent with ID '${initialStep.agent}' not found for initial step`);
            return;
        }
        // Validate inputs for the initial step
        if (!this.validateInputs(initialStep.inputs, context)) {
            console.log(`ERROR: Missing required inputs for step '${initialStep.id}'`);
            if (workflow.stopOnError) {
                throw new Error(`Missing required inputs for step '${initialStep.id}'`);
            }
            return;
        }
        console.log(`\nExecuting: ${initialStep.id} → ${initialStep.agent}`);
        try {
            const output = await agent.run(context);
            context.addMessage(agent.id, output);
            // Determine which case to execute based on the output
            let matchedCase = cases.find(c => output.includes(c.condition) || output.toLowerCase().includes(c.condition.toLowerCase()));
            if (!matchedCase && defaultStep) {
                matchedCase = { condition: 'default', step: defaultStep };
            }
            if (matchedCase) {
                console.log(`\nCondition matched: '${matchedCase.condition}', executing branch`);
                const branchStep = matchedCase.step;
                const branchAgent = agents.find(a => a.id === branchStep.agent);
                if (!branchAgent) {
                    console.log(`ERROR: Agent with ID '${branchStep.agent}' not found for conditional branch`);
                    return;
                }
                // Validate inputs for the branch step
                if (!this.validateInputs(branchStep.inputs, context)) {
                    console.log(`ERROR: Missing required inputs for conditional step '${branchStep.id}'`);
                    if (workflow.stopOnError) {
                        throw new Error(`Missing required inputs for conditional step '${branchStep.id}'`);
                    }
                    return;
                }
                console.log(`\nExecuting: ${branchStep.id} → ${branchStep.agent}`);
                // Prepare context information before execution
                this.logContextPassing(branchAgent, context, branchStep);
                const branchOutput = await branchAgent.run(context);
                context.addMessage(branchAgent.id, branchOutput);
                console.log('  Output:', branchOutput.substring(0, 200) + (branchOutput.length > 200 ? '...' : ''));
                // Log what was added to the context
                this.logContextUpdate(branchAgent, branchOutput, branchStep.outputs?.produced || []);
            }
            else {
                console.log('\nNo condition matched and no default step defined');
            }
        }
        catch (error) {
            console.error('ERROR: executing initial step:', error.message);
            if (workflow.stopOnError) {
                throw error;
            }
        }
        console.log('\n>>> CONDITIONAL EXECUTION COMPLETED <<<');
    }
    /**
     * Executes a parallel workflow
     * @param workflow - The parallel workflow to execute
     * @param agents - Array of agents available for the workflow
     * @param context - Shared context for the workflow
     */
    async executeParallel(workflow, agents, context) {
        console.log('\n>>> PARALLEL EXECUTION STARTED <<<');
        // Execute all branches concurrently
        const branchPromises = workflow.branches.map(async (branch, index) => {
            const branchName = branch.id ?? `branch-${index + 1}`;
            const actionName = branch.action ?? "execute";
            console.log(`\n[${index + 1}/${workflow.branches.length}] ${branchName} → ${branch.agent} (${actionName})`);
            // Find the agent for this branch
            const agent = agents.find(a => a.id === branch.agent);
            if (!agent) {
                const errorMsg = `Agent with ID '${branch.agent}' not found for branch '${branchName}'`;
                console.error('ERROR:', errorMsg);
                if (workflow.stopOnError) {
                    throw new Error(errorMsg);
                }
                else {
                    console.log('INFO: Continuing execution (stopOnError=false)...');
                    return { branch, output: null, error: errorMsg };
                }
            }
            console.log(`  Running: ${agent.id} (${agent.role})`);
            try {
                // Validate inputs for this branch
                if (!this.validateInputs(branch.inputs, context)) {
                    const errorMsg = `Missing required inputs for branch '${branch.id}'`;
                    console.error('ERROR:', errorMsg);
                    if (workflow.stopOnError) {
                        throw new Error(errorMsg);
                    }
                    else {
                        console.log('INFO: Continuing execution (stopOnError=false)...');
                        return { branch, output: null, error: errorMsg };
                    }
                }
                // Prepare context information before execution
                this.logContextPassing(agent, context, branch);
                // Execute the agent with the current context
                const output = await agent.run(context);
                // Append the agent's output to the context as a new message
                context.addMessage(agent.id, output);
                // Store outputs in the context if specified
                if (branch.outputs && branch.outputs.produced) {
                    for (const outputKey of branch.outputs.produced) {
                        context.setOutput(outputKey, output);
                    }
                }
                console.log('  Output:', output.substring(0, 200) + (output.length > 200 ? '...' : ''));
                // Log what was added to the context
                this.logContextUpdate(agent, output, branch.outputs?.produced || []);
                return { branch, output };
            }
            catch (error) {
                const errorMsg = `Error executing agent '${agent.id}': ${error.message}`;
                console.error('ERROR:', errorMsg);
                if (workflow.stopOnError) {
                    throw new Error(errorMsg);
                }
                else {
                    console.log('INFO: Continuing execution (stopOnError=false)...');
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
            console.log(`\nThen: ${workflow.then.agent} (${thenAction})`);
            // Find the 'then' agent
            const thenAgent = agents.find(a => a.id === workflow.then.agent);
            if (!thenAgent) {
                const errorMsg = `'Then' agent with ID '${workflow.then.agent}' not found`;
                console.error('ERROR:', errorMsg);
                if (workflow.stopOnError) {
                    throw new Error(errorMsg);
                }
                else {
                    console.log('INFO: Continuing execution (stopOnError=false)...');
                }
            }
            else {
                console.log(`  Running: ${thenAgent.id} (${thenAgent.role})`);
                try {
                    // Validate inputs for the 'then' step
                    if (!this.validateInputs(workflow.then.inputs, context)) {
                        const errorMsg = `Missing required inputs for 'then' step`;
                        console.error('ERROR:', errorMsg);
                        if (workflow.stopOnError) {
                            throw new Error(errorMsg);
                        }
                        else {
                            console.log('INFO: Continuing execution (stopOnError=false)...');
                        }
                    }
                    else {
                        // Prepare context information before execution
                        this.logContextPassing(thenAgent, context, { ...workflow.then, id: 'then-step' });
                        // Execute the 'then' agent with the aggregated context
                        const finalOutput = await thenAgent.run(context);
                        // Append the final agent's output to the context
                        context.addMessage(thenAgent.id, finalOutput);
                        // Store outputs in the context if specified
                        if (workflow.then.outputs && workflow.then.outputs.produced) {
                            for (const outputKey of workflow.then.outputs.produced) {
                                context.setOutput(outputKey, finalOutput);
                            }
                        }
                        console.log('  Output:', finalOutput.substring(0, 200) + (finalOutput.length > 200 ? '...' : ''));
                        // Log what was added to the context
                        this.logContextUpdate(thenAgent, finalOutput, workflow.then.outputs?.produced || []);
                    }
                }
                catch (error) {
                    const errorMsg = `Error executing 'then' agent '${thenAgent.id}': ${error.message}`;
                    console.error('ERROR:', errorMsg);
                    if (workflow.stopOnError) {
                        throw new Error(errorMsg);
                    }
                    else {
                        console.log('INFO: Continuing execution (stopOnError=false)...');
                    }
                }
            }
        }
        console.log('\n>>> PARALLEL EXECUTION COMPLETED <<<');
        // Print the final context messages
        console.log('\n>>> FINAL RESULTS <<<');
        // Group messages by agent ID
        const messages = context.getMessages();
        const messagesByAgent = {};
        messages.forEach(msg => {
            if (!messagesByAgent[msg.agentId]) {
                messagesByAgent[msg.agentId] = [];
            }
            messagesByAgent[msg.agentId].push(msg.content);
        });
        // Print each agent's outputs
        Object.entries(messagesByAgent).forEach(([agentId, contents]) => {
            console.log(`\n${agentId}:`);
            contents.forEach(content => {
                console.log('  ' + content);
            });
        });
    }
}
exports.Executor = Executor;
//# sourceMappingURL=Executor.js.map