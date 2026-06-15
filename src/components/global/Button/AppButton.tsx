import React from 'react';
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Button, useTheme } from 'react-native-paper';

export interface AppButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outlined' | 'text' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: ViewStyle | ViewStyle[];
  labelStyle?: TextStyle | TextStyle[];
  accessibilityLabel?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  labelStyle,
  accessibilityLabel,
}) => {
  const theme = useTheme();

  let mode: 'text' | 'outlined' | 'contained' | 'elevated' | 'contained-tonal' = 'contained';
  let buttonColor = undefined;
  let textColor = undefined;

  switch (variant) {
    case 'primary':
      mode = 'contained';
      buttonColor = theme.colors.primary;
      break;
    case 'secondary':
      mode = 'contained-tonal';
      buttonColor = theme.colors.secondaryContainer;
      textColor = theme.colors.secondary;
      break;
    case 'outlined':
      mode = 'outlined';
      textColor = theme.colors.primary;
      break;
    case 'text':
      mode = 'text';
      textColor = theme.colors.primary;
      break;
    case 'destructive':
      mode = 'contained';
      buttonColor = theme.colors.error;
      break;
  }

  const getPadding = () => {
    switch (size) {
      case 'small': return { paddingVertical: 2, paddingHorizontal: 4 };
      case 'large': return { paddingVertical: 10, paddingHorizontal: 24 };
      default: return { paddingVertical: 6, paddingHorizontal: 16 };
    }
  };

  return (
    <Button
      mode={mode}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      icon={icon}
      buttonColor={buttonColor}
      textColor={textColor}
      style={[
        { borderRadius: theme.roundness },
        style,
      ]}
      contentStyle={[
        getPadding(),
      ]}
      labelStyle={[
        { fontWeight: '600' },
        size === 'small' && { fontSize: 12, marginHorizontal: 8 },
        size === 'large' && { fontSize: 16 },
        labelStyle,
      ]}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </Button>
  );
};
