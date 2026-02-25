# Troubleshooting Guide

> Common issues and solutions when working with Sketch via MCP.

## Quick Diagnostics

```javascript
// Check document state
const document = sketch.getSelectedDocument();
return {
  hasDocument: !!document,
  pageName: document?.selectedPage?.name,
  layerCount: document?.selectedPage?.layers?.length,
  selectionCount: document?.selectedLayers?.length
};
```

## Common Errors

### "Cannot read property 'selectedPage' of undefined"

**Cause**: No document is open in Sketch.

**Solution**:
```javascript
const document = sketch.getSelectedDocument();
if (!document) {
  return { error: 'No document open. Please open a Sketch file first.' };
}
```

### "SymbolMaster.fromGroup is not a function"

**Cause**: This method doesn't exist in the Sketch JS API.

**Solution**: Create Symbol Masters directly:
```javascript
// WRONG - doesn't exist
const master = SymbolMaster.fromGroup(group);

// CORRECT - use constructor
const master = new SymbolMaster({
  name: 'Components/Button',
  frame: { x: -2000, y: 0, width: 120, height: 40 },
  parent: page
});
```

See: [symbols.md](./symbols.md#creating-symbol-masters)

### "Layer type is undefined"

**Cause**: Accessing a layer that was deleted or moved.

**Solution**: Re-fetch layers before operations:
```javascript
// Cache can become stale
const layers = page.layers.filter(l => l.type === 'Artboard');
// Verify each layer exists
layers.forEach(layer => {
  if (layer && layer.type) {
    // Safe to use
  }
});
```

### "Cannot set property 'frame' of undefined"

**Cause**: Parent layer doesn't exist or wasn't created.

**Solution**: Verify parent creation:
```javascript
const parent = new Artboard({
  name: 'Frame',
  frame: { x: 0, y: 0, width: 1440, height: 900 },
  parent: page
});

// Verify parent exists before adding children
if (parent && parent.id) {
  new Rectangle({
    name: 'Child',
    parent: parent,  // Now safe
    // ...
  });
}
```

### "style.fills is not iterable"

**Cause**: Layer doesn't have fills or style object.

**Solution**: Check before accessing:
```javascript
if (layer.style && Array.isArray(layer.style.fills)) {
  layer.style.fills.forEach(fill => {
    // Safe to iterate
  });
}
```

## Symbol Issues

### Symbols not appearing in Insert menu

**Cause**: Symbol Masters placed on wrong page or named incorrectly.

**Solution**:
1. Place on Symbols page or any page (Sketch indexes all pages)
2. Use proper naming with `/` for hierarchy:
```javascript
name: 'Components/Buttons/Primary'  // Creates nested menu
```

### Symbol overrides not working

**Cause**: Text or image layers not named uniquely.

**Solution**: Give override-able layers unique names:
```javascript
new Text({
  name: 'Title',  // Will appear in overrides panel
  text: 'Default',
  parent: symbolMaster
});
```

See: [symbols.md](./symbols.md#symbol-overrides)

### Symbol instances not updating

**Cause**: Changes made to instance, not master.

**Solution**: Modify the Symbol Master:
```javascript
const masters = document.getSymbols();
const master = masters.find(s => s.name === 'Components/Button');
// Modify master, not instances
```

## Prototype Issues

### HotSpots not triggering

**Cause**: HotSpot has zero dimensions or is behind other layers.

**Solution**:
```javascript
new HotSpot({
  name: 'nav-link',
  frame: { x: 0, y: 0, width: 200, height: 50 },  // Must have size
  parent: frame,
  flow: { targetId: targetFrame.id }
});
// Ensure HotSpot is on top
```

### Animation not playing

**Cause**: Invalid animation type or missing target.

**Solution**: Use valid animation types:
```javascript
const validAnimations = [
  'instant',
  'dissolve',
  'slideFromRight',
  'slideFromLeft',
  'slideFromBottom',
  'slideFromTop'
];

new HotSpot({
  flow: {
    targetId: targetFrame.id,  // Must be valid frame ID
    animationType: 'slideFromRight'  // Must be from list
  }
});
```

See: [prototyping.md](./prototyping.md#animation-types)

## Performance Issues

### Script timeout

**Cause**: Too many operations in single script.

**Solution**: Break into smaller scripts:
```javascript
// Instead of creating 100 layers at once:
// 1. Create frames (first script)
// 2. Add content to frames (second script)
// 3. Add styling (third script)
```

### Sketch becomes unresponsive

**Cause**: Large batch operations blocking UI.

**Solution**:
1. Use smaller batches
2. Close undo grouping:
```javascript
// Wrap operations
const result = document.sketchObject.undoManager().disableUndoRegistration();
try {
  // Many operations
} finally {
  document.sketchObject.undoManager().enableUndoRegistration();
}
```

## Debugging Techniques

### Return debug info

```javascript
const debugInfo = {
  documentName: document.path,
  pageCount: document.pages.length,
  currentPage: page.name,
  layerCount: page.layers.length,
  symbolCount: document.getSymbols().length
};
return debugInfo;
```

### Inspect layer properties

```javascript
function inspectLayer(layer) {
  return {
    id: layer.id,
    name: layer.name,
    type: layer.type,
    frame: layer.frame,
    parent: layer.parent?.name,
    childCount: layer.layers?.length
  };
}
```

### Find layers by type

```javascript
function findByType(root, type) {
  const found = [];
  function search(layer) {
    if (layer.type === type) found.push(layer);
    if (layer.layers) layer.layers.forEach(search);
  }
  search(root);
  return found;
}

const allText = findByType(page, 'Text');
return { textLayers: allText.length };
```

## MCP-Specific Issues

### Tool not responding

**Cause**: MCP server disconnected or Sketch not running.

**Solution**:
1. Verify Sketch is open with a document
2. Check MCP server connection
3. Try simpler script first:
```javascript
return { status: 'connected', sketch: typeof sketch !== 'undefined' };
```

### Script returns undefined

**Cause**: Missing return statement.

**Solution**: Always return results:
```javascript
// WRONG
new Rectangle({ /* ... */ });

// CORRECT
const rect = new Rectangle({ /* ... */ });
return { created: rect.name, id: rect.id };
```

## Recovery Procedures

### Undo failed operation

```javascript
// Sketch maintains undo history
// Use Cmd+Z in Sketch UI to undo script operations
```

### Reset page state

```javascript
// Remove all layers from page
page.layers.forEach(layer => layer.remove());
return { cleared: true };
```

### Find orphaned symbols

```javascript
const symbols = document.getSymbols();
const instanceCounts = {};

// Count instances of each symbol
page.layers.forEach(function countInstances(layer) {
  if (layer.type === 'SymbolInstance') {
    const masterId = layer.master?.id;
    instanceCounts[masterId] = (instanceCounts[masterId] || 0) + 1;
  }
  if (layer.layers) layer.layers.forEach(countInstances);
});

// Find unused symbols
const unused = symbols.filter(s => !instanceCounts[s.id]);
return { unusedSymbols: unused.map(s => s.name) };
```

## Related Documentation

- [MCP API Patterns](./mcp-api.md) - API reference and patterns
- [Workflow Guide](./workflow.md) - Best practices
- [Symbols Reference](./symbols.md) - Symbol creation and management
- [Glossary](./glossary.md) - Term definitions
