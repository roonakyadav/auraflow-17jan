# Memory Systems in AuraFlow

## Overview
AuraFlow implements two distinct memory systems that serve different purposes:

1. **Persistent Memory**: Long-term storage for agent learning and continuity across workflow executions
2. **Execution Logs**: Per-run records for debugging, monitoring, and auditing

These systems are completely separated to maintain clean architecture and prevent cross-contamination.

## Implementation Details

### Comparison: Persistent Memory vs Execution Logs

| Aspect | Persistent Memory | Execution Logs | Vector Memory |
|--------|-------------------|----------------|---------------|
| **Purpose** | Long-term agent learning & continuity | Debugging, monitoring, and auditing | Semantic similarity search |
| **Storage Location** | `./persistent_memory/memory.json` | `./execution_logs/` (timestamped files) | In-memory with file cache |
| **Lifespan** | Cross-workflow (long-term) | Per-workflow run (short-term) | Per-workflow (temporary) |
| **Content** | Agent outputs and context | Execution events, timing, errors | Embedded agent outputs |
| **Agent Access** | Yes (influences agent prompts) | No (separate system) | Yes (supplements persistent memory) |
| **Format** | JSON with metadata | Structured log files with timestamps | Vector embeddings + metadata |
| **Retention** | Configurable (default: 1000 entries) | Automatic rotation (default: 5 files, 10MB each) | Session-based |
| **Access Method** | API methods in Agent class | File system access | Semantic search API |
| **Influences Agent Behavior** | Yes | No | Yes (when enabled) |

### Core Components

#### PersistentMemory Class
- **Location**: `src/memory/PersistentMemory.ts`
- **Purpose**: Manages storage and retrieval of agent interactions
- **Features**:
  - Automatic saving and loading of memory entries
  - Structured storage with metadata
  - Search and filtering capabilities
  - Size management with configurable limits

#### MemoryEntry Interface
- **Structure**: 
  - `id`: Unique identifier for each entry
  - `timestamp`: When the entry was created
  - `agentId`: Which agent created the entry
  - `content`: The actual content from the agent
  - `metadata`: Additional contextual information

#### Storage System
- **Location**: `./persistent_memory/memory.json` (by default)
- **Format**: JSON array of memory entries
- **Automatic**: Created and managed automatically
- **Persistent**: Survives between workflow executions

### Integration Points

#### Executor Class
- **Modified**: `src/models/Executor.ts`
- **Changes**:
  - Added persistent memory initialization
  - Integrated memory saving in all execution paths (sequential, parallel, conditional)
  - Added metadata tracking for workflow context
  - Maintains backward compatibility

#### Context Class
- **Modified**: `src/models/Context.ts`
- **Changes**:
  - Added `clear()` method to support memory management

### Features Implemented

#### 1. Automatic Memory Storage
- Every agent output is automatically saved to persistent storage
- Metadata includes workflow ID, step name, and timestamp
- Supports all workflow types (sequential, parallel, conditional)

#### 2. Memory Persistence
- Data survives between different workflow runs
- Stored in JSON format for easy inspection and backup
- Configurable storage path

#### 3. Memory Loading
- Automatically loads existing memory when executor starts
- Maintains continuity across sessions
- Integrates with Context system for immediate availability

#### 4. Memory Management
- Configurable maximum entries limit
- Automatic cleanup of old entries
- Manual clear functionality

#### 5. Search and Retrieval
- Ability to search through stored memories
- Filter by agent ID
- Retrieve recent entries

### Usage Examples

#### Memory Entry Structure
Each entry in the persistent memory includes:
```json
{
  "id": "mem_1768662965804_ua74i9mju",
  "timestamp": 1768662965804,
  "agentId": "researcher",
  "content": "Agent output content...",
  "metadata": {
    "workflowId": "demo-workflow",
    "step": "research_step", 
    "timestamp": "2026-01-17T15:16:05.804Z"
  }
}
```

#### Configuration Options
- `storagePath`: Directory where memory files are stored
- `maxEntries`: Maximum number of entries to retain
- `autoSave`: Whether to save automatically after each entry

### Benefits

#### 1. Long-term Learning
- Agents can access information from previous workflows
- Enables continuity across multiple execution sessions
- Supports complex multi-session tasks

#### 2. Enhanced Intelligence
- Agents can learn from past mistakes and successes
- Better context awareness across workflows
- Improved decision making based on historical data

#### 3. Audit Trail
- Complete record of all agent interactions
- Traceable decision making process
- Debugging and analysis capabilities

#### 4. Scalability
- Efficient storage and retrieval mechanisms
- Configurable retention policies
- Minimal performance overhead

### Technical Architecture

#### Layered Design
1. **Agent Layer**: Interacts with the system through normal workflow execution
2. **Executor Layer**: Automatically captures and stores agent outputs
3. **Memory Layer**: Manages storage, retrieval, and persistence
4. **Storage Layer**: Physical file-based storage system

#### Data Flow
1. Agent produces output during workflow execution
2. Executor captures output and metadata
3. PersistentMemory saves to storage
4. On next execution, memory is loaded and available
5. Agents can leverage historical context

### Security and Privacy
- Local file storage prevents external exposure
- No sensitive data transmission
- Configurable storage location
- Clean separation from other systems

## Testing
The persistent memory system has been tested with:
- Sequential workflows
- Parallel workflows  
- Conditional workflows
- Multiple concurrent executions
- Memory loading and retrieval scenarios

## Files Created/Modified
- `src/memory/PersistentMemory.ts` - Core memory implementation
- `src/memory/index.ts` - Export module
- `src/models/Executor.ts` - Integration with workflow execution
- `src/models/Context.ts` - Minor update for clear method
- `persistent_memory/memory.json` - Default storage file

## Execution Logs System

### Purpose and Implementation
The Execution Logs system provides comprehensive tracking of workflow execution without interfering with agent operations:

- **Location**: `src/logs/ExecutionLogger.ts`
- **Purpose**: Track workflow and agent execution events for debugging and auditing
- **Output**: Timestamped log files in `./execution_logs/` directory
- **Format**: Structured entries with timestamps, log levels, and metadata
- **Rotation**: Automatic file rotation based on size limits (10MB default)
- **Retention**: Keeps up to 5 log files by default

### Key Features
- Workflow start/end events with duration tracking
- Agent execution start/end events with timing and success status
- Error logging with detailed metadata
- Console output mirroring to files
- Safe for concurrent execution scenarios

## Workflow Lifecycle and Memory Systems

During a typical workflow execution, both systems operate independently:

1. **Initialization Phase**:
   - ExecutionLogger starts tracking the workflow
   - PersistentMemory loads existing entries from storage
   - VectorMemory initializes (disabled by default)

2. **Execution Phase**:
   - Each agent execution is logged in execution logs
   - Agent outputs are stored in persistent memory
   - Context is shared between agents in the same workflow

3. **Completion Phase**:
   - Execution logs record workflow completion
   - Persistent memory is saved to storage
   - Execution logs are rotated if needed

## Security and Isolation

Both memory systems maintain strict isolation:
- Execution logs never influence agent prompts or decisions
- Persistent memory only contains agent-generated content
- Vector memory supplements (but doesn't replace) persistent memory
- No cross-contamination between systems

The persistent memory system successfully addresses the requirement for "Persistent memory or long-term learning" in the minimal feature set, providing a robust foundation for agent learning and continuity across workflow executions.