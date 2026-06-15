import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, useTheme } from 'react-native-paper';
import { tokens } from '@theme/tokens';

export interface AppCardProps {
  children: React.ReactNode;
  style?: any;
  elevation?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const AppCard: React.FC<AppCardProps> = ({ children, style, elevation = 'md' }) => {
  const theme = useTheme();

  const getElevationValue = () => {
    switch (elevation) {
      case 'none': return 0;
      case 'sm': return 1;
      case 'md': return 2;
      case 'lg': return 4;
      case 'xl': return 8;
      default: return 2;
    }
  };

  return (
    <Surface
      style={[
        styles.card,
        { 
          borderRadius: tokens.borderRadius.md,
          backgroundColor: theme.colors.surface,
        },
        style
      ]}
      elevation={getElevationValue() as any}
    >
      {children}
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: tokens.spacing.sm,
    padding: tokens.spacing.lg,
    overflow: 'hidden',
  },
});
