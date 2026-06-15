import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import { tokens } from '@theme/tokens';
import { AppButton } from '../Button/AppButton';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  style?: any;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  style,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      {icon && <View style={[styles.iconContainer, { backgroundColor: theme.colors.surface, shadowColor: tokens.colors.shadow, ...tokens.shadows.sm }]}>{icon}</View>}
      <Text style={[styles.title, { color: theme.colors.onSurface }]}>{title}</Text>
      <Text style={[styles.description, { color: tokens.colors.textSecondary }]}>{description}</Text>
      {actionLabel && onAction && (
        <AppButton onPress={onAction} style={styles.button} mode="contained">
          {actionLabel}
        </AppButton>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacing.xxxl,
    flex: 1,
  },
  iconContainer: {
    marginBottom: tokens.spacing.xl,
    width: 80,
    height: 80,
    borderRadius: tokens.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: tokens.typography.headlineSmall.fontSize,
    fontWeight: tokens.typography.headlineSmall.fontWeight as any,
    marginBottom: tokens.spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: tokens.typography.bodyLarge.fontSize,
    textAlign: 'center',
    marginBottom: tokens.spacing.xxl,
    lineHeight: 24,
  },
  button: {
    minWidth: 180,
    borderRadius: tokens.borderRadius.full,
  },
});
