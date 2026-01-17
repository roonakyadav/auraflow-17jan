#!/usr/bin/env node
"use strict";
/**
 * Main entry point for the Auraflow orchestration engine
 * This file serves as the primary export for the library
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Executor = exports.Workflow = exports.Context = exports.Agent = void 0;
var Agent_1 = require("./models/Agent");
Object.defineProperty(exports, "Agent", { enumerable: true, get: function () { return Agent_1.Agent; } });
var Context_1 = require("./models/Context");
Object.defineProperty(exports, "Context", { enumerable: true, get: function () { return Context_1.Context; } });
var Workflow_1 = require("./models/Workflow");
Object.defineProperty(exports, "Workflow", { enumerable: true, get: function () { return Workflow_1.Workflow; } });
var Executor_1 = require("./models/Executor");
Object.defineProperty(exports, "Executor", { enumerable: true, get: function () { return Executor_1.Executor; } });
console.log('Auraflow engine loaded. Use via CLI: auraflow run <yaml-file>');
//# sourceMappingURL=index.js.map