---
number: 25
title: Component Naming Conventions
status: accepted
date: 2026-02-26
tags:
  - wireframes
  - conventions
  - sketch
---

# Component Naming Conventions

## Context and Problem Statement

The Looms wireframe component library in Sketch has grown to 73+ symbols. Without consistent naming conventions, components become difficult to find, organize, and maintain. We need a standard naming pattern that scales as the library expands to 100+ components.

## Decision Drivers

* Components must be easy to find in Sketch's symbol picker
* Names should indicate component category and variant
* Naming must be consistent across all components
* Pattern should accommodate future growth (nested variants, states)

## Considered Options

* Flat naming: `PrimaryButton`, `SecondaryButton`, `OpenBadge`
* Category/Name: `Button/Primary`, `Badge/Open`
* Category/Subcategory/Name: `Badge/Status/Open`, `Badge/Priority/High`

## Decision Outcome

Chosen option: "Category/Subcategory/Name", because it provides hierarchical organization that Sketch displays as nested menus, making components easy to find and logically grouped.

### Naming Rules

1. **Use forward slashes** to create hierarchy: `Category/Subcategory/Variant`
2. **Categories match section headers**: Icons, Buttons, Badges, Avatars, Feedback, Data Entry, Data Display, Navigation, Overlays, Domain
3. **Use PascalCase** for each segment: `Badge/Status/InProgress` not `badge/status/in-progress`
4. **Subcategories** for related variants: `Badge/Status/*`, `Badge/Priority/*`
5. **State suffixes** when needed: `Button/Toggle/On`, `Button/Toggle/Off`
6. **Size variants** use descriptive names: `Avatar/Small`, `Avatar/Default`, `Avatar/Large`

### Examples

| Component | Name |
|-----------|------|
| Primary button | `Button/Primary` |
| Status badge (open) | `Badge/Status/Open` |
| Priority badge (high) | `Badge/Priority/High` |
| Small avatar | `Avatar/Small` |
| Text input | `Input/Text` |
| Search input | `Input/Search` |
| Kanban column | `Kanban/Column` |
| Modal container | `Modal/Container` |
| Horizontal divider | `Divider/Horizontal` |

### Consequences

* Good, because Sketch automatically groups components into nested menus
* Good, because easy to find related components together
* Good, because scales well as library grows
* Neutral, because requires discipline to maintain consistency
* Bad, because long names can be truncated in some Sketch UI areas

### Confirmation

* All 73 existing components follow this convention
* New components must be reviewed for naming compliance
* Section headers in Components Library match category names

## Section Organization

Components are organized into these sections (in order from top to bottom):

1. **Icons** - All icon symbols (24x24)
2. **Buttons** - Action buttons and toggles
3. **Badges** - Status and priority indicators
4. **Avatars & Feedback** - User avatars, spinners, progress, tooltips, dividers
5. **Data Entry** - Input fields, form controls
6. **Data Display** - Cards, records, legends, activity items
7. **Navigation** - Nav bars, tabs, breadcrumbs, search
8. **Overlays** - Modals, dialogs, drawers
9. **Domain** - Kanban, Gantt, charts (domain-specific components)

## More Information

Related to: Component Library Expansion epic (projx-jhi)

This convention is inspired by:
- Material Design 3 UI Kit naming
- Primer (GitHub) component organization
- Sketch best practices for symbol libraries
