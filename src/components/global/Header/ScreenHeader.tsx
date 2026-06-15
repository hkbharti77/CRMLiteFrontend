import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { ArrowLeft } from 'lucide-react-native';
import { tokens } from '../../../theme/tokens';

export interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  style?: any;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, onBack, rightAction, style }) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }, style]}>
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
      )}
      <Text style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={1}>
        {title}
      </Text>
      {rightAction ? (
        <View style={styles.rightAction}>{rightAction}</View>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.borderLight,
  },
  backButton: {
    padding: tokens.spacing.xs,
    marginRight: tokens.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: tokens.typography.titleLarge.fontSize,
    fontWeight: 'bold',
  },
  rightAction: {
    marginLeft: tokens.spacing.sm,
  },
  placeholder: {
    width: 32,
  },
});
