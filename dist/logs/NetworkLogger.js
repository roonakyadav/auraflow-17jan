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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkLogger = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
class NetworkLogger {
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
     * Get the current log file path
     */
    getCurrentLogFilePath() {
        if (!this.currentLogFile) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            this.currentLogFile = path.join(this.config.logPath, `network-${timestamp}.log`);
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
                .filter(file => file.startsWith('network-') && file.endsWith('.log'))
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
     * Add a network log entry
     */
    async logConnection(entry) {
        if (!this.config.enabled)
            return;
        const logEntry = {
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
            console.error(`Failed to write network log to file: ${error.message}`);
        }
    }
    /**
     * Format log entry for file output
     */
    formatLogEntry(entry) {
        const timestamp = new Date(entry.timestamp).toISOString();
        return `${chalk_1.default.grey(`[${timestamp}]`)} ${chalk_1.default.blue(`[${entry.connectionType}]`)} ${chalk_1.default.magenta(`[Session: ${entry.sessionId}]`)} ${chalk_1.default.cyan(entry.method || 'CONNECT')} ${chalk_1.default.yellow(entry.endpoint)}${entry.status ? ` ${chalk_1.default.green(`-> ${entry.status}`)}` : ''} | ${chalk_1.default.blue(`Duration: ${entry.durationMs || 0}ms`)} | ${chalk_1.default.blue(`Size: ${entry.dataSize || 0} bytes`)}${entry.metadata ? ` | ${chalk_1.default.grey(`Metadata: ${JSON.stringify(entry.metadata)}`)}` : ''}`;
    }
    /**
     * Log an HTTP request
     */
    async logHttpRequest(sessionId, endpoint, method, userAgent, ipAddress) {
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
    async logHttpResponse(requestId, sessionId, endpoint, method, status, startTime, dataSize, userAgent, ipAddress) {
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
    async logWebSocketConnection(sessionId, endpoint, userAgent, ipAddress) {
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
    async logWebSocketDisconnection(sessionId, endpoint, durationMs) {
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
    async logTcpConnection(sessionId, endpoint, ipAddress) {
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
    getRecentLogs(count = 50) {
        return this.logs.slice(-count);
    }
    /**
     * Search network logs by session or endpoint
     */
    searchLogs(searchTerm, count = 50) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const matches = this.logs.filter(entry => entry.sessionId.toLowerCase().includes(lowerSearchTerm) ||
            entry.endpoint.toLowerCase().includes(lowerSearchTerm) ||
            (entry.userAgent && entry.userAgent.toLowerCase().includes(lowerSearchTerm)) ||
            (entry.ipAddress && entry.ipAddress.includes(searchTerm)) ||
            JSON.stringify(entry.metadata).toLowerCase().includes(lowerSearchTerm));
        return matches.slice(-count);
    }
    /**
     * Get logs by connection type
     */
    getLogsByType(connectionType, count = 50) {
        const matches = this.logs.filter(entry => entry.connectionType === connectionType);
        return matches.slice(-count);
    }
    /**
     * Get logs by session
     */
    getLogsBySession(sessionId, count = 50) {
        const matches = this.logs.filter(entry => entry.sessionId === sessionId);
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
exports.NetworkLogger = NetworkLogger;
//# sourceMappingURL=NetworkLogger.js.map