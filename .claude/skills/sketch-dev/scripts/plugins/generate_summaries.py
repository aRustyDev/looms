#!/usr/bin/env python3
"""
Generate Plugin Summaries

Fetches content from plugin links and generates research summaries.
Two modes of operation:

1. API Mode (--api-key): Uses Anthropic API for batch summary generation
2. Interactive Mode (default): Outputs structured JSON for AI tools like Claude Code

Usage:
    # Interactive mode - outputs JSON for Claude Code to process
    python generate_summaries.py --category colors --limit 5

    # API mode - batch processing with Anthropic API
    python generate_summaries.py --api-key sk-ant-xxx --category colors --limit 10

    # Dry run - show what would be fetched (no output/API calls)
    python generate_summaries.py --dry-run --category icons --limit 5

    # Process plugins without summaries
    python generate_summaries.py --missing --limit 20

Requirements:
    gh auth login          # For GitHub README access
    pip install anthropic  # Only for API mode
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
from dataclasses import dataclass, asdict


# Rate limiting
GITHUB_DELAY = 0.5  # Seconds between GitHub API calls
LLM_DELAY = 1.0     # Seconds between LLM calls


@dataclass
class PluginContent:
    """Fetched content for a plugin."""
    name: str
    link: str
    description: str
    category: str
    filepath: str
    index: int  # Index in the YAML file for updating
    readme: Optional[str] = None
    homepage: Optional[str] = None
    error: Optional[str] = None
    is_github: bool = False

    def to_dict(self) -> dict:
        return {k: v for k, v in asdict(self).items() if v is not None}


def fetch_github_readme(repo_url: str, verbose: bool = True) -> Optional[str]:
    """Fetch README content from GitHub repo."""
    match = re.search(r"github\.com/([^/]+)/([^/]+)", repo_url)
    if not match:
        return None

    owner, repo = match.groups()
    repo = repo.removesuffix(".git").split("#")[0]

    try:
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
        if verbose:
            print(f"  Warning: Failed to fetch README: {e}", file=sys.stderr)

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


def generate_summary_with_api(prompt: str, api_key: str) -> Optional[str]:
    """Generate summary using Anthropic API."""
    try:
        import anthropic
    except ImportError:
        print("Error: anthropic package not installed. Run: pip install anthropic", file=sys.stderr)
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
        print(f"  LLM error: {e}", file=sys.stderr)
        return None


def load_plugins_by_category(plugins_dir: Path, category: str) -> list[tuple[Path, list]]:
    """Load plugins from a specific category file."""
    filename = category.lower().replace(" ", "-").replace("/", "-") + ".yml"
    filepath = plugins_dir / filename

    if not filepath.exists():
        matches = list(plugins_dir.glob(f"*{category.lower()}*.yml"))
        if matches:
            filepath = matches[0]
        else:
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


def fetch_plugin_content(entry: dict, filepath: Path, index: int, verbose: bool = True) -> PluginContent:
    """Fetch content for a single plugin."""
    name = entry.get("plugin", "Unknown")
    link = entry.get("link", "")
    description = entry.get("description", "")
    is_github = "github.com" in link.lower()

    content = PluginContent(
        name=name,
        link=link,
        description=description,
        category=filepath.stem,
        filepath=str(filepath),
        index=index,
        is_github=is_github
    )

    if verbose:
        print(f"  Fetching: {name}", file=sys.stderr)

    if is_github:
        time.sleep(GITHUB_DELAY)
        content.readme = fetch_github_readme(link, verbose=verbose)
        if verbose:
            if content.readme:
                print(f"    README: {len(content.readme)} chars", file=sys.stderr)
            else:
                print(f"    README: not found", file=sys.stderr)
    else:
        content.homepage = fetch_webpage_content(link)
        if verbose:
            if content.homepage:
                print(f"    Homepage: {len(content.homepage)} chars", file=sys.stderr)
            else:
                print(f"    Homepage: not found", file=sys.stderr)

    return content


def update_yaml_file(filepath: Path, entries: list):
    """Write updated entries back to YAML file."""
    with open(filepath, "w", encoding="utf-8") as f:
        f.write("---\n")
        yaml.dump(entries, f, default_flow_style=False,
                  allow_unicode=True, sort_keys=False)


def run_interactive_mode(plugins_dir: Path, files_to_process: list, args) -> int:
    """
    Interactive mode: fetch content and output structured JSON for AI tools.

    Output format:
    {
        "mode": "interactive",
        "plugins_dir": "/path/to/plugins",
        "plugins": [
            {
                "name": "Plugin Name",
                "link": "https://...",
                "description": "...",
                "category": "colors",
                "filepath": "/path/to/colors.yml",
                "index": 0,
                "readme": "README content...",
                "is_github": true
            },
            ...
        ],
        "instructions": "Generate summaries for each plugin..."
    }
    """
    plugins_data = []
    processed = 0

    print(f"Fetching content for up to {args.limit} plugins...", file=sys.stderr)
    print(file=sys.stderr)

    for filepath, entries in files_to_process:
        if processed >= args.limit:
            break

        print(f"{filepath.name}:", file=sys.stderr)

        for i, entry in enumerate(entries):
            if processed >= args.limit:
                break

            # Skip if already has summary (unless processing specific plugin)
            if args.missing and entry.get("summary"):
                continue

            # Skip if processing specific plugin and this isn't it
            if args.plugin and entry.get("plugin", "").lower() != args.plugin.lower():
                continue

            content = fetch_plugin_content(entry, filepath, i, verbose=True)
            plugins_data.append(content.to_dict())
            processed += 1

        print(file=sys.stderr)

    # Output structured JSON to stdout
    output = {
        "mode": "interactive",
        "plugins_dir": str(plugins_dir),
        "count": len(plugins_data),
        "plugins": plugins_data,
        "instructions": """Generate a summary for each plugin based on its description and fetched content (readme/homepage).

Each summary should be 2-4 sentences covering:
1. Main functionality
2. Key features/capabilities
3. Maintenance status (if evident)
4. Notable technical details

After generating summaries, update the YAML files by adding a 'summary' field to each plugin entry.
The 'filepath' and 'index' fields indicate where to update."""
    }

    print(json.dumps(output, indent=2, ensure_ascii=False))

    print(f"\nOutput {len(plugins_data)} plugins for summary generation.", file=sys.stderr)
    return 0


def run_api_mode(plugins_dir: Path, files_to_process: list, args) -> int:
    """API mode: batch process with Anthropic API."""
    processed = 0
    updated = 0

    print(f"Processing up to {args.limit} plugins with API...", file=sys.stderr)
    print(file=sys.stderr)

    for filepath, entries in files_to_process:
        if processed >= args.limit:
            break

        print(f"{filepath.name}:", file=sys.stderr)
        modified = False

        for i, entry in enumerate(entries):
            if processed >= args.limit:
                break

            if args.missing and entry.get("summary"):
                continue

            if args.plugin and entry.get("plugin", "").lower() != args.plugin.lower():
                continue

            # Fetch content
            content = fetch_plugin_content(entry, filepath, i, verbose=True)

            # Generate prompt and call API
            prompt = create_summary_prompt(content)

            time.sleep(LLM_DELAY)
            summary = generate_summary_with_api(prompt, args.api_key)

            if summary:
                entry["summary"] = summary
                modified = True
                updated += 1
                print(f"    Summary: {len(summary)} chars", file=sys.stderr)
            else:
                print(f"    Summary: FAILED", file=sys.stderr)

            processed += 1

        if modified:
            update_yaml_file(filepath, entries)
            print(f"  Saved {filepath.name}", file=sys.stderr)

        print(file=sys.stderr)

    print("=" * 50, file=sys.stderr)
    print(f"Processed: {processed}", file=sys.stderr)
    print(f"Updated:   {updated}", file=sys.stderr)

    return 0


def run_dry_run(plugins_dir: Path, files_to_process: list, args) -> int:
    """Dry run: show what would be processed."""
    processed = 0

    print(f"[DRY RUN] Would process up to {args.limit} plugins", file=sys.stderr)
    print(file=sys.stderr)

    for filepath, entries in files_to_process:
        if processed >= args.limit:
            break

        print(f"{filepath.name}:", file=sys.stderr)

        for entry in entries:
            if processed >= args.limit:
                break

            if args.missing and entry.get("summary"):
                continue

            if args.plugin and entry.get("plugin", "").lower() != args.plugin.lower():
                continue

            name = entry.get("plugin", "Unknown")
            link = entry.get("link", "")
            is_github = "github.com" in link.lower()

            print(f"  {name}", file=sys.stderr)
            print(f"    Link: {link}", file=sys.stderr)
            print(f"    Source: {'GitHub README' if is_github else 'Homepage'}", file=sys.stderr)

            processed += 1

        print(file=sys.stderr)

    print(f"Would process {processed} plugins", file=sys.stderr)
    return 0


def main():
    parser = argparse.ArgumentParser(
        description="Generate plugin summaries",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument("--api-key",
                        help="Anthropic API key for batch processing. If not set, outputs JSON for AI tools.")
    parser.add_argument("--category", help="Process plugins in this category")
    parser.add_argument("--plugin", help="Process specific plugin by name")
    parser.add_argument("--missing", action="store_true",
                        help="Only process plugins without summaries")
    parser.add_argument("--limit", type=int, default=5,
                        help="Maximum number of plugins to process (default: 5)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Show what would be processed without fetching or generating")
    args = parser.parse_args()

    # Find plugins directory
    skill_root = Path(__file__).parent.parent.parent
    plugins_dir = skill_root / "references" / "plugins"

    if not plugins_dir.exists():
        print(f"Error: Plugins directory not found: {plugins_dir}", file=sys.stderr)
        return 1

    # Load plugins based on options
    files_to_process = []

    if args.plugin:
        result = find_plugin_by_name(plugins_dir, args.plugin)
        if result:
            filepath, entries, idx = result
            files_to_process = [(filepath, entries)]
            print(f"Found plugin '{args.plugin}' in {filepath.name}", file=sys.stderr)
        else:
            print(f"Plugin not found: {args.plugin}", file=sys.stderr)
            return 1
    elif args.category:
        files_to_process = load_plugins_by_category(plugins_dir, args.category)
        if files_to_process:
            print(f"Category '{args.category}': {len(files_to_process[0][1])} plugins", file=sys.stderr)
        else:
            print(f"Category not found: {args.category}", file=sys.stderr)
            return 1
    else:
        files_to_process = load_all_plugins(plugins_dir)
        total = sum(len(entries) for _, entries in files_to_process)
        print(f"All categories: {total} plugins in {len(files_to_process)} files", file=sys.stderr)

    print(file=sys.stderr)

    # Run appropriate mode
    if args.dry_run:
        return run_dry_run(plugins_dir, files_to_process, args)
    elif args.api_key:
        return run_api_mode(plugins_dir, files_to_process, args)
    else:
        return run_interactive_mode(plugins_dir, files_to_process, args)


if __name__ == "__main__":
    sys.exit(main())
