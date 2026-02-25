# Glossary

> Key terms and concepts for Sketch development via MCP.

## Core Concepts

### Artboard
A fixed-size canvas representing a screen or view. Also called a "Frame" in some contexts.

```javascript
new Artboard({
  name: '01-Dashboard',
  frame: { x: 0, y: 0, width: 1440, height: 900 },
  parent: page
});
```

See: [layouts.md](./layouts.md)

### Document
The top-level Sketch file container. Contains pages, symbols, and shared styles.

```javascript
const document = sketch.getSelectedDocument();
```

### Frame
Generic term for a rectangular container. Can refer to:
1. An Artboard (design canvas)
2. A Rectangle layer
3. The `frame` property (position/size)

```javascript
// Frame property - position and dimensions
layer.frame = { x: 0, y: 0, width: 100, height: 50 };
```

### Group
A container that groups multiple layers together. Unlike Artboards, Groups resize to fit their contents.

```javascript
new Group({
  name: 'Button Group',
  layers: [background, label],
  parent: frame
});
```

### HotSpot
An invisible interactive area used for prototype navigation.

```javascript
new HotSpot({
  name: 'click-area',
  frame: { x: 0, y: 0, width: 200, height: 50 },
  parent: frame,
  flow: { targetId: targetFrame.id }
});
```

See: [prototyping.md](./prototyping.md)

### Layer
Any element in a Sketch document. Types include:
- `Artboard` - Design canvas
- `Group` - Layer container
- `Rectangle`, `Oval`, `ShapePath` - Vector shapes
- `Text` - Text element
- `Image` - Bitmap image
- `SymbolMaster` - Reusable component definition
- `SymbolInstance` - Instance of a symbol
- `HotSpot` - Prototype interaction area

### Page
A canvas container within a document. Documents can have multiple pages.

```javascript
const page = document.selectedPage;
const allPages = document.pages;
```

## Symbols

### Symbol Master
The definition of a reusable component. Contains the layers that make up the symbol.

```javascript
const master = new SymbolMaster({
  name: 'Components/Button',
  frame: { x: -2000, y: 0, width: 120, height: 40 },
  parent: page
});
```

See: [symbols.md](./symbols.md)

### Symbol Instance
A copy of a Symbol Master that can be placed in designs. Changes to the Master propagate to all instances.

```javascript
const instance = master.createNewInstance();
instance.parent = targetFrame;
```

### Override
A property of a Symbol Instance that can be customized without detaching from the Master. Common overrides include text content and nested symbol selection.

```javascript
instance.setOverrideValue(
  override,
  'New Text'
);
```

### Detach
Breaking the link between a Symbol Instance and its Master, converting it to regular layers.

```javascript
instance.detach();
```

## Styling

### Fill
A color or gradient applied to the interior of a shape.

```javascript
style: {
  fills: [{ color: '#3B82F6FF' }]
}
```

See: [styling.md](./styling.md)

### Stroke / Border
A line drawn along the edge of a shape.

```javascript
style: {
  borders: [{
    color: '#E5E7EBFF',
    thickness: 1,
    position: 'Inside'  // Inside, Outside, Center
  }]
}
```

### Shadow
A drop shadow effect applied to a layer.

```javascript
style: {
  shadows: [{
    color: '#00000033',
    x: 0, y: 4,
    blur: 12,
    spread: 0
  }]
}
```

### Shared Style
A reusable style definition that can be applied to multiple layers. Changes to the style update all layers using it.

### Text Style
Shared style specifically for text, including font, size, weight, color, and alignment.

## Layout

### Alignment
Positioning layers relative to each other or their container.

| Value | Description |
|-------|-------------|
| `left` | Align to left edge |
| `center` | Center horizontally |
| `right` | Align to right edge |

### Spacing
The distance between elements. Common patterns:
- **Padding**: Space inside a container
- **Margin**: Space outside an element
- **Gap**: Space between sibling elements

See: [layouts.md](./layouts.md)

### Corner Radius
The rounding applied to rectangle corners.

```javascript
cornerRadius: 8  // Single value for all corners
```

## Prototyping

### Flow
A prototype connection between artboards.

```javascript
flow: {
  targetId: targetFrame.id,
  animationType: 'slideFromRight'
}
```

### Animation Type
The transition effect when navigating between artboards.

| Value | Effect |
|-------|--------|
| `instant` | No animation |
| `dissolve` | Crossfade |
| `slideFromRight` | Slide from right |
| `slideFromLeft` | Slide from left |
| `slideFromTop` | Slide from top |
| `slideFromBottom` | Slide from bottom |

See: [prototyping.md](./prototyping.md)

### Prototype
An interactive preview of the design, allowing click-through navigation between artboards.

## MCP Integration

### MCP (Model Context Protocol)
Protocol enabling AI assistants to interact with external tools like Sketch.

### run_code
MCP tool that executes JavaScript in the Sketch environment.

```javascript
// Executed via mcp__sketch__run_code
const document = sketch.getSelectedDocument();
return { success: true };
```

See: [mcp-api.md](./mcp-api.md)

### get_selection_as_image
MCP tool that captures the current selection as an image.

## File Organization

### Component Library
Collection of Symbol Masters organized for reuse. Typically placed at x: -2000.

See: [workflow.md](./workflow.md)

### Naming Convention
Patterns for layer names. Symbol Masters use `/` for hierarchy:

```
Components/Buttons/Primary
Components/Forms/Input
Components/Navigation/NavBar
```

See: [naming.md](./naming.md)

## Color Format

### Hex with Alpha
8-character hex codes including alpha channel (RRGGBBAA).

```javascript
'#3B82F6FF'  // Blue, fully opaque
'#111827E6'  // Dark gray, 90% opacity
'#00000000'  // Transparent
```

### Opacity Values
| Hex | Percentage |
|-----|------------|
| `FF` | 100% |
| `E6` | 90% |
| `CC` | 80% |
| `99` | 60% |
| `66` | 40% |
| `33` | 20% |
| `00` | 0% |

## Related Documentation

- [SKILL.md](../SKILL.md) - Main skill reference
- [Troubleshooting](./troubleshooting.md) - Common issues
- [MCP API](./mcp-api.md) - API patterns
- [Naming](./naming.md) - Naming conventions
