# Developer Handoff Reference

> Exporting designs for development: inspect mode, code generation, and asset export.

## Overview

Developer handoff bridges design and development by providing:
- Dimension and spacing specifications
- Color values and typography details
- Exportable assets
- Generated code snippets

## Inspect Mode

### Accessing Inspect

Developers can inspect Sketch files via:
1. **Sketch Cloud** - Upload and share (free inspect for viewers)
2. **Sketch App** - Direct file access with Sketch installed
3. **Third-party tools** - Zeplin, Avocode, Figma import

### What Inspect Shows

| Property | Format | Example |
|----------|--------|---------|
| **Position** | x, y pixels | x: 240, y: 56 |
| **Dimensions** | width × height | 1200 × 844 |
| **Spacing** | Measured between layers | 24px gap |
| **Colors** | Hex, RGB, HSL | #3B82F6, rgb(59,130,246) |
| **Typography** | Font, size, weight, line-height | Inter 14px/20px Medium |
| **Borders** | Color, width, radius | 1px #E5E7EB, radius 8px |
| **Shadows** | Offset, blur, spread, color | 0 4px 6px rgba(0,0,0,0.1) |

### Measuring Distances

Hold `Option/Alt` and hover between layers to see spacing:

```
┌──────────────┐
│   Header     │
└──────────────┘
       ↕ 24px (shown on hover)
┌──────────────┐
│   Content    │
└──────────────┘
```

## CSS Code Generation

### Copy CSS Attributes

Right-click layer → Copy → Copy CSS Attributes

```css
/* Generated for a button */
.button {
  width: 120px;
  height: 40px;
  background: #3B82F6;
  border-radius: 6px;
}

/* Generated for text */
.label {
  font-family: Inter;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: #111827;
}
```

### Copy SVG Code

Right-click shape → Copy → Copy SVG Code

```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M12 4L20 12L12 20L4 12L12 4Z" fill="#3B82F6"/>
</svg>
```

### Limitations

| What's Copied | What's NOT Copied |
|---------------|-------------------|
| Basic styles | Hover/active states |
| Colors as hex | CSS variables |
| Font properties | Responsive rules |
| Border radius | Flexbox/grid layout |
| Box shadow | Animations |

## Export Presets

### Configuring Exports

Select layer → Bottom-right panel → Make Exportable (+)

### Common Presets

| Platform | Scales | Format | Naming |
|----------|--------|--------|--------|
| **iOS** | @1x, @2x, @3x | PNG | icon@2x.png |
| **Android** | mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi | PNG | icon.png in folders |
| **Web** | 1x, 2x | PNG, WebP, SVG | icon.png, icon@2x.png |
| **macOS** | @1x, @2x | PNG | icon@2x.png |

### Export Settings

```javascript
// Programmatic export configuration
layer.exportFormats = [
  { fileFormat: 'png', scale: 1 },
  { fileFormat: 'png', scale: 2, suffix: '@2x' },
  { fileFormat: 'svg', scale: 1 }
];
```

### Scale Mappings

| Sketch Scale | iOS | Android | Web |
|--------------|-----|---------|-----|
| 1x | @1x | mdpi | 1x |
| 1.5x | - | hdpi | - |
| 2x | @2x | xhdpi | 2x |
| 3x | @3x | xxhdpi | 3x |
| 4x | - | xxxhdpi | - |

## Asset Export

### Batch Export

File → Export... (Cmd+Shift+E)

Exports all layers marked as exportable.

### Slices

Create export regions independent of layer bounds:

```javascript
// Create a slice
const slice = new Slice({
  name: 'hero-export',
  frame: { x: 0, y: 0, width: 800, height: 400 },
  parent: frame,
  exportFormats: [
    { fileFormat: 'png', scale: 2 }
  ]
});
```

### Export Naming

| Pattern | Result |
|---------|--------|
| `{name}` | layer-name.png |
| `{name}@{scale}x` | layer-name@2x.png |
| `{folder}/{name}` | icons/arrow.png |

## Design Tokens Export

### Manual Token Documentation

Create a reference page with token values:

```
┌─────────────────────────────────────────┐
│  COLOR TOKENS                           │
│                                         │
│  Primary     ██████  #3B82F6            │
│  Secondary   ██████  #6B7280            │
│  Success     ██████  #10B981            │
│  Error       ██████  #EF4444            │
│                                         │
│  SPACING TOKENS                         │
│                                         │
│  xs: 4px   sm: 8px   md: 16px          │
│  lg: 24px  xl: 32px  2xl: 48px         │
└─────────────────────────────────────────┘
```

### Automated Token Export

Using MCP to extract tokens:

```javascript
// Extract all colors from document
const extractColors = () => {
  const colors = new Set();
  const document = sketch.getSelectedDocument();

  const traverse = (layers) => {
    layers.forEach(layer => {
      if (layer.style?.fills) {
        layer.style.fills.forEach(fill => {
          if (fill.color) colors.add(fill.color);
        });
      }
      if (layer.layers) traverse(layer.layers);
    });
  };

  document.pages.forEach(page => traverse(page.layers));
  return Array.from(colors);
};

return extractColors();
```

## Third-Party Integrations

### Zeplin

1. Install Zeplin plugin for Sketch
2. Select frames → Plugins → Zeplin → Export
3. Developers access via Zeplin web/app

**Zeplin Features:**
- Style guide generation
- Component documentation
- Version history
- Slack integration

### Avocode

1. Sync Sketch file to Avocode
2. Automatic layer inspection
3. Code generation in multiple languages

**Avocode Code Options:**
- CSS / SCSS / LESS
- Swift / Objective-C
- Android XML
- React Native

### Abstract

1. Version control for Sketch files
2. Visual diff between versions
3. Branch/merge workflow
4. Handoff via Abstract web

## Handoff Best Practices

### For Designers

1. **Name layers descriptively** - Developers rely on names
2. **Use consistent spacing** - Apply spacing tokens
3. **Mark exportables** - Pre-configure export settings
4. **Document states** - Create hover, active, disabled variants
5. **Include redlines** - Add measurement annotations

### For Developers

1. **Use inspect mode** - Don't guess values
2. **Check all states** - Look for variant frames
3. **Export SVG for icons** - Better than PNG at any scale
4. **Verify responsive behavior** - Ask about breakpoints
5. **Request missing assets** - Don't recreate from screenshots

## Specification Document

### Creating Spec Sheets

Include in handoff documentation:

```markdown
## Button Component Spec

### Variants
| State | Background | Text | Border |
|-------|-----------|------|--------|
| Default | #3B82F6 | #FFFFFF | none |
| Hover | #2563EB | #FFFFFF | none |
| Active | #1D4ED8 | #FFFFFF | none |
| Disabled | #E5E7EB | #9CA3AF | none |

### Sizes
| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| Small | 32px | 12px 16px | 12px |
| Medium | 40px | 12px 20px | 14px |
| Large | 48px | 16px 24px | 16px |

### Spacing
- Button group gap: 12px
- Icon to label: 8px
```

## Programmatic Handoff

### Generate Spec JSON

```javascript
// Extract component specifications
const extractSpec = (symbolMaster) => {
  const spec = {
    name: symbolMaster.name,
    dimensions: {
      width: symbolMaster.frame.width,
      height: symbolMaster.frame.height
    },
    layers: []
  };

  symbolMaster.layers.forEach(layer => {
    spec.layers.push({
      name: layer.name,
      type: layer.type,
      frame: layer.frame,
      style: layer.style ? {
        fills: layer.style.fills,
        borders: layer.style.borders,
        shadows: layer.style.shadows
      } : null
    });
  });

  return spec;
};

const master = document.getSymbols().find(s => s.name.includes('Button'));
return JSON.stringify(extractSpec(master), null, 2);
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Colors don't match | Check color profiles (sRGB) |
| Fonts look different | Verify exact font weights |
| Spacing is off | Measure from edge, not baseline |
| Icons are blurry | Export as SVG or higher DPI |
| Missing assets | Mark all layers as exportable |

## Related References
- [Styling & Colors](./styling.md)
- [Naming Conventions](./naming.md)
- [Workflow & Organization](./workflow.md)
