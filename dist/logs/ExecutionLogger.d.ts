import { Agent } from '../models/Agent';
import { Workflow } from '../models/Workflow';
export interface LogEntry {
    id: string;
    timestamp: number;
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    component: string;
    message: string;
    metadata?: Record<string, any>;
}
export interface ExecutionLogConfig {
    logPath: string;
    maxFileSize?: number;
    maxFiles?: number;
    level?: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    enabled?: boolean;
}
export declare class ExecutionLogger {
    private logs;
    private config;
    private currentLogFile;
    constructor(config: ExecutionLogConfig);
    /**
     * Ensure the log directory exists
     */
    private ensureLogDirectory;
    /**
     * Check if logging is enabled for the given level
     */
    private isLevelEnabled;
    /**
     * Get the current log file path
     */
    private getCurrentLogFilePath;
    /**
     * Rotate log file if it exceeds max size
     */
    private rotateLogFileIfNeeded;
    /**
     * Clean up old log files
     */
    private cleanupOldLogs;
    /**
     * Add a log entry
     */
    log(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', component: string, message: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * Write log entry to file
     */
    private writeToFile;
    /**
     * Format log entry for file output
     */
    private formatLogEntry;
    /**
     * Log an info message
     */
    info(component: string, message: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * Log a warning message
     */
    warn(component: string, message: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * Log an error message
     */
    error(component: string, message: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * Log a debug message
     */
    debug(component: string, message: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * Log workflow execution start
     */
    logWorkflowStart(workflow: Workflow, agents: Agent[]): Promise<void>;
    /**
     * Log workflow execution end
     */
    logWorkflowEnd(workflowId: string, success: boolean, durationMs: number): Promise<void>;
    /**
     * Log agent execution start
     */
    logAgentStart(agent: Agent, stepId?: string): Promise<void>;
    /**
     * Log agent execution end
     */
    logAgentEnd(agentId: string, stepId: string, success: boolean, durationMs: number, outputLength?: number): Promise<void>;
    /**
     * Log step execution
     */
    logStepExecution(stepId: string, agentId: string, workflowId: string): Promise<void>;
    /**
     * Get recent log entries
     */
    getRecentLogs(count?: number): LogEntry[];
    /**
     * Search logs by component or message
     */
    searchLogs(searchTerm: string, count?: number): LogEntry[];
    /**
     * Get logs by level
     */
    getLogsByLevel(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', count?: number): LogEntry[];
    /**
     * Get logs by component
     */
    getLogsByComponent(component: string, count?: number): LogEntry[];
    /**
     * Clear in-memory logs
     */
    clear(): void;
    /**
     * Export logs to a different format
     */
    export(format?: 'json' | 'text'): string;
}
