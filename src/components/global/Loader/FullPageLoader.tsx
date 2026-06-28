import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ActivityIndicator, useTheme } from 'react-native-paper';
import { tokens } from '@theme/tokens';

export interface FullPageLoaderProps {
  message?: string;
  size?: 'small' | 'large' | number;
}

export const FullPageLoader: React.FC<FullPageLoaderProps> = ({
  message,
  size = 'large',
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size={size} color={theme.colors.primary} />
      {message ? (
        <Text style={[styles.message, { color: theme.colors.onBackground }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  message: {
    marginTop: tokens.spacing.md,
    fontSize: tokens.typography.bodyMedium.fontSize,
    fontWeight: tokens.typography.bodyMedium.fontWeight as any,
    textAlign: 'center',
  },
});
