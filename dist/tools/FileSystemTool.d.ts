export declare class FileSystemTool {
    static readonly NAME = "file_system";
    private server;
    constructor(basePath?: string);
    /**
     * Execute filesystem operations
     */
    execute(operation: string, params: any): Promise<string>;
    /**
     * Format directory listing for display
     */
    private formatDirectoryListing;
    /**
     * Format file content for display
     */
    private formatFileContent;
    /**
     * Format operation result for display
     */
    private formatOperationResult;
    /**
     * List directory contents
     */
    list(path?: string): Promise<string>;
    /**
     * Read file content
     */
    read(path: string): Promise<string>;
    /**
     * Write file content
     */
    write(path: string, content: string): Promise<string>;
    /**
     * Create directory
     */
    mkdir(path: string, recursive?: boolean): Promise<string>;
    /**
     * Delete file or directory
     */
    delete(path: string, recursive?: boolean): Promise<string>;
    /**
     * Get file/directory info
     */
    info(path: string): Promise<string>;
    /**
     * Get tool description
     */
    getDescription(): string;
}
