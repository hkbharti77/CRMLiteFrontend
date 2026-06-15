import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, HelperText, useTheme } from 'react-native-paper';
import { tokens } from '@theme/tokens';

export interface AppInputProps extends React.ComponentProps<typeof TextInput> {
  errorText?: string;
  helperText?: string;
}

export const AppInput: React.FC<AppInputProps> = ({
  errorText,
  helperText,
  style,
  ...props
}) => {
  const theme = useTheme();

  const hasError = !!errorText;

  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        error={hasError}
        style={[styles.input, style]}
        outlineStyle={{ borderRadius: tokens.borderRadius.md }}
        {...props}
      />
      {(hasError || helperText) && (
        <HelperText type={hasError ? 'error' : 'info'} visible={true}>
          {hasError ? errorText : helperText}
        </HelperText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.md,
  },
  input: {
    backgroundColor: 'transparent',
  },
});
