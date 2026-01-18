import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';

export interface NetworkLogEntry {
  id: string;
  timestamp: number;
  sessionId: string;
  connectionType: 'HTTP' | 'HTTPS' | 'WebSocket' | 'TCP' | 'Custom';
  endpoint: string;
  method?: string; // For HTTP requests
  status?: number; // For HTTP responses
  durationMs?: number;
  dataSize?: number;
  userAgent?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export interface NetworkLogConfig {
  logPath: string;
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  level?: 'INFO' | 'DEBUG';
  enabled?: boolean;
}

export class NetworkLogger {
  private logs: NetworkLogEntry[] = [];
  private config: NetworkLogConfig;
  private currentLogFile: string | null = null;

  constructor(config: NetworkLogConfig) {
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
   * Get the current log file path
   */
  private getCurrentLogFilePath(): string {
    if (!this.currentLogFile) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.currentLogFile = path.join(this.config.logPath, `network-${timestamp}.log`);
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
        .filter(file => file.startsWith('network-') && file.endsWith('.log'))
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
   * Add a network log entry
   */
  async logConnection(entry: Omit<NetworkLogEntry, 'id'>): Promise<void> {
    if (!this.config.enabled) return;

    const logEntry: NetworkLogEntry = {
      id: `net_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...entry
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
  private async writeToFile(entry: NetworkLogEntry): Promise<void> {
    if (!this.config.enabled) return;

    try {
      await this.rotateLogFileIfNeeded();
      const logFile = this.getCurrentLogFilePath();
      
      const logLine = this.formatLogEntry(entry);
      await fs.appendFile(logFile, logLine + '\n');
    } catch (error: any) {
      console.error(`Failed to write network log to file: ${error.message}`);
    }
  }

  /**
   * Format log entry for file output
   */
  private formatLogEntry(entry: NetworkLogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    return `${chalk.grey(`[${timestamp}]`)} ${chalk.blue(`[${entry.connectionType}]`)} ${chalk.magenta(`[Session: ${entry.sessionId}]`)} ${chalk.cyan(entry.method || 'CONNECT')} ${chalk.yellow(entry.endpoint)}${entry.status ? ` ${chalk.green(`-> ${entry.status}`)}` : ''} | ${chalk.blue(`Duration: ${entry.durationMs || 0}ms`)} | ${chalk.blue(`Size: ${entry.dataSize || 0} bytes`)}${entry.metadata ? ` | ${chalk.grey(`Metadata: ${JSON.stringify(entry.metadata)}`)}` : ''}`;
  }

  /**
   * Log an HTTP request
   */
  async logHttpRequest(sessionId: string, endpoint: string, method: string, userAgent?: string, ipAddress?: string): Promise<{ requestId: string, startTime: number }> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    await this.logConnection({
      timestamp: Date.now(),
      sessionId,
      connectionType: 'HTTP',
      endpoint,
      method,
      userAgent,
      ipAddress,
      metadata: {
        requestId,
        eventType: 'request_start'
      }
    });
    
    return { requestId, startTime };
  }

  /**
   * Log an HTTP response
   */
  async logHttpResponse(requestId: string, sessionId: string, endpoint: string, method: string, status: number, startTime: number, dataSize?: number, userAgent?: string, ipAddress?: string): Promise<void> {
    const durationMs = Date.now() - startTime;
    
    await this.logConnection({
      timestamp: Date.now(),
      sessionId,
      connectionType: 'HTTP',
      endpoint,
      method,
      status,
      durationMs,
      dataSize,
      userAgent,
      ipAddress,
      metadata: {
        requestId,
        eventType: 'response_end'
      }
    });
  }

  /**
   * Log a WebSocket connection
   */
  async logWebSocketConnection(sessionId: string, endpoint: string, userAgent?: string, ipAddress?: string): Promise<void> {
    await this.logConnection({
      timestamp: Date.now(),
      sessionId,
      connectionType: 'WebSocket',
      endpoint,
      userAgent,
      ipAddress,
      metadata: {
        eventType: 'websocket_connect'
      }
    });
  }

  /**
   * Log a WebSocket disconnection
   */
  async logWebSocketDisconnection(sessionId: string, endpoint: string, durationMs: number): Promise<void> {
    await this.logConnection({
      timestamp: Date.now(),
      sessionId,
      connectionType: 'WebSocket',
      endpoint,
      durationMs,
      metadata: {
        eventType: 'websocket_disconnect'
      }
    });
  }

  /**
   * Log a TCP connection
   */
  async logTcpConnection(sessionId: string, endpoint: string, ipAddress?: string): Promise<void> {
    await this.logConnection({
      timestamp: Date.now(),
      sessionId,
      connectionType: 'TCP',
      endpoint,
      ipAddress,
      metadata: {
        eventType: 'tcp_connect'
      }
    });
  }

  /**
   * Get recent network logs
   */
  getRecentLogs(count: number = 50): NetworkLogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Search network logs by session or endpoint
   */
  searchLogs(searchTerm: string, count: number = 50): NetworkLogEntry[] {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const matches = this.logs.filter(entry => 
      entry.sessionId.toLowerCase().includes(lowerSearchTerm) ||
      entry.endpoint.toLowerCase().includes(lowerSearchTerm) ||
      (entry.userAgent && entry.userAgent.toLowerCase().includes(lowerSearchTerm)) ||
      (entry.ipAddress && entry.ipAddress.includes(searchTerm)) ||
      JSON.stringify(entry.metadata).toLowerCase().includes(lowerSearchTerm)
    );
    return matches.slice(-count);
  }

  /**
   * Get logs by connection type
   */
  getLogsByType(connectionType: NetworkLogEntry['connectionType'], count: number = 50): NetworkLogEntry[] {
    const matches = this.logs.filter(entry => entry.connectionType === connectionType);
    return matches.slice(-count);
  }

  /**
   * Get logs by session
   */
  getLogsBySession(sessionId: string, count: number = 50): NetworkLogEntry[] {
    const matches = this.logs.filter(entry => entry.sessionId === sessionId);
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