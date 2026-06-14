import React from 'react';
import { StyleSheet } from 'react-native';
import { Portal, Dialog, Text, useTheme } from 'react-native-paper';
import { tokens } from '@theme/tokens';
import { AppButton } from '../Button/AppButton';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false
}) => {
  const theme = useTheme();
  
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onCancel} style={{ borderRadius: tokens.borderRadius.lg, backgroundColor: theme.colors.surface }}>
        <Dialog.Title style={{ fontWeight: 'bold' }}>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <AppButton variant="text" onPress={onCancel}>
            {cancelLabel}
          </AppButton>
          <AppButton 
            variant={destructive ? 'destructive' : 'primary'}
            onPress={onConfirm}
          >
            {confirmLabel}
          </AppButton>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default ConfirmDialog;
