import { colors, colorsDark } from './colors';

// SPACING SYSTEM (Mobile-First)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

// BORDER RADIUS (Premium Rounded)
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// SHADOW SYSTEM (Elevation-based)
export const shadows = {
  none: {
    boxShadow: 'none',
    elevation: 0,
  },
  sm: {
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    elevation: 1,
  },
  md: {
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  lg: {
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.12)',
    elevation: 4,
  },
  xl: {
    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.16)',
    elevation: 8,
  },
};

// TYPOGRAPHY SYSTEM
export const fontConfig = {
  displayLarge: { fontFamily: 'System', fontWeight: '700', fontSize: 48 },
  displayMedium: { fontFamily: 'System', fontWeight: '700', fontSize: 40 },
  displaySmall: { fontFamily: 'System', fontWeight: '700', fontSize: 32 },
  headlineLarge: { fontFamily: 'System', fontWeight: '700', fontSize: 28 },
  headlineMedium: { fontFamily: 'System', fontWeight: '700', fontSize: 24 },
  headlineSmall: { fontFamily: 'System', fontWeight: '600', fontSize: 20 },
  titleLarge: { fontFamily: 'System', fontWeight: '600', fontSize: 18 },
  titleMedium: { fontFamily: 'System', fontWeight: '600', fontSize: 16 },
  titleSmall: { fontFamily: 'System', fontWeight: '600', fontSize: 14 },
  labelLarge: { fontFamily: 'System', fontWeight: '600', fontSize: 14 },
  labelMedium: { fontFamily: 'System', fontWeight: '500', fontSize: 12 },
  labelSmall: { fontFamily: 'System', fontWeight: '500', fontSize: 11 },
  bodyLarge: { fontFamily: 'System', fontWeight: '400', fontSize: 16 },
  bodyMedium: { fontFamily: 'System', fontWeight: '400', fontSize: 14 },
  bodySmall: { fontFamily: 'System', fontWeight: '400', fontSize: 13 },
} as const;

export const tokens = {
  colors,
  colorsDark,
  spacing,
  borderRadius,
  shadows,
  typography: fontConfig,
};
