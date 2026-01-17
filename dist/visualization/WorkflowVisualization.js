"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowVisualization = void 0;
class WorkflowVisualization {
    /**
     * Generates an ASCII art representation of the workflow
     * @param workflow - The workflow to visualize
     * @returns A string representation of the workflow structure
     */
    static generateVisualization(workflow) {
        let visualization = '';
        visualization += '┌─────────────────────────────────────────┐\n';
        visualization += `│ WORKFLOW VISUALIZATION: ${workflow.id} │\n`;
        visualization += '└─────────────────────────────────────────┘\n\n';
        visualization += `Workflow Type: ${workflow.type}\n\n`;
        switch (workflow.type) {
            case 'sequential':
                visualization += this.renderSequentialWorkflow(workflow);
                break;
            case 'parallel':
                visualization += this.renderParallelWorkflow(workflow);
                break;
            case 'parallel_then':
                visualization += this.renderParallelThenWorkflow(workflow);
                break;
            case 'conditional':
                visualization += this.renderConditionalWorkflow(workflow);
                break;
            default:
                visualization += `Unknown workflow type: ${workflow.type}\n`;
        }
        return visualization;
    }
    /**
     * Renders a sequential workflow visualization
     */
    static renderSequentialWorkflow(workflow) {
        let output = 'SEQUENTIAL EXECUTION FLOW:\n';
        output += '┌─';
        for (let i = 0; i < workflow.steps.length; i++) {
            output += '─────';
            if (i < workflow.steps.length - 1) {
                output += '─→─';
            }
        }
        output += '─┐\n';
        output += '│ ';
        for (let i = 0; i < workflow.steps.length; i++) {
            const step = workflow.steps[i];
            const stepLabel = this.truncateString(step.agent, 5);
            output += stepLabel;
            if (i < workflow.steps.length - 1) {
                output += ' ─→ ';
            }
        }
        output += ' │\n';
        output += '└─';
        for (let i = 0; i < workflow.steps.length; i++) {
            output += '─────';
            if (i < workflow.steps.length - 1) {
                output += '─→─';
            }
        }
        output += '─┘\n\n';
        // Add step details
        output += 'STEP DETAILS:\n';
        for (let i = 0; i < workflow.steps.length; i++) {
            const step = workflow.steps[i];
            output += `  [${i + 1}] ${step.id} → ${step.agent} (${step.action})\n`;
            if (step.inputs && step.inputs.required && step.inputs.required.length > 0) {
                output += `      Inputs: ${step.inputs.required.join(', ')}\n`;
            }
            if (step.outputs && step.outputs.produced && step.outputs.produced.length > 0) {
                output += `      Outputs: ${step.outputs.produced.join(', ')}\n`;
            }
        }
        return output;
    }
    /**
     * Renders a parallel workflow visualization
     */
    static renderParallelWorkflow(workflow) {
        let output = 'PARALLEL EXECUTION FLOW:\n';
        // Top border
        output += '┌─';
        for (let i = 0; i < workflow.branches.length; i++) {
            output += '──────────';
            if (i < workflow.branches.length - 1) {
                output += '─┬─';
            }
        }
        output += '─┐\n';
        // Agents row
        output += '│ ';
        for (let i = 0; i < workflow.branches.length; i++) {
            const branch = workflow.branches[i];
            const agentLabel = this.truncateString(branch.agent, 8);
            output += agentLabel.padEnd(10);
            if (i < workflow.branches.length - 1) {
                output += ' │ ';
            }
        }
        output += ' │\n';
        // Middle connector
        output += '├─';
        for (let i = 0; i < workflow.branches.length; i++) {
            output += '──────────';
            if (i < workflow.branches.length - 1) {
                output += '─┼─';
            }
        }
        output += '─┤\n';
        // Down arrows to converge
        output += '│ ';
        for (let i = 0; i < workflow.branches.length; i++) {
            output += '    ↓     ';
            if (i < workflow.branches.length - 1) {
                output += ' │ ';
            }
        }
        output += ' │\n';
        // Converge to 'then' agent if exists
        if (workflow.then) {
            const thenAgentLabel = this.truncateString(workflow.then.agent, 8);
            const totalWidth = workflow.branches.length * 11 + (workflow.branches.length - 1) * 3;
            const centeredText = thenAgentLabel.padStart((totalWidth - thenAgentLabel.length) / 2 + thenAgentLabel.length / 2)
                .padEnd(totalWidth);
            output += `│ ${centeredText} │\n`;
        }
        else {
            const totalWidth = workflow.branches.length * 11 + (workflow.branches.length - 1) * 3;
            const centeredText = '[RESULTS]';
            output += `│ ${centeredText.padStart((totalWidth - centeredText.length) / 2 + centeredText.length / 2)
                .padEnd(totalWidth)} │\n`;
        }
        // Bottom border
        output += '└─';
        for (let i = 0; i < workflow.branches.length; i++) {
            output += '──────────';
            if (i < workflow.branches.length - 1) {
                output += '─┴─';
            }
        }
        output += '─┘\n\n';
        // Branch details
        output += 'BRANCH DETAILS:\n';
        for (let i = 0; i < workflow.branches.length; i++) {
            const branch = workflow.branches[i];
            output += `  [${i + 1}] ${branch.id} → ${branch.agent} (${branch.action})\n`;
            if (branch.inputs && branch.inputs.required && branch.inputs.required.length > 0) {
                output += `      Inputs: ${branch.inputs.required.join(', ')}\n`;
            }
            if (branch.outputs && branch.outputs.produced && branch.outputs.produced.length > 0) {
                output += `      Outputs: ${branch.outputs.produced.join(', ')}\n`;
            }
        }
        if (workflow.then) {
            output += `\nTHEN STEP:\n`;
            output += `  ${workflow.then.agent} (${workflow.then.action})\n`;
            if (workflow.then.inputs && workflow.then.inputs.required && workflow.then.inputs.required.length > 0) {
                output += `    Inputs: ${workflow.then.inputs.required.join(', ')}\n`;
            }
            if (workflow.then.outputs && workflow.then.outputs.produced && workflow.then.outputs.produced.length > 0) {
                output += `    Outputs: ${workflow.then.outputs.produced.join(', ')}\n`;
            }
        }
        return output;
    }
    /**
     * Renders a parallel-then workflow visualization
     */
    static renderParallelThenWorkflow(workflow) {
        return this.renderParallelWorkflow(workflow);
    }
    /**
     * Renders a conditional workflow visualization
     */
    static renderConditionalWorkflow(workflow) {
        let output = 'CONDITIONAL EXECUTION FLOW:\n';
        if (workflow.steps.length > 0) {
            const initialStep = workflow.steps[0]; // Assuming first step triggers condition
            const initialAgentLabel = this.truncateString(initialStep.agent, 8);
            output += `  ${initialAgentLabel} → DECISION\n`;
            output += '           ↙      ↘\n';
            if (workflow.condition) {
                for (let i = 0; i < workflow.condition.cases.length; i++) {
                    const caseStep = workflow.condition.cases[i].step;
                    const caseAgentLabel = this.truncateString(caseStep.agent, 8);
                    output += `    ${caseAgentLabel}    `;
                }
                if (workflow.condition.default) {
                    const defaultAgentLabel = this.truncateString(workflow.condition.default.agent, 8);
                    output += `  ${defaultAgentLabel} (default)\n`;
                }
                else {
                    output += '\n';
                }
            }
        }
        output += '\nCONDITION DETAILS:\n';
        if (workflow.condition) {
            output += `  Decision Step: ${workflow.condition.stepId}\n`;
            output += '  Cases:\n';
            for (const c of workflow.condition.cases) {
                output += `    If "${c.condition}" → ${c.step.agent} (${c.step.action})\n`;
            }
            if (workflow.condition.default) {
                output += `    Default → ${workflow.condition.default.agent} (${workflow.condition.default.action})\n`;
            }
        }
        return output;
    }
    /**
     * Helper function to truncate strings to a maximum length
     */
    static truncateString(str, maxLength) {
        if (str.length <= maxLength) {
            return str;
        }
        return str.substring(0, maxLength - 3) + '...';
    }
}
exports.WorkflowVisualization = WorkflowVisualization;
//# sourceMappingURL=WorkflowVisualization.js.map