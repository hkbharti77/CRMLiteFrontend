import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { tokens } from '@theme/tokens';

export interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'archived' | 'open' | 'in_progress' | 'closed' | 'scheduled' | 'cancelled' | string;
  size?: 'small' | 'medium' | 'large';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const theme = useTheme();

  const getStatusConfig = (statusString: string) => {
    const s = statusString.toLowerCase();
    if (['active', 'completed', 'closed'].includes(s)) {
      return { color: tokens.colors.success, label: s.toUpperCase() };
    }
    if (['pending', 'in_progress', 'scheduled'].includes(s)) {
      return { color: tokens.colors.warning, label: s.toUpperCase() };
    }
    if (['inactive', 'open', 'cancelled'].includes(s)) {
      return { color: tokens.colors.error, label: s.toUpperCase() };
    }
    if (['qualified'].includes(s)) {
      return { color: tokens.colors.info, label: s.toUpperCase() };
    }
    return { color: tokens.colors.textTertiary, label: s.toUpperCase() };
  };

  const config = getStatusConfig(status);

  const getPadding = () => {
    switch (size) {
      case 'small': return { paddingVertical: tokens.spacing.xs / 2, paddingHorizontal: tokens.spacing.sm };
      case 'large': return { paddingVertical: tokens.spacing.sm, paddingHorizontal: tokens.spacing.lg };
      default: return { paddingVertical: tokens.spacing.xs, paddingHorizontal: tokens.spacing.md };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small': return tokens.typography.labelSmall.fontSize;
      case 'large': return tokens.typography.labelLarge.fontSize;
      default: return tokens.typography.labelMedium.fontSize;
    }
  };

  return (
    <View style={[
      styles.badge, 
      { backgroundColor: config.color, borderRadius: tokens.borderRadius.sm },
      getPadding()
    ]}>
      <Text style={[
        styles.text, 
        { fontSize: getFontSize(), color: theme.colors.surface }
      ]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
  },
});
