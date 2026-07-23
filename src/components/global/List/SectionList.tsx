import React from 'react';
import { SectionList as RNSectionList, StyleSheet, View } from 'react-native';
import { List, useTheme } from 'react-native-paper';
import { tokens } from '../../../theme/tokens';

export interface SectionListData<T> {
  title: string;
  data: T[];
}

export interface SectionListProps<T> {
  sections: SectionListData<T>[];
  renderItem: (info: { item: T; index: number }) => React.ReactElement | null;
  keyExtractor?: (item: T, index: number) => string;
  style?: any;
  contentContainerStyle?: any;
}

export const SectionList = <T,>({
  sections,
  renderItem,
  keyExtractor,
  style,
  contentContainerStyle,
}: SectionListProps<T>) => {
  const theme = useTheme();

  return (
    <RNSectionList
      sections={sections}
      renderItem={({ item, index }) => renderItem({ item, index })}
      renderSectionHeader={({ section: { title } }) => (
        <List.Subheader style={[styles.header, { backgroundColor: theme.colors.background, color: theme.colors.primary }]}>
          {title}
        </List.Subheader>
      )}
      keyExtractor={keyExtractor || ((_, index) => index.toString())}
      style={[styles.list, style]}
      contentContainerStyle={contentContainerStyle}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  header: {
    fontWeight: 'bold',
    fontSize: tokens.typography.titleSmall.fontSize,
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.md,
  },
});
