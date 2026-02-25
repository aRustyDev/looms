#!/usr/bin/env python3
"""
Generate Plugin Summaries

Fetches content from plugin links and generates research summaries.
Uses GitHub API for READMEs and web fetching for other sources.

Usage:
    # Dry run - show what would be fetched (no LLM calls)
    python generate_summaries.py --dry-run --category icons --limit 5

    # Generate summaries for a category
    python generate_summaries.py --category icons --limit 10

    # Generate for specific plugin
    python generate_summaries.py --plugin "Phosphor Icons"

    # Generate for plugins without summaries
    python generate_summaries.py --missing --limit 20

Requirements:
    pip install anthropic  # For LLM summarization
    gh auth login          # For GitHub README access
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time
import yaml
from pathlib import Path
from typing import Optional
from dataclasses import dataclass


# Rate limiting
GITHUB_DELAY = 0.5  # Seconds between GitHub API calls
LLM_DELAY = 1.0     # Seconds between LLM calls


@dataclass
class PluginContent:
    """Fetched content for a plugin."""
    name: str
    link: str
    description: str
    readme: Optional[str] = None
    homepage: Optional[str] = None
    error: Optional[str] = None


def fetch_github_readme(repo_url: str) -> Optional[str]:
    """Fetch README content from GitHub repo."""
    match = re.search(r"github\.com/([^/]+)/([^/]+)", repo_url)
    if not match:
        return None

    owner, repo = match.groups()
    repo = repo.removesuffix(".git").split("#")[0]

    try:
        # Try to get README via gh CLI
        result = subprocess.run(
            ["gh", "api", f"repos/{owner}/{repo}/readme",
             "-H", "Accept: application/vnd.github.raw+json"],
            capture_output=True, text=True, timeout=15
        )
        if result.returncode == 0 and result.stdout:
            content = result.stdout
            # Truncate very long READMEs
            if len(content) > 8000:
                content = content[:8000] + "\n\n[... truncated ...]"
            return content
    except Exception as e:
        print(f"  Warning: Failed to fetch README: {e}")

    return None


def fetch_webpage_content(url: str) -> Optional[str]:
    """Fetch and extract text from a webpage using curl + simple extraction."""
    try:
        result = subprocess.run(
            ["curl", "-sL", "-m", "10", url],
            capture_output=True, text=True, timeout=15
        )
        if result.returncode == 0 and result.stdout:
            html = result.stdout
            # Very basic text extraction (strip tags)
            text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
            text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)
            text = re.sub(r'<[^>]+>', ' ', text)
            text = re.sub(r'\s+', ' ', text).strip()
            # Truncate
            if len(text) > 4000:
                text = text[:4000] + " [... truncated ...]"
            return text if len(text) > 100 else None
    except Exception:
        pass
    return None


def create_summary_prompt(content: PluginContent) -> str:
    """Create a prompt for generating a plugin summary."""
    prompt = f"""Analyze this Sketch plugin and write a concise research summary.

## Plugin Information

**Name**: {content.name}
**Link**: {content.link}
**Description**: {content.description}

"""
    if content.readme:
        prompt += f"""## README Content

{content.readme}

"""
    elif content.homepage:
        prompt += f"""## Homepage Content

{content.homepage}

"""

    prompt += """## Task

Write a 2-4 sentence summary that covers:
1. What the plugin does (main functionality)
2. Key features or capabilities
3. Maintenance status (if evident from content)
4. Any notable technical details (frameworks supported, etc.)

Keep it factual and concise. Do not include marketing language.
Output ONLY the summary text, no headers or formatting."""

    return prompt


def generate_summary_with_llm(prompt: str) -> Optional[str]:
    """Generate summary using Anthropic API."""
    try:
        import anthropic
    except ImportError:
        print("Error: anthropic package not installed. Run: pip install anthropic")
        return None

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY not set")
        return None

    try:
        client = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )
        return message.content[0].text.strip()
    except Exception as e:
        print(f"  LLM error: {e}")
        return None


def load_plugins_by_category(plugins_dir: Path, category: str) -> list[dict]:
    """Load plugins from a specific category file."""
    # Convert category to filename
    filename = category.lower().replace(" ", "-").replace("/", "-") + ".yml"
    filepath = plugins_dir / filename

    if not filepath.exists():
        # Try to find matching file
        matches = list(plugins_dir.glob(f"*{category.lower()}*.yml"))
        if matches:
            filepath = matches[0]
        else:
            print(f"Category file not found: {filename}")
            return []

    with open(filepath, "r", encoding="utf-8") as f:
        entries = yaml.safe_load(f) or []

    return [(filepath, entries)]


def load_all_plugins(plugins_dir: Path) -> list[tuple[Path, list]]:
    """Load all plugins from all category files."""
    result = []
    for filepath in sorted(plugins_dir.glob("*.yml")):
        with open(filepath, "r", encoding="utf-8") as f:
            entries = yaml.safe_load(f) or []
        if entries:
            result.append((filepath, entries))
    return result


def find_plugin_by_name(plugins_dir: Path, name: str) -> Optional[tuple[Path, list, int]]:
    """Find a plugin by name across all files."""
    for filepath in plugins_dir.glob("*.yml"):
        with open(filepath, "r", encoding="utf-8") as f:
            entries = yaml.safe_load(f) or []
        for i, entry in enumerate(entries):
            if entry.get("plugin", "").lower() == name.lower():
                return (filepath, entries, i)
    return None


def process_plugin(entry: dict, dry_run: bool = False) -> Optional[str]:
    """Process a single plugin and return its summary."""
    name = entry.get("plugin", "Unknown")
    link = entry.get("link", "")
    description = entry.get("description", "")

    print(f"  Processing: {name}")

    # Fetch content
    content = PluginContent(
        name=name,
        link=link,
        description=description
    )

    is_github = "github.com" in link.lower()

    if is_github:
        time.sleep(GITHUB_DELAY)
        content.readme = fetch_github_readme(link)
        if content.readme:
            print(f"    Fetched README ({len(content.readme)} chars)")
        else:
            print(f"    No README found")
    else:
        content.homepage = fetch_webpage_content(link)
        if content.homepage:
            print(f"    Fetched homepage ({len(content.homepage)} chars)")
        else:
            print(f"    Could not fetch homepage")

    # Generate prompt
    prompt = create_summary_prompt(content)

    if dry_run:
        print(f"    [DRY RUN] Would generate summary")
        print(f"    Prompt preview: {prompt[:200]}...")
        return None

    # Generate summary
    if not content.readme and not content.homepage:
        # Fallback: generate from description only
        print(f"    Generating from description only...")

    time.sleep(LLM_DELAY)
    summary = generate_summary_with_llm(prompt)

    if summary:
        print(f"    Generated summary ({len(summary)} chars)")
    else:
        print(f"    Failed to generate summary")

    return summary


def update_yaml_file(filepath: Path, entries: list):
    """Write updated entries back to YAML file."""
    with open(filepath, "w", encoding="utf-8") as f:
        f.write("---\n")
        yaml.dump(entries, f, default_flow_style=False,
                  allow_unicode=True, sort_keys=False)


def main():
    parser = argparse.ArgumentParser(
        description="Generate plugin summaries",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument("--category", help="Process plugins in this category")
    parser.add_argument("--plugin", help="Process specific plugin by name")
    parser.add_argument("--missing", action="store_true",
                        help="Only process plugins without summaries")
    parser.add_argument("--limit", type=int, default=5,
                        help="Maximum number of plugins to process (default: 5)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Show what would be done without making changes")
    parser.add_argument("--skip-fetch", action="store_true",
                        help="Skip content fetching, use description only")
    args = parser.parse_args()

    # Find plugins directory
    skill_root = Path(__file__).parent.parent.parent
    plugins_dir = skill_root / "references" / "plugins"

    if not plugins_dir.exists():
        print(f"Error: Plugins directory not found: {plugins_dir}")
        return 1

    print(f"Plugins directory: {plugins_dir}")
    print(f"Dry run: {args.dry_run}")
    print(f"Limit: {args.limit}")
    print()

    # Check for API key if not dry run
    if not args.dry_run and not os.environ.get("ANTHROPIC_API_KEY"):
        print("Warning: ANTHROPIC_API_KEY not set. Set it to generate summaries.")
        print("  export ANTHROPIC_API_KEY=your-key-here")
        print()

    # Load plugins based on options
    files_to_process = []

    if args.plugin:
        result = find_plugin_by_name(plugins_dir, args.plugin)
        if result:
            filepath, entries, idx = result
            files_to_process = [(filepath, entries)]
            print(f"Found plugin '{args.plugin}' in {filepath.name}")
        else:
            print(f"Plugin not found: {args.plugin}")
            return 1
    elif args.category:
        files_to_process = load_plugins_by_category(plugins_dir, args.category)
        if files_to_process:
            print(f"Loaded {len(files_to_process[0][1])} plugins from category '{args.category}'")
    else:
        files_to_process = load_all_plugins(plugins_dir)
        total = sum(len(entries) for _, entries in files_to_process)
        print(f"Loaded {total} plugins from {len(files_to_process)} files")

    print()

    # Process plugins
    processed = 0
    updated = 0

    for filepath, entries in files_to_process:
        if processed >= args.limit:
            break

        print(f"{filepath.name}:")
        modified = False

        for entry in entries:
            if processed >= args.limit:
                break

            # Skip if already has summary (unless processing specific plugin)
            if args.missing and entry.get("summary"):
                continue

            # Skip if processing specific plugin and this isn't it
            if args.plugin and entry.get("plugin", "").lower() != args.plugin.lower():
                continue

            summary = process_plugin(entry, dry_run=args.dry_run)

            if summary:
                entry["summary"] = summary
                modified = True
                updated += 1

            processed += 1

        # Save changes
        if modified and not args.dry_run:
            update_yaml_file(filepath, entries)
            print(f"  Saved {filepath.name}")

        print()

    print("=" * 50)
    print(f"Processed: {processed}")
    print(f"Updated:   {updated}")

    if args.dry_run:
        print()
        print("Run without --dry-run to apply changes")

    return 0


if __name__ == "__main__":
    sys.exit(main())
