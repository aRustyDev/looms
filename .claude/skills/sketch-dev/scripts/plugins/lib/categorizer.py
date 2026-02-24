"""
Plugin Categorizer

Keyword-based categorization for Sketch plugins.
"""

from typing import Optional


# Category definitions with priority-ordered keyword patterns
# More specific patterns come first to avoid mis-categorization
CATEGORIES = {
    # Accessibility
    "A11y": [
        "accessibility", "wcag", "color blind", "colorblind", "stark",
        "a11y", "contrast ratio", "contrast check", "pass/fail"
    ],

    # AI-powered
    "AI": [
        "codia", "uxarts", "screenshot to design", "picsart", "ai-powered",
        "ai detect", "machine learning", "prediction", "heatmap"
    ],

    # Developer Handoff
    "Developer Handoff": ["zeplin", "handoff"],

    # Localization
    "Localization": [
        "localize", "localization", "translate", "crowdin", "phrase string",
        "i18n", "language", "multi language"
    ],

    # Icons
    "Icons": [
        "icon", "phosphor", "icondrop", "iconscout", "feather icon",
        "material icon", "ionicon", "fontawesome"
    ],

    # Symbol Management
    "Symbol Management": [
        "symbol", "instance", "component browser", "batch create symbol",
        "symbol locator", "symbol finder", "symbol state", "symbol legend",
        "merge duplicate symbol", "symbol organizer"
    ],

    # Override Management
    "Override Management": ["override", "killswitch"],

    # Branding
    "Branding": ["brandfolder", "brandfetch", "frontify", "uilogo", "brand asset"],

    # Library Management
    "Library Management": [
        "library", "design system", "design token", "kitchen", "style master"
    ],

    # Colors
    "Colors": [
        "color", "colour", "gradient", "palette", "swatch", "chromata",
        "hue", "saturation", "dark mode", "dark theme", "light to dark"
    ],

    # Typography
    "Typography": ["typography", "typeface", "opentype", "font family"],

    # Text
    "Text": [
        "text", "string", "lorem", "ipsum", "lippy", "find and replace",
        "title case", "rename", "font"
    ],

    # Code
    "Code": [
        "tailwind", "css", "html", "react", "code", "picasso", "imgcook",
        "codewave", "code generate"
    ],

    # SPEC / Measure
    "SPEC / Measure": [
        "spec", "measure", "meaxure", "redline", "annotation", "guide"
    ],

    # Prototyping
    "Prototyping": [
        "prototype", "proto.io", "justinmind", "overflow", "interaction",
        "hotspot", "animate", "user flow"
    ],

    # Wireframing
    "Wireframing": ["wireframe", "flow diagram"],

    # Mockups
    "Mockups": ["mockup", "device", "perspective", "isometric", "angle", "3d"],

    # Images/Photos
    "Images/Photos": [
        "unsplash", "pexels", "image", "photo", "picture", "bitmap",
        "background remov"
    ],

    # Data
    "Data": [
        "data", "faker", "avatar", "tinyface", "placeholder", "dummy",
        "random", "chinese", "dutch", "korean", "turkish"
    ],

    # Charts
    "Charts": ["chart", "graph", "diagram", "visualization"],

    # Shapes
    "Shapes": [
        "shape", "spiral", "circle", "polygon", "rough", "looper",
        "blob", "elevation shadow", "button"
    ],

    # Vectors
    "Vectors": ["svg", "vector", "svgo", "path", "boolean"],

    # Artboards
    "Artboards": ["artboard", "zerozero", "canvas"],

    # Layers
    "Layers": ["layer", "group", "flatten", "align", "order"],

    # Sizing
    "Sizing": ["resize", "scale", "size", "dimension", "pinit", "pixel", "unit"],

    # Search
    "Search": ["select", "find", "search", "finder"],

    # Exports
    "Exports": ["export", "pdf", "output"],

    # Imports
    "Imports": ["import"],

    # Copy/Paste
    "Copy/Paste": ["copy", "paste", "clipboard", "duplicate"],

    # Integrations
    "Integrations": [
        "sync", "connect", "integrate", "upload", "cloud", "wakatime",
        "miro", "jira", "slack", "trello"
    ],

    # Versioning
    "Versioning": ["version", "history", "backup", "git", "abstract"],

    # Dev Tools
    "Dev Tools": ["debug", "devtool", "console", "inspect"],

    # Automations
    "Automations": ["automate", "batch", "bulk", "action", "spotlight"],

    # Linting
    "Linting": ["clean", "lint", "fix", "tidy", "validate"],

    # Plugins
    "Plugins": ["plugin list", "plugin reload", "plugin manager"],

    # Human-Focused
    "Human-Focused": ["anniversary", "fun", "joke", "game"],
}


def to_filename(category: str) -> str:
    """Convert category name to valid filename (without extension)."""
    return category.lower().replace(" ", "-").replace("/", "-")


def from_filename(filename: str) -> Optional[str]:
    """Convert filename back to category name."""
    # Strip extension
    name = filename.replace(".yml", "").replace(".yaml", "")

    # Try exact match first
    for category in CATEGORIES:
        if to_filename(category) == name:
            return category

    # Handle "other" special case
    if name == "other":
        return "Other"

    return None


class PluginCategorizer:
    """
    Categorizes plugins based on keyword matching.

    Priority order matters - first match wins.
    """

    def __init__(self, categories: dict[str, list[str]] = None):
        """
        Initialize categorizer.

        Args:
            categories: Optional custom categories dict. Defaults to CATEGORIES.
        """
        self.categories = categories or CATEGORIES

    def categorize(self, name: str, description: str) -> str:
        """
        Categorize a plugin based on its name and description.

        Args:
            name: Plugin name
            description: Plugin description

        Returns:
            Category name string
        """
        text = f"{name} {description}".lower()

        for category, keywords in self.categories.items():
            for keyword in keywords:
                if keyword.lower() in text:
                    # Special handling for Exports vs Imports conflict
                    if category == "Exports" and "import" in text:
                        continue
                    return category

        return "Other"

    def get_all_categories(self) -> list[str]:
        """Get list of all category names including 'Other'."""
        return list(self.categories.keys()) + ["Other"]

    def get_filename(self, category: str) -> str:
        """Get YAML filename for a category."""
        return to_filename(category) + ".yml"
