/**
 * Landfall colors. Named by meaning so we change them in one place.
 * v1 is light-only; `dark` is kept so the scaffold doesn't break.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A', // main text (near-black slate)
    textSecondary: '#5B6B78', // muted text (subtext)
    background: '#F2F5F7', // app background (light gray)
    backgroundElement: '#FFFFFF', // cards / surfaces (white)
    backgroundSelected: '#E3F2EC', // pressed / selected (soft green)
    primary: '#10B981', // brand GREEN (lighter) — buttons, active tab, etc.
    warning: '#B45309', // amber warning text/icon (expiring items, low stock — never red)
    warningBackground: '#FEF3C7', // amber warning card background
    border: '#CBD5E1', // border around cards/sections (a touch darker than a hairline)
  },
  dark: {
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    background: '#0B1220',
    backgroundElement: '#141C2B',
    backgroundSelected: '#1A2B24',
    primary: '#34D399',
    warning: '#FBBF24',
    warningBackground: '#3F2D12',
    border: '#233043', // subtle hairline border around cards/sections
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
