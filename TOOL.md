# Web Search Tool in AuraFlow

## Overview
The Web Search Tool provides internet search capabilities to AuraFlow agents using the DuckDuckGo Instant Answer API. This allows agents to access current information from the web during workflow execution.

## DuckDuckGo API Integration

### Why DuckDuckGo?
- **Free Access**: No API key required for basic search functionality
- **Reliable**: Stable API with good response times
- **Privacy**: Privacy-focused search engine
- **Comprehensive**: Good coverage of general topics

### Components
1. **WebSearchTool** - Core tool implementation that handles search requests
2. **ToolRegistry** - Integration with the central tool management system
3. **Interactive Prompt System** - User confirmation for web search operations

## Capabilities

### Search Operations
- **Instant Answers**: Quick factual information retrieval
- **Text Snippets**: Relevant content excerpts from search results
- **Source Information**: Attribution to original websites
- **Multiple Results**: Up to 5 results per query by default

### Result Processing
- **Content Extraction**: Extracts relevant information from search results
- **Format Conversion**: Converts raw search data to readable text
- **Quality Filtering**: Filters results based on relevance and quality
- **Source Attribution**: Maintains source information for credibility

## Security and Privacy
- **No Personal Data**: Doesn't send personal information to DuckDuckGo
- **Public API**: Uses public-facing search API
- **Limited Scope**: Only accesses publicly available information
- **User Control**: Interactive prompts allow users to control web search usage

## Integration with Agents

### YAML Configuration
```yaml
agents:
  - id: researcher
    tools: ["web_search"]
```

### Usage in Workflows
Agents can call web search using:
```javascript
web_search("current information about technology trends")
```

## Visual Feedback
- **Blue Highlighting**: Prominent blue color for search notifications
- **Status Indicators**: Clear start and completion messages
- **Query Display**: Shows the exact search query being performed
- **Result Count**: Indicates number of results found

## Interactive Features
- **Confirmation Prompts**: Asks users before executing web searches
- **Force Enable Flag**: `--enable-web-search` bypasses interactive prompts
- **Dry Run Support**: Validates workflows without executing searches
- **Verbose Logging**: Detailed output for debugging

## Example Operations
- `web_search("current weather in New York")` - Get current weather information
- `web_search("latest developments in AI technology")` - Get recent AI advancements
- `web_search("population statistics for 2024")` - Get demographic data

## Command-Line Options
- `--enable-web-search`: Force enable web search without prompts
- `--dry-run`: Validate workflow without executing web searches
- No flag: Interactive mode with user confirmation

## Benefits
- **Current Information**: Access to up-to-date web content
- **No Cost**: Free API usage without requiring keys
- **Easy Integration**: Simple configuration and setup
- **User Control**: Interactive prompts for search confirmation
- **Visual Clarity**: Clear indicators when searches occur
- **Privacy Conscious**: Respects user privacy with public API

## Limitations
- **Rate Limits**: Public API may have rate limitations
- **Result Quality**: Depends on DuckDuckGo's search algorithms
- **Content Depth**: May not provide in-depth analysis for complex topics
- **Availability**: Dependent on DuckDuckGo API availability