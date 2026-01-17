# Demo Script for Judges

## Demo 1: Sequential Collaboration
**Command**: `npm run cli -- run examples/demo-sequential.yaml`

### What to Show:
1. **Configuration Defines Behavior**: Changing the YAML changes system behavior
2. **Explicit Context Contracts**: Each step declares required inputs and produced outputs
3. **Sequential Flow**: Agents execute in order, passing context between them

### Expected Behavior:
- Researcher analyzes market trends
- Writer creates report using research findings  
- Editor refines the final report

### Key Innovation:
The entire workflow behavior is declared in YAML - no imperative code needed.

---

## Demo 2: Parallel Agents + Conditional Branch
**Command**: `npm run cli -- run examples/demo-parallel.yaml`

### What to Show:
1. **Parallel Execution**: Multiple agents work simultaneously
2. **Context Aggregation**: Final agent consolidates parallel results
3. **Declarative Orchestration**: Clear separation of concerns

### Expected Behavior:
- Tech, Business, and Risk analysts work in parallel
- Executive Summary agent consolidates all analyses

**Bonus Demo**: `npm run cli -- run examples/demo-conditional-branching.yaml`

### What to Show:
1. **Conditional Logic**: Next step determined by agent output
2. **Dynamic Flow Control**: Workflow adapts based on results

---

## Innovation Highlight

**Collaboration-as-Configuration**: Unlike traditional agent frameworks that require code, AuraFlow lets you define complex multi-agent behaviors purely through YAML configuration.

**Core Value**: "GitHub Actions for AI agents — but simpler."

---

## Technical Implementation

- **Clean Separation**: Configuration vs execution logic
- **Deterministic Execution**: Predictable order and context flow  
- **Strong Validation**: Fails fast with clear error messages
- **Minimal Complexity**: Focused on core orchestration, not bells and whistles