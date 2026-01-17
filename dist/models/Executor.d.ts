import { Workflow } from './Workflow';
import { Context } from './Context';
import { Agent } from './Agent';
/**
 * Responsible for executing workflows.
 * This class handles the actual execution of workflow steps using agents.
 */
export declare class Executor {
    /**
     * Executes a workflow using the provided agents and context
     * @param workflow - The workflow to execute
     * @param agents - Array of agents available for the workflow
     * @param context - Shared context for the workflow
     */
    execute(workflow: Workflow, agents: Agent[], context: Context): Promise<void>;
    /**
     * Executes a sequential workflow
     * @param workflow - The sequential workflow to execute
     * @param agents - Array of agents available for the workflow
     * @param context - Shared context for the workflow
     */
    private executeSequential;
    /**
     * Validates that required inputs are available in the context before executing a step
     * @param inputs - Input requirements for the step
     * @param context - Shared context to check for required values
     * @returns true if all required inputs are available
     */
    private validateInputs;
    /**
     * Logs the context being passed to an agent
     * @param agent - The agent that will receive the context
     * @param context - The current context being passed
     * @param step - The step configuration
     */
    private logContextPassing;
    /**
     * Logs the context update after an agent executes
     * @param agent - The agent that just executed
     * @param output - The output from the agent
     * @param outputKeys - Keys under which the output is stored
     */
    private logContextUpdate;
    /**
     * Executes a conditional workflow based on agent output
     * @param workflow - The conditional workflow to execute
     * @param agents - Array of agents available for the workflow
     * @param context - Shared context for the workflow
     */
    private executeConditional;
    /**
     * Executes a parallel workflow
     * @param workflow - The parallel workflow to execute
     * @param agents - Array of agents available for the workflow
     * @param context - Shared context for the workflow
     */
    private executeParallel;
}
