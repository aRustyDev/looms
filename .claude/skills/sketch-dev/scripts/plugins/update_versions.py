#!/usr/bin/env python3
"""
Update Plugin Versions

Fetches current version info for plugins without modifying other fields.
For GitHub repos: fetches latest commit SHA
For non-GitHub: leaves as-is (manual update needed)

Usage:
    python update_versions.py [--dry-run] [--github-only] [--limit N]

Rate Limits:
    - Unauthenticated: 60 requests/hour (adds 1s delay between requests)
    - With `gh` CLI: 5,000 requests/hour (recommended)

To use authenticated requests, ensure `gh` CLI is installed and authenticated:
    gh auth login
"""

import argparse
import re
import yaml
import json
import subprocess
import time
import shutil
from pathlib import Path
from typing import Optional


# Rate limiting
REQUEST_DELAY = 1.0  # Seconds between unauthenticated requests
GH_CLI_AVAILABLE = shutil.which("gh") is not None


def check_rate_limit() -> dict:
    """Check current GitHub API rate limit status."""
    if GH_CLI_AVAILABLE:
        try:
            result = subprocess.run(
                ["gh", "api", "rate_limit"],
                capture_output=True, text=True, timeout=10
            )
            if result.returncode == 0:
                data = json.loads(result.stdout)
                core = data.get("resources", {}).get("core", {})
                return {
                    "remaining": core.get("remaining", 0),
                    "limit": core.get("limit", 0),
                    "reset": core.get("reset", 0),
                    "authenticated": core.get("limit", 0) > 60
                }
        except Exception:
            pass

    # Fallback: check via curl
    try:
        result = subprocess.run(
            ["curl", "-s", "https://api.github.com/rate_limit"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            data = json.loads(result.stdout)
            core = data.get("resources", {}).get("core", {})
            return {
                "remaining": core.get("remaining", 0),
                "limit": core.get("limit", 0),
                "reset": core.get("reset", 0),
                "authenticated": False
            }
    except Exception:
        pass

    return {"remaining": 0, "limit": 60, "reset": 0, "authenticated": False}


def fetch_github_sha(repo_url: str, use_gh_cli: bool = True) -> Optional[str]:
    """
    Fetch latest commit SHA for a GitHub repo.

    Args:
        repo_url: GitHub repository URL
        use_gh_cli: Use gh CLI for authenticated requests (recommended)
    """
    match = re.search(r"github\.com/([^/]+)/([^/]+)", repo_url)
    if not match:
        return None

    owner, repo = match.groups()
    repo = repo.removesuffix(".git").split("#")[0]  # Remove .git suffix and anchors

    # Try gh CLI first (authenticated, higher rate limit)
    if use_gh_cli and GH_CLI_AVAILABLE:
        try:
            result = subprocess.run(
                ["gh", "api", f"repos/{owner}/{repo}/commits?per_page=1"],
                capture_output=True, text=True, timeout=15
            )
            if result.returncode == 0:
                data = json.loads(result.stdout)
                if isinstance(data, list) and len(data) > 0:
                    return data[0].get("sha")
        except Exception:
            pass

    # Fallback to curl (unauthenticated)
    api_url = f"https://api.github.com/repos/{owner}/{repo}/commits?per_page=1"
    try:
        result = subprocess.run(
            ["curl", "-s", "-f", api_url],
            capture_output=True, text=True, timeout=15
        )
        if result.returncode == 0:
            data = json.loads(result.stdout)
            if isinstance(data, list) and len(data) > 0:
                return data[0].get("sha")
    except Exception:
        pass

    return None


def update_file(
    filepath: Path,
    dry_run: bool = True,
    github_only: bool = True,
    use_gh_cli: bool = True,
    delay: float = 0.0
) -> dict:
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
            # Rate limiting delay
            if delay > 0:
                time.sleep(delay)

            sha = fetch_github_sha(link, use_gh_cli=use_gh_cli)
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
    parser = argparse.ArgumentParser(
        description="Update plugin versions",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Rate Limits:
  Without gh CLI: 60 requests/hour (1s delay added automatically)
  With gh CLI:    5,000 requests/hour (recommended)

To authenticate: gh auth login
"""
    )
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
    parser.add_argument("--no-gh-cli", action="store_true",
                        help="Don't use gh CLI (use unauthenticated API)")
    parser.add_argument("--no-delay", action="store_true",
                        help="Disable rate limit delay (may hit limits)")
    args = parser.parse_args()

    github_only = not args.all
    use_gh_cli = not args.no_gh_cli and GH_CLI_AVAILABLE

    # Check rate limit status
    rate_info = check_rate_limit()
    print(f"{'[DRY RUN] ' if args.dry_run else ''}Updating plugin versions...")
    print()
    print("GitHub API Rate Limit:")
    print(f"  Remaining: {rate_info['remaining']}/{rate_info['limit']}")
    print(f"  Authenticated: {'Yes (gh CLI)' if rate_info['authenticated'] else 'No'}")

    if not rate_info['authenticated'] and not args.no_delay:
        print(f"  Delay: {REQUEST_DELAY}s between requests (use --no-delay to disable)")
    print()

    if rate_info['remaining'] < 10 and not args.dry_run:
        import datetime
        reset_time = datetime.datetime.fromtimestamp(rate_info['reset'])
        print(f"Warning: Rate limit nearly exhausted. Resets at {reset_time}")
        print("Consider waiting or using `gh auth login` for higher limits.")
        print()

    # Determine delay
    delay = 0.0
    if not rate_info['authenticated'] and not args.no_delay:
        delay = REQUEST_DELAY

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
        stats = update_file(
            filepath,
            dry_run=args.dry_run,
            github_only=github_only,
            use_gh_cli=use_gh_cli,
            delay=delay
        )

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
