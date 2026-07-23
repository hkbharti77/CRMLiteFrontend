import React from 'react';
import { StyleSheet } from 'react-native';
import { Snackbar, useTheme } from 'react-native-paper';
import { tokens } from '../../../theme/tokens';

export interface ToastProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  duration?: number;
  type?: 'info' | 'success' | 'error';
  actionLabel?: string;
  onActionPress?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  onDismiss,
  duration = 3000,
  type = 'info',
  actionLabel,
  onActionPress,
}) => {
  const theme = useTheme();

  let bg = theme.colors.elevation.level3;
  let textColor = theme.colors.onSurface;

  if (type === 'success') {
    bg = '#E8F5E9';
    textColor = '#2E7D32';
  } else if (type === 'error') {
    bg = '#FFEBEE';
    textColor = '#C62828';
  }

  return (
    <Snackbar
      visible={visible}
      onDismiss={onDismiss}
      duration={duration}
      style={[styles.snackbar, { backgroundColor: bg }]}
      theme={{ colors: { inverseOnSurface: textColor } }}
      action={
        actionLabel
          ? {
              label: actionLabel,
              onPress: onActionPress,
              textColor: theme.colors.primary,
            }
          : undefined
      }
    >
      {message}
    </Snackbar>
  );
};

const styles = StyleSheet.create({
  snackbar: {
    margin: tokens.spacing.md,
    borderRadius: tokens.borderRadius.md,
  },
});
