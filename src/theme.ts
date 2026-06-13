import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';

// ============================================================================
// DESIGN SYSTEM - PREMIUM SAAS MOBILE FIRST
// ============================================================================

// TYPOGRAPHY SYSTEM
const fontConfig = {
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

// COLOR PALETTE - PREMIUM SAAS
const colors = {
  // Primary Brand Colors (Modern Teal/Green - Tech SaaS)
  primary: '#0F766E',        // Deep Teal (Primary action)
  primaryLight: '#14B8A6',   // Bright Teal (Hover/Secondary)
  primaryLighter: '#CCFBF1', // Very light Teal (Background)
  
  // Secondary Colors (Deep Blue - Professional)
  secondary: '#1E3A8A',      // Deep Blue (Supporting elements)
  secondaryLight: '#3B82F6', // Bright Blue (Accents)
  
  // Neutral Colors (Clean & Modern)
  surface: '#FFFFFF',
  background: '#F9FAFB',
  backgroundDark: '#F3F4F6',
  
  // Text Colors (High Contrast)
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  
  // Semantic Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Borders & Dividers
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Shadows (Subtle premium feel)
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowMedium: 'rgba(0, 0, 0, 0.12)',
  shadowLarge: 'rgba(0, 0, 0, 0.16)',
};

// DARK MODE COLORS
const colorsDark = {
  primary: '#14B8A6',
  primaryLight: '#2DD4BF',
  primaryLighter: '#134E4A',
  secondary: '#60A5FA',
  secondaryLight: '#93C5FD',
  surface: '#1F2937',
  background: '#111827',
  backgroundDark: '#0F172A',
  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#60A5FA',
  border: '#374151',
  borderLight: '#1F2937',
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowMedium: 'rgba(0, 0, 0, 0.4)',
  shadowLarge: 'rgba(0, 0, 0, 0.5)',
};

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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
};

// LIGHT THEME
export const theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLighter,
    secondary: colors.secondary,
    secondaryContainer: colors.primaryLighter,
    tertiary: colors.secondaryLight,
    surface: colors.surface,
    background: colors.background,
    error: colors.error,
    errorContainer: '#FFEBEE',
    warning: colors.warning,
    success: colors.success,
    info: colors.info,
    outline: colors.border,
    outlineVariant: colors.borderLight,
  },
  roundness: 12,
};

// DARK THEME
export const themeDark = {
  ...MD3DarkTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3DarkTheme.colors,
    primary: colorsDark.primary,
    primaryContainer: colorsDark.primaryLighter,
    secondary: colorsDark.secondary,
    secondaryContainer: colorsDark.primaryLighter,
    tertiary: colorsDark.secondaryLight,
    surface: colorsDark.surface,
    background: colorsDark.background,
    error: colorsDark.error,
    errorContainer: '#5A1F1F',
    warning: colorsDark.warning,
    success: colorsDark.success,
    info: colorsDark.info,
    outline: colorsDark.border,
    outlineVariant: colorsDark.borderLight,
  },
  roundness: 12,
};

// EXPORT COLOR PALETTES
export { colors, colorsDark };
