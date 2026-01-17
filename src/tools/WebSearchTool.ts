import chalk from 'chalk';

/**
 * WebSearchTool - DuckDuckGo search integration
 * Free search tool that doesn't require API keys
 */
export class WebSearchTool {
  private static readonly BASE_URL = 'https://api.duckduckgo.com/';
  private maxResults: number;
  private region: string;

  constructor(config: { maxResults?: number; region?: string } = {}) {
    this.maxResults = config.maxResults || 10;
    this.region = config.region || 'us-en';
  }

  /**
   * Perform web search using DuckDuckGo Instant Answer API
   * @param query - Search query string
   * @returns Promise resolving to search results
   */
  async search(query: string): Promise<SearchResult[]> {
    try {
      console.log(chalk.blue.bold(`🔍 🔍 🔍 INTERNET SEARCH ACTIVATED: "${query}"`));
      
      const url = new URL(WebSearchTool.BASE_URL);
      url.searchParams.append('q', query);
      url.searchParams.append('format', 'json');
      url.searchParams.append('no_html', '1');
      url.searchParams.append('skip_disambig', '1');
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': 'AuraFlow/1.0 (Multi-Agent Orchestration Engine)'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const results: SearchResult[] = [];

      // Add abstract/definition if available
      if (data.AbstractText) {
        results.push({
          title: data.Heading || 'Definition/Abstract',
          url: data.AbstractURL || '',
          snippet: `[WEB SEARCH RESULT] ${data.AbstractText}`,
          source: 'DuckDuckGo Instant Answer'
        });
      }

      // Add related topics/results
      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        const topics = data.RelatedTopics.slice(0, this.maxResults - results.length);
        topics.forEach((topic: any) => {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: this.extractTitle(topic.Text),
              url: topic.FirstURL,
              snippet: `[WEB SEARCH RESULT] ${this.extractSnippet(topic.Text)}`,
              source: 'DuckDuckGo Related Topics'
            });
          }
        });
      }

      // Add results section if available
      if (data.Results && Array.isArray(data.Results)) {
        const directResults = data.Results.slice(0, this.maxResults - results.length);
        directResults.forEach((result: any) => {
          if (result.Text && result.FirstURL) {
            results.push({
              title: this.extractTitle(result.Text),
              url: result.FirstURL,
              snippet: `[WEB SEARCH RESULT] ${this.extractSnippet(result.Text)}`,
              source: 'DuckDuckGo Direct Results'
            });
          }
        });
      }

      console.log(chalk.blue.bold(`✅ ✅ ✅ INTERNET SEARCH COMPLETED: Found ${results.length} results`));
      return results;
    } catch (error: any) {
      console.error('❌ Web search failed:', error.message);
      throw new Error(`Web search failed: ${error.message}`);
    }
  }

  /**
   * Extract clean title from DuckDuckGo result text
   */
  private extractTitle(text: string): string {
    // DuckDuckGo results often have format: "Title - Description"
    const parts = text.split(' - ');
    return parts[0] || text.substring(0, 100);
  }

  /**
   * Extract snippet from DuckDuckGo result text
   */
  private extractSnippet(text: string): string {
    const parts = text.split(' - ');
    return parts.slice(1).join(' - ') || text;
  }

  /**
   * Format results for agent consumption
   */
  formatResults(results: SearchResult[]): string {
    if (results.length === 0) {
      return chalk.blue('[INTERNET SEARCH] No relevant results found for the search query.');
    }

    let formatted = `Web Search Results (${results.length} found):\n\n`;
    
    results.forEach((result, index) => {
      formatted += `${index + 1}. ${result.title}\n`;
      formatted += `   URL: ${result.url}\n`;
      formatted += `   Snippet: ${result.snippet}\n`;
      formatted += `   Source: ${result.source}\n\n`;
    });

    return formatted.trim();
  }
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