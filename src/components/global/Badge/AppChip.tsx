import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import { X } from 'lucide-react-native';
import { tokens } from '@theme/tokens';

export interface ChipProps {
  label: string;
  onPress?: () => void;
  onClose?: () => void;
  selected?: boolean;
  style?: any;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  onPress,
  onClose,
  selected = false,
  style,
}) => {
  const theme = useTheme();

  const content = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.colors.primary : tokens.colors.backgroundDark,
          borderColor: selected ? theme.colors.primary : tokens.colors.border,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? theme.colors.onPrimary : tokens.colors.textSecondary },
        ]}
      >
        {label}
      </Text>
      {onClose && (
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={14} color={selected ? theme.colors.onPrimary : tokens.colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>;
  }

  return content;
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: tokens.typography.labelMedium.fontSize,
    fontWeight: tokens.typography.labelMedium.fontWeight as any,
  },
  closeButton: {
    marginLeft: tokens.spacing.sm,
    padding: 2,
  },
});
