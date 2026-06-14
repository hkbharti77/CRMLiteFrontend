import { StyleSheet } from 'react-native';
import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import { tokens, spacing, borderRadius, shadows, fontConfig } from './theme/tokens';
import { colors, colorsDark } from './theme/colors';

// LIGHT THEME
export const theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: tokens.typography }),
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
  roundness: tokens.borderRadius.lg,
};

// DARK THEME
export const themeDark = {
  ...MD3DarkTheme,
  fonts: configureFonts({ config: tokens.typography }),
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
  roundness: tokens.borderRadius.lg,
};

export const typography = {
  pageTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  cardTitle: { fontSize: 16, fontWeight: '500', color: colors.text },
  description: { fontSize: 14, fontWeight: '400', color: colors.muted },
  metaText: { fontSize: 12, fontWeight: '400', color: colors.muted },
};

export const sharedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    padding: 24,
    paddingTop: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  headerContent: {
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  modernCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  controlRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
  },
  controlIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 16,
  },
  controlTextWrapper: {
    flex: 1,
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  button: {
    borderRadius: 8,
    marginVertical: 8,
  },
  input: {
    backgroundColor: colors.card,
    marginBottom: 12,
  }
});

// EXPORT ALL
export { colors, colorsDark, tokens, spacing, borderRadius, shadows, fontConfig };
