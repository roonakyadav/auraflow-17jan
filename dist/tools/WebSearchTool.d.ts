/**
 * WebSearchTool - DuckDuckGo search integration
 * Free search tool that doesn't require API keys
 */
export declare class WebSearchTool {
    private static readonly BASE_URL;
    private maxResults;
    private region;
    constructor(config?: {
        maxResults?: number;
        region?: string;
    });
    /**
     * Perform web search using DuckDuckGo Instant Answer API
     * @param query - Search query string
     * @returns Promise resolving to search results
     */
    search(query: string): Promise<SearchResult[]>;
    /**
     * Extract clean title from DuckDuckGo result text
     */
    private extractTitle;
    /**
     * Extract snippet from DuckDuckGo result text
     */
    private extractSnippet;
    /**
     * Format results for agent consumption
     */
    formatResults(results: SearchResult[]): string;
}
/**
 * Search result interface
 */
export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
    source: string;
}
