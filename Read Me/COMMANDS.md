# AuraFlow Commands Reference

This document lists all commands available for running and managing the AuraFlow project.

## Table of Contents
- [Development Commands](#development-commands)
- [Execution Commands](#execution-commands)
- [Configuration Commands](#configuration-commands)
- [Testing Commands](#testing-commands)
- [Build Commands](#build-commands)

## Development Commands

### Building the Project
```bash
npm run build
```
Compiles the TypeScript source code to JavaScript in the `dist` directory.

### Installing Dependencies
```bash
npm install
```
Installs all project dependencies from `package.json`.

## Execution Commands

### Running Workflows
```bash
node dist/cli.js run <workflow-file.yaml>
```
Executes a multi-agent workflow defined in a YAML file.

#### With Dry Run Mode
```bash
node dist/cli.js run <workflow-file.yaml> --dry-run
```
Validates and displays execution plan without executing agents.

#### With Web Search Enabled
```bash
node dist/cli.js run <workflow-file.yaml> --enable-web-search
```
Forces web search tool usage without prompting for confirmation.

### Testing Specific Agents
```bash
node dist/cli.js test-agent <agent-id> <workflow-file.yaml>
```
Tests a specific agent from a workflow YAML file.

## Configuration Commands

### Adding/Updating AI Model Configuration
```bash
node dist/cli.js configure
```
Interactive command to add or update AI model and API key configuration.

#### With Arguments
```bash
node dist/cli.js configure --model <model-name> --api-key <api-key> --name <config-name>
```
Configure with specific parameters without interactive prompts.

### Switching Between Saved Configurations
```bash
node dist/cli.js switch
```
Interactive command to list and select from saved API keys.

#### Switching to Specific Configuration
```bash
node dist/cli.js switch <key-name>
```
Switch to a specific API key configuration by name.

## Build Commands

### Compile TypeScript
```bash
npm run build
```
Compiles TypeScript source files to JavaScript in the `dist` directory using the configuration in `tsconfig.json`.

### Watch Mode (if configured)
```bash
npm run build:watch
```
Compile and watch for changes (if available in package.json scripts).

## Testing Commands

### Running Example Workflows
```bash
# Basic sequential workflow
node dist/cli.js run examples/01-basic-sequential-workflow.yaml

# Parallel execution workflow
node dist/cli.js run examples/02-parallel-execution-workflow.yaml

# Conditional workflow
node dist/cli.js run examples/03-conditional-workflow.yaml

# Sub-agent delegation workflow
node dist/cli.js run examples/04-sub-agent-delegation-workflow.yaml

# MCP file system workflow
node dist/cli.js run examples/05-mcp-file-system-workflow.yaml

# Web search tool workflow
node dist/cli.js run examples/06-web-search-tool-workflow.yaml

# Persistent memory workflow
node dist/cli.js run examples/07-persistent-memory-workflow.yaml

# Context sharing workflow
node dist/cli.js run examples/08-context-sharing-workflow.yaml

# Network logging test workflow
node dist/cli.js run examples/09-network-logging-test.yaml
```

### Dry Run All Examples
```bash
for file in examples/*; do echo "=== Testing $file ===" && node dist/cli.js run "$file" --dry-run; echo ""; done
```
Run dry-run validation on all example files.

### Get Help
```bash
node dist/cli.js --help
```
Display help information and available commands.

### View Specific Command Help
```bash
node dist/cli.js run --help
node dist/cli.js test-agent --help
node dist/cli.js configure --help
node dist/cli.js switch --help
```
Get help for specific commands.

## Environment Setup

### Setting up Environment Variables
Create a `.env` file in the project root with:
```env
GROQ_API_KEY=your_groq_api_key_here
CURRENT_AI_MODEL=llama-3.1-8b-instant
```

### Creating API Key Configuration File
The CLI can create and manage API key configurations in `config/api-keys.json`:
```json
{
  "default": "my-groq-config",
  "keys": {
    "my-groq-config": {
      "provider": "groq",
      "model": "llama-3.1-8b-instant",
      "apiKey": "your-api-key-here"
    }
  }
}
```

## Directory Structure Commands

### Create Required Directories
The following directories are automatically created during execution:
- `execution_logs/` - Execution logs with file rotation
- `network_logs/` - Network activity logs with session tracking
- `persistent_memory/` - Persistent memory storage
- `temp_test/` - Temporary test files

## Troubleshooting Commands

### Check Current Configuration
```bash
cat .env
cat config/api-keys.json
```
View current API key and model configuration.

### View Persistent Memory
```bash
cat persistent_memory/memory.json
```
Inspect the persistent memory storage containing agent outputs across workflow runs.

### View Recent Execution Logs
```bash
ls -la execution_logs/
tail -f execution_logs/execution-*.log
```
Monitor recent execution logs showing workflow and agent execution traces.

### View Network Activity Logs
```bash
ls -la network_logs/
tail -f network_logs/network-*.log
```
Monitor network activity logs showing API calls and connections.

### Reset Persistent Memory Safely
```bash
# Backup current memory
mv persistent_memory/memory.json persistent_memory/memory-backup-$(date +%s).json
# Create empty memory file
echo "[]" > persistent_memory/memory.json
```
Safely reset persistent memory by backing up existing content first.

### Clean Build Artifacts
```bash
rm -rf dist/
npm run build
```
Clean compiled files and rebuild the project.