// apps/mobile/src/ui/tokens.ts
// §8.1 — Design tokens. Never hard-code colors in components; consume from here.

export const tokens = {
  color: {
    bg:       'oklch(0.14 0.02 260)',
    surface:  'oklch(0.19 0.02 260)',
    surface2: 'oklch(0.23 0.02 260)',
    text:     'oklch(0.98 0.005 260)',
    muted:    'oklch(0.68 0.02 260)',
    primary:  'oklch(0.72 0.18 230)',   // cyber-blue
    success:  'oklch(0.78 0.20 150)',   // neon-green
    warning:  'oklch(0.80 0.16 75)',    // amber (locked state)
    danger:   'oklch(0.65 0.24 25)',    // crimson (blocked state)
  },
  // React Native uses numbers for borderRadius, not strings
  radius: {
    sm: 8,
    md: 12,
    lg: 20,
    xl: 28,
  } as const,
  // Animation durations in ms
  motion: {
    fast: 120,
    base: 220,
    slow: 360,
  } as const,
  // Typography scale
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  } as const,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  } as const,
} as const;

export type ColorToken = keyof typeof tokens.color;
export type RadiusToken = keyof typeof tokens.radius;
export type SpacingToken = keyof typeof tokens.spacing;
