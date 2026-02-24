"""
Sketch Plugin Tracking Library

Modular components for scraping, tracking, and categorizing Sketch plugins.
Uses YAML files in references/plugins/*.yml as the source of truth.
"""

from .state import PluginState, PluginRecord, WatchStatus
from .scraper import PluginScraper, ScrapedPlugin
from .differ import PluginDiffer, ChangeType, DiffResult
from .categorizer import PluginCategorizer, CATEGORIES, to_filename, from_filename
from .reviewer import ReviewQueue, ReviewItem, ReviewAction, create_review_prompt

__all__ = [
    # State management
    "PluginState",
    "PluginRecord",
    "WatchStatus",
    # Scraping
    "PluginScraper",
    "ScrapedPlugin",
    # Diffing
    "PluginDiffer",
    "ChangeType",
    "DiffResult",
    # Categorization
    "PluginCategorizer",
    "CATEGORIES",
    "to_filename",
    "from_filename",
    # Review
    "ReviewQueue",
    "ReviewItem",
    "ReviewAction",
    "create_review_prompt",
]
