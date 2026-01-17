"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Workflow = void 0;
/**
 * Represents a workflow that defines how agents should operate.
 * Contains the type of workflow and the steps or branches.
 */
class Workflow {
    /**
     * Unique identifier for the workflow
     */
    id;
    /**
     * Type of workflow - determines how steps are executed
     * 'sequential' - steps execute one after another
     * 'parallel' - steps execute simultaneously
     * 'parallel_then' - steps execute in parallel, then a final step executes
     * 'conditional' - conditional branching based on agent output
     */
    type;
    /**
     * Whether to stop execution on first error
     * Default: true
     */
    stopOnError;
    /**
     * Array of steps in the workflow
     * Each step represents an action or task for an agent
     */
    steps;
    /**
     * Array of branches for parallel workflow execution
     * Each branch represents an action or task for an agent that runs in parallel
     */
    branches;
    /**
     * Final step that runs after all branches complete in a parallel workflow
     */
    then;
    /**
     * Conditional branch configuration for conditional workflow type
     */
    condition;
    /**
     * Creates a new Workflow instance
     * @param id - Unique identifier for the workflow
     * @param type - Type of workflow (sequential, parallel, parallel_then, conditional)
     * @param steps - Array of steps in the workflow
     * @param branches - Array of branches for parallel workflows (optional)
     * @param then - Final step for parallel workflows (optional)
     * @param condition - Conditional configuration for conditional workflows (optional)
     * @param stopOnError - Whether to stop execution on first error (default: true)
     */
    constructor(id, type, steps = [], branches = [], then = undefined, condition = undefined, stopOnError = true) {
        this.id = id;
        this.type = type;
        this.steps = steps;
        this.branches = branches || [];
        this.then = then;
        this.condition = condition;
        this.stopOnError = stopOnError;
    }
}
exports.Workflow = Workflow;
//# sourceMappingURL=Workflow.js.map