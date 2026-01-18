export interface NetworkLogEntry {
    id: string;
    timestamp: number;
    sessionId: string;
    connectionType: 'HTTP' | 'HTTPS' | 'WebSocket' | 'TCP' | 'Custom';
    endpoint: string;
    method?: string;
    status?: number;
    durationMs?: number;
    dataSize?: number;
    userAgent?: string;
    ipAddress?: string;
    metadata?: Record<string, any>;
}
export interface NetworkLogConfig {
    logPath: string;
    maxFileSize?: number;
    maxFiles?: number;
    level?: 'INFO' | 'DEBUG';
    enabled?: boolean;
}
export declare class NetworkLogger {
    private logs;
    private config;
    private currentLogFile;
    constructor(config: NetworkLogConfig);
    /**
     * Ensure the log directory exists
     */
    private ensureLogDirectory;
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
     * Add a network log entry
     */
    logConnection(entry: Omit<NetworkLogEntry, 'id'>): Promise<void>;
    /**
     * Write log entry to file
     */
    private writeToFile;
    /**
     * Format log entry for file output
     */
    private formatLogEntry;
    /**
     * Log an HTTP request
     */
    logHttpRequest(sessionId: string, endpoint: string, method: string, userAgent?: string, ipAddress?: string): Promise<{
        requestId: string;
        startTime: number;
    }>;
    /**
     * Log an HTTP response
     */
    logHttpResponse(requestId: string, sessionId: string, endpoint: string, method: string, status: number, startTime: number, dataSize?: number, userAgent?: string, ipAddress?: string): Promise<void>;
    /**
     * Log a WebSocket connection
     */
    logWebSocketConnection(sessionId: string, endpoint: string, userAgent?: string, ipAddress?: string): Promise<void>;
    /**
     * Log a WebSocket disconnection
     */
    logWebSocketDisconnection(sessionId: string, endpoint: string, durationMs: number): Promise<void>;
    /**
     * Log a TCP connection
     */
    logTcpConnection(sessionId: string, endpoint: string, ipAddress?: string): Promise<void>;
    /**
     * Get recent network logs
     */
    getRecentLogs(count?: number): NetworkLogEntry[];
    /**
     * Search network logs by session or endpoint
     */
    searchLogs(searchTerm: string, count?: number): NetworkLogEntry[];
    /**
     * Get logs by connection type
     */
    getLogsByType(connectionType: NetworkLogEntry['connectionType'], count?: number): NetworkLogEntry[];
    /**
     * Get logs by session
     */
    getLogsBySession(sessionId: string, count?: number): NetworkLogEntry[];
    /**
     * Clear in-memory logs
     */
    clear(): void;
    /**
     * Export logs to a different format
     */
    export(format?: 'json' | 'text'): string;
}
