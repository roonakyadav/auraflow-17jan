import { WebSearchTool } from './WebSearchTool';
import { FileSystemTool } from './FileSystemTool';
import chalk from 'chalk';

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
    
    console.log(chalk.blue(`\n🔧 Executing tool: ${chalk.green(toolName)}`));
    
    // Execute tool based on its type
    if (toolName === 'web_search' && tool.search) {
      console.log(chalk.yellow(`🔍 Searching for: ${params.query}`));
      const result = await tool.search(params.query);
      console.log(chalk.green(`✅ Web search completed with ${result.results?.length || 0} results`));
      return result;
    }
    
    if (toolName === 'file_system' && tool.execute) {
      console.log(chalk.yellow(`📁 File system operation: ${params.operation}`));
      const result = await tool.execute(params.operation, params.params);
      console.log(chalk.green(`✅ File system operation completed`));
      return result;
    }

    throw new Error(`Tool '${toolName}' execution method not implemented`);
  }
}