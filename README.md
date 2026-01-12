# Auraflow - Multi-Agent Orchestration Engine

Auraflow is a powerful multi-agent orchestration engine that enables complex AI workflows by coordinating multiple specialized agents defined through declarative YAML configuration files.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Workflow Types](#workflow-types)
- [YAML Schema](#yaml-schema)
- [Usage](#usage)
- [Examples](#examples)
- [Advanced Features](#advanced-features)
- [Troubleshooting](#troubleshooting)
- [Environment Variables](#environment-variables)
- [Best Practices](#best-practices)

## Overview

Auraflow allows you to define and execute complex workflows involving multiple AI agents. Each agent has a specific role and goal, and the workflow defines how they collaborate to achieve a common objective. The engine supports both sequential and parallel execution patterns.

### Key Features

- **Sequential Workflows**: Execute agents in a defined order with context passing
- **Parallel Workflows**: Execute multiple agents concurrently with result aggregation
- **Context Sharing**: Agents can share information and build upon previous outputs
- **Flexible Configuration**: Define agents and workflows using YAML files
- **Extensible Design**: Easy to add new agents and workflow patterns

## Prerequisites

Before using Auraflow, ensure you have:

- Node.js (version 14 or higher)
- npm (Node Package Manager)
- A GROQ API key for LLM integration

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Auraflow
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Verify the installation:
   ```bash
   npm run build
   ```

## Configuration

### Environment Variables

Create a `.env` file in the root directory with your GROQ API key:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Alternatively, you can set the environment variable directly:

```bash
export GROQ_API_KEY=your_groq_api_key_here
```

### API Key Setup

1. Sign up for a GROQ account at [https://console.groq.com](https://console.groq.com)
2. Navigate to the API Keys section
3. Create a new API key
4. Copy the key and use it in your environment configuration

## Workflow Types

Auraflow supports two primary workflow types:

### Sequential Workflows

Sequential workflows execute agents in a predefined order. Each agent can access the context from previous agents in the workflow, allowing for a chain of thought or task completion process.

### Parallel Workflows

Parallel workflows execute multiple agents concurrently. All agents in the "branches" section run simultaneously, and their outputs are aggregated for a final "then" agent that synthesizes the results.

## YAML Schema

### Root Level Structure

```yaml
id: workflow-identifier
agents:
  # Array of agent definitions
workflow:
  # Workflow configuration
```

### Agent Definition

Each agent is defined with the following properties:

- `id`: Unique identifier for the agent (required)
- `role`: The role or title of the agent (required)
- `goal`: The primary objective or purpose of the agent (required)
- `tools`: Optional array of tools available to the agent

Example:

```yaml
agents:
  - id: researcher
    role: "Market Research Analyst"
    goal: "Analyze market trends and compile comprehensive findings"
    tools: ["market_analysis", "data_collection"]
```

### Sequential Workflow Schema

```yaml
workflow:
  type: sequential
  steps:
    - agent: agent-id
      action: action-description
      inputs?: input-parameters
      outputs?: output-keys
      dependsOn?: [list-of-step-ids]
```

### Parallel Workflow Schema

```yaml
workflow:
  type: parallel
  branches:
    - agent: agent-id
      action: action-description
      inputs?: input-parameters
      outputs?: output-keys
  then?:
    agent: agent-id
    action: action-description
    inputs?: input-parameters
    outputs?: output-keys
```

## Usage

### Running Workflows

To run a workflow, use the CLI command:

```bash
npm run cli -- run <path-to-yaml-file>
```

Example:

```bash
npm run cli -- run examples/sequential-demo.yaml
```

### Command Structure

- `npm run cli`: Executes the CLI application
- `run`: The command to execute a workflow
- `<path-to-yaml-file>`: Path to your workflow YAML file

### Output Information

When running a workflow, Auraflow provides:

1. Workflow validation summary
2. List of agents and their roles
3. Execution order or branches
4. Real-time execution logs
5. Final context messages from all agents

## Examples

### Sequential Workflow Example

```yaml
# Sequential demo: Market research and report writing
id: market-research-report

agents:
  - id: researcher
    role: "Market Research Analyst"
    goal: "Analyze the current state of AI technology market trends and compile comprehensive findings"
    tools: ["market_analysis", "data_collection"]

  - id: writer
    role: "Business Report Writer"
    goal: "Create a professional market analysis report based on research data"
    tools: ["report_writing", "business_documentation"]

workflow:
  type: sequential
  steps:
    - id: research_step
      agent: researcher
      action: "analyze_ai_market_trends"
      inputs:
        focus_area: "enterprise AI adoption"
        time_period: "last 2 years"
      outputs:
        - market_findings

    - id: writing_step
      agent: writer
      action: "create_market_report"
      dependsOn:
        - research_step
      inputs:
        research_data: "{{ market_findings }}"
      outputs:
        - final_market_report
```

### Parallel Workflow Example

```yaml
# Parallel demo: Multi-faceted product evaluation
id: product-evaluation-review

agents:
  - id: tech_expert
    role: "Technical Expert"
    goal: "Evaluate product technical aspects, architecture, and implementation feasibility"
    tools: ["technical_analysis", "architecture_review"]

  - id: business_analyst
    role: "Business Analyst"
    goal: "Assess market potential, business model, and financial viability"
    tools: ["market_analysis", "business_modeling"]

  - id: ux_designer
    role: "UX Designer"
    goal: "Analyze user experience, interface design, and usability factors"
    tools: ["usability_testing", "ui_analysis"]

  - id: senior_reviewer
    role: "Senior Product Reviewer"
    goal: "Synthesize all evaluations and provide final recommendation"
    tools: ["synthesis", "decision_making"]

workflow:
  type: parallel
  branches:
    - id: technical_evaluation
      agent: tech_expert
      action: "perform_technical_review"
      inputs:
        product_name: "Enterprise AI Platform"
        product_description: "AI platform for enterprise automation"
      outputs:
        - technical_assessment

    - id: business_evaluation
      agent: business_analyst
      action: "perform_business_review"
      inputs:
        product_name: "Enterprise AI Platform"
        product_description: "AI platform for enterprise automation"
      outputs:
        - business_assessment

    - id: ux_evaluation
      agent: ux_designer
      action: "perform_ux_review"
      inputs:
        product_name: "Enterprise AI Platform"
        product_description: "AI platform for enterprise automation"
      outputs:
        - ux_assessment

  then:
    agent: senior_reviewer
    action: "synthesize_evaluations_and_recommend"
    inputs:
      technical_review: "{{ technical_assessment }}"
      business_review: "{{ business_assessment }}"
      ux_review: "{{ ux_assessment }}"
    outputs:
      - final_recommendation
```

## Advanced Features

### Context Variables

Use `{{ variable_name }}` syntax to reference outputs from previous steps or branches in your inputs:

```yaml
inputs:
  previous_result: "{{ output_key_from_previous_step }}"
```

### Agent Dependencies

In sequential workflows, you can specify dependencies between steps using the `dependsOn` field:

```yaml
steps:
  - id: step1
    agent: researcher
    action: "perform_research"
    outputs:
      - research_data
  - id: step2
    agent: writer
    action: "write_summary"
    dependsOn:
      - step1
    inputs:
      data: "{{ research_data }}"
```

## Troubleshooting

### Common Issues

1. **API Key Errors**: Ensure your GROQ_API_KEY is correctly set in environment variables
2. **YAML Syntax Errors**: Verify proper indentation and structure in your YAML files
3. **Agent ID Mismatches**: Ensure all agent references in steps/branches match defined agent IDs
4. **Missing Required Fields**: Verify all required fields (id, role, goal) are present for agents

### Validation Messages

If there are issues with your workflow file, Auraflow will display validation errors:

```
Validation errors found in workflow file:
- Each agent must have a valid id
- Agent 'researcher' must have a valid goal
- Step with agent 'non_existent_agent' must reference a valid agent id
```

### Debugging Tips

1. Start with example files and modify them gradually
2. Verify all agent IDs are unique and referenced correctly
3. Check that workflow type is either 'sequential' or 'parallel'
4. Ensure proper YAML formatting with consistent indentation

## Environment Variables

### Required Variables

- `GROQ_API_KEY`: Your GROQ API key for LLM integration

### Optional Variables

- `NODE_ENV`: Set to 'development' or 'production' (default: 'development')

## Best Practices

### Agent Design

1. **Clear Roles**: Define specific, focused roles for each agent
2. **Well-Defined Goals**: Ensure each agent has a clear objective
3. **Appropriate Tools**: Assign tools that align with the agent's role
4. **Unique IDs**: Use descriptive, unique IDs for agents

### Workflow Design

1. **Logical Flow**: Design workflows with clear, logical progression
2. **Context Management**: Plan how information flows between agents
3. **Error Handling**: Design workflows that can handle potential failures
4. **Modular Structure**: Keep workflows modular and reusable

### YAML Structure

1. **Consistent Indentation**: Use 2 spaces for indentation
2. **Descriptive IDs**: Use clear, descriptive IDs for steps and branches
3. **Meaningful Actions**: Use descriptive action names
4. **Proper Comments**: Add comments to explain complex workflows

## Contributing

If you'd like to contribute to Auraflow:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

See the LICENSE file for licensing information.