import React from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Search, X } from 'lucide-react-native';
import { tokens } from '@theme/tokens';

export interface AppSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  style?: any;
}

export const AppSearchBar: React.FC<AppSearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  style,
}) => {
  const theme = useTheme();

  const handleClear = () => {
    onChangeText('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.backgroundDark, borderColor: tokens.colors.border }, style]}>
      <Search size={18} color={tokens.colors.textSecondary} style={styles.icon} />
      <TextInput
        style={[styles.input, { color: theme.colors.onSurface }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={tokens.colors.textTertiary}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <View style={[styles.clearIconBg, { backgroundColor: tokens.colors.border }]}>
            <X size={14} color={tokens.colors.textSecondary} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: tokens.borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: tokens.spacing.lg,
    height: 44,
  },
  icon: {
    marginRight: tokens.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: tokens.typography.bodyMedium.fontSize,
    height: '100%',
    paddingVertical: 0,
  },
  clearButton: {
    padding: tokens.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearIconBg: {
    borderRadius: tokens.borderRadius.full,
    padding: 2,
  },
});
