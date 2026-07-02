import React from 'react';
import { StyleSheet } from 'react-native';
import { List, useTheme } from 'react-native-paper';
import { tokens } from '../../../theme/tokens';

export interface ListItemProps {
  title: string;
  description?: string;
  left?: (props: { color: string; style: any }) => React.ReactNode;
  right?: (props: { color: string; style: any }) => React.ReactNode;
  onPress?: () => void;
  style?: any;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  description,
  left,
  right,
  onPress,
  style,
}) => {
  const theme = useTheme();

  return (
    <List.Item
      title={title}
      description={description}
      left={left}
      right={right}
      onPress={onPress}
      style={[styles.item, style]}
      titleStyle={[styles.title, { color: theme.colors.onSurface }]}
      descriptionStyle={[styles.description, { color: theme.colors.onSurfaceVariant }]}
    />
  );
};

const styles = StyleSheet.create({
  item: {
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
  },
  title: {
    fontSize: tokens.typography.bodyLarge.fontSize,
    fontWeight: '500',
  },
  description: {
    fontSize: tokens.typography.bodySmall.fontSize,
    marginTop: tokens.spacing.xs,
  },
});
