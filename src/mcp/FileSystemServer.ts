import { promises as fs } from 'fs';
import * as path from 'path';

interface FileSystemOperation {
  operation: 'read' | 'write' | 'list' | 'create_dir' | 'delete' | 'info';
  path: string;
  content?: string;
  recursive?: boolean;
}

interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: 'file' | 'directory';
  modified: string;
}

export type { FileInfo };

export class FileSystemServer {
  private basePath: string;

  constructor(basePath: string = './') {
    this.basePath = path.resolve(basePath);
  }

  /**
   * Resolve and validate file path
   */
  private resolvePath(filePath: string): string {
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
  async listDirectory(dirPath: string = '.'): Promise<FileInfo[]> {
    const fullPath = this.resolvePath(dirPath);
    
    try {
      const stats = await fs.stat(fullPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${dirPath}`);
      }

      const items = await fs.readdir(fullPath, { withFileTypes: true });
      
      const fileInfos: FileInfo[] = [];
      for (const item of items) {
        const itemPath = path.join(fullPath, item.name);
        const itemStats = await fs.stat(itemPath);
        
        fileInfos.push({
          name: item.name,
          path: path.relative(this.basePath, itemPath),
          size: itemStats.size,
          type: item.isDirectory() ? 'directory' : 'file',
          modified: itemStats.mtime.toISOString()
        });
      }
      
      return fileInfos;
    } catch (error: any) {
      throw new Error(`Failed to list directory ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Read file content
   */
  async readFile(filePath: string): Promise<string> {
    const fullPath = this.resolvePath(filePath);
    
    try {
      const stats = await fs.stat(fullPath);
      if (stats.isDirectory()) {
        throw new Error(`Cannot read directory as file: ${filePath}`);
      }
      
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error: any) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Write file content
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    const fullPath = this.resolvePath(filePath);
    
    try {
      // Ensure directory exists
      const dirPath = path.dirname(fullPath);
      await fs.mkdir(dirPath, { recursive: true });
      
      await fs.writeFile(fullPath, content, 'utf-8');
    } catch (error: any) {
      throw new Error(`Failed to write file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Create directory
   */
  async createDirectory(dirPath: string, recursive: boolean = false): Promise<void> {
    const fullPath = this.resolvePath(dirPath);
    
    try {
      await fs.mkdir(fullPath, { recursive });
    } catch (error: any) {
      throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Delete file or directory
   */
  async deletePath(targetPath: string, recursive: boolean = false): Promise<void> {
    const fullPath = this.resolvePath(targetPath);
    
    try {
      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory() && recursive) {
        await fs.rm(fullPath, { recursive: true, force: true });
      } else if (stats.isDirectory()) {
        await fs.rmdir(fullPath);
      } else {
        await fs.unlink(fullPath);
      }
    } catch (error: any) {
      throw new Error(`Failed to delete ${targetPath}: ${error.message}`);
    }
  }

  /**
   * Get file/directory information
   */
  async getPathInfo(targetPath: string): Promise<FileInfo> {
    const fullPath = this.resolvePath(targetPath);
    
    try {
      const stats = await fs.stat(fullPath);
      
      return {
        name: path.basename(fullPath),
        path: path.relative(this.basePath, fullPath),
        size: stats.size,
        type: stats.isDirectory() ? 'directory' : 'file',
        modified: stats.mtime.toISOString()
      };
    } catch (error: any) {
      throw new Error(`Failed to get info for ${targetPath}: ${error.message}`);
    }
  }

  /**
   * Execute filesystem operation
   */
  async execute(operation: FileSystemOperation): Promise<any> {
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
  getCapabilities(): any {
    return {
      operations: ['read', 'write', 'list', 'create_dir', 'delete', 'info'],
      basePath: this.basePath,
      description: 'File System MCP Server for AuraFlow'
    };
  }
}
