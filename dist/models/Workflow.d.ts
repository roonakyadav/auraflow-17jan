/**
 * Represents a workflow that defines how agents should operate.
 * Contains the type of workflow and the steps or branches.
 */
export declare class Workflow {
    /**
     * Unique identifier for the workflow
     */
    id: string;
    /**
     * Type of workflow - determines how steps are executed
     * 'sequential' - steps execute one after another
     * 'parallel' - steps execute simultaneously
     * 'parallel_then' - steps execute in parallel, then a final step executes
     * 'conditional' - conditional branching based on agent output
     */
    type: 'sequential' | 'parallel' | 'parallel_then' | 'conditional';
    /**
     * Whether to stop execution on first error
     * Default: true
     */
    stopOnError: boolean;
    /**
     * Array of steps in the workflow
     * Each step represents an action or task for an agent
     */
    steps: Array<{
        id: string;
        agent: string;
        action: string;
        dependsOn?: string[];
        inputs?: {
            required: string[];
            optional?: string[];
        };
        outputs?: {
            produced: string[];
        };
    }>;
    /**
     * Array of branches for parallel workflow execution
     * Each branch represents an action or task for an agent that runs in parallel
     */
    branches: Array<{
        id: string;
        agent: string;
        action: string;
        inputs?: {
            required: string[];
            optional?: string[];
        };
        outputs?: {
            produced: string[];
        };
    }>;
    /**
     * Final step that runs after all branches complete in a parallel workflow
     */
    then?: {
        agent: string;
        action: string;
        inputs?: {
            required: string[];
            optional?: string[];
        };
        outputs?: {
            produced: string[];
        };
    };
    /**
     * Conditional branch configuration for conditional workflow type
     */
    condition?: {
        stepId: string;
        cases: Array<{
            condition: string;
            step: {
                id: string;
                agent: string;
                action: string;
                inputs?: {
                    required: string[];
                    optional?: string[];
                };
                outputs?: {
                    produced: string[];
                };
            };
        }>;
        default?: {
            id: string;
            agent: string;
            action: string;
            inputs?: {
                required: string[];
                optional?: string[];
            };
            outputs?: {
                produced: string[];
            };
        };
    };
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
    constructor(id: string, type: 'sequential' | 'parallel' | 'parallel_then' | 'conditional', steps?: Array<{
        id: string;
        agent: string;
        action: string;
        dependsOn?: string[];
        inputs?: {
            required: string[];
            optional?: string[];
        };
        outputs?: {
            produced: string[];
        };
    }>, branches?: Array<{
        id: string;
        agent: string;
        action: string;
        inputs?: {
            required: string[];
            optional?: string[];
        };
        outputs?: {
            produced: string[];
        };
    }>, then?: {
        agent: string;
        action: string;
        inputs?: {
            required: string[];
            optional?: string[];
        };
        outputs?: {
            produced: string[];
        };
    } | undefined, condition?: {
        stepId: string;
        cases: Array<{
            condition: string;
            step: {
                id: string;
                agent: string;
                action: string;
                inputs?: {
                    required: string[];
                    optional?: string[];
                };
                outputs?: {
                    produced: string[];
                };
            };
        }>;
        default?: {
            id: string;
            agent: string;
            action: string;
            inputs?: {
                required: string[];
                optional?: string[];
            };
            outputs?: {
                produced: string[];
            };
        };
    } | undefined, stopOnError?: boolean);
}
