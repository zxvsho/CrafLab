---
name: Academic Precision
colors:
  surface: '#faf9fc'
  surface-dim: '#dad9dd'
  surface-bright: '#faf9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f7'
  surface-container: '#eeedf1'
  surface-container-high: '#e9e7eb'
  surface-container-highest: '#e3e2e6'
  on-surface: '#1a1c1e'
  on-surface-variant: '#43474e'
  inverse-surface: '#2f3033'
  inverse-on-surface: '#f1f0f4'
  outline: '#74777f'
  outline-variant: '#c4c6cf'
  surface-tint: '#455f87'
  primary: '#022448'
  on-primary: '#ffffff'
  primary-container: '#1e3a5f'
  on-primary-container: '#8aa4cf'
  inverse-primary: '#adc8f5'
  secondary: '#00677d'
  on-secondary: '#ffffff'
  secondary-container: '#50d9fe'
  on-secondary-container: '#005c70'
  tertiary: '#341f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#503300'
  on-tertiary-container: '#c69b5f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#adc8f5'
  on-primary-fixed: '#001c3b'
  on-primary-fixed-variant: '#2d486d'
  secondary-fixed: '#b3ebff'
  secondary-fixed-dim: '#4cd6fb'
  on-secondary-fixed: '#001f27'
  on-secondary-fixed-variant: '#004e5f'
  tertiary-fixed: '#ffddb2'
  tertiary-fixed-dim: '#edbf7f'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#60410c'
  background: '#faf9fc'
  on-background: '#1a1c1e'
  surface-variant: '#e3e2e6'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The design system is engineered for academic excellence and administrative efficiency. It targets educators, students, and administrators who require a focused, distraction-free environment for managing complex tasks, schedules, and grades. 

The visual style is **Corporate / Modern**, emphasizing structural clarity and information hierarchy. It avoids unnecessary ornamentation, opting instead for functional aesthetics that evoke feelings of reliability, organization, and scholarly rigor. The interface uses generous whitespace to prevent cognitive overload, ensuring that even data-dense screens remain legible and navigable.

## Colors
The palette is rooted in a deep "Academic Blue" (#1E3A5F) to project authority and trust, complemented by a "Vibrant Teal" (#00B4D8) used sparingly for primary actions and highlights. 

Backgrounds utilize pure white for content areas to maximize contrast, while a soft "Ghost Gray" (#F8FAFC) is used for secondary surfaces and sidebar containers to create subtle depth. Status indicators use a standardized semantic system:
- **Pendiente:** Neutral Slate (#64748B) for inactive or upcoming tasks.
- **En proceso:** Bright Blue (#3B82F6) to indicate active attention.
- **Finalizado:** Emerald Green (#10B981) to denote successful completion.

## Typography
This design system utilizes **Inter** exclusively to ensure maximum legibility and a systematic, utilitarian feel across all platforms. 

The type scale is optimized for high-density academic data. Headlines use tighter letter spacing and heavier weights to maintain a strong presence, while body text uses a standard 1.5-1.6 line height for comfortable long-form reading. Small labels utilize an uppercase transformation and increased letter spacing to remain legible even at minute sizes within data tables or badges.

## Layout & Spacing
The system employs a **Fixed Grid** model for desktop, centered within a maximum width of 1440px. A standard 12-column grid is used for primary layout structures, with 24px gutters providing ample breathing room between content modules.

The spacing rhythm is built on an **8px base unit**. All padding and margin increments must be multiples of 8 (e.g., 8, 16, 24, 32, 48, 64). On desktop, sidebars should occupy a fixed 280px width, while the main content area remains fluid within the remaining grid columns. For data tables, a compact 4px vertical padding may be used to increase information density.

## Elevation & Depth
Depth is communicated through **Tonal Layers** and **Ambient Shadows**. This design system avoids high-elevation shadows to maintain a flat, professional profile.

- **Level 0 (Base):** Light gray (#F8FAFC) for the application background.
- **Level 1 (Surface):** White cards and content containers. These use a very soft, diffused shadow: `0px 2px 4px rgba(30, 58, 95, 0.05)`.
- **Level 2 (Interaction):** Hover states for cards or dropdown menus. These use a slightly more pronounced shadow: `0px 10px 15px rgba(30, 58, 95, 0.1)`.
- **Level 3 (Overlays):** Modals and dialogs. These use a deep, wide-spread shadow and a semi-transparent backdrop blur to isolate the user's focus.

## Shapes
The shape language balances approachability with professional structure. A **Rounded** corner strategy is applied throughout the system.

Base components like buttons, input fields, and checkboxes utilize a **0.5rem (8px)** radius. Larger containers, such as dashboard cards and modals, utilize a **0.75rem (12px)** radius. This subtle variation creates a nested hierarchy where internal elements feel comfortably tucked within their parent containers. Interactive elements should never be fully sharp (0px) nor fully pill-shaped, except for status badges/tags which may use a pill-shape for distinct visual categorization.

## Components
### Buttons
Primary buttons use the Deep Blue background with white text. Secondary buttons use the Teal background for secondary actions. Ghost buttons are reserved for tertiary actions like "Cancel" or "Go Back."

### Cards
Cards are the primary vehicle for academic content (e.g., Course Overviews, Task Details). They must feature a 1px border (#E2E8F0) and the Level 1 shadow. Headers within cards should have a subtle bottom divider.

### Input Fields
Inputs use a white background with a 1px border (#CBD5E1). On focus, the border transitions to Teal (#00B4D8) with a soft 2px outer glow in the same color. Labels are always positioned above the input field in `body-sm` weight.

### Lists & Data Tables
Tables are high-density. Rows should have a subtle hover state (#F1F5F9). Column headers should be `label-md` for clear categorization.

### Status Badges
Badges are used to show the "Pendiente," "En proceso," and "Finalizado" states. They utilize a light tinted background (10% opacity of the status color) with high-contrast text for maximum readability.

### Academic Components
- **Progress Bars:** Thin 8px bars using the Teal color for success and a light gray for the track.
- **Grade Chips:** Small, circular or rounded-square containers with bold typography to highlight numerical or letter grades.