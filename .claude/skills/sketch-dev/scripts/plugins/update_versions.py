#!/usr/bin/env python3
"""
Update Plugin Versions

Fetches current version info for plugins without modifying other fields.
For GitHub repos: fetches latest commit SHA
For non-GitHub: leaves as-is (manual update needed)

Usage:
    python update_versions.py [--dry-run] [--github-only] [--limit N]
"""

import argparse
import re
import yaml
import json
import subprocess
from pathlib import Path
from typing import Optional
from concurrent.futures import ThreadPoolExecutor, as_completed


def fetch_github_sha(repo_url: str) -> Optional[str]:
    """Fetch latest commit SHA for a GitHub repo."""
    match = re.search(r"github\.com/([^/]+)/([^/]+)", repo_url)
    if not match:
        return None

    owner, repo = match.groups()
    repo = repo.rstrip(".git").split("#")[0]  # Remove .git and anchors

    api_url = f"https://api.github.com/repos/{owner}/{repo}/commits?per_page=1"

    try:
        result = subprocess.run(
            ["curl", "-s", "-f", api_url],
            capture_output=True,
            text=True,
            timeout=15
        )
        if result.returncode == 0:
            data = json.loads(result.stdout)
            if isinstance(data, list) and len(data) > 0:
                return data[0].get("sha")
    except Exception:
        pass

    return None


def update_file(filepath: Path, dry_run: bool = True, github_only: bool = True) -> dict:
    """
    Update versions in a single YAML file.

    Returns dict with counts: updated, skipped, failed
    """
    with open(filepath, "r", encoding="utf-8") as f:
        entries = yaml.safe_load(f)

    if not entries:
        return {"updated": 0, "skipped": 0, "failed": 0}

    stats = {"updated": 0, "skipped": 0, "failed": 0}
    modified = False

    for entry in entries:
        link = entry.get("link", "")
        is_github = "github.com" in link.lower()

        # Skip non-GitHub if github_only
        if github_only and not is_github:
            stats["skipped"] += 1
            continue

        # Skip if already has a real version (not "unknown")
        current_version = entry.get("version", {})
        if isinstance(current_version, dict):
            current_value = current_version.get("value", "unknown")
        else:
            current_value = str(current_version)

        if current_value != "unknown" and len(current_value) == 40:
            # Already has a SHA
            stats["skipped"] += 1
            continue

        if is_github:
            sha = fetch_github_sha(link)
            if sha:
                entry["version"] = {"value": sha}
                stats["updated"] += 1
                modified = True
                print(f"  ✓ {entry.get('plugin', '?')}: {sha[:8]}...")
            else:
                stats["failed"] += 1
                print(f"  ✗ {entry.get('plugin', '?')}: failed to fetch")
        else:
            stats["skipped"] += 1

    if modified and not dry_run:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write("---\n")
            yaml.dump(entries, f, default_flow_style=False,
                      allow_unicode=True, sort_keys=False)

    return stats


def main():
    parser = argparse.ArgumentParser(description="Update plugin versions")
    parser.add_argument("--dry-run", action="store_true",
                        help="Show what would be changed without modifying files")
    parser.add_argument("--github-only", action="store_true", default=True,
                        help="Only update GitHub plugins (default)")
    parser.add_argument("--all", action="store_true",
                        help="Update all plugins (not just GitHub)")
    parser.add_argument("--limit", type=int, default=0,
                        help="Limit number of plugins to update (0 = no limit)")
    parser.add_argument("--file", type=str,
                        help="Update single file instead of all")
    args = parser.parse_args()

    github_only = not args.all

    # Find plugins directory
    skill_root = Path(__file__).parent.parent.parent
    plugins_dir = skill_root / "references" / "plugins"

    if not plugins_dir.exists():
        print(f"Error: Plugins directory not found: {plugins_dir}")
        return 1

    if args.file:
        files = [Path(args.file)]
    else:
        files = sorted(plugins_dir.glob("*.yml"))

    print(f"{'[DRY RUN] ' if args.dry_run else ''}Updating plugin versions...")
    print(f"GitHub only: {github_only}")
    if args.limit:
        print(f"Limit: {args.limit} plugins")
    print()

    total_stats = {"updated": 0, "skipped": 0, "failed": 0}
    update_count = 0

    for filepath in files:
        if args.limit and update_count >= args.limit:
            break

        print(f"{filepath.name}:")
        stats = update_file(filepath, dry_run=args.dry_run, github_only=github_only)

        total_stats["updated"] += stats["updated"]
        total_stats["skipped"] += stats["skipped"]
        total_stats["failed"] += stats["failed"]
        update_count += stats["updated"]

        if stats["updated"] == 0 and stats["failed"] == 0:
            print("  (no updates needed)")
        print()

    print("=" * 50)
    print(f"Updated: {total_stats['updated']}")
    print(f"Skipped: {total_stats['skipped']}")
    print(f"Failed:  {total_stats['failed']}")

    if args.dry_run:
        print()
        print("Run without --dry-run to apply changes")

    return 0


if __name__ == "__main__":
    exit(main())
