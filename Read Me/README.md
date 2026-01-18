# AuraFlow - Declarative Multi-Agent Orchestration Engine

**GitHub Actions for AI agents — but simpler.**

AuraFlow makes multi-agent orchestration declarative like infrastructure-as-code. Define agent collaboration in YAML, get automatic execution.

## Problem
Multi-agent orchestration is complex and imperative. Teams struggle to coordinate AI agents for collaborative tasks.

## Solution
Configuration defines collaboration. Execution is automatic.

```yaml
id: market-analysis
agents:
  - id: researcher
    role: "Market Research Analyst"
    goal: "Analyze market trends"
  - id: writer
    role: "Report Writer" 
    goal: "Create analysis report"

workflow:
  type: sequential
  steps:
    - id: research
      agent: researcher
      action: "analyze_trends"
      outputs:
        produced: ["findings"]
    - id: write_report
      agent: writer
      action: "create_report"
      inputs:
        required: ["findings"]
      outputs:
        produced: ["report"]
```

## Quick Start

```bash
npm install
npm run cli -- run examples/demo-sequential.yaml
```

## Features

- **Sequential Execution**: Agents run in defined order
- **Parallel Execution**: Multiple agents work simultaneously  
- **Conditional Branching**: Next step determined by agent output
- **Explicit Contracts**: Agents declare required inputs and produced outputs
- **Strong Validation**: Fails fast with human-readable errors

---

*Built for hackathons. Production-ready patterns. Declarative by design.*