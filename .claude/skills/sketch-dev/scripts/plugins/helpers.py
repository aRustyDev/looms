#!/usr/bin/env python3
"""
Helper commands for just scrape module.

These are extracted to avoid just's parser issues with inline Python.
"""

import sys
import json

def cmd_crawl(output_path: str):
    """Scrape plugins and save to JSON."""
    from lib import PluginScraper

    print("Scraping Sketch plugins...")
    scraper = PluginScraper()
    plugins = scraper.scrape_sync()

    if scraper.last_error:
        print(f"Error: {scraper.last_error}")
        sys.exit(1)

    print(f"Scraped {len(plugins)} plugins")

    data = [{
        "name": p.name,
        "link": p.link,
        "description": p.description,
        "author": p.author,
        "updated": p.updated,
        "is_github": p.is_github
    } for p in plugins]

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Saved to {output_path}")


def cmd_load_state():
    """Show current plugin state."""
    from lib import PluginState

    state = PluginState()
    stats = state.get_stats()

    print("=== Plugin State ===")
    print(f"Total plugins:  {stats['total']}")
    print(f"GitHub hosted:  {stats['github']}")
    print(f"Non-GitHub:     {stats['non_github']}")
    print(f"Categories:     {stats['categories']}")
    print()
    print("Watch Status:")
    print(f"  Watched:      {stats['watched']}")
    print(f"  Ignored:      {stats['ignored']}")
    print(f"  Major only:   {stats['major_only']}")


def cmd_list_category(category: str):
    """List plugins in a category."""
    from lib import PluginState

    state = PluginState()
    plugins = state.get_by_category(category)

    print(f"=== {category} ({len(plugins)} plugins) ===")
    for p in sorted(plugins, key=lambda x: x.name.lower()):
        github = "(GitHub)" if p.is_github else ""
        print(f"  {p.name} {github}")
        print(f"    {p.link}")


def cmd_search(query: str):
    """Search plugins by name or description."""
    from lib import PluginState

    state = PluginState()
    query_lower = query.lower()

    matches = [
        p for p in state.plugins.values()
        if query_lower in p.name.lower() or query_lower in p.description.lower()
    ]

    print(f'Found {len(matches)} plugins matching "{query}":')
    for p in sorted(matches, key=lambda x: x.name.lower())[:20]:
        print(f"  [{p.category}] {p.name}")
        print(f"    {p.link}")

    if len(matches) > 20:
        print(f"  ... and {len(matches) - 20} more")


def cmd_watch(link: str, status: str):
    """Set watch status for a plugin."""
    from lib import PluginState, WatchStatus

    state = PluginState()
    watch_status = WatchStatus(status)

    state.set_watch_status(link, watch_status)
    state.save()

    plugin = state.get_plugin(link)
    if plugin:
        print(f"Set {plugin.name} to {watch_status.value}")
    else:
        print(f"Plugin not found: {link}")


def main():
    if len(sys.argv) < 2:
        print("Usage: helpers.py <command> [args...]")
        print("Commands: crawl, load-state, list-category, search, watch")
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == "crawl":
        output = sys.argv[2] if len(sys.argv) > 2 else "/tmp/sketch-plugins-scrape.json"
        cmd_crawl(output)
    elif cmd == "load-state":
        cmd_load_state()
    elif cmd == "list-category":
        if len(sys.argv) < 3:
            print("Usage: helpers.py list-category <category>")
            sys.exit(1)
        cmd_list_category(sys.argv[2])
    elif cmd == "search":
        if len(sys.argv) < 3:
            print("Usage: helpers.py search <query>")
            sys.exit(1)
        cmd_search(sys.argv[2])
    elif cmd == "watch":
        if len(sys.argv) < 4:
            print("Usage: helpers.py watch <link> <status>")
            sys.exit(1)
        cmd_watch(sys.argv[2], sys.argv[3])
    else:
        print(f"Unknown command: {cmd}")
        sys.exit(1)


if __name__ == "__main__":
    main()
