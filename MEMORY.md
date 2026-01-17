# AuraFlow Memory Sharing Report

## Memory Management Architecture

The AuraFlow project implements a **shared context-based memory system** that enables agents to collaborate and share information during workflow execution. It does **NOT** use external memory solutions like MemZero, SuperMemory, or Vector DBs. Instead, it relies on an in-memory Context object that's passed between agents during execution.

## Core Memory Components

### 1. Context Class (`src/models/Context.ts`)
The central memory management component that provides two main data structures:

- **`messages: Message[]`** - An ordered array of messages that agents can read and contribute to
- **`outputs: Map<string, any>`** - A key-value store for sharing specific outputs between agents

### 2. Message Interface
Each message contains:
- `id`: Unique identifier for the message
- `agentId`: ID of the agent that created the message
- `content`: The actual message content
- `timestamp`: When the message was created

## Memory Sharing Mechanisms

### 1. Sequential Workflows
- Each agent's output is added to the shared context as a message
- Subsequent agents receive the full history of previous interactions
- Agents can access both the message history and specific outputs by key

### 2. Parallel Workflows
- All parallel branches share the same context instance
- Each branch can read messages from other branches as they execute
- The "then" step receives all accumulated messages and outputs from all branches

### 3. Conditional Workflows
- The initial decision step adds its output to the context
- Conditional branches can access the context to inform their decisions
- The selected branch continues with the accumulated context

## How Memory is Used

### Input/Output Contract System
- Steps can specify required inputs using the `inputs.required` array
- Steps can specify produced outputs using the `outputs.produced` array
- The Executor validates that required inputs are available in the context before executing a step

### Agent Prompt Construction
- Each agent receives the full context history when building its prompt
- The prompt includes all previous messages with timestamps and agent IDs
- Agents can see the complete conversation history and build upon it

## Key Memory Features

1. **Temporal Ordering**: Messages are stored in chronological order with timestamps
2. **Agent Attribution**: Each message is tagged with the originating agent ID
3. **State Persistence**: Outputs are stored by key for easy retrieval by downstream agents
4. **Context Validation**: The system validates that required inputs exist before executing steps
5. **Thread-Safe Access**: Context provides methods to safely read/write shared state

## Memory Lifecycle

1. **Initialization**: A new Context instance is created for each workflow execution
2. **Accumulation**: Messages and outputs accumulate as agents execute
3. **Sharing**: All agents in a workflow share the same Context instance
4. **Finalization**: Context contains complete execution history at workflow completion

## Memory Limitations

- **In-Memory Only**: No persistent storage - memory is lost when workflow completes
- **Single Workflow Scope**: Context is isolated to individual workflow execution
- **No External Storage**: No integration with vector databases or external memory systems
- **Size Limitations**: Large workflows with extensive histories consume significant RAM

## Summary

AuraFlow uses a simple but effective in-memory context sharing system that enables collaborative multi-agent workflows. Rather than relying on external memory solutions, it maintains a shared Context object that travels with the workflow execution, allowing agents to build upon each other's work through a combination of message history and keyed outputs. This approach keeps the system lightweight while enabling sophisticated agent collaboration patterns.