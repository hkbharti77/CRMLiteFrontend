import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { tokens } from '../../../theme/tokens';

export interface TabItem {
  key: string;
  label: string;
  badge?: number | string;
}

export interface AppTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (key: string) => void;
  scrollable?: boolean;
  style?: any;
}

export const AppTabs: React.FC<AppTabsProps> = ({
  tabs,
  activeTab,
  onTabPress,
  scrollable = false,
  style,
}) => {
  const theme = useTheme();

  const renderTab = (tab: TabItem) => {
    const isActive = tab.key === activeTab;
    return (
      <TouchableOpacity
        key={tab.key}
        style={[
          styles.tab,
          isActive && { borderBottomColor: theme.colors.primary },
          !scrollable && { flex: 1 },
        ]}
        onPress={() => onTabPress(tab.key)}
      >
        <Text
          style={[
            styles.label,
            { color: isActive ? theme.colors.primary : theme.colors.onSurfaceVariant },
            isActive && { fontWeight: '700' },
          ]}
        >
          {tab.label}
        </Text>
        {tab.badge !== undefined && (
          <View style={[styles.badgeContainer, { backgroundColor: theme.colors.error }]}>
            <Text style={styles.badgeText}>{tab.badge}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const containerStyle = [
    styles.container,
    { borderBottomColor: theme.colors.outlineVariant },
    style,
  ];

  if (scrollable) {
    return (
      <View style={containerStyle}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map(renderTab)}
        </ScrollView>
      </View>
    );
  }

  return <View style={[containerStyle, { flexDirection: 'row' }]}>{tabs.map(renderTab)}</View>;
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingHorizontal: tokens.spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  label: {
    fontSize: tokens.typography.labelLarge.fontSize,
    fontWeight: tokens.typography.labelLarge.fontWeight as any,
  },
  badgeContainer: {
    marginLeft: tokens.spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: tokens.borderRadius.full,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
