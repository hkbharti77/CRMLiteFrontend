import { MD3LightTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  displayLarge: { fontFamily: 'System', fontWeight: '700', fontSize: 57 },
  displayMedium: { fontFamily: 'System', fontWeight: '700', fontSize: 45 },
  displaySmall: { fontFamily: 'System', fontWeight: '700', fontSize: 36 },
  headlineLarge: { fontFamily: 'System', fontWeight: '600', fontSize: 32 },
  headlineMedium: { fontFamily: 'System', fontWeight: '600', fontSize: 28 },
  headlineSmall: { fontFamily: 'System', fontWeight: '600', fontSize: 24 },
  titleLarge: { fontFamily: 'System', fontWeight: '500', fontSize: 22 },
  titleMedium: { fontFamily: 'System', fontWeight: '500', fontSize: 16 },
  titleSmall: { fontFamily: 'System', fontWeight: '500', fontSize: 14 },
  labelLarge: { fontFamily: 'System', fontWeight: '500', fontSize: 14 },
  labelMedium: { fontFamily: 'System', fontWeight: '500', fontSize: 12 },
  labelSmall: { fontFamily: 'System', fontWeight: '500', fontSize: 11 },
  bodyLarge: { fontFamily: 'System', fontWeight: '400', fontSize: 16 },
  bodyMedium: { fontFamily: 'System', fontWeight: '400', fontSize: 14 },
  bodySmall: { fontFamily: 'System', fontWeight: '400', fontSize: 12 },
} as const;

export const theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: '#075E54', // Brand Green
    primaryContainer: '#D4E4BC', // Sage Green
    secondary: '#1A237E', // Deep Indigo
    secondaryContainer: '#E8EAF6',
    tertiary: '#5F7D75', // Muted Sage
    surface: '#FFFFFF',
    background: '#F8F9FA',
    error: '#B00020',
    outline: '#E0E0E0',
  },
  roundness: 12,
};
