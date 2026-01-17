# How To Use AuraFlow

## Basic Commands

### Run a workflow
```bash
npx auraflow run examples/basic-sequential-example.yaml
```

### Dry run (validate without executing)
```bash
npx auraflow run examples/basic-sequential-example.yaml --dry-run
```

### Get help
```bash
npx auraflow --help
```

## Web Search Commands

### Run with web search enabled (no prompt)
```bash
npx auraflow run examples/web-search-demo.yaml --enable-web-search
```

### Run with interactive web search prompt
```bash
npx auraflow run examples/web-search-demo.yaml
```
(Respond with 'y' when prompted to enable web search)

## API Key Management

### Configure API keys
```bash
npx auraflow configure
```

### Switch between API key profiles
```bash
npx auraflow switch
```

### Switch to specific profile
```bash
npx auraflow switch my-profile-name
```

## Testing Commands

### Test a specific agent
```bash
npx auraflow test-agent researcher examples/sample-workflow.yaml
```

## Available Examples

### Sequential workflows
```bash
npx auraflow run examples/basic-sequential-example.yaml
npx auraflow run examples/advanced-sequential-collaboration.yaml
npx auraflow run examples/data-analytics-sequential-complete.yaml
npx auraflow run examples/ml-data-processing-sequential.yaml
```

### Parallel workflows
```bash
npx auraflow run examples/parallel-analysis-workflow.yaml
npx auraflow run examples/social-media-analysis-sequential.yaml
```

### Conditional workflows
```bash
npx auraflow run examples/conditional-decision-workflow.yaml
```

### Web search workflows
```bash
npx auraflow run examples/web-search-demo.yaml --enable-web-search
npx auraflow run examples/quick-web-search-demo.yaml --enable-web-search
```

### Sub-agents workflows
```bash
npx auraflow run examples/sub-agents-demo.yaml
npx auraflow run examples/simple-sub-agents-demo.yaml
npx auraflow run examples/nested-sub-agents-demo.yaml
```

## Workflow Types

### Sequential
Agents execute one after another, passing context between steps.

### Parallel
Multiple agents execute simultaneously, results are aggregated.

### Conditional
Execution branches based on agent output conditions.

## Agent Tools

### Available tools
- `web_search` - Internet search capability
- More tools can be added to agent definitions

### Using tools in YAML
```yaml
agents:
  - id: researcher
    role: "Research Assistant"
    goal: "Gather information"
    tools: ["web_search"]
```

## Context Passing

The system automatically passes context between agents:
- Previous agent outputs become available to subsequent agents
- Required inputs are validated before execution
- All messages are stored in shared context

## Web Search Evidence

When web search is enabled, look for these indicators:
- 🔧 WEB SEARCH FORCED ENABLED (test mode)
- Agent calling `web_search()` function
- Current information with specific sources and dates
- [WEB SEARCH RESULT] markers in search snippets

## Error Handling

### Stop on error (default)
Workflows stop when an agent fails.

### Continue on error
Add to YAML:
```yaml
workflow:
  stopOnError: false
```

## Output Information

### Context passing logs
Show what information is shared between agents in highlighted boxes.

### Execution visualization
ASCII diagrams show workflow structure and execution flow.

### Final results
Complete conversation history and agent outputs.