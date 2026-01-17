/**
 * Tool Registry - Central management for all available tools
 */
export declare class ToolRegistry {
    private tools;
    constructor();
    /**
     * Initialize default built-in tools
     */
    private initializeDefaultTools;
    /**
     * Get a tool by name
     * @param toolName - Name of the tool to retrieve
     * @returns Tool instance or null if not found
     */
    getTool(toolName: string): any | null;
    /**
     * Check if a tool exists
     * @param toolName - Name of the tool to check
     * @returns boolean indicating if tool exists
     */
    hasTool(toolName: string): boolean;
    /**
     * Get list of all available tools
     * @returns Array of tool names
     */
    getAvailableTools(): string[];
    /**
     * Execute a tool with given parameters
     * @param toolName - Name of the tool to execute
     * @param params - Parameters for the tool
     * @returns Promise resolving to tool result
     */
    executeTool(toolName: string, params: any): Promise<any>;
}
