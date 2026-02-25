/**
 * Create Component Library
 *
 * Generates a comprehensive component library with:
 * - Organized symbol masters
 * - Consistent styling
 * - Section labels
 * - Common UI patterns
 *
 * @see references/symbols.md
 * @see references/workflow.md
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const LIBRARY_CONFIG = {
  x: -2000,              // Left of main canvas
  startY: 0,             // Starting Y position
  sectionGap: 80,        // Gap between sections
  componentGap: 20,      // Gap between components in section
  labelWidth: 400
};

// Design Tokens
const TOKENS = {
  colors: {
    // Grayscale
    white: '#FFFFFFFF',
    gray50: '#F9FAFBFF',
    gray100: '#F3F4F6FF',
    gray200: '#E5E7EBFF',
    gray300: '#D1D5DBFF',
    gray400: '#9CA3AFFF',
    gray500: '#6B7280FF',
    gray600: '#4B5563FF',
    gray700: '#374151FF',
    gray800: '#1F2937FF',
    gray900: '#111827FF',

    // Primary
    primary50: '#EFF6FFFF',
    primary100: '#DBEAFEFF',
    primary500: '#3B82F6FF',
    primary600: '#2563EBFF',
    primary700: '#1D4ED8FF',

    // Success
    success50: '#ECFDF5FF',
    success500: '#10B981FF',
    success700: '#047857FF',

    // Warning
    warning50: '#FFFBEBFF',
    warning500: '#F59E0BFF',
    warning700: '#B45309FF',

    // Error
    error50: '#FEF2F2FF',
    error500: '#EF4444FF',
    error700: '#B91C1CFF'
  },

  typography: {
    fontFamily: 'Inter',
    sizes: { xs: 10, sm: 12, body: 14, lg: 16, xl: 18, h3: 20, h2: 24, h1: 32 },
    weights: { regular: 400, medium: 500, semibold: 600, bold: 700 }
  },

  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radius: { sm: 4, md: 6, lg: 8, xl: 12, full: 9999 }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

let currentY = LIBRARY_CONFIG.startY;

function addSectionLabel(page, title) {
  new Text({
    text: `═══ ${title.toUpperCase()} ═══`,
    frame: { x: LIBRARY_CONFIG.x, y: currentY, width: LIBRARY_CONFIG.labelWidth, height: 24 },
    parent: page,
    style: {
      textColor: TOKENS.colors.gray500,
      fontSize: TOKENS.typography.sizes.sm,
      fontFamily: TOKENS.typography.fontFamily,
      fontWeight: TOKENS.typography.weights.semibold
    }
  });
  currentY += 40;
}

function advanceY(height) {
  currentY += height + LIBRARY_CONFIG.componentGap;
}

function advanceSection() {
  currentY += LIBRARY_CONFIG.sectionGap;
}

// =============================================================================
// COMPONENT CREATORS
// =============================================================================

/**
 * Create Button variants
 */
function createButtons(page) {
  const variants = [
    { name: 'Primary', bg: TOKENS.colors.primary500, text: TOKENS.colors.white, border: null },
    { name: 'Secondary', bg: TOKENS.colors.white, text: TOKENS.colors.gray700, border: TOKENS.colors.gray300 },
    { name: 'Outline', bg: 'transparent', text: TOKENS.colors.primary500, border: TOKENS.colors.primary500 },
    { name: 'Ghost', bg: 'transparent', text: TOKENS.colors.gray700, border: null },
    { name: 'Danger', bg: TOKENS.colors.error500, text: TOKENS.colors.white, border: null }
  ];

  const created = [];

  variants.forEach(variant => {
    const width = 120;
    const height = 40;

    const master = new SymbolMaster({
      name: `Components/Buttons/${variant.name}`,
      frame: { x: LIBRARY_CONFIG.x, y: currentY, width, height },
      parent: page
    });

    // Background
    if (variant.bg && variant.bg !== 'transparent') {
      new Rectangle({
        name: 'Background',
        frame: { x: 0, y: 0, width, height },
        parent: master,
        style: {
          fills: [{ color: variant.bg }],
          borders: variant.border ? [{ color: variant.border, thickness: 1 }] : []
        },
        cornerRadius: TOKENS.radius.md
      });
    } else if (variant.border) {
      new Rectangle({
        name: 'Background',
        frame: { x: 0, y: 0, width, height },
        parent: master,
        style: {
          fills: [],
          borders: [{ color: variant.border, thickness: 1 }]
        },
        cornerRadius: TOKENS.radius.md
      });
    }

    // Label
    new Text({
      text: 'Button',
      frame: { x: 0, y: 12, width, height: 16 },
      parent: master,
      style: {
        textColor: variant.text,
        fontSize: TOKENS.typography.sizes.body,
        fontFamily: TOKENS.typography.fontFamily,
        fontWeight: TOKENS.typography.weights.medium,
        alignment: 'center'
      }
    });

    created.push(master);
    advanceY(height);
  });

  return created;
}

/**
 * Create Form inputs
 */
function createInputs(page) {
  const created = [];
  const variants = [
    { name: 'Default', focused: false },
    { name: 'Focused', focused: true },
    { name: 'Error', error: true },
    { name: 'Disabled', disabled: true }
  ];

  variants.forEach(variant => {
    const width = 280;
    const height = 40;

    let borderColor = TOKENS.colors.gray300;
    let bgColor = TOKENS.colors.white;
    let textColor = TOKENS.colors.gray900;

    if (variant.focused) borderColor = TOKENS.colors.primary500;
    if (variant.error) borderColor = TOKENS.colors.error500;
    if (variant.disabled) {
      bgColor = TOKENS.colors.gray100;
      textColor = TOKENS.colors.gray400;
    }

    const master = new SymbolMaster({
      name: `Components/Forms/Input/${variant.name}`,
      frame: { x: LIBRARY_CONFIG.x, y: currentY, width, height },
      parent: page
    });

    new Rectangle({
      name: 'Background',
      frame: { x: 0, y: 0, width, height },
      parent: master,
      style: {
        fills: [{ color: bgColor }],
        borders: [{ color: borderColor, thickness: 1, position: 'Inside' }]
      },
      cornerRadius: TOKENS.radius.md
    });

    new Text({
      text: 'Placeholder',
      frame: { x: 12, y: 12, width: width - 24, height: 16 },
      parent: master,
      style: {
        textColor: variant.disabled ? TOKENS.colors.gray400 : TOKENS.colors.gray500,
        fontSize: TOKENS.typography.sizes.body,
        fontFamily: TOKENS.typography.fontFamily,
        fontWeight: TOKENS.typography.weights.regular
      }
    });

    created.push(master);
    advanceY(height);
  });

  return created;
}

/**
 * Create Badge variants
 */
function createBadges(page) {
  const variants = [
    { name: 'Default', bg: TOKENS.colors.gray100, text: TOKENS.colors.gray700 },
    { name: 'Primary', bg: TOKENS.colors.primary100, text: TOKENS.colors.primary700 },
    { name: 'Success', bg: TOKENS.colors.success50, text: TOKENS.colors.success700 },
    { name: 'Warning', bg: TOKENS.colors.warning50, text: TOKENS.colors.warning700 },
    { name: 'Error', bg: TOKENS.colors.error50, text: TOKENS.colors.error700 }
  ];

  const created = [];

  variants.forEach(variant => {
    const width = 72;
    const height = 24;

    const master = new SymbolMaster({
      name: `Components/Badges/${variant.name}`,
      frame: { x: LIBRARY_CONFIG.x, y: currentY, width, height },
      parent: page
    });

    new Rectangle({
      name: 'Background',
      frame: { x: 0, y: 0, width, height },
      parent: master,
      style: { fills: [{ color: variant.bg }], borders: [] },
      cornerRadius: TOKENS.radius.full
    });

    new Text({
      text: 'Badge',
      frame: { x: 0, y: 5, width, height: 14 },
      parent: master,
      style: {
        textColor: variant.text,
        fontSize: TOKENS.typography.sizes.sm,
        fontFamily: TOKENS.typography.fontFamily,
        fontWeight: TOKENS.typography.weights.medium,
        alignment: 'center'
      }
    });

    created.push(master);
    advanceY(height);
  });

  return created;
}

/**
 * Create Card component
 */
function createCards(page) {
  const created = [];
  const width = 320;
  const height = 200;

  const master = new SymbolMaster({
    name: 'Components/Cards/Card',
    frame: { x: LIBRARY_CONFIG.x, y: currentY, width, height },
    parent: page
  });

  // Background
  new Rectangle({
    name: 'Background',
    frame: { x: 0, y: 0, width, height },
    parent: master,
    style: {
      fills: [{ color: TOKENS.colors.white }],
      borders: [{ color: TOKENS.colors.gray200, thickness: 1, position: 'Inside' }],
      shadows: [{ color: '#0000001A', x: 0, y: 1, blur: 3, spread: 0 }]
    },
    cornerRadius: TOKENS.radius.lg
  });

  // Title
  new Text({
    text: 'Card Title',
    frame: { x: TOKENS.spacing.lg, y: TOKENS.spacing.lg, width: width - 32, height: 24 },
    parent: master,
    style: {
      textColor: TOKENS.colors.gray900,
      fontSize: TOKENS.typography.sizes.lg,
      fontFamily: TOKENS.typography.fontFamily,
      fontWeight: TOKENS.typography.weights.semibold
    }
  });

  // Description
  new Text({
    text: 'Card description text that provides additional context.',
    frame: { x: TOKENS.spacing.lg, y: 52, width: width - 32, height: 48 },
    parent: master,
    style: {
      textColor: TOKENS.colors.gray500,
      fontSize: TOKENS.typography.sizes.body,
      fontFamily: TOKENS.typography.fontFamily,
      fontWeight: TOKENS.typography.weights.regular
    }
  });

  created.push(master);
  advanceY(height);

  return created;
}

/**
 * Create Navigation components
 */
function createNavigation(page) {
  const created = [];

  // NavBar
  const navWidth = 1440;
  const navHeight = 56;

  const navBar = new SymbolMaster({
    name: 'Components/Navigation/NavBar',
    frame: { x: LIBRARY_CONFIG.x, y: currentY, width: navWidth, height: navHeight },
    parent: page
  });

  new Rectangle({
    name: 'Background',
    frame: { x: 0, y: 0, width: navWidth, height: navHeight },
    parent: navBar,
    style: {
      fills: [{ color: TOKENS.colors.white }],
      borders: [{ color: TOKENS.colors.gray200, thickness: 1, position: 'Inside' }]
    }
  });

  new Text({
    text: 'Logo',
    frame: { x: 24, y: 18, width: 80, height: 20 },
    parent: navBar,
    style: {
      textColor: TOKENS.colors.gray900,
      fontSize: TOKENS.typography.sizes.lg,
      fontFamily: TOKENS.typography.fontFamily,
      fontWeight: TOKENS.typography.weights.bold
    }
  });

  ['Dashboard', 'Projects', 'Settings'].forEach((item, i) => {
    new Text({
      text: item,
      frame: { x: 200 + i * 100, y: 18, width: 80, height: 20 },
      parent: navBar,
      style: {
        textColor: i === 0 ? TOKENS.colors.gray900 : TOKENS.colors.gray500,
        fontSize: TOKENS.typography.sizes.body,
        fontFamily: TOKENS.typography.fontFamily,
        fontWeight: TOKENS.typography.weights.medium
      }
    });
  });

  created.push(navBar);
  advanceY(navHeight);

  // Sidebar
  const sidebarWidth = 240;
  const sidebarHeight = 600;

  const sidebar = new SymbolMaster({
    name: 'Components/Navigation/Sidebar',
    frame: { x: LIBRARY_CONFIG.x, y: currentY, width: sidebarWidth, height: sidebarHeight },
    parent: page
  });

  new Rectangle({
    name: 'Background',
    frame: { x: 0, y: 0, width: sidebarWidth, height: sidebarHeight },
    parent: sidebar,
    style: {
      fills: [{ color: TOKENS.colors.gray50 }],
      borders: [{ color: TOKENS.colors.gray200, thickness: 1, position: 'Inside' }]
    }
  });

  ['Overview', 'Tasks', 'Calendar', 'Files', 'Reports'].forEach((item, i) => {
    new Text({
      text: item,
      frame: { x: 16, y: 16 + i * 40, width: sidebarWidth - 32, height: 24 },
      parent: sidebar,
      style: {
        textColor: i === 0 ? TOKENS.colors.primary600 : TOKENS.colors.gray700,
        fontSize: TOKENS.typography.sizes.body,
        fontFamily: TOKENS.typography.fontFamily,
        fontWeight: i === 0 ? TOKENS.typography.weights.medium : TOKENS.typography.weights.regular
      }
    });
  });

  created.push(sidebar);
  advanceY(sidebarHeight);

  return created;
}

/**
 * Create Avatar components
 */
function createAvatars(page) {
  const sizes = [
    { name: 'Small', size: 32, fontSize: 12 },
    { name: 'Medium', size: 40, fontSize: 14 },
    { name: 'Large', size: 56, fontSize: 18 }
  ];

  const created = [];

  sizes.forEach(variant => {
    const master = new SymbolMaster({
      name: `Components/Avatars/${variant.name}`,
      frame: { x: LIBRARY_CONFIG.x, y: currentY, width: variant.size, height: variant.size },
      parent: page
    });

    new Oval({
      name: 'Background',
      frame: { x: 0, y: 0, width: variant.size, height: variant.size },
      parent: master,
      style: {
        fills: [{ color: TOKENS.colors.primary100 }],
        borders: []
      }
    });

    new Text({
      text: 'AB',
      frame: { x: 0, y: (variant.size - variant.fontSize - 4) / 2, width: variant.size, height: variant.fontSize + 4 },
      parent: master,
      style: {
        textColor: TOKENS.colors.primary700,
        fontSize: variant.fontSize,
        fontFamily: TOKENS.typography.fontFamily,
        fontWeight: TOKENS.typography.weights.medium,
        alignment: 'center'
      }
    });

    created.push(master);
    advanceY(variant.size);
  });

  return created;
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

const document = sketch.getSelectedDocument();
if (!document) {
  return { error: 'No document open' };
}

const page = document.selectedPage;

// Check for existing symbols to avoid overlap
const existingSymbols = page.layers.filter(
  l => l.type === 'SymbolMaster' && l.frame.x < 0
);

if (existingSymbols.length > 0) {
  const maxY = Math.max(...existingSymbols.map(s => s.frame.y + s.frame.height));
  currentY = maxY + LIBRARY_CONFIG.sectionGap;
}

// Track created components
const library = {
  buttons: [],
  inputs: [],
  badges: [],
  cards: [],
  navigation: [],
  avatars: []
};

// Create library sections
addSectionLabel(page, 'Buttons');
library.buttons = createButtons(page);
advanceSection();

addSectionLabel(page, 'Form Inputs');
library.inputs = createInputs(page);
advanceSection();

addSectionLabel(page, 'Badges');
library.badges = createBadges(page);
advanceSection();

addSectionLabel(page, 'Cards');
library.cards = createCards(page);
advanceSection();

addSectionLabel(page, 'Navigation');
library.navigation = createNavigation(page);
advanceSection();

addSectionLabel(page, 'Avatars');
library.avatars = createAvatars(page);

// Summary
const totalComponents = Object.values(library).flat().length;

return {
  status: 'success',
  message: `Created ${totalComponents} components in library`,
  location: { x: LIBRARY_CONFIG.x, startY: LIBRARY_CONFIG.startY },
  components: {
    buttons: library.buttons.map(s => s.name),
    inputs: library.inputs.map(s => s.name),
    badges: library.badges.map(s => s.name),
    cards: library.cards.map(s => s.name),
    navigation: library.navigation.map(s => s.name),
    avatars: library.avatars.map(s => s.name)
  },
  usage: [
    'Components are now available in Insert > Symbols menu',
    'Use Components/Category/Name to find specific components',
    'Create instances with: master.createNewInstance()'
  ]
};
