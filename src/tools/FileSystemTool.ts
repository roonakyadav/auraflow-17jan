import chalk from 'chalk';
import { FileSystemServer } from '../mcp/FileSystemServer';
import type { FileInfo } from '../mcp/FileSystemServer';

export class FileSystemTool {
  static readonly NAME = 'file_system';
  private server: FileSystemServer;

  constructor(basePath: string = './') {
    this.server = new FileSystemServer(basePath);
  }

  /**
   * Execute filesystem operations
   */
  async execute(operation: string, params: any): Promise<string> {
    try {
      console.log(chalk.blue.bold(`📁 FILE SYSTEM OPERATION: ${operation}`));
      
      const result = await this.server.execute({
        operation: operation as any,
        path: params.path || '.',
        content: params.content,
        recursive: params.recursive
      });

      // Format the result for display
      let formattedResult: string;
      
      if (Array.isArray(result)) {
        // Directory listing
        formattedResult = this.formatDirectoryListing(result as FileInfo[]);
      } else if (typeof result === 'string') {
        // File content
        formattedResult = this.formatFileContent(result, params.path);
      } else if (result && typeof result === 'object') {
        // Operation result object
        formattedResult = this.formatOperationResult(result);
      } else {
        formattedResult = String(result);
      }

      console.log(chalk.blue.bold(`✅ FILE SYSTEM OPERATION COMPLETED`));
      return formattedResult;
      
    } catch (error: any) {
      console.error(chalk.red(`❌ File system operation failed: ${error.message}`));
      throw error;
    }
  }

  /**
   * Format directory listing for display
   */
  private formatDirectoryListing(files: FileInfo[]): string {
    if (files.length === 0) {
      return '[Empty directory]';
    }

    const lines: string[] = ['DIRECTORY CONTENTS:'];
    lines.push('─'.repeat(60));
    
    files.forEach(file => {
      const typeIcon = file.type === 'directory' ? '📁' : '📄';
      const sizeInfo = file.type === 'file' ? ` (${file.size} bytes)` : '';
      const date = new Date(file.modified).toLocaleDateString();
      
      lines.push(`${typeIcon} ${file.name}${sizeInfo} - ${date}`);
    });
    
    lines.push('─'.repeat(60));
    lines.push(`Total items: ${files.length}`);
    
    return lines.join('\n');
  }

  /**
   * Format file content for display
   */
  private formatFileContent(content: string, filePath: string): string {
    const lines = content.split('\n');
    const previewLines = Math.min(lines.length, 10);
    
    const formatted = [
      `FILE CONTENTS: ${filePath}`,
      '─'.repeat(60),
      ...lines.slice(0, previewLines).map((line, i) => `${String(i + 1).padStart(3)}: ${line}`),
      '─'.repeat(60)
    ];
    
    if (lines.length > previewLines) {
      formatted.push(`... (${lines.length - previewLines} more lines)`);
    }
    
    return formatted.join('\n');
  }

  /**
   * Format operation result for display
   */
  private formatOperationResult(result: any): string {
    if (result.success) {
      return `[SUCCESS] ${result.message}`;
    }
    return `[RESULT] ${JSON.stringify(result, null, 2)}`;
  }

  /**
   * List directory contents
   */
  async list(path: string = '.'): Promise<string> {
    return await this.execute('list', { path });
  }

  /**
   * Read file content
   */
  async read(path: string): Promise<string> {
    return await this.execute('read', { path });
  }

  /**
   * Write file content
   */
  async write(path: string, content: string): Promise<string> {
    return await this.execute('write', { path, content });
  }

  /**
   * Create directory
   */
  async mkdir(path: string, recursive: boolean = false): Promise<string> {
    return await this.execute('create_dir', { path, recursive });
  }

  /**
   * Delete file or directory
   */
  async delete(path: string, recursive: boolean = false): Promise<string> {
    return await this.execute('delete', { path, recursive });
  }

  /**
   * Get file/directory info
   */
  async info(path: string): Promise<string> {
    return await this.execute('info', { path });
  }

  /**
   * Get tool description
   */
  getDescription(): string {
    return `
File System Tool - Manage files and directories

Available operations:
- list(path): List directory contents
- read(path): Read file content
- write(path, content): Write content to file
- mkdir(path, recursive): Create directory
- delete(path, recursive): Delete file/directory
- info(path): Get file/directory information

Example usage:
file_system("list", { path: "./examples" })
file_system("read", { path: "./README.md" })
file_system("write", { path: "./output.txt", content: "Hello World" })
    `.trim();
  }
}