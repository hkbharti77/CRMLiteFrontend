import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar, useTheme } from 'react-native-paper';
import { tokens } from '@theme/tokens';

export interface AppAvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: 'small' | 'medium' | 'large' | number;
}

export const AppAvatar: React.FC<AppAvatarProps> = ({
  name,
  imageUrl,
  size = 'medium',
}) => {
  const theme = useTheme();

  const getNumericSize = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'small': return 32;
      case 'large': return 64;
      case 'medium':
      default: return 48;
    }
  };

  const numericSize = getNumericSize();
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  if (imageUrl) {
    return <Avatar.Image size={numericSize} source={{ uri: imageUrl }} />;
  }

  return (
    <Avatar.Text
      size={numericSize}
      label={initials}
      color={theme.colors.onPrimary}
      style={{ backgroundColor: theme.colors.primary }}
    />
  );
};
