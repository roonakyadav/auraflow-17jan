"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionLogger = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class ExecutionLogger {
    logs = [];
    config;
    currentLogFile = null;
    constructor(config) {
        this.config = {
            maxFileSize: 10 * 1024 * 1024, // 10MB default
            maxFiles: 5,
            level: 'INFO',
            enabled: true,
            ...config
        };
        this.ensureLogDirectory();
    }
    /**
     * Ensure the log directory exists
     */
    async ensureLogDirectory() {
        try {
            await fs.mkdir(this.config.logPath, { recursive: true });
        }
        catch (error) {
            console.error(`Failed to create log directory: ${error.message}`);
        }
    }
    /**
     * Check if logging is enabled for the given level
     */
    isLevelEnabled(level) {
        if (!this.config.enabled)
            return false;
        const levels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
        return levels[level] >= levels[this.config.level || 'INFO'];
    }
    /**
     * Get the current log file path
     */
    getCurrentLogFilePath() {
        if (!this.currentLogFile) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            this.currentLogFile = path.join(this.config.logPath, `execution-${timestamp}.log`);
        }
        return this.currentLogFile;
    }
    /**
     * Rotate log file if it exceeds max size
     */
    async rotateLogFileIfNeeded() {
        if (!this.currentLogFile)
            return;
        try {
            const stats = await fs.stat(this.currentLogFile);
            if (stats.size > (this.config.maxFileSize || 10 * 1024 * 1024)) {
                // Move current log to archived name
                const archivePath = this.currentLogFile.replace('.log', `-archive-${Date.now()}.log`);
                await fs.rename(this.currentLogFile, archivePath);
                // Create new log file
                this.currentLogFile = null;
                // Clean up old log files if needed
                await this.cleanupOldLogs();
            }
        }
        catch (error) {
            // File might not exist yet, that's OK
        }
    }
    /**
     * Clean up old log files
     */
    async cleanupOldLogs() {
        try {
            const files = await fs.readdir(this.config.logPath);
            const logFiles = files
                .filter(file => file.startsWith('execution-') && file.endsWith('.log'))
                .sort();
            if (logFiles.length > (this.config.maxFiles || 5)) {
                const filesToDelete = logFiles.slice(0, logFiles.length - (this.config.maxFiles || 5));
                for (const file of filesToDelete) {
                    await fs.unlink(path.join(this.config.logPath, file));
                }
            }
        }
        catch (error) {
            console.error(`Failed to cleanup old logs: ${error.message}`);
        }
    }
    /**
     * Add a log entry
     */
    async log(level, component, message, metadata) {
        if (!this.isLevelEnabled(level))
            return;
        const logEntry = {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            level,
            component,
            message,
            metadata
        };
        this.logs.push(logEntry);
        // Limit memory usage by keeping only recent logs
        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(-1000);
        }
        // Write to file
        await this.writeToFile(logEntry);
    }
    /**
     * Write log entry to file
     */
    async writeToFile(entry) {
        if (!this.config.enabled)
            return;
        try {
            await this.rotateLogFileIfNeeded();
            const logFile = this.getCurrentLogFilePath();
            const logLine = this.formatLogEntry(entry);
            await fs.appendFile(logFile, logLine + '\n');
        }
        catch (error) {
            console.error(`Failed to write log to file: ${error.message}`);
        }
    }
    /**
     * Format log entry for file output
     */
    formatLogEntry(entry) {
        const timestamp = new Date(entry.timestamp).toISOString();
        return `[${timestamp}] [${entry.level}] [${entry.component}] ${entry.message}${entry.metadata ? ` | Metadata: ${JSON.stringify(entry.metadata)}` : ''}`;
    }
    /**
     * Log an info message
     */
    async info(component, message, metadata) {
        await this.log('INFO', component, message, metadata);
    }
    /**
     * Log a warning message
     */
    async warn(component, message, metadata) {
        await this.log('WARN', component, message, metadata);
    }
    /**
     * Log an error message
     */
    async error(component, message, metadata) {
        await this.log('ERROR', component, message, metadata);
    }
    /**
     * Log a debug message
     */
    async debug(component, message, metadata) {
        await this.log('DEBUG', component, message, metadata);
    }
    /**
     * Log workflow execution start
     */
    async logWorkflowStart(workflow, agents) {
        await this.info('EXECUTOR', `Starting execution of workflow: ${workflow.id}`, {
            workflowId: workflow.id,
            workflowType: workflow.type,
            agentCount: agents.length,
            stepCount: workflow.steps?.length || 0,
            branchCount: workflow.branches?.length || 0
        });
    }
    /**
     * Log workflow execution end
     */
    async logWorkflowEnd(workflowId, success, durationMs) {
        await this.info('EXECUTOR', `Workflow ${workflowId} execution ${success ? 'completed' : 'failed'}`, {
            workflowId,
            success,
            durationMs
        });
    }
    /**
     * Log agent execution start
     */
    async logAgentStart(agent, stepId) {
        await this.info('EXECUTOR', `Starting agent: ${agent.id}`, {
            agentId: agent.id,
            agentRole: agent.role,
            stepId: stepId || 'unknown'
        });
    }
    /**
     * Log agent execution end
     */
    async logAgentEnd(agentId, stepId, success, durationMs, outputLength) {
        await this.info('EXECUTOR', `Agent ${agentId} execution ${success ? 'completed' : 'failed'}`, {
            agentId,
            stepId,
            success,
            durationMs,
            outputLength
        });
    }
    /**
     * Log step execution
     */
    async logStepExecution(stepId, agentId, workflowId) {
        await this.info('EXECUTOR', `Executing step: ${stepId}`, {
            stepId,
            agentId,
            workflowId
        });
    }
    /**
     * Get recent log entries
     */
    getRecentLogs(count = 50) {
        return this.logs.slice(-count);
    }
    /**
     * Search logs by component or message
     */
    searchLogs(searchTerm, count = 50) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const matches = this.logs.filter(entry => entry.component.toLowerCase().includes(lowerSearchTerm) ||
            entry.message.toLowerCase().includes(lowerSearchTerm) ||
            JSON.stringify(entry.metadata).toLowerCase().includes(lowerSearchTerm));
        return matches.slice(-count);
    }
    /**
     * Get logs by level
     */
    getLogsByLevel(level, count = 50) {
        const matches = this.logs.filter(entry => entry.level === level);
        return matches.slice(-count);
    }
    /**
     * Get logs by component
     */
    getLogsByComponent(component, count = 50) {
        const matches = this.logs.filter(entry => entry.component === component);
        return matches.slice(-count);
    }
    /**
     * Clear in-memory logs
     */
    clear() {
        this.logs = [];
    }
    /**
     * Export logs to a different format
     */
    export(format = 'json') {
        if (format === 'json') {
            return JSON.stringify(this.logs, null, 2);
        }
        else {
            return this.logs.map(entry => this.formatLogEntry(entry)).join('\n');
        }
    }
}
exports.ExecutionLogger = ExecutionLogger;
//# sourceMappingURL=ExecutionLogger.js.map