/**
 * Represents a workflow that defines how agents should operate.
 * Contains the type of workflow (sequential, parallel) and the steps or branches.
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
   */
  type: 'sequential' | 'parallel' | 'parallel_then';

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
    inputs?: Record<string, any>; // Inputs required for this step
    outputs?: string[]; // Output keys this step produces
  }>;

  /**
   * Array of branches for parallel workflow execution
   * Each branch represents an action or task for an agent that runs in parallel
   */
  branches: Array<{
    id: string;
    agent: string;
    action: string;
    inputs?: Record<string, any>; // Inputs required for this branch
    outputs?: string[]; // Output keys this branch produces
  }>;

  /**
   * Final step that runs after all branches complete in a parallel workflow
   */
  then?: {
    agent: string;
    action: string;
    inputs?: Record<string, any>; // Inputs required for this step
    outputs?: string[]; // Output keys this step produces
  };

  /**
   * Creates a new Workflow instance
   * @param id - Unique identifier for the workflow
   * @param type - Type of workflow (sequential, parallel, parallel_then)
   * @param steps - Array of steps in the workflow
   * @param branches - Array of branches for parallel workflows (optional)
   * @param then - Final step for parallel workflows (optional)
   * @param stopOnError - Whether to stop execution on first error (default: true)
   */
  constructor(
    id: string,
    type: 'sequential' | 'parallel' | 'parallel_then',
    steps: Array<{
      id: string;
      agent: string;
      action: string;
      dependsOn?: string[];
      inputs?: Record<string, any>;
      outputs?: string[];
    }>,
    branches?: Array<{
      id: string;
      agent: string;
      action: string;
      inputs?: Record<string, any>;
      outputs?: string[];
    }>,
    then?: {
      agent: string;
      action: string;
      inputs?: Record<string, any>;
      outputs?: string[];
    },
    stopOnError: boolean = true
  ) {
    this.id = id;
    this.type = type;
    this.steps = steps;
    this.branches = branches || [];
    this.then = then;
    this.stopOnError = stopOnError;
  }
}