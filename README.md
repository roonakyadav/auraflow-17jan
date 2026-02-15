# AuraFlow

Declarative multi-agent orchestration using YAML workflows.

AuraFlow lets you define agents, execution flow, and input/output contracts in a YAML file, then execute the workflow from the CLI.

## What It Supports

- Sequential workflows
- Parallel workflows with optional `then` step
- Conditional workflows (`steps` + `condition.cases` + optional `condition.default`)
- Agent sub-agent delegation via `DELEGATE_TO:<sub_agent_id>:<task>`
- Built-in tools:
- `web_search` (DuckDuckGo Instant Answer API)
- `file_system` (scoped filesystem operations)
- Persistent memory across runs (`persistent_memory/memory.json`)
- Execution logs (`execution_logs/`)
- Network logs (`network_logs/`)
- Dry-run validation and ASCII workflow visualization

## Tech Stack

- Node.js + TypeScript
- CLI: `yargs`
- YAML parsing: `js-yaml`
- LLM provider in current code: Groq (`groq-sdk`)

## Project Layout

- `src/cli.ts`: CLI commands and YAML validation
- `src/models/`: `Agent`, `Workflow`, `Executor`, `Context`
- `src/tools/`: tool registry + web/file tools
- `src/memory/`: persistent and vector memory
- `src/logs/`: execution/network loggers
- `src/mcp/`: filesystem MCP server
- `examples/`: workflow examples
- `config/api-keys.json`: saved model/API-key profiles

## Prerequisites

- Node.js 18+ (Node 20 recommended)
- npm
- A valid Groq API key

## Installation

```bash
npm install
npm run build
```

## Configuration

You can configure model + key interactively:

```bash
npm run cli -- configure
```

Or manually set environment variables in `.env`:

```env
GROQ_API_KEY=your_key_here
CURRENT_AI_MODEL=llama-3.1-8b-instant
```

Current CLI commands also store profile data in `config/api-keys.json`.

## CLI Commands

Run a workflow:

```bash
npm run cli -- run examples/01-financial-market-analysis.yaml
```

Validate only (no agent execution):

```bash
npm run cli -- run examples/01-financial-market-analysis.yaml --dry-run
```

Force-enable web search without prompt:

```bash
npm run cli -- run examples/01-financial-market-analysis.yaml --enable-web-search
```

Test one agent from a workflow:

```bash
npm run cli -- test-agent market_researcher examples/01-financial-market-analysis.yaml
```

Configure model/API key:

```bash
npm run cli -- configure
```

Switch active key profile:

```bash
npm run cli -- switch
```

Build and run compiled CLI:

```bash
npm run build
node dist/cli.js run examples/01-financial-market-analysis.yaml --dry-run
```

## Workflow YAML Schema

Top-level shape:

```yaml
id: workflow-id
agents:
  - id: agent_id
    role: "Agent role"
    goal: "Agent goal"
    tools: ["web_search", "file_system"] # optional
    subAgents: [] # optional

workflow:
  type: sequential | parallel | conditional
  stopOnError: true # optional, defaults to true
```

Sequential:

```yaml
workflow:
  type: sequential
  steps:
    - id: step_1
      agent: agent_id
      action: "action_name"
      inputs:
        required: []
        optional: []
      outputs:
        produced: ["output_key"]
```

Parallel:

```yaml
workflow:
  type: parallel
  branches:
    - id: branch_1
      agent: agent_id
      action: "action_name"
      inputs:
        required: []
      outputs:
        produced: ["branch_output"]
  then:
    agent: final_agent
    action: "aggregate"
    inputs:
      required: ["branch_output"]
    outputs:
      produced: ["final_output"]
```

Conditional:

```yaml
workflow:
  type: conditional
  steps:
    - id: decision_step
      agent: agent_id
      action: "produce_condition_text"
      outputs:
        produced: ["decision_output"]
  condition:
    stepId: decision_step
    cases:
      - condition: "success"
        step:
          id: success_step
          agent: agent_id
          action: "handle_success"
    default:
      id: default_step
      agent: agent_id
      action: "handle_default"
```

Notes:

- IDs must be unique (agents, steps, branches, conditions).
- Referenced agents must exist in `agents`.
- `inputs.required` and `outputs.produced` must be arrays when provided.
- Overlapping keys between `inputs.required` and `inputs.optional` are invalid.

## Built-in Tools

`web_search`:

- Uses DuckDuckGo Instant Answer API
- Enabled per agent via `tools: ["web_search"]`
- CLI prompts before search unless `--enable-web-search` is passed

`file_system`:

- Operations: `list`, `read`, `write`, `create_dir`, `delete`, `info`
- Backed by `FileSystemServer` with path boundary checks

## Memory and Logs

- Persistent memory path: `persistent_memory/memory.json`
- Execution logs path: `execution_logs/*.log`
- Network logs path: `network_logs/*.log`

These directories are created/used automatically during execution.

## Example Status (Dry-Run Checked)

The following examples passed validation:

- `examples/01-financial-market-analysis.yaml`
- `examples/02-product-launch-strategy.yaml`
- `examples/04-software-architecture-review.yaml`
- `examples/05-document-processing-pipeline.yaml`
- `examples/06-industry-research-report.yaml`
- `examples/07-customer-feedback-analysis.yaml`
- `examples/08-healthcare-research-collaboration.yaml`
- `examples/09-api-performance-monitoring.yaml`
- `examples/10-mcp-file-system-example.yaml`
- `examples/11-persistent-memory-example.yaml`
- `examples/12-execution-logs-example.yaml`
- `examples/13-internet-logs-example.yaml`

Known issues in current examples:

- `examples/03-risk-assessment-workflow.yaml`: conditional format does not match current validator (missing `steps` + `condition` block format expected by CLI).
- `examples/14-comprehensive-feature-demo.yaml`: YAML parse error due to duplicate mapping keys (`then` and `steps` repeated).

## Troubleshooting

YAML parse errors:

- Check indentation and duplicate keys.
- Validate with `--dry-run` first.

Validation errors:

- Confirm workflow type is one of `sequential`, `parallel`, `conditional`.
- Confirm every referenced agent exists.
- Confirm required inputs are produced by previous steps.

API errors:

- Ensure `GROQ_API_KEY` is set and valid.
- Ensure selected model is available for your key.

## Security Notes

- Do not commit real API keys in `.env` or `config/api-keys.json`.
- Keep secrets in environment variables or a secure secret manager.
