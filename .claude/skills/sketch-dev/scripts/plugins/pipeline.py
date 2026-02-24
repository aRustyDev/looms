#!/usr/bin/env python3
"""
Plugin Tracking Pipeline

Orchestrates the full plugin tracking workflow:
1. Scrape - Fetch plugins from Sketch extensions page
2. Diff - Compare against YAML state to detect changes
3. Review - Queue changes for LLM review (MCP-gated)
4. Update - Apply reviewed changes to YAML files

Usage:
    # Show current stats
    python pipeline.py stats

    # Check for updates (direct Crawl4AI - recommended)
    python pipeline.py check --scrape

    # Check for updates (MCP input)
    python pipeline.py check --mcp-input /tmp/crawl4ai-result.json

    # Run full pipeline (direct scraping)
    python pipeline.py run --scrape

    # Run full pipeline (MCP input)
    python pipeline.py run --mcp-input /tmp/crawl4ai-result.json

    # Process review queue
    python pipeline.py review --queue /tmp/review-queue.json

    # Apply reviewed changes
    python pipeline.py apply --queue /tmp/review-queue.json

Requirements:
    pip install crawl4ai pyyaml
    crawl4ai-setup  # Install browser for Crawl4AI
"""

import argparse
import json
import sys
from pathlib import Path
from datetime import datetime

from lib import (
    PluginState,
    PluginScraper,
    PluginDiffer,
    PluginCategorizer,
    ReviewQueue,
    ReviewAction,
    ChangeType,
    create_review_prompt,
)


def get_plugins_dir() -> Path:
    """Get the plugins YAML directory."""
    # Path: pipeline.py -> plugins -> scripts -> sketch-dev -> references/plugins
    skill_root = Path(__file__).parent.parent.parent
    return skill_root / "references" / "plugins"


def cmd_stats(args):
    """Show current state statistics."""
    state = PluginState(get_plugins_dir())
    stats = state.get_stats()

    print("Plugin State Statistics")
    print("=" * 40)
    print(f"Total plugins:     {stats['total']}")
    print(f"GitHub hosted:     {stats['github']}")
    print(f"Non-GitHub:        {stats['non_github']}")
    print(f"Categories:        {stats['categories']}")
    print()
    print("Watch Status:")
    print(f"  Watched:         {stats['watched']}")
    print(f"  Ignored:         {stats['ignored']}")
    print(f"  Major only:      {stats['major_only']}")


def cmd_check(args):
    """Check for updates without making changes."""
    state = PluginState(get_plugins_dir())
    scraper = PluginScraper()

    print("Checking for plugin updates...")
    print(f"Loaded {len(state.plugins)} plugins from YAML files")
    print()

    scraped = None

    # Direct scraping with Crawl4AI
    if args.scrape:
        print("Scraping with Crawl4AI...")
        scraped = scraper.scrape_sync()
        if scraper.last_error:
            print(f"Error: {scraper.last_error}")
            sys.exit(1)
        print(f"Scraped {len(scraped)} plugins")

    # MCP input file
    elif args.mcp_input:
        # Process provided MCP result
        with open(args.mcp_input, "r", encoding="utf-8") as f:
            content = f.read()

        # Detect format (JSON or markdown)
        if content.strip().startswith("["):
            scraped = scraper.scrape_from_json(content)
        else:
            scraped = scraper.scrape_from_markdown(content)

        print(f"Scraped {len(scraped)} plugins from input file")

    else:
        # Show instructions
        mcp_call = scraper.generate_mcp_call()
        print("To check for updates, either:")
        print()
        print("  1. Use --scrape flag (requires Crawl4AI):")
        print("     python pipeline.py check --scrape")
        print()
        print("  2. Provide MCP scrape result:")
        print(f"     Tool: {mcp_call['tool']}")
        print(f"     URL:  {mcp_call['params']['url']}")
        print("     Then: python pipeline.py check --mcp-input /path/to/result.json")
        return

    # Diff
    differ = PluginDiffer(state)
    results = differ.diff_all(scraped)
    summary = differ.get_summary(results)

    print()
    print("Diff Summary:")
    print("-" * 40)
    print(f"New plugins:       {summary['new']}")
    print(f"Major updates:     {summary['major_updates']}")
    print(f"Minor updates:     {summary['minor_updates']}")
    print(f"Unchanged:         {summary['unchanged']}")
    print(f"Removed:           {summary['removed']}")
    print()
    print(f"Need review:       {summary['needs_review']}")
    print(f"Skipped (ignored): {summary['skipped']}")

    # Show actionable items
    actionable = differ.filter_actionable(results)
    if actionable:
        print()
        print("Actionable Items:")
        print("-" * 40)
        for r in actionable[:20]:  # Limit output
            status = "NEW" if r.change_type == ChangeType.NEW else r.change_type.value.upper()
            print(f"  [{status}] {r.plugin.name}")
            if r.reason:
                print(f"          {r.reason}")

        if len(actionable) > 20:
            print(f"  ... and {len(actionable) - 20} more")


def cmd_run(args):
    """Run full pipeline and create review queue."""
    state = PluginState(get_plugins_dir())
    scraper = PluginScraper()

    scraped = None

    # Direct scraping with Crawl4AI
    if args.scrape:
        print("Scraping with Crawl4AI...")
        scraped = scraper.scrape_sync()
        if scraper.last_error:
            print(f"Error: {scraper.last_error}")
            sys.exit(1)

    # MCP input file
    elif args.mcp_input:
        with open(args.mcp_input, "r", encoding="utf-8") as f:
            content = f.read()

        if content.strip().startswith("["):
            scraped = scraper.scrape_from_json(content)
        else:
            scraped = scraper.scrape_from_markdown(content)

    else:
        print("Error: Either --scrape or --mcp-input required")
        print()
        print("Options:")
        print("  python pipeline.py run --scrape")
        print("  python pipeline.py run --mcp-input /path/to/result.json")
        sys.exit(1)

    print(f"Loaded {len(state.plugins)} existing plugins")
    print(f"Scraped {len(scraped)} plugins")

    # Diff
    differ = PluginDiffer(state)
    results = differ.diff_all(scraped)
    summary = differ.get_summary(results)

    print()
    print(f"New: {summary['new']}, Major: {summary['major_updates']}, "
          f"Minor: {summary['minor_updates']}, Unchanged: {summary['unchanged']}")

    # Create review queue
    queue = ReviewQueue()
    added = queue.populate_from_diff(results)

    if added == 0:
        print()
        print("No items need review. State is up to date.")
        return

    # Save queue
    queue_path = args.queue or "/tmp/plugin-review-queue.json"
    queue.save(queue_path)

    print()
    print(f"Created review queue with {added} items: {queue_path}")
    print()
    print("Next steps:")
    print(f"  1. Review items: python pipeline.py review --queue {queue_path}")
    print(f"  2. Apply changes: python pipeline.py apply --queue {queue_path}")


def cmd_review(args):
    """Interactive review of queued items."""
    if not args.queue:
        print("Error: --queue required for 'review' command")
        sys.exit(1)

    # Load queue
    with open(args.queue, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Loaded queue with {data['stats']['total']} items")
    print(f"Pending: {data['stats']['pending']}, Reviewed: {data['stats']['reviewed']}")
    print()

    # Show pending items
    pending = [i for i in data["items"] if not i["reviewed"]]
    if not pending:
        print("No pending items to review.")
        return

    print("Pending Items:")
    print("-" * 60)
    for i, item in enumerate(pending, 1):
        print(f"{i}. [{item['change_type'].upper()}] {item['plugin_name']}")
        print(f"   Link: {item['plugin_link']}")
        if item.get("suggested_category"):
            print(f"   Category: {item['suggested_category']}")
        if item.get("reason"):
            print(f"   Reason: {item['reason']}")
        print()

    print()
    print("To review an item with LLM, use the create_review_prompt() function")
    print("or process the queue programmatically with ReviewQueue.mark_reviewed()")


def cmd_apply(args):
    """Apply reviewed items to state."""
    if not args.queue:
        print("Error: --queue required for 'apply' command")
        sys.exit(1)

    # This is a simplified version - full implementation would
    # reload the queue and apply to state
    print("Apply command - reconstructing from saved queue")
    print()
    print("Note: For full implementation, the review queue should be")
    print("processed programmatically with ReviewQueue.apply_to_state()")
    print()
    print("Manual workflow:")
    print("  1. Load state: state = PluginState()")
    print("  2. For each reviewed item, call state.add_or_update()")
    print("  3. Save state: state.save()")


def cmd_mcp_info(args):
    """Show MCP tool call information for scraping."""
    scraper = PluginScraper()
    mcp_call = scraper.generate_mcp_call()

    print("MCP Tool Call for Scraping")
    print("=" * 40)
    print(f"Tool: {mcp_call['tool']}")
    print(f"Parameters:")
    print(json.dumps(mcp_call["params"], indent=2))
    print()
    print("Example Claude Code usage:")
    print('  Use the mcp__crawl4ai__md tool with:')
    print(f'    url: "{mcp_call["params"]["url"]}"')
    print(f'    f: "{mcp_call["params"]["f"]}"')


def main():
    parser = argparse.ArgumentParser(
        description="Sketch Plugin Tracking Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # stats
    p_stats = subparsers.add_parser("stats", help="Show state statistics")
    p_stats.set_defaults(func=cmd_stats)

    # check
    p_check = subparsers.add_parser("check", help="Check for updates")
    p_check.add_argument("--scrape", action="store_true",
                         help="Scrape directly using Crawl4AI")
    p_check.add_argument("--mcp-input", help="Path to MCP scrape result")
    p_check.set_defaults(func=cmd_check)

    # run
    p_run = subparsers.add_parser("run", help="Run full pipeline")
    p_run.add_argument("--scrape", action="store_true",
                       help="Scrape directly using Crawl4AI")
    p_run.add_argument("--mcp-input", help="Path to MCP scrape result")
    p_run.add_argument("--queue", help="Path to save review queue")
    p_run.set_defaults(func=cmd_run)

    # review
    p_review = subparsers.add_parser("review", help="Review queued items")
    p_review.add_argument("--queue", required=True, help="Path to review queue")
    p_review.set_defaults(func=cmd_review)

    # apply
    p_apply = subparsers.add_parser("apply", help="Apply reviewed changes")
    p_apply.add_argument("--queue", required=True, help="Path to review queue")
    p_apply.set_defaults(func=cmd_apply)

    # mcp-info
    p_mcp = subparsers.add_parser("mcp-info", help="Show MCP scraping info")
    p_mcp.set_defaults(func=cmd_mcp_info)

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    args.func(args)


if __name__ == "__main__":
    main()
