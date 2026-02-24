#!/usr/bin/env python3
"""
Sketch Plugin Categorizer

Categorizes scraped Sketch plugins into predefined categories based on
name and description keyword matching.

Usage:
    python categorize-plugins.py input.json output_dir/
"""

import json
import yaml
import os
import sys
import re

# Category definitions with priority-ordered keyword patterns
# More specific patterns should come first
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


def categorize_plugin(plugin: dict) -> str:
    """
    Categorize a plugin based on its name and description.

    Args:
        plugin: Dict with 'name' and 'description' keys

    Returns:
        Category name string
    """
    name = plugin.get("name", "").lower()
    desc = plugin.get("description", "").lower()
    text = f"{name} {desc}"

    for category, keywords in CATEGORIES.items():
        for keyword in keywords:
            if keyword.lower() in text:
                # Special handling for Exports vs Imports conflict
                if category == "Exports" and "import" in text:
                    continue
                return category

    return "Other"


def to_filename(category: str) -> str:
    """Convert category name to valid filename."""
    return category.lower().replace(" ", "-").replace("/", "-")


def main(input_file: str, output_dir: str):
    """
    Main categorization function.

    Args:
        input_file: Path to JSON file with plugin data
        output_dir: Directory to write YAML files
    """
    # Load plugins
    with open(input_file, "r", encoding="utf-8") as f:
        plugins = json.load(f)

    print(f"Loaded {len(plugins)} plugins from {input_file}")

    # Categorize
    categorized = {}
    for plugin in plugins:
        category = categorize_plugin(plugin)
        if category not in categorized:
            categorized[category] = []

        is_github = "github.com" in plugin.get("link", "").lower()

        categorized[category].append({
            "plugin": plugin["name"],
            "link": plugin["link"],
            "description": plugin["description"],
            "summary": f"By {plugin['author']}. Last updated {plugin['updated']}.",
            "open-source": is_github,
            "tags": [to_filename(category)]
        })

    # Print summary
    print("\nCategory Distribution:")
    print("-" * 50)
    for cat, items in sorted(categorized.items(), key=lambda x: -len(x[1])):
        print(f"  {cat}: {len(items)}")

    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Write YAML files
    for category, items in categorized.items():
        filename = to_filename(category) + ".yml"
        filepath = os.path.join(output_dir, filename)

        with open(filepath, "w", encoding="utf-8") as f:
            f.write("---\n")
            yaml.dump(items, f, default_flow_style=False,
                      allow_unicode=True, sort_keys=False)

        print(f"Wrote {filepath} ({len(items)} plugins)")

    total = sum(len(v) for v in categorized.values())
    print(f"\nTotal: {total} plugins in {len(categorized)} files")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python categorize-plugins.py input.json output_dir/")
        sys.exit(1)

    main(sys.argv[1], sys.argv[2])
