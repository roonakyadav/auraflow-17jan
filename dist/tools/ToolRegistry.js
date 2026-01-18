"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolRegistry = void 0;
const WebSearchTool_1 = require("./WebSearchTool");
const FileSystemTool_1 = require("./FileSystemTool");
const chalk_1 = __importDefault(require("chalk"));
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
        console.log(chalk_1.default.blue(`\n🔧 Executing tool: ${chalk_1.default.green(toolName)}`));
        // Execute tool based on its type
        if (toolName === 'web_search' && tool.search) {
            console.log(chalk_1.default.yellow(`🔍 Searching for: ${params.query}`));
            const result = await tool.search(params.query);
            console.log(chalk_1.default.green(`✅ Web search completed with ${result.results?.length || 0} results`));
            return result;
        }
        if (toolName === 'file_system' && tool.execute) {
            console.log(chalk_1.default.yellow(`📁 File system operation: ${params.operation}`));
            const result = await tool.execute(params.operation, params.params);
            console.log(chalk_1.default.green(`✅ File system operation completed`));
            return result;
        }
        throw new Error(`Tool '${toolName}' execution method not implemented`);
    }
}
exports.ToolRegistry = ToolRegistry;
//# sourceMappingURL=ToolRegistry.js.map