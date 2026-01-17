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
exports.FileSystemServer = void 0;
const fs_1 = require("fs");
const path = __importStar(require("path"));
class FileSystemServer {
    basePath;
    constructor(basePath = './') {
        this.basePath = path.resolve(basePath);
    }
    /**
     * Resolve and validate file path
     */
    resolvePath(filePath) {
        const resolved = path.resolve(this.basePath, filePath);
        // Security check - ensure path is within base directory
        if (!resolved.startsWith(this.basePath)) {
            throw new Error('Access denied: Path outside allowed directory');
        }
        return resolved;
    }
    /**
     * List directory contents
     */
    async listDirectory(dirPath = '.') {
        const fullPath = this.resolvePath(dirPath);
        try {
            const stats = await fs_1.promises.stat(fullPath);
            if (!stats.isDirectory()) {
                throw new Error(`Path is not a directory: ${dirPath}`);
            }
            const items = await fs_1.promises.readdir(fullPath, { withFileTypes: true });
            const fileInfos = [];
            for (const item of items) {
                const itemPath = path.join(fullPath, item.name);
                const itemStats = await fs_1.promises.stat(itemPath);
                fileInfos.push({
                    name: item.name,
                    path: path.relative(this.basePath, itemPath),
                    size: itemStats.size,
                    type: item.isDirectory() ? 'directory' : 'file',
                    modified: itemStats.mtime.toISOString()
                });
            }
            return fileInfos;
        }
        catch (error) {
            throw new Error(`Failed to list directory ${dirPath}: ${error.message}`);
        }
    }
    /**
     * Read file content
     */
    async readFile(filePath) {
        const fullPath = this.resolvePath(filePath);
        try {
            const stats = await fs_1.promises.stat(fullPath);
            if (stats.isDirectory()) {
                throw new Error(`Cannot read directory as file: ${filePath}`);
            }
            return await fs_1.promises.readFile(fullPath, 'utf-8');
        }
        catch (error) {
            throw new Error(`Failed to read file ${filePath}: ${error.message}`);
        }
    }
    /**
     * Write file content
     */
    async writeFile(filePath, content) {
        const fullPath = this.resolvePath(filePath);
        try {
            // Ensure directory exists
            const dirPath = path.dirname(fullPath);
            await fs_1.promises.mkdir(dirPath, { recursive: true });
            await fs_1.promises.writeFile(fullPath, content, 'utf-8');
        }
        catch (error) {
            throw new Error(`Failed to write file ${filePath}: ${error.message}`);
        }
    }
    /**
     * Create directory
     */
    async createDirectory(dirPath, recursive = false) {
        const fullPath = this.resolvePath(dirPath);
        try {
            await fs_1.promises.mkdir(fullPath, { recursive });
        }
        catch (error) {
            throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
        }
    }
    /**
     * Delete file or directory
     */
    async deletePath(targetPath, recursive = false) {
        const fullPath = this.resolvePath(targetPath);
        try {
            const stats = await fs_1.promises.stat(fullPath);
            if (stats.isDirectory() && recursive) {
                await fs_1.promises.rm(fullPath, { recursive: true, force: true });
            }
            else if (stats.isDirectory()) {
                await fs_1.promises.rmdir(fullPath);
            }
            else {
                await fs_1.promises.unlink(fullPath);
            }
        }
        catch (error) {
            throw new Error(`Failed to delete ${targetPath}: ${error.message}`);
        }
    }
    /**
     * Get file/directory information
     */
    async getPathInfo(targetPath) {
        const fullPath = this.resolvePath(targetPath);
        try {
            const stats = await fs_1.promises.stat(fullPath);
            return {
                name: path.basename(fullPath),
                path: path.relative(this.basePath, fullPath),
                size: stats.size,
                type: stats.isDirectory() ? 'directory' : 'file',
                modified: stats.mtime.toISOString()
            };
        }
        catch (error) {
            throw new Error(`Failed to get info for ${targetPath}: ${error.message}`);
        }
    }
    /**
     * Execute filesystem operation
     */
    async execute(operation) {
        switch (operation.operation) {
            case 'list':
                return await this.listDirectory(operation.path);
            case 'read':
                return await this.readFile(operation.path);
            case 'write':
                if (operation.content === undefined) {
                    throw new Error('Content required for write operation');
                }
                await this.writeFile(operation.path, operation.content);
                return { success: true, message: `File written: ${operation.path}` };
            case 'create_dir':
                await this.createDirectory(operation.path, operation.recursive);
                return { success: true, message: `Directory created: ${operation.path}` };
            case 'delete':
                await this.deletePath(operation.path, operation.recursive);
                return { success: true, message: `Deleted: ${operation.path}` };
            case 'info':
                return await this.getPathInfo(operation.path);
            default:
                throw new Error(`Unknown operation: ${operation.operation}`);
        }
    }
    /**
     * Get server capabilities
     */
    getCapabilities() {
        return {
            operations: ['read', 'write', 'list', 'create_dir', 'delete', 'info'],
            basePath: this.basePath,
            description: 'File System MCP Server for AuraFlow'
        };
    }
}
exports.FileSystemServer = FileSystemServer;
//# sourceMappingURL=FileSystemServer.js.map