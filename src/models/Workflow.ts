/**
 * Represents a workflow that defines how agents should operate.
 * Contains the type of workflow and the steps or branches.
 */
export class Workflow {
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
    dependsOn?: string[]; // IDs of steps that must complete before this step runs
    inputs?: {
      required: string[]; // Required input keys
      optional?: string[]; // Optional input keys
    };
    outputs?: {
      produced: string[]; // Output keys this step produces
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
      required: string[]; // Required input keys
      optional?: string[]; // Optional input keys
    };
    outputs?: {
      produced: string[]; // Output keys this branch produces
    };
  }>;

  /**
   * Final step that runs after all branches complete in a parallel workflow
   */
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

  /**
   * Conditional branch configuration for conditional workflow type
   */
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
  constructor(
    id: string,
    type: 'sequential' | 'parallel' | 'parallel_then' | 'conditional',
    steps: Array<{
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
    }> = [],
    branches: Array<{
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
    }> = [],
    then: {
      agent: string;
      action: string;
      inputs?: {
        required: string[]; // Required input keys
        optional?: string[]; // Optional input keys
      };
      outputs?: {
        produced: string[]; // Output keys this step produces
      };
    } | undefined = undefined,
    condition: {
      stepId: string;
      cases: Array<{
        condition: string;
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
    } | undefined = undefined,
    stopOnError: boolean = true
  ) {
    this.id = id;
    this.type = type;
    this.steps = steps;
    this.branches = branches || [];
    this.then = then;
    this.condition = condition;
    this.stopOnError = stopOnError;
  }
}