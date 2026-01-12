#!/usr/bin/env node

/**
 * Main entry point for the Auraflow orchestration engine
 * This file serves as the primary export for the library
 */

export { Agent } from './models/Agent';
export { Context } from './models/Context';
export { Workflow } from './models/Workflow';
export { Executor } from './models/Executor';

console.log('Auraflow engine loaded. Use via CLI: auraflow run <yaml-file>');