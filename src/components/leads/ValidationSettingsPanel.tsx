import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Switch, ActivityIndicator, useTheme } from 'react-native-paper';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react-native';
import { AppCard } from '@components/global/Card/AppCard';
import { bulkLeadApi } from '../../services/api';
import { tokens } from '../../theme/tokens';

const OPTIONAL_FIELDS: { key: string; label: string }[] = [
  { key: 'source', label: 'Source' },
  { key: 'status', label: 'Status' },
  { key: 'notes',  label: 'Notes' },
  { key: 'tags',   label: 'Tags' },
];

export interface ValidationSettingsPanelProps {
  /** Pass false to hide this panel (non-admin users). */
  visible: boolean;
}

/**
 * Admin-only expandable panel for configuring extra required fields
 * applied during bulk lead upload validation.
 *
 * Requirement 6; design.md §3
 */
export function ValidationSettingsPanel({ visible }: ValidationSettingsPanelProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [enabledFields, setEnabledFields] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [hidden, setHidden] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load current config on mount when visible
  useEffect(() => {
    if (!visible) return;
    bulkLeadApi.getValidationConfig()
      .then((res: any) => {
        const fields: string[] = res.data?.extraRequiredFields ?? [];
        setEnabledFields(new Set(fields));
      })
      .catch((err: any) => {
        if (err?.response?.status === 403) {
          setHidden(true);
        }
      });
  }, [visible]);

  const handleToggle = (fieldKey: string, value: boolean) => {
    const next = new Set(enabledFields);
    if (value) next.add(fieldKey);
    else next.delete(fieldKey);
    setEnabledFields(next);

    // Debounce save by 500ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaving(true);
    debounceRef.current = setTimeout(async () => {
      try {
        await bulkLeadApi.updateValidationConfig({
          extraRequiredFields: Array.from(next),
        });
      } catch (err: any) {
        if (err?.response?.status === 403) setHidden(true);
      } finally {
        setSaving(false);
      }
    }, 500);
  };

  if (!visible || hidden) return null;

  return (
    <AppCard style={styles.card} elevation="sm">
      {/* Header / Toggle Row */}
      <View
        style={styles.sectionHeader}
        onStartShouldSetResponder={() => true}
        onResponderRelease={() => setExpanded(v => !v)}
      >
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.tertiaryContainer ?? theme.colors.primaryContainer }]}>
          <Settings size={18} color={theme.colors.tertiary ?? theme.colors.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Validation Settings
        </Text>
        {saving && <ActivityIndicator size={12} color={theme.colors.primary} style={{ marginRight: tokens.spacing.sm }} />}
        {expanded
          ? <ChevronUp size={18} color={tokens.colors.textSecondary} />
          : <ChevronDown size={18} color={tokens.colors.textSecondary} />}
      </View>

      {expanded && (
        <View style={styles.fieldList}>
          <Text style={[styles.hintText, { color: tokens.colors.textSecondary }]}>
            Mark extra fields as required for all bulk uploads in your organization.
          </Text>
          {OPTIONAL_FIELDS.map(field => (
            <View key={field.key} style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: theme.colors.onSurface }]}>
                {field.label}
              </Text>
              <Switch
                value={enabledFields.has(field.key)}
                onValueChange={v => handleToggle(field.key, v)}
                color={theme.colors.primary}
              />
            </View>
          ))}
        </View>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: tokens.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  fieldList: {
    marginTop: tokens.spacing.md,
    paddingTop: tokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.borderLight,
  },
  hintText: {
    fontSize: 12,
    marginBottom: tokens.spacing.md,
    lineHeight: 17,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.borderLight,
  },
  fieldLabel: {
    fontSize: 14,
  },
});
