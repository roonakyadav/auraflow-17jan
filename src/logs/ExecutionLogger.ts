import * as fs from 'fs/promises';
import * as path from 'path';
import { Agent } from '../models/Agent';
import { Workflow } from '../models/Workflow';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  component: string; // 'EXECUTOR', 'AGENT', 'WORKFLOW', etc.
  message: string;
  metadata?: Record<string, any>;
}

export interface ExecutionLogConfig {
  logPath: string;
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  level?: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  enabled?: boolean;
}

export class ExecutionLogger {
  private logs: LogEntry[] = [];
  private config: ExecutionLogConfig;
  private currentLogFile: string | null = null;

  constructor(config: ExecutionLogConfig) {
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
  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.logPath, { recursive: true });
    } catch (error: any) {
      console.error(`Failed to create log directory: ${error.message}`);
    }
  }

  /**
   * Check if logging is enabled for the given level
   */
  private isLevelEnabled(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'): boolean {
    if (!this.config.enabled) return false;
    
    const levels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
    return levels[level] >= levels[this.config.level || 'INFO'];
  }

  /**
   * Get the current log file path
   */
  private getCurrentLogFilePath(): string {
    if (!this.currentLogFile) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.currentLogFile = path.join(this.config.logPath, `execution-${timestamp}.log`);
    }
    return this.currentLogFile;
  }

  /**
   * Rotate log file if it exceeds max size
   */
  private async rotateLogFileIfNeeded(): Promise<void> {
    if (!this.currentLogFile) return;

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
    } catch (error) {
      // File might not exist yet, that's OK
    }
  }

  /**
   * Clean up old log files
   */
  private async cleanupOldLogs(): Promise<void> {
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
    } catch (error: any) {
      console.error(`Failed to cleanup old logs: ${error.message}`);
    }
  }

  /**
   * Add a log entry
   */
  async log(
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
    component: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.isLevelEnabled(level)) return;

    const logEntry: LogEntry = {
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
  private async writeToFile(entry: LogEntry): Promise<void> {
    if (!this.config.enabled) return;

    try {
      await this.rotateLogFileIfNeeded();
      const logFile = this.getCurrentLogFilePath();
      
      const logLine = this.formatLogEntry(entry);
      await fs.appendFile(logFile, logLine + '\n');
    } catch (error: any) {
      console.error(`Failed to write log to file: ${error.message}`);
    }
  }

  /**
   * Format log entry for file output
   */
  private formatLogEntry(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    return `[${timestamp}] [${entry.level}] [${entry.component}] ${entry.message}${
      entry.metadata ? ` | Metadata: ${JSON.stringify(entry.metadata)}` : ''
    }`;
  }

  /**
   * Log an info message
   */
  async info(component: string, message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log('INFO', component, message, metadata);
  }

  /**
   * Log a warning message
   */
  async warn(component: string, message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log('WARN', component, message, metadata);
  }

  /**
   * Log an error message
   */
  async error(component: string, message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log('ERROR', component, message, metadata);
  }

  /**
   * Log a debug message
   */
  async debug(component: string, message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log('DEBUG', component, message, metadata);
  }

  /**
   * Log workflow execution start
   */
  async logWorkflowStart(workflow: Workflow, agents: Agent[]): Promise<void> {
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
  async logWorkflowEnd(workflowId: string, success: boolean, durationMs: number): Promise<void> {
    await this.info('EXECUTOR', `Workflow ${workflowId} execution ${success ? 'completed' : 'failed'}`, {
      workflowId,
      success,
      durationMs
    });
  }

  /**
   * Log agent execution start
   */
  async logAgentStart(agent: Agent, stepId?: string): Promise<void> {
    await this.info('EXECUTOR', `Starting agent: ${agent.id}`, {
      agentId: agent.id,
      agentRole: agent.role,
      stepId: stepId || 'unknown'
    });
  }

  /**
   * Log agent execution end
   */
  async logAgentEnd(agentId: string, stepId: string, success: boolean, durationMs: number, outputLength?: number): Promise<void> {
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
  async logStepExecution(stepId: string, agentId: string, workflowId: string): Promise<void> {
    await this.info('EXECUTOR', `Executing step: ${stepId}`, {
      stepId,
      agentId,
      workflowId
    });
  }

  /**
   * Get recent log entries
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Search logs by component or message
   */
  searchLogs(searchTerm: string, count: number = 50): LogEntry[] {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const matches = this.logs.filter(entry => 
      entry.component.toLowerCase().includes(lowerSearchTerm) ||
      entry.message.toLowerCase().includes(lowerSearchTerm) ||
      JSON.stringify(entry.metadata).toLowerCase().includes(lowerSearchTerm)
    );
    return matches.slice(-count);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', count: number = 50): LogEntry[] {
    const matches = this.logs.filter(entry => entry.level === level);
    return matches.slice(-count);
  }

  /**
   * Get logs by component
   */
  getLogsByComponent(component: string, count: number = 50): LogEntry[] {
    const matches = this.logs.filter(entry => entry.component === component);
    return matches.slice(-count);
  }

  /**
   * Clear in-memory logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Export logs to a different format
   */
  export(format: 'json' | 'text' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    } else {
      return this.logs.map(entry => this.formatLogEntry(entry)).join('\n');
    }
  }
}