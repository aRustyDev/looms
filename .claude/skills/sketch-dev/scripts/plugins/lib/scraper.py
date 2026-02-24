"""
Plugin Scraper

Handles fetching and parsing the Sketch plugins page.
Supports three modes:
1. Direct: Uses Crawl4AI Python library (preferred)
2. MCP: Receives pre-fetched content from MCP tool
3. Fallback: Uses curl for simple fetching
"""

import re
import json
import hashlib
import subprocess
import asyncio
from dataclasses import dataclass
from typing import Optional
from datetime import datetime


@dataclass
class ScrapedPlugin:
    """Raw plugin data from scraping."""
    name: str
    link: str
    description: str
    author: str
    updated: str
    is_github: bool

    @property
    def content_hash(self) -> str:
        """Hash of content for change detection."""
        content = f"{self.name}|{self.description}|{self.author}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]


class PluginScraper:
    """
    Scrapes Sketch plugins from the extensions page.

    Supports two modes:
    1. Direct: Uses curl/wget to fetch page, then parses
    2. MCP: Receives pre-fetched markdown from MCP tool
    """

    PLUGINS_URL = "https://www.sketch.com/extensions/plugins/#all"

    # Regex for developer plugins
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

    # Regex for official plugins
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

    # Official plugins (hardcoded as they rarely change)
    OFFICIAL_PLUGINS = [
        ScrapedPlugin(
            name="Color Variables Migrator",
            link="https://github.com/sketch-hq/color-variables-migrator",
            description="Migrate your Layers and Styles to use the new Color Variables feature.",
            author="Sketch",
            updated="Official",
            is_github=True
        ),
        ScrapedPlugin(
            name="SVGO Compressor",
            link="https://github.com/sketch-hq/svgo-compressor",
            description="Automatically compress your SVG assets using SVGO at export time.",
            author="Sketch",
            updated="Official",
            is_github=True
        ),
        ScrapedPlugin(
            name="Unsplash",
            link="https://github.com/sketch-hq/unsplash-sketchplugin",
            description="Easily grab images from Unsplash.",
            author="Sketch",
            updated="Official",
            is_github=True
        ),
    ]

    def __init__(self):
        self.last_error: Optional[str] = None

    def scrape_from_markdown(self, markdown: str) -> list[ScrapedPlugin]:
        """
        Parse plugins from markdown content.

        This is the primary method when using MCP (Crawl4AI provides markdown).

        Args:
            markdown: Raw markdown content from the plugins page

        Returns:
            List of ScrapedPlugin objects
        """
        plugins = []

        # Parse developer plugins
        for match in self.PLUGIN_PATTERN.finditer(markdown):
            link = match.group(5).strip()
            plugins.append(ScrapedPlugin(
                name=match.group(1).strip(),
                updated=match.group(2).strip(),
                description=match.group(3).strip(),
                author=match.group(4).strip(),
                link=link,
                is_github="github.com" in link.lower()
            ))

        # Add official plugins
        plugins.extend(self.OFFICIAL_PLUGINS)

        # Deduplicate by link
        seen = set()
        unique = []
        for p in plugins:
            key = p.link.lower().rstrip("/")
            if key not in seen:
                seen.add(key)
                unique.append(p)

        return unique

    def scrape_from_json(self, json_content: str) -> list[ScrapedPlugin]:
        """
        Parse plugins from Crawl4AI JSON response.

        The response format is: [{"type": "text", "text": "{\"markdown\": \"...\"}"}]

        Args:
            json_content: Raw JSON response from Crawl4AI

        Returns:
            List of ScrapedPlugin objects
        """
        try:
            data = json.loads(json_content)
            if isinstance(data, list) and len(data) > 0:
                inner = json.loads(data[0].get("text", "{}"))
                markdown = inner.get("markdown", "")
                return self.scrape_from_markdown(markdown)
            else:
                self.last_error = "Invalid JSON structure"
                return []
        except json.JSONDecodeError as e:
            self.last_error = f"JSON decode error: {e}"
            return []

    def generate_mcp_call(self) -> dict:
        """
        Generate the MCP tool call parameters for scraping.

        Returns:
            Dict with tool name and parameters for MCP call
        """
        return {
            "tool": "mcp__crawl4ai__md",
            "params": {
                "url": self.PLUGINS_URL,
                "f": "raw"
            }
        }

    async def scrape_async(self) -> list["ScrapedPlugin"]:
        """
        Scrape plugins directly using Crawl4AI Python library.

        This is the preferred method when running outside of MCP context.
        Requires: pip install crawl4ai

        Returns:
            List of ScrapedPlugin objects
        """
        try:
            from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig
        except ImportError:
            self.last_error = "Crawl4AI not installed. Run: pip install crawl4ai"
            return []

        browser_cfg = BrowserConfig(
            browser_type="chromium",
            headless=True,
            verbose=False
        )

        run_cfg = CrawlerRunConfig(
            word_count_threshold=10,
        )

        try:
            async with AsyncWebCrawler(config=browser_cfg) as crawler:
                result = await crawler.arun(self.PLUGINS_URL, config=run_cfg)

                if not result.success:
                    self.last_error = result.error_message or "Crawl failed"
                    return []

                return self.scrape_from_markdown(result.markdown)
        except Exception as e:
            self.last_error = f"Crawl4AI error: {e}"
            return []

    def scrape_sync(self) -> list["ScrapedPlugin"]:
        """
        Synchronous wrapper for scrape_async().

        Convenience method for non-async contexts.
        """
        return asyncio.run(self.scrape_async())

    @staticmethod
    def fetch_github_sha(repo_url: str) -> Optional[str]:
        """
        Fetch the latest commit SHA for a GitHub repo.

        Args:
            repo_url: GitHub repository URL

        Returns:
            SHA string or None if failed
        """
        # Extract owner/repo from URL
        match = re.search(r"github\.com/([^/]+)/([^/]+)", repo_url)
        if not match:
            return None

        owner, repo = match.groups()
        repo = repo.rstrip(".git")

        # Use GitHub API (no auth for public repos)
        api_url = f"https://api.github.com/repos/{owner}/{repo}/commits?per_page=1"

        try:
            result = subprocess.run(
                ["curl", "-s", api_url],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                data = json.loads(result.stdout)
                if isinstance(data, list) and len(data) > 0:
                    return data[0].get("sha")
        except Exception:
            pass

        return None

    @staticmethod
    def get_github_compare_url(repo_url: str, from_sha: str, to_sha: str = "HEAD") -> str:
        """
        Generate GitHub compare URL for viewing diff between commits.

        Args:
            repo_url: GitHub repository URL
            from_sha: Starting commit SHA
            to_sha: Ending commit SHA (default HEAD)

        Returns:
            GitHub compare URL
        """
        # Normalize URL
        base = repo_url.rstrip("/").rstrip(".git")
        return f"{base}/compare/{from_sha}...{to_sha}"
