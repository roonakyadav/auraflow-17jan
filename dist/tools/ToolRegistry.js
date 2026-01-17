"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolRegistry = void 0;
const WebSearchTool_1 = require("./WebSearchTool");
const FileSystemTool_1 = require("./FileSystemTool");
/**
 * Tool Registry - Central management for all available tools
 */
class ToolRegistry {
    tools = new Map();
    constructor() {
        this.initializeDefaultTools();
    }
    /**
     * Initialize default built-in tools
     */
    initializeDefaultTools() {
        // Register web search tool
        this.tools.set('web_search', new WebSearchTool_1.WebSearchTool({
            maxResults: 5,
            region: 'us-en'
        }));
        // Register file system tool
        this.tools.set('file_system', new FileSystemTool_1.FileSystemTool('./'));
    }
    /**
     * Get a tool by name
     * @param toolName - Name of the tool to retrieve
     * @returns Tool instance or null if not found
     */
    getTool(toolName) {
        return this.tools.get(toolName) || null;
    }
    /**
     * Check if a tool exists
     * @param toolName - Name of the tool to check
     * @returns boolean indicating if tool exists
     */
    hasTool(toolName) {
        return this.tools.has(toolName);
    }
    /**
     * Get list of all available tools
     * @returns Array of tool names
     */
    getAvailableTools() {
        return Array.from(this.tools.keys());
    }
    /**
     * Execute a tool with given parameters
     * @param toolName - Name of the tool to execute
     * @param params - Parameters for the tool
     * @returns Promise resolving to tool result
     */
    async executeTool(toolName, params) {
        const tool = this.getTool(toolName);
        if (!tool) {
            throw new Error(`Tool '${toolName}' not found`);
        }
        // Execute tool based on its type
        if (toolName === 'web_search' && tool.search) {
            return await tool.search(params.query);
        }
        if (toolName === 'file_system' && tool.execute) {
            return await tool.execute(params.operation, params.params);
        }
        throw new Error(`Tool '${toolName}' execution method not implemented`);
    }
}
exports.ToolRegistry = ToolRegistry;
//# sourceMappingURL=ToolRegistry.js.map