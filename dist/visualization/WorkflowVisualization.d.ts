import { Workflow } from '../models/Workflow';
export declare class WorkflowVisualization {
    /**
     * Generates an ASCII art representation of the workflow
     * @param workflow - The workflow to visualize
     * @returns A string representation of the workflow structure
     */
    static generateVisualization(workflow: Workflow): string;
    /**
     * Renders a sequential workflow visualization
     */
    private static renderSequentialWorkflow;
    /**
     * Renders a parallel workflow visualization
     */
    private static renderParallelWorkflow;
    /**
     * Renders a parallel-then workflow visualization
     */
    private static renderParallelThenWorkflow;
    /**
     * Renders a conditional workflow visualization
     */
    private static renderConditionalWorkflow;
    /**
     * Helper function to truncate strings to a maximum length
     */
    private static truncateString;
}
