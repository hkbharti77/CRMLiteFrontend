import React from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '@theme/tokens';

export interface AppDividerProps {
  style?: any;
  light?: boolean;
}

export const AppDivider: React.FC<AppDividerProps> = ({ style, light = false }) => {
  return (
    <View
      style={[
        styles.divider,
        { backgroundColor: light ? tokens.colors.borderLight : tokens.colors.border },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    height: 1,
    width: '100%',
  },
});
