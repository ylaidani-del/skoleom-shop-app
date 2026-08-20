import { type ThemeMode } from '@/store/themeStore';

export const PALETTES: Record<
  ThemeMode,
  {
    bg: string;
    surface: string;
    surface2: string;
    fill: string;
    fg: string;
    fg2: string;
    fg3: string;
    border: string;
    border2: string;
    inv: string;
    invFg: string;
  }
> = {
  light: {
    bg: '#ffffff',
    surface: '#ffffff',
    surface2: '#f7f7f5',
    fill: '#f2f2ef',
    fg: '#1a1a1a',
    fg2: '#555555',
    fg3: '#9ca3af',
    border: '#ececec',
    border2: '#e0e0e0',
    inv: '#1a1a1a',
    invFg: '#ffffff',
  },
  dark: {
    bg: '#111111',
    surface: '#1a1a1a',
    surface2: '#1e1e1e',
    fill: 'rgba(255,255,255,0.07)',
    fg: '#ffffff',
    fg2: 'rgba(255,255,255,0.65)',
    fg3: 'rgba(255,255,255,0.38)',
    border: 'rgba(255,255,255,0.12)',
    border2: 'rgba(255,255,255,0.16)',
    inv: '#ffffff',
    invFg: '#111111',
  },
};

export const BRAND = {
  green: '#4bdd2c',
  greenDeep: '#22b222',
  yellow: '#dbea18',
  black: '#1a1a1a',
};
