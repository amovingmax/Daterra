import type { Config } from 'tailwindcss';
import { colors, typography, spacing, radii, shadows } from './tokens';

const fontFamily = {
  display: [...typography.fontFamily.display],
  body: [...typography.fontFamily.body],
  mono: [...typography.fontFamily.mono],
};

const fontWeight = Object.fromEntries(
  Object.entries(typography.fontWeight).map(([k, v]) => [k, String(v)]),
);

const preset = {
  theme: {
    extend: {
      colors: {
        brand: { ...colors.brand },
        accent: { ...colors.accent },
        gold: { ...colors.gold },
        sand: { ...colors.sand },
        ink: { ...colors.ink },
        surface: { ...colors.surface },
        status: { ...colors.status },
        border: { ...colors.border },
      },
      fontFamily,
      fontSize: { ...typography.fontSize },
      fontWeight,
      spacing: { ...spacing },
      borderRadius: { ...radii },
      boxShadow: { ...shadows },
    },
  },
} satisfies Partial<Config>;

export default preset;
