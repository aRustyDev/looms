/**
 * Batch Rename Layers
 *
 * Rename multiple layers using patterns, find/replace, or sequential numbering.
 * Supports frames, groups, shapes, text, and symbols.
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const RENAME_MODES = {
  PATTERN: 'pattern',         // Use pattern with placeholders
  FIND_REPLACE: 'findReplace', // Find and replace text
  SEQUENTIAL: 'sequential',    // Add sequential numbers
  PREFIX: 'prefix',           // Add prefix
  SUFFIX: 'suffix',           // Add suffix
  CASE: 'case'                // Change case
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Apply pattern-based rename
 * Placeholders:
 * - %n% = original name
 * - %N% = sequential number (1, 2, 3...)
 * - %NN% = padded number (01, 02, 03...)
 * - %t% = layer type
 */
function patternRename(layers, pattern, startNumber = 1) {
  const results = [];

  layers.forEach((layer, index) => {
    const num = startNumber + index;
    const paddedNum = String(num).padStart(2, '0');

    let newName = pattern
      .replace(/%n%/gi, layer.name)
      .replace(/%N%/g, String(num))
      .replace(/%NN%/g, paddedNum)
      .replace(/%t%/gi, layer.type);

    const oldName = layer.name;
    layer.name = newName;
    results.push({ oldName, newName });
  });

  return results;
}

/**
 * Find and replace in layer names
 */
function findReplaceRename(layers, find, replace, useRegex = false) {
  const results = [];

  layers.forEach(layer => {
    const oldName = layer.name;
    let newName;

    if (useRegex) {
      const regex = new RegExp(find, 'g');
      newName = oldName.replace(regex, replace);
    } else {
      newName = oldName.split(find).join(replace);
    }

    if (oldName !== newName) {
      layer.name = newName;
      results.push({ oldName, newName });
    }
  });

  return results;
}

/**
 * Add sequential numbers to layer names
 */
function sequentialRename(layers, position = 'prefix', startNumber = 1, separator = '-') {
  const results = [];

  layers.forEach((layer, index) => {
    const num = String(startNumber + index).padStart(2, '0');
    const oldName = layer.name;
    let newName;

    // Remove existing number prefix/suffix if present
    const cleanName = oldName.replace(/^\d+-/, '').replace(/-\d+$/, '');

    if (position === 'prefix') {
      newName = `${num}${separator}${cleanName}`;
    } else {
      newName = `${cleanName}${separator}${num}`;
    }

    layer.name = newName;
    results.push({ oldName, newName });
  });

  return results;
}

/**
 * Add prefix to layer names
 */
function prefixRename(layers, prefix) {
  const results = [];

  layers.forEach(layer => {
    const oldName = layer.name;
    // Avoid double-prefix
    if (!oldName.startsWith(prefix)) {
      layer.name = prefix + oldName;
      results.push({ oldName, newName: layer.name });
    }
  });

  return results;
}

/**
 * Add suffix to layer names
 */
function suffixRename(layers, suffix) {
  const results = [];

  layers.forEach(layer => {
    const oldName = layer.name;
    // Avoid double-suffix
    if (!oldName.endsWith(suffix)) {
      layer.name = oldName + suffix;
      results.push({ oldName, newName: layer.name });
    }
  });

  return results;
}

/**
 * Change case of layer names
 */
function caseRename(layers, caseType) {
  const results = [];

  layers.forEach(layer => {
    const oldName = layer.name;
    let newName;

    switch (caseType) {
      case 'upper':
        newName = oldName.toUpperCase();
        break;
      case 'lower':
        newName = oldName.toLowerCase();
        break;
      case 'title':
        newName = oldName.replace(/\b\w/g, c => c.toUpperCase());
        break;
      case 'kebab':
        newName = oldName
          .replace(/([a-z])([A-Z])/g, '$1-$2')
          .replace(/\s+/g, '-')
          .toLowerCase();
        break;
      case 'camel':
        newName = oldName
          .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
          .replace(/^./, c => c.toLowerCase());
        break;
      case 'pascal':
        newName = oldName
          .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
          .replace(/^./, c => c.toUpperCase());
        break;
      default:
        newName = oldName;
    }

    if (oldName !== newName) {
      layer.name = newName;
      results.push({ oldName, newName });
    }
  });

  return results;
}

/**
 * Get layers by type filter
 */
function filterLayers(layers, typeFilter) {
  if (!typeFilter || typeFilter === 'all') {
    return layers;
  }

  const types = typeFilter.split(',').map(t => t.trim().toLowerCase());

  return layers.filter(layer => {
    const layerType = layer.type.toLowerCase();
    return types.some(t => {
      if (t === 'frame' || t === 'artboard') return layerType === 'artboard';
      if (t === 'shape') return ['rectangle', 'oval', 'shapepath', 'polygon', 'star'].includes(layerType);
      return layerType === t;
    });
  });
}

/**
 * Recursively get all layers
 */
function getAllLayers(root, includeNested = false) {
  const layers = [];

  const traverse = (items) => {
    items.forEach(layer => {
      layers.push(layer);
      if (includeNested && layer.layers) {
        traverse(layer.layers);
      }
    });
  };

  if (root.layers) {
    traverse(root.layers);
  }

  return layers;
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

const document = sketch.getSelectedDocument();
const page = document.selectedPage;
const selection = document.selectedLayers.layers;

// Configuration - modify these for your use case
const config = {
  mode: RENAME_MODES.SEQUENTIAL,  // Change rename mode
  scope: 'selection',             // 'selection', 'page', or 'all'
  typeFilter: 'artboard',         // 'all', 'artboard', 'text', 'shape', 'group', etc.
  includeNested: false,           // Include nested layers

  // Mode-specific options
  pattern: '%NN%-%n%',            // For PATTERN mode
  find: 'Artboard',               // For FIND_REPLACE mode
  replace: 'Frame',               // For FIND_REPLACE mode
  useRegex: false,                // For FIND_REPLACE mode
  startNumber: 1,                 // For SEQUENTIAL mode
  position: 'prefix',             // For SEQUENTIAL mode: 'prefix' or 'suffix'
  separator: '-',                 // For SEQUENTIAL mode
  prefix: 'Screen-',              // For PREFIX mode
  suffix: '-v1',                  // For SUFFIX mode
  caseType: 'kebab'               // For CASE mode: 'upper', 'lower', 'title', 'kebab', 'camel', 'pascal'
};

// Get layers based on scope
let layers;
switch (config.scope) {
  case 'selection':
    layers = selection;
    break;
  case 'page':
    layers = getAllLayers(page, config.includeNested);
    break;
  case 'all':
    layers = [];
    document.pages.forEach(p => {
      layers.push(...getAllLayers(p, config.includeNested));
    });
    break;
  default:
    layers = selection;
}

// Filter by type
layers = filterLayers(layers, config.typeFilter);

if (layers.length === 0) {
  return {
    error: 'No layers found matching criteria',
    scope: config.scope,
    typeFilter: config.typeFilter
  };
}

// Sort by position for consistent ordering
layers.sort((a, b) => {
  if (a.frame.y !== b.frame.y) return a.frame.y - b.frame.y;
  return a.frame.x - b.frame.x;
});

// Apply rename based on mode
let results;
switch (config.mode) {
  case RENAME_MODES.PATTERN:
    results = patternRename(layers, config.pattern, config.startNumber);
    break;
  case RENAME_MODES.FIND_REPLACE:
    results = findReplaceRename(layers, config.find, config.replace, config.useRegex);
    break;
  case RENAME_MODES.SEQUENTIAL:
    results = sequentialRename(layers, config.position, config.startNumber, config.separator);
    break;
  case RENAME_MODES.PREFIX:
    results = prefixRename(layers, config.prefix);
    break;
  case RENAME_MODES.SUFFIX:
    results = suffixRename(layers, config.suffix);
    break;
  case RENAME_MODES.CASE:
    results = caseRename(layers, config.caseType);
    break;
  default:
    results = [];
}

// Return summary
return {
  mode: config.mode,
  layersProcessed: layers.length,
  layersRenamed: results.length,
  changes: results.slice(0, 20), // Limit output
  moreChanges: results.length > 20 ? results.length - 20 : 0
};
