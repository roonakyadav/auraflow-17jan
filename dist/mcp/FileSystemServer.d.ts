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
export declare class FileSystemServer {
    private basePath;
    constructor(basePath?: string);
    /**
     * Resolve and validate file path
     */
    private resolvePath;
    /**
     * List directory contents
     */
    listDirectory(dirPath?: string): Promise<FileInfo[]>;
    /**
     * Read file content
     */
    readFile(filePath: string): Promise<string>;
    /**
     * Write file content
     */
    writeFile(filePath: string, content: string): Promise<void>;
    /**
     * Create directory
     */
    createDirectory(dirPath: string, recursive?: boolean): Promise<void>;
    /**
     * Delete file or directory
     */
    deletePath(targetPath: string, recursive?: boolean): Promise<void>;
    /**
     * Get file/directory information
     */
    getPathInfo(targetPath: string): Promise<FileInfo>;
    /**
     * Execute filesystem operation
     */
    execute(operation: FileSystemOperation): Promise<any>;
    /**
     * Get server capabilities
     */
    getCapabilities(): any;
}
