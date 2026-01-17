import { WebSearchTool } from './WebSearchTool';
import { FileSystemTool } from './FileSystemTool';

/**
 * Tool Registry - Central management for all available tools
 */
export class ToolRegistry {
  private tools: Map<string, any> = new Map();

  constructor() {
    this.initializeDefaultTools();
  }

  /**
   * Initialize default built-in tools
   */
  private initializeDefaultTools(): void {
    // Register web search tool
    this.tools.set('web_search', new WebSearchTool({
      maxResults: 5,
      region: 'us-en'
    }));
    
    // Register file system tool
    this.tools.set('file_system', new FileSystemTool('./'));
  }

  /**
   * Get a tool by name
   * @param toolName - Name of the tool to retrieve
   * @returns Tool instance or null if not found
   */
  getTool(toolName: string): any | null {
    return this.tools.get(toolName) || null;
  }

  /**
   * Check if a tool exists
   * @param toolName - Name of the tool to check
   * @returns boolean indicating if tool exists
   */
  hasTool(toolName: string): boolean {
    return this.tools.has(toolName);
  }

  /**
   * Get list of all available tools
   * @returns Array of tool names
   */
  getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Execute a tool with given parameters
   * @param toolName - Name of the tool to execute
   * @param params - Parameters for the tool
   * @returns Promise resolving to tool result
   */
  async executeTool(toolName: string, params: any): Promise<any> {
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