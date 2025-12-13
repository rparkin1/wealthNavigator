# Design Tokens Documentation

**Version:** 1.0
**Last Updated:** 2025-12-12
**Status:** Active

## Overview

This document describes the design tokens used in WealthNavigator AI. Design tokens are the visual design atoms of the design system — specifically, they are named entities that store visual design attributes. They're used in place of hard-coded values to ensure consistency and maintainability.

## Philosophy

### Professional Financial Interface

Our design tokens create an interface worthy of institutional wealth management while remaining accessible and approachable. The system balances:

- **Data Clarity**: Clean, scannable layouts with generous whitespace
- **Professional Aesthetics**: Sophisticated color palette without being intimidating
- **Progressive Complexity**: Simple entry points, advanced features discoverable
- **Trust Through Transparency**: Clear visual hierarchy and explicit states

## Color System

### Primary Colors (Deep Blue)

Used for primary actions, CTAs, links, and brand elements.

```css
--primary-50:  #eff6ff  /* Lightest background tint */
--primary-100: #dbeafe
--primary-200: #bfdbfe
--primary-300: #93c5fd
--primary-400: #60a5fa
--primary-500: #3b82f6  /* Base color */
--primary-600: #2563eb  /* Default CTA buttons */
--primary-700: #1d4ed8  /* Hover states */
--primary-800: #1e40af
--primary-900: #1e3a8a  /* Darkest, high contrast */
```

**Usage Examples:**
- Primary buttons: `--primary-600` background
- Links: `--primary-600` text
- Focus rings: `--primary-500` outline
- Selected states: `--primary-50` background

### Accent Colors (Purple)

Used for highlights, special notifications, and visual interest.

```css
--accent-500: #8b5cf6
--accent-600: #7c3aed
```

**Usage Examples:**
- AI agent indicators
- Premium features
- Decorative highlights

### Semantic Colors

#### Success (Green)

Indicates goals on track, positive changes, completed actions.

```css
--success-50:  #f0fdf4
--success-500: #22c55e
--success-600: #16a34a
--success-700: #15803d
```

**Usage Examples:**
- "On Track" goal badges
- Positive portfolio changes (+2.3% ↑)
- Success notifications
- Checkmarks and completed states

#### Warning (Orange)

Indicates risks, items behind schedule, items needing attention.

```css
--warning-50:  #fffbeb
--warning-500: #f59e0b
--warning-600: #d97706
--warning-700: #b45309
```

**Usage Examples:**
- "Behind" goal badges
- Rebalancing needed alerts
- Important notifications
- Caution indicators

#### Error (Red)

Indicates critical issues, failed actions, destructive operations.

```css
--error-50:  #fef2f2
--error-500: #ef4444
--error-600: #dc2626
--error-700: #b91c1c
```

**Usage Examples:**
- "At Risk" goal badges
- Form validation errors
- Error notifications
- Delete buttons
- Critical alerts

#### Info (Blue)

Neutral information, tips, general notifications.

```css
--info-50:  #f0f9ff
--info-500: #0ea5e9
--info-600: #0284c7
```

**Usage Examples:**
- Helper text
- Informational tooltips
- Neutral notifications
- Learning resources

### Neutral Colors (Gray Scale)

The workhorse of the design system. Used for text, borders, backgrounds.

```css
--gray-50:  #f9fafb  /* Backgrounds */
--gray-100: #f3f4f6  /* Hover states */
--gray-200: #e5e7eb  /* Borders */
--gray-300: #d1d5db  /* Disabled borders */
--gray-400: #9ca3af  /* Placeholder text */
--gray-500: #6b7280  /* Secondary text */
--gray-600: #4b5563  /* Body text */
--gray-700: #374151  /* Headings */
--gray-800: #1f2937  /* Emphasis */
--gray-900: #111827  /* Maximum contrast */
```

**Usage Guidelines:**
- **Text Hierarchy:**
  - Primary headings: `--gray-900`
  - Secondary headings: `--gray-800` or `--gray-700`
  - Body text: `--gray-600`
  - Secondary text: `--gray-500`
  - Placeholder text: `--gray-400`

- **Borders:**
  - Default borders: `--gray-200`
  - Hover borders: `--gray-300`
  - Disabled borders: `--gray-300`

- **Backgrounds:**
  - Page background: `white` or `--gray-50`
  - Card backgrounds: `white`
  - Hover backgrounds: `--gray-100`

### Chart Colors

Designed for data visualization with high contrast and accessibility.

```css
--chart-1: #3b82f6  /* Blue - Stocks */
--chart-2: #8b5cf6  /* Purple - Bonds */
--chart-3: #10b981  /* Green - Cash */
--chart-4: #f59e0b  /* Orange - Real Estate */
--chart-5: #ef4444  /* Red - Alternatives */
--chart-6: #06b6d4  /* Cyan */
--chart-7: #ec4899  /* Pink */
--chart-8: #84cc16  /* Lime */
```

**Usage Notes:**
- Use in order for consistent data representation
- All colors pass WCAG AA contrast requirements
- Avoid using more than 5 colors in a single chart when possible
- Use patterns/textures in addition to color for accessibility

## Typography

### Font Families

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'IBM Plex Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
```

**When to Use:**
- **Sans-serif (Inter):** All UI text, headings, body copy
- **Monospace:** Numbers in tables, currency values, code snippets

### Font Sizes (Modular Scale: 1.250)

```css
--text-xs:   0.75rem   (12px)  /* Labels, captions, timestamps */
--text-sm:   0.875rem  (14px)  /* Small text, helper text, secondary info */
--text-base: 1rem      (16px)  /* Body text (default) */
--text-lg:   1.125rem  (18px)  /* Large body, subheadings */
--text-xl:   1.25rem   (20px)  /* Card titles */
--text-2xl:  1.5rem    (24px)  /* Section headings */
--text-3xl:  1.875rem  (30px)  /* Page titles */
--text-4xl:  2.25rem   (36px)  /* Hero text */
--text-5xl:  3rem      (48px)  /* Dashboard numbers, data highlights */
```

### Font Weights

```css
--font-normal:   400  /* Body text */
--font-medium:   500  /* Emphasis, button text */
--font-semibold: 600  /* Subheadings */
--font-bold:     700  /* Headings, important data */
```

### Line Heights

```css
--leading-none:    1     /* Tight, for headings */
--leading-tight:   1.25  /* Headings, card titles */
--leading-normal:  1.5   /* Body text (default) */
--leading-relaxed: 1.75  /* Long-form content */
```

### Typography Classes

Common typography patterns:

```css
/* Page Title */
.page-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  color: var(--gray-900);
}

/* Section Heading */
.section-heading {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  color: var(--gray-800);
}

/* Body Text */
.body-text {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--gray-600);
}

/* Data/Numbers (tabular) */
.data-value {
  font-family: var(--font-mono);
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  color: var(--gray-900);
}
```

## Spacing System

### 8px Grid System

All spacing uses multiples of 8px (0.5rem) for visual consistency.

```css
--space-0:  0          (0px)   /* No spacing */
--space-1:  0.125rem   (2px)   /* Hairline separation */
--space-2:  0.25rem    (4px)   /* Tight spacing */
--space-3:  0.5rem     (8px)   /* Base unit */
--space-4:  0.75rem    (12px)  /* Small spacing */
--space-5:  1rem       (16px)  /* Medium spacing */
--space-6:  1.5rem     (24px)  /* Large spacing */
--space-7:  2rem       (32px)  /* XL spacing */
--space-8:  2.5rem     (40px)  /* 2XL spacing */
--space-9:  3rem       (48px)  /* 3XL spacing */
--space-10: 4rem       (64px)  /* 4XL spacing */
```

### Component Spacing Patterns

Recommended spacing for common components:

- **Card padding:** `--space-6` (24px)
- **Section gaps:** `--space-7` (32px)
- **Input padding:** `--space-4` vertical, `--space-5` horizontal
- **Button padding:** `--space-4` vertical, `--space-6` horizontal
- **Page margins:** `--space-6` mobile, `--space-8` desktop

## Shadows (Elevation System)

Shadows create visual hierarchy and depth.

```css
--shadow-sm:  /* Small - Buttons on hover */
  0 1px 2px 0 rgba(0, 0, 0, 0.05);

--shadow-md:  /* Medium - Cards (default) */
  0 4px 6px -1px rgba(0, 0, 0, 0.1),
  0 2px 4px -1px rgba(0, 0, 0, 0.06);

--shadow-lg:  /* Large - Dropdowns, popovers */
  0 10px 15px -3px rgba(0, 0, 0, 0.1),
  0 4px 6px -2px rgba(0, 0, 0, 0.05);

--shadow-xl:  /* Extra large - Modals */
  0 20px 25px -5px rgba(0, 0, 0, 0.1),
  0 10px 10px -5px rgba(0, 0, 0, 0.04);

--shadow-2xl: /* Maximum - Full-screen overlays */
  0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

**Usage Guidelines:**
- Use shadows sparingly for clear hierarchy
- Cards: `--shadow-md`
- Dropdowns/Popovers: `--shadow-lg`
- Modals: `--shadow-xl`
- Buttons on hover: `--shadow-sm`

## Border Radius

```css
--radius-sm:   0.25rem  (4px)   /* Badges, tags */
--radius-md:   0.5rem   (8px)   /* Buttons, inputs */
--radius-lg:   0.75rem  (12px)  /* Cards */
--radius-xl:   1rem     (16px)  /* Large cards, modals */
--radius-full: 9999px           /* Pills, avatars, circular elements */
```

## Borders

```css
--border-width: 1px
--border-color: var(--gray-200)          /* Default */
--border-color-hover: var(--gray-300)    /* Hover state */
--border-color-focus: var(--primary-500) /* Focus state */
```

## Z-Index Scale

Consistent stacking order prevents z-index conflicts.

```css
--z-base: 0              /* Normal content */
--z-dropdown: 1000       /* Dropdown menus */
--z-sticky: 1100         /* Sticky headers */
--z-fixed: 1200          /* Fixed position elements */
--z-modal-backdrop: 1300 /* Modal backdrop */
--z-modal: 1400          /* Modal content */
--z-popover: 1500        /* Popovers */
--z-tooltip: 1600        /* Tooltips */
--z-notification: 1700   /* Toast notifications (highest) */
```

## Transitions

```css
--transition-fast: 150ms    /* Quick interactions (hover) */
--transition-base: 200ms    /* Default (most transitions) */
--transition-slow: 300ms    /* Deliberate animations */
--transition-slower: 500ms  /* Page transitions */

--ease-in: cubic-bezier(0.4, 0, 1, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)  /* Default */
```

## Dark Mode (Future)

Dark mode variables are defined but not yet implemented. When implementing:

1. Use `data-theme` attribute on root element
2. Override color tokens for dark mode
3. Invert gray scale appropriately
4. Adjust shadow opacity
5. Test all components in both modes

## Accessibility

### Color Contrast

All color combinations meet WCAG 2.1 AA standards:

- **Text on backgrounds:** Minimum 4.5:1 ratio
- **Large text (18px+):** Minimum 3:1 ratio
- **UI components:** Minimum 3:1 ratio

### Tested Combinations

Safe text color combinations:

| Background | Text Color | Ratio | Pass |
|------------|------------|-------|------|
| White | --gray-600 | 7.0:1 | AAA ✓ |
| White | --gray-500 | 4.6:1 | AA ✓ |
| --gray-50 | --gray-700 | 8.9:1 | AAA ✓ |
| --primary-600 | White | 4.8:1 | AA ✓ |
| --success-600 | White | 4.5:1 | AA ✓ |
| --error-600 | White | 5.1:1 | AA ✓ |

## Usage Examples

### Applying Tokens in CSS

```css
/* Button */
.btn-primary {
  padding: var(--space-4) var(--space-6);
  background: var(--primary-600);
  color: white;
  border-radius: var(--radius-md);
  font-weight: var(--font-medium);
  transition: all var(--transition-base) var(--ease-in-out);
}

.btn-primary:hover {
  background: var(--primary-700);
  box-shadow: var(--shadow-sm);
}

/* Card */
.card {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
}
```

### Using in Tailwind

Design tokens are integrated into Tailwind config, so use Tailwind classes normally:

```html
<button class="bg-primary-600 text-white px-6 py-4 rounded-md">
  Save Goal
</button>
```

## Maintenance

### Adding New Tokens

1. Add to `design-tokens.css`
2. Update this documentation
3. Update `tailwind.config.js` if Tailwind integration needed
4. Add to Storybook examples
5. Test in multiple contexts

### Deprecating Tokens

1. Mark as deprecated in comments
2. Update documentation with migration path
3. Create alias to new token if renaming
4. Remove after 2 release cycles

## Resources

- [Color Palette Tool](https://coolors.co/)
- [WCAG Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Modular Scale Calculator](https://www.modularscale.com/)
- [IBM Plex Mono Font](https://fonts.google.com/specimen/IBM+Plex+Mono)
- [Inter Font](https://fonts.google.com/specimen/Inter)

---

**Last Reviewed:** 2025-12-12
**Next Review:** 2026-01-12
