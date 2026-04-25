/**
 * Design tokens do Da Terra.
 * Conforme PRD §5 — paleta inspirada na identidade potiguar.
 *
 * Estes tokens são consumidos por:
 *   - apps/web (Next.js + Tailwind via @daterra/ui/tailwind-preset)
 *   - apps/admin (Next.js + Tailwind)
 *   - apps/mobile (Expo, importa direto como JS)
 */

export const colors = {
  /** Verde Caatinga — primária, headers, CTAs principais */
  brand: {
    50: '#EFF6F1',
    100: '#D9E9DD',
    200: '#B3D2BB',
    300: '#7AAE89',
    400: '#4F8862',
    500: '#2D5F3F',
    600: '#244D33',
    700: '#1C3D28',
    800: '#142C1D',
    900: '#0C1B12',
  },
  /** Terracota — secundária, badges, destaques */
  accent: {
    50: '#FBEEE9',
    100: '#F4D5C8',
    200: '#E8AB91',
    300: '#DA8366',
    400: '#C75D3F',
    500: '#A34A30',
    600: '#7E3925',
    700: '#5A281A',
    800: '#36180F',
    900: '#1B0C07',
  },
  /** Dourado Mel — selo Feito Potiguar, acentos */
  gold: {
    50: '#FCF4E2',
    100: '#F8E5B7',
    200: '#F1CB72',
    300: '#E8A33D',
    400: '#C68927',
    500: '#9D6C1E',
    600: '#7A5418',
    700: '#583B11',
    800: '#36240A',
    900: '#1A1105',
  },
  /** Areia — backgrounds claros */
  sand: {
    50: '#FBF8F1',
    100: '#F5EFE0',
    200: '#EBE0C2',
    300: '#DBC998',
    400: '#C5AB6E',
    500: '#A78B4D',
  },
  ink: {
    primary: '#2A2A2A',
    secondary: '#6B6B6B',
    tertiary: '#9B9B9B',
    inverse: '#FBF8F1',
  },
  surface: {
    primary: '#FFFFFF',
    secondary: '#FBF8F1',
    tertiary: '#F5EFE0',
  },
  status: {
    success: '#2D8F4E',
    warning: '#E8A33D',
    danger: '#C2392F',
    info: '#3A7AA6',
  },
  border: {
    subtle: '#EBE0C2',
    default: '#D9CFB5',
    strong: '#A78B4D',
  },
} as const;

export const typography = {
  fontFamily: {
    /** Headers — fonte com personalidade regional */
    display: ['Fraunces', 'Georgia', 'serif'],
    /** Body — limpa e legível em mobile */
    body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'Menlo', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
} as const;

export const radii = {
  none: '0',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(42, 42, 42, 0.05)',
  md: '0 4px 8px rgba(42, 42, 42, 0.08)',
  lg: '0 12px 24px rgba(42, 42, 42, 0.10)',
  xl: '0 24px 48px rgba(42, 42, 42, 0.14)',
} as const;

export const motion = {
  duration: {
    fast: '120ms',
    base: '200ms',
    slow: '320ms',
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    decelerate: 'cubic-bezier(0, 0, 0, 1)',
    accelerate: 'cubic-bezier(0.3, 0, 1, 1)',
  },
} as const;

export const tokens = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  motion,
};
export type Tokens = typeof tokens;
