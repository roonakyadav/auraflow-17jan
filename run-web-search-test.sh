#!/bin/bash
# Test script to demonstrate web search with visible markers

# Force web search to be enabled by modifying the CLI temporarily
echo "Testing web search functionality with visible markers..."

# Run with web search enabled (simulating "y" response)
timeout 45 bash -c 'echo "y" | npx auraflow run examples/web-search-demo.yaml' 2>&1 | tee web-search-output.txt

echo "
=== WEB SEARCH MARKERS IDENTIFICATION ===

Look for these indicators that prove internet search was used:

1. 🔍 WEB SEARCH DETECTED prompt at start
2. ✓ Web search enabled confirmation  
3. [WEB SEARCH RESULT] markers in the researcher's output
4. Current/recent information that wouldn't be in training data
5. Specific references to current sources and publications

Check the full output in web-search-output.txt for detailed evidence."