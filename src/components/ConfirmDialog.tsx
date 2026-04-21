import React from 'react';
import { Portal, Dialog, Button, Text, useTheme } from 'react-native-paper';

interface ConfirmDialogProps {
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
      <Dialog visible={visible} onDismiss={onCancel} style={{ borderRadius: 12, backgroundColor: '#fff' }}>
        <Dialog.Title style={{ fontWeight: 'bold' }}>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onCancel}>{cancelLabel}</Button>
          <Button 
            onPress={onConfirm} 
            textColor={destructive ? theme.colors.error : theme.colors.primary}
          >
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default ConfirmDialog;
