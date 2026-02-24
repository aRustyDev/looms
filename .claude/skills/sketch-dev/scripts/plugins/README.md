# Sketch Plugin Scripts

Scripts for scraping, extracting, and categorizing Sketch plugins from the official extensions page.

## Scripts

### scrape-plugins.js

Documents the Crawl4AI MCP approach for scraping the Sketch plugins page. This is a reference implementation showing:
- The URL to scrape
- Regex patterns for parsing plugin entries
- Data structure for extracted plugins

**Note**: Actual scraping is done via MCP tool calls (`mcp__crawl4ai__md`).

### extract-plugins.py

Parses raw markdown from Crawl4AI and extracts structured plugin data.

```bash
python extract-plugins.py raw-markdown.md plugins.json
```

**Input**: Markdown content from Crawl4AI
**Output**: JSON array of plugin objects

```json
{
  "name": "Plugin Name",
  "description": "Plugin description",
  "author": "Author Name",
  "link": "https://...",
  "updated": "15 Jan 2026",
  "is_github": true
}
```

### categorize-plugins.py

Categorizes extracted plugins into predefined categories based on keyword matching.

```bash
python categorize-plugins.py plugins.json output/
```

**Input**: JSON file from extract-plugins.py
**Output**: YAML files per category in output directory

## Categories

The categorizer supports these categories:

| Category | Keywords |
|----------|----------|
| A11y | accessibility, wcag, color blind, stark |
| AI | codia, uxarts, picsart, prediction |
| Icons | icon, phosphor, icondrop, fontawesome |
| Symbol Management | symbol, instance, component |
| Colors | color, gradient, palette, swatch |
| Text | text, lorem, ipsum, rename |
| Code | tailwind, css, html, react |
| ... | (see script for full list) |

## Workflow

1. **Scrape** - Use Crawl4AI MCP to fetch the plugins page
   ```
   mcp__crawl4ai__md({ url: "https://www.sketch.com/extensions/plugins/#all", f: "raw" })
   ```

2. **Extract** - Parse the JSON response to get markdown, then run extraction
   ```bash
   python extract-plugins.py /tmp/sketch-plugins-raw.md /tmp/plugins.json
   ```

3. **Categorize** - Generate YAML files by category
   ```bash
   python categorize-plugins.py /tmp/plugins.json ./references/plugins/
   ```

## Output Format

Each category YAML file follows this schema:

```yaml
---
- plugin: Plugin Name
  link: https://github.com/...
  description: Plugin description text
  summary: By Author. Last updated DATE.
  open-source: true
  tags:
  - category-name
```

## Statistics

As of February 2026:
- **660+ plugins** listed on Sketch extensions page
- **~90% open source** (hosted on GitHub)
- **35+ categories** after classification
