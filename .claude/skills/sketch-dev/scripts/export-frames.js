/**
 * Export Frames
 *
 * Exports artboards/frames with various options:
 * - PNG/SVG/PDF formats
 * - Multiple scales (1x, 2x, 3x)
 * - Selection or all frames
 *
 * @see references/handoff.md
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const EXPORT_CONFIG = {
  // Default export settings
  format: 'png',           // png, svg, pdf, jpg, webp
  scales: ['1x', '2x'],    // Export scales
  prefix: '',              // Filename prefix
  suffix: '',              // Filename suffix

  // Output organization
  groupByPage: true,       // Create subfolders per page
  includeBackground: true, // Include artboard background
  trimTransparent: false   // Trim transparent pixels
};

// Scale multipliers
const SCALE_MAP = {
  '0.5x': 0.5,
  '1x': 1,
  '2x': 2,
  '3x': 3,
  '4x': 4
};

// =============================================================================
// EXPORT FUNCTIONS
// =============================================================================

/**
 * Generate export options for a layer
 */
function createExportOptions(layer, config) {
  const options = [];

  config.scales.forEach(scale => {
    const multiplier = SCALE_MAP[scale] || 1;
    const suffix = scale === '1x' ? '' : `@${scale}`;

    options.push({
      size: `${multiplier * 100}%`,
      suffix: `${config.suffix}${suffix}`,
      prefix: config.prefix,
      format: config.format
    });
  });

  return options;
}

/**
 * Configure layer for export
 */
function configureExport(layer, config) {
  // Set export options on the layer
  layer.exportFormats = createExportOptions(layer, config);

  return {
    name: layer.name,
    id: layer.id,
    formats: layer.exportFormats.length
  };
}

/**
 * Get all artboards from a page
 */
function getArtboards(page) {
  return page.layers.filter(layer => layer.type === 'Artboard');
}

/**
 * Get artboards from selection
 */
function getSelectedArtboards(document) {
  return document.selectedLayers.layers.filter(
    layer => layer.type === 'Artboard'
  );
}

/**
 * Generate export manifest
 */
function generateManifest(frames, config) {
  return {
    exportedAt: new Date().toISOString(),
    format: config.format,
    scales: config.scales,
    frames: frames.map(f => ({
      name: f.name,
      width: f.frame.width,
      height: f.frame.height,
      files: config.scales.map(scale => {
        const suffix = scale === '1x' ? '' : `@${scale}`;
        return `${config.prefix}${f.name}${config.suffix}${suffix}.${config.format}`;
      })
    }))
  };
}

/**
 * Prepare frames for batch export
 */
function prepareExport(frames, customConfig = {}) {
  const config = { ...EXPORT_CONFIG, ...customConfig };
  const prepared = [];

  frames.forEach(frame => {
    const result = configureExport(frame, config);
    prepared.push(result);
  });

  return {
    config,
    frames: prepared,
    manifest: generateManifest(frames, config)
  };
}

// =============================================================================
// EXPORT PRESETS
// =============================================================================

const PRESETS = {
  // Standard web export
  web: {
    format: 'png',
    scales: ['1x', '2x'],
    suffix: ''
  },

  // iOS app icons
  ios: {
    format: 'png',
    scales: ['1x', '2x', '3x'],
    suffix: ''
  },

  // Android assets
  android: {
    format: 'png',
    scales: ['1x', '2x', '3x', '4x'],
    suffix: ''
  },

  // Vector export
  vector: {
    format: 'svg',
    scales: ['1x'],
    suffix: ''
  },

  // Print/PDF
  print: {
    format: 'pdf',
    scales: ['1x'],
    suffix: ''
  },

  // Thumbnail preview
  thumbnail: {
    format: 'jpg',
    scales: ['0.5x'],
    suffix: '-thumb'
  }
};

/**
 * Apply preset configuration
 */
function applyPreset(presetName) {
  return PRESETS[presetName] || PRESETS.web;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Sanitize filename
 */
function sanitizeFilename(name) {
  return name
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

/**
 * Generate unique filenames
 */
function ensureUniqueNames(frames) {
  const names = new Map();

  return frames.map(frame => {
    let baseName = sanitizeFilename(frame.name);
    let count = names.get(baseName) || 0;

    if (count > 0) {
      baseName = `${baseName}-${count}`;
    }

    names.set(baseName, count + 1);

    return {
      ...frame,
      exportName: baseName
    };
  });
}

/**
 * Group frames by category (based on naming convention)
 */
function groupFrames(frames) {
  const groups = {};

  frames.forEach(frame => {
    // Extract category from name (e.g., "01-Dashboard" -> "01")
    const match = frame.name.match(/^(\d+)-/);
    const category = match ? match[1] : 'other';

    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(frame);
  });

  return groups;
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

const document = sketch.getSelectedDocument();
if (!document) {
  return { error: 'No document open' };
}

const page = document.selectedPage;
const selection = document.selectedLayers;

// Determine which frames to export
let framesToExport;
if (selection.length > 0) {
  framesToExport = getSelectedArtboards(document);
  if (framesToExport.length === 0) {
    return { error: 'No artboards selected. Select artboards to export.' };
  }
} else {
  framesToExport = getArtboards(page);
  if (framesToExport.length === 0) {
    return { error: 'No artboards found on current page.' };
  }
}

// Apply preset or use defaults
// Change preset here: 'web', 'ios', 'android', 'vector', 'print', 'thumbnail'
const preset = applyPreset('web');

// Prepare export configuration
const exportResult = prepareExport(framesToExport, preset);

// Add uniqueness check
const uniqueFrames = ensureUniqueNames(framesToExport);

// Return summary
return {
  status: 'configured',
  message: `${framesToExport.length} artboards configured for export`,
  preset: 'web',
  config: exportResult.config,
  frames: exportResult.frames,
  manifest: exportResult.manifest,
  instructions: [
    'Artboards are now configured with export settings.',
    'To export: File > Export... or use Sketch export shortcuts.',
    'Export formats have been applied to each artboard.'
  ]
};
