#!/usr/bin/env python3
"""
Sketch Plugin Extractor

Parses the raw markdown output from Crawl4AI and extracts plugin data
into a structured JSON format.

Usage:
    python extract-plugins.py input.md output.json
"""

import json
import re
import sys


# Regex pattern for developer plugins
# Format: "### [ Plugin Name  Updated on DATE Description  by Author ](URL)"
PLUGIN_PATTERN = re.compile(
    r"\d+\.\s+###\s+\[\s*"
    r"([^\]]+?)"           # Group 1: Plugin name
    r"\s+Updated on "
    r"(\d+ \w+ \d+)"       # Group 2: Date
    r"\s+"
    r"([^\]]+?)"           # Group 3: Description
    r"\s+by\s+"
    r"([^\]]+?)"           # Group 4: Author
    r"\s*\]\("
    r"([^)]+)"             # Group 5: URL
    r"\)"
)

# Regex pattern for official plugins
# Format: "[ ![image](url) Name  Description  by Author ](URL)"
OFFICIAL_PATTERN = re.compile(
    r"\[\s*!\[[^\]]*\]\([^)]+\)\s*"
    r"([^\s]+(?:\s+[^\s]+)*?)"  # Group 1: Name
    r"\s+"
    r"([^!]+?)"                  # Group 2: Description
    r"\s+by\s+"
    r"([^\]]+?)"                 # Group 3: Author
    r"\s*\]\("
    r"([^)]+)"                   # Group 4: URL
    r"\)"
)


def extract_plugins(markdown: str) -> list:
    """
    Extract plugin data from markdown content.

    Args:
        markdown: Raw markdown string from Crawl4AI

    Returns:
        List of plugin dictionaries
    """
    plugins = []

    # Extract developer plugins
    for match in PLUGIN_PATTERN.finditer(markdown):
        plugins.append({
            "name": match.group(1).strip(),
            "updated": match.group(2).strip(),
            "description": match.group(3).strip(),
            "author": match.group(4).strip(),
            "link": match.group(5).strip(),
            "is_github": "github.com" in match.group(5).lower()
        })

    return plugins


def extract_official_plugins(markdown: str) -> list:
    """
    Extract official Sketch plugins from markdown content.

    Args:
        markdown: Raw markdown string from Crawl4AI

    Returns:
        List of official plugin dictionaries
    """
    plugins = []

    for match in OFFICIAL_PATTERN.finditer(markdown):
        plugins.append({
            "name": match.group(1).strip(),
            "description": match.group(2).strip(),
            "author": match.group(3).strip(),
            "link": match.group(4).strip(),
            "updated": "Official",
            "is_github": "github.com" in match.group(4).lower()
        })

    return plugins


def main(input_file: str, output_file: str):
    """
    Main extraction function.

    Args:
        input_file: Path to markdown file
        output_file: Path for JSON output
    """
    # Load markdown
    with open(input_file, "r", encoding="utf-8") as f:
        markdown = f.read()

    print(f"Loaded {len(markdown)} characters from {input_file}")

    # Extract plugins
    plugins = extract_plugins(markdown)
    official = extract_official_plugins(markdown)

    print(f"Found {len(plugins)} developer plugins")
    print(f"Found {len(official)} official plugins")

    # Combine (official first)
    all_plugins = official + plugins

    # Remove duplicates by link
    seen = set()
    unique_plugins = []
    for p in all_plugins:
        if p["link"] not in seen:
            seen.add(p["link"])
            unique_plugins.append(p)

    print(f"Total unique plugins: {len(unique_plugins)}")

    # Save to JSON
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(unique_plugins, f, indent=2, ensure_ascii=False)

    print(f"Saved to {output_file}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python extract-plugins.py input.md output.json")
        sys.exit(1)

    main(sys.argv[1], sys.argv[2])
