"""
Plugin State Management

Tracks plugin metadata using YAML files as the source of truth.
The YAML files in references/plugins/*.yml serve as both documentation
and version tracking state.
"""

import re
import yaml
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional
from pathlib import Path


class WatchStatus(str, Enum):
    """Watch status for a plugin."""
    WATCH = "watch"           # Track all updates
    IGNORE = "ignore"         # Skip all updates
    MAJOR_ONLY = "major_only" # Only track major updates
    DEFAULT = "default"       # Use default behavior


@dataclass
class PluginRecord:
    """Record for a single plugin with tracking metadata."""
    # Core identity
    name: str
    link: str

    # Metadata
    description: str = ""
    author: str = ""
    category: str = "Other"
    last_updated: str = ""        # Date string from Sketch page

    # Tracking (optional fields, stored in YAML when set)
    github_sha: Optional[str] = None
    watch_status: WatchStatus = WatchStatus.DEFAULT
    last_reviewed: Optional[str] = None
    review_summary: Optional[str] = None

    # Computed
    is_github: bool = False
    open_source: bool = False
    tags: list = field(default_factory=list)

    @property
    def tracking_key(self) -> str:
        """Unique key for this plugin (normalized link)."""
        return self.link.lower().rstrip("/")

    @classmethod
    def from_yaml_entry(cls, entry: dict, category: str) -> "PluginRecord":
        """Create from YAML entry."""
        # Parse author and date from summary
        # Format: "By {author}. Last updated {date}."
        author = ""
        last_updated = ""
        summary = entry.get("summary", "")

        author_match = re.match(r"By ([^.]+)\.", summary)
        if author_match:
            author = author_match.group(1).strip()

        date_match = re.search(r"Last updated (.+)\.$", summary)
        if date_match:
            last_updated = date_match.group(1).strip()

        link = entry.get("link", "")
        is_github = "github.com" in link.lower()

        # Parse watch status if present
        watch_str = entry.get("watch_status", "default")
        try:
            watch_status = WatchStatus(watch_str)
        except ValueError:
            watch_status = WatchStatus.DEFAULT

        return cls(
            name=entry.get("plugin", ""),
            link=link,
            description=entry.get("description", ""),
            author=author,
            category=category,
            last_updated=last_updated,
            github_sha=entry.get("github_sha"),
            watch_status=watch_status,
            last_reviewed=entry.get("last_reviewed"),
            review_summary=entry.get("review_summary"),
            is_github=is_github,
            open_source=entry.get("open-source", is_github),
            tags=entry.get("tags", [])
        )

    def to_yaml_entry(self) -> dict:
        """Convert to YAML entry format."""
        entry = {
            "plugin": self.name,
            "link": self.link,
            "description": self.description,
            "summary": f"By {self.author}. Last updated {self.last_updated}.",
            "open-source": self.open_source,
            "tags": self.tags or [self.category.lower().replace(" ", "-").replace("/", "-")]
        }

        # Only include tracking fields if set (to keep YAML clean)
        if self.github_sha:
            entry["github_sha"] = self.github_sha
        if self.watch_status != WatchStatus.DEFAULT:
            entry["watch_status"] = self.watch_status.value
        if self.last_reviewed:
            entry["last_reviewed"] = self.last_reviewed
        if self.review_summary:
            entry["review_summary"] = self.review_summary

        return entry


class PluginState:
    """
    Manages plugin state using YAML files as the source of truth.

    The YAML files in references/plugins/*.yml serve dual purposes:
    1. Human-readable plugin documentation by category
    2. Version tracking state (dates, SHA, watch status)
    """

    def __init__(self, plugins_dir: str = None):
        """
        Initialize plugin state.

        Args:
            plugins_dir: Path to plugins YAML directory
        """
        if plugins_dir is None:
            # Default to references/plugins relative to sketch-dev skill root
            # Path: lib/state.py -> lib -> plugins -> scripts -> sketch-dev
            skill_root = Path(__file__).parent.parent.parent.parent
            plugins_dir = skill_root / "references" / "plugins"

        self.plugins_dir = Path(plugins_dir)
        self.plugins: dict[str, PluginRecord] = {}
        self._category_map: dict[str, str] = {}  # link -> category

        self._load()

    def _load(self):
        """Load state from all YAML files."""
        if not self.plugins_dir.exists():
            return

        for yaml_file in self.plugins_dir.glob("*.yml"):
            # Derive category from filename
            category = self._filename_to_category(yaml_file.stem)

            try:
                with open(yaml_file, "r", encoding="utf-8") as f:
                    entries = yaml.safe_load(f)

                if not entries:
                    continue

                for entry in entries:
                    record = PluginRecord.from_yaml_entry(entry, category)
                    key = record.tracking_key
                    self.plugins[key] = record
                    self._category_map[key] = category

            except Exception as e:
                print(f"Warning: Failed to load {yaml_file}: {e}")

    def _filename_to_category(self, stem: str) -> str:
        """Convert filename stem to category name."""
        # Map common patterns
        mappings = {
            "a11y": "A11y",
            "ai": "AI",
            "spec---measure": "SPEC / Measure",
            "images-photos": "Images/Photos",
            "copy-paste": "Copy/Paste",
            "dev-tools": "Dev Tools",
        }

        if stem in mappings:
            return mappings[stem]

        # Title case with special handling
        return stem.replace("-", " ").title()

    def save(self):
        """Save state back to YAML files."""
        # Group plugins by category
        by_category: dict[str, list[PluginRecord]] = {}

        for record in self.plugins.values():
            cat = record.category
            if cat not in by_category:
                by_category[cat] = []
            by_category[cat].append(record)

        # Ensure directory exists
        self.plugins_dir.mkdir(parents=True, exist_ok=True)

        # Write each category file
        for category, records in by_category.items():
            filename = self._category_to_filename(category)
            filepath = self.plugins_dir / filename

            entries = [r.to_yaml_entry() for r in records]

            with open(filepath, "w", encoding="utf-8") as f:
                f.write("---\n")
                yaml.dump(entries, f, default_flow_style=False,
                          allow_unicode=True, sort_keys=False)

    def _category_to_filename(self, category: str) -> str:
        """Convert category name to filename."""
        return category.lower().replace(" ", "-").replace("/", "-") + ".yml"

    def get_plugin(self, link: str) -> Optional[PluginRecord]:
        """Get plugin by link."""
        key = link.lower().rstrip("/")
        return self.plugins.get(key)

    def add_or_update(self, record: PluginRecord) -> bool:
        """
        Add or update a plugin record.

        Returns:
            True if this is a new plugin, False if updated
        """
        key = record.tracking_key
        is_new = key not in self.plugins

        self.plugins[key] = record
        self._category_map[key] = record.category
        return is_new

    def remove(self, link: str) -> bool:
        """
        Remove a plugin.

        Returns:
            True if removed, False if not found
        """
        key = link.lower().rstrip("/")
        if key in self.plugins:
            del self.plugins[key]
            self._category_map.pop(key, None)
            return True
        return False

    def set_watch_status(self, link: str, status: WatchStatus):
        """Set watch status for a plugin."""
        key = link.lower().rstrip("/")
        if key in self.plugins:
            self.plugins[key].watch_status = status

    def get_by_status(self, status: WatchStatus) -> list[PluginRecord]:
        """Get all plugins with a specific watch status."""
        return [p for p in self.plugins.values() if p.watch_status == status]

    def get_watched(self) -> list[PluginRecord]:
        """Get all explicitly watched plugins."""
        return self.get_by_status(WatchStatus.WATCH)

    def get_ignored(self) -> list[PluginRecord]:
        """Get all ignored plugins."""
        return self.get_by_status(WatchStatus.IGNORE)

    def get_by_category(self, category: str) -> list[PluginRecord]:
        """Get all plugins in a category."""
        return [p for p in self.plugins.values() if p.category == category]

    def get_github_plugins(self) -> list[PluginRecord]:
        """Get all GitHub-hosted plugins."""
        return [p for p in self.plugins.values() if p.is_github]

    def get_stats(self) -> dict:
        """Get summary statistics."""
        watched = sum(1 for p in self.plugins.values()
                      if p.watch_status == WatchStatus.WATCH)
        ignored = sum(1 for p in self.plugins.values()
                      if p.watch_status == WatchStatus.IGNORE)
        major_only = sum(1 for p in self.plugins.values()
                         if p.watch_status == WatchStatus.MAJOR_ONLY)

        return {
            "total": len(self.plugins),
            "watched": watched,
            "ignored": ignored,
            "major_only": major_only,
            "github": sum(1 for p in self.plugins.values() if p.is_github),
            "non_github": sum(1 for p in self.plugins.values() if not p.is_github),
            "categories": len(set(p.category for p in self.plugins.values())),
        }

    def get_all_links(self) -> set[str]:
        """Get all tracked plugin links (normalized)."""
        return set(self.plugins.keys())
