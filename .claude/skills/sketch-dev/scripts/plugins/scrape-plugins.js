/**
 * Sketch Plugin Scraper
 *
 * Uses Crawl4AI MCP to scrape the Sketch plugins page and extract plugin data.
 * This script documents the approach used - actual execution happens via MCP tools.
 *
 * Prerequisites:
 * - Crawl4AI MCP server configured
 * - Access to mcp__crawl4ai__md tool
 */

// The scraping process:
//
// 1. Use Crawl4AI to fetch the plugins page
// URL: https://www.sketch.com/extensions/plugins/#all
//
// Tool call:
// mcp__crawl4ai__md({
//   url: "https://www.sketch.com/extensions/plugins/#all",
//   f: "raw"  // Get raw content without filtering
// })
//
// 2. The result is JSON containing a "markdown" field with the page content
//
// 3. Parse the markdown to extract plugin entries
// Format: "### [ Plugin Name  Updated on DATE Description  by Author ](URL)"

const PLUGINS_URL = 'https://www.sketch.com/extensions/plugins/#all';

/**
 * Example parsing regex for developer plugins
 */
const PLUGIN_PATTERN = /\d+\.\s+###\s+\[\s*([^\]]+?)\s+Updated on (\d+ \w+ \d+)\s+([^\]]+?)\s+by\s+([^\]]+?)\s*\]\(([^)]+)\)/g;

/**
 * Parse markdown content and extract plugins
 * @param {string} markdown - The raw markdown from Crawl4AI
 * @returns {Array} Array of plugin objects
 */
function parsePlugins(markdown) {
  const plugins = [];
  let match;

  while ((match = PLUGIN_PATTERN.exec(markdown)) !== null) {
    plugins.push({
      name: match[1].trim(),
      updated: match[2].trim(),
      description: match[3].trim(),
      author: match[4].trim(),
      link: match[5].trim(),
      isGitHub: match[5].toLowerCase().includes('github.com')
    });
  }

  return plugins;
}

/**
 * Official plugins have a different format:
 * [ ![image](url) Name  Description  by Author ](URL)
 */
const OFFICIAL_PATTERN =
  /\[\s*!\[[^\]]*\]\([^)]+\)\s*([^\s]+(?:\s+[^\s]+)*?)\s+([^!]+?)\s+by\s+([^\]]+?)\s*\]\(([^)]+)\)/g;

function parseOfficialPlugins(markdown) {
  const plugins = [];
  let match;

  while ((match = OFFICIAL_PATTERN.exec(markdown)) !== null) {
    plugins.push({
      name: match[1].trim(),
      description: match[2].trim(),
      author: match[3].trim(),
      link: match[4].trim(),
      updated: 'Official',
      isGitHub: match[4].toLowerCase().includes('github.com')
    });
  }

  return plugins;
}

// Export for use in other scripts
module.exports = {
  PLUGINS_URL,
  parsePlugins,
  parseOfficialPlugins,
  PLUGIN_PATTERN,
  OFFICIAL_PATTERN
};
