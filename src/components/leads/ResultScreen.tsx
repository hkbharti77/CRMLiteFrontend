import React, { useEffect, useRef } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { CheckCircle, AlertCircle, RotateCcw } from 'lucide-react-native';
import { AppCard } from '@components/global/Card/AppCard';
import { tokens } from '../../theme/tokens';

export interface BulkUploadResult {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  errors: { rowNumber: number; reason: string }[];
}

export interface ResultScreenProps {
  result: BulkUploadResult | null;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
}

/**
 * Replaces modal content after an upload finishes or fails.
 *
 * States:
 *  - Full success (no errors)  → green checkmark + auto-close after 2s
 *  - Partial success (errors)  → counts + scrollable error list + Done button
 *  - Network/server error       → error message + Retry + Done buttons
 *
 * Requirement 7; design.md §4
 */
export function ResultScreen({ result, error, onClose, onRetry }: ResultScreenProps) {
  const theme = useTheme();
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isFullSuccess =
    result != null && result.failedCount === 0 && result.skippedCount === 0;

  // Auto-close on full success after 2s
  useEffect(() => {
    if (isFullSuccess) {
      autoCloseTimer.current = setTimeout(() => onClose(), 2000);
    }
    return () => {
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    };
  }, [isFullSuccess, onClose]);

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <AppCard style={styles.card} elevation="sm">
        <View style={styles.centerSection}>
          <AlertCircle size={48} color="#F44336" />
          <Text style={[styles.headingText, { color: '#F44336' }]}>Upload Failed</Text>
          <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>{error}</Text>
        </View>
        <View style={styles.btnRow}>
          <Button
            mode="outlined"
            onPress={onClose}
            style={styles.btn}
            textColor={tokens.colors.textSecondary}
          >
            Done
          </Button>
          <Button
            mode="contained"
            onPress={onRetry}
            style={styles.btn}
            icon={() => <RotateCcw size={14} color="#fff" />}
          >
            Retry
          </Button>
        </View>
      </AppCard>
    );
  }

  if (!result) return null;

  // ── Full success ───────────────────────────────────────────────────────────
  if (isFullSuccess) {
    return (
      <AppCard style={styles.card} elevation="sm">
        <View style={styles.centerSection}>
          <CheckCircle size={52} color="#4CAF50" />
          <Text style={[styles.headingText, { color: '#4CAF50' }]}>
            {result.importedCount} lead{result.importedCount !== 1 ? 's' : ''} imported successfully!
          </Text>
          <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
            Closing automatically…
          </Text>
        </View>
      </AppCard>
    );
  }

  // ── Partial success ────────────────────────────────────────────────────────
  return (
    <AppCard style={styles.card} elevation="sm">
      {/* Counts */}
      <View style={styles.countsRow}>
        <View style={styles.countItem}>
          <Text style={[styles.countValue, { color: '#4CAF50' }]}>{result.importedCount}</Text>
          <Text style={styles.countLabel}>Imported</Text>
        </View>
        <View style={[styles.countItem, styles.countDivider]}>
          <Text style={[styles.countValue, { color: '#FF9800' }]}>{result.skippedCount}</Text>
          <Text style={styles.countLabel}>Skipped</Text>
        </View>
        <View style={styles.countItem}>
          <Text style={[styles.countValue, { color: '#F44336' }]}>{result.failedCount}</Text>
          <Text style={styles.countLabel}>Failed</Text>
        </View>
        <View style={styles.countItem}>
          <Text style={[styles.countValue, { color: theme.colors.onSurface }]}>{result.totalRows}</Text>
          <Text style={styles.countLabel}>Total</Text>
        </View>
      </View>

      {/* Error list */}
      {result.errors.length > 0 && (
        <>
          <Text style={[styles.errorListTitle, { color: theme.colors.onSurface }]}>
            Row Errors ({result.errors.length})
          </Text>
          <FlatList
            data={result.errors}
            keyExtractor={(item, idx) => `${item.rowNumber}-${idx}`}
            style={styles.errorList}
            renderItem={({ item }) => (
              <View style={styles.errorItem}>
                <Text style={styles.errorRowNum}>Row {item.rowNumber}</Text>
                <Text style={[styles.errorReason, { color: tokens.colors.textSecondary }]}>
                  {item.reason}
                </Text>
              </View>
            )}
          />
        </>
      )}

      <Button
        mode="contained"
        onPress={onClose}
        style={styles.doneBtn}
      >
        Done
      </Button>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: tokens.spacing.lg,
  },
  centerSection: {
    alignItems: 'center',
    paddingVertical: tokens.spacing.xl,
    gap: tokens.spacing.md,
  },
  headingText: {
    fontSize: tokens.typography.titleMedium.fontSize,
    fontWeight: '700',
    textAlign: 'center',
  },
  bodyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.lg,
  },
  btn: {
    flex: 1,
  },
  countsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: tokens.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.borderLight,
    marginBottom: tokens.spacing.md,
  },
  countItem: {
    alignItems: 'center',
    flex: 1,
  },
  countDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: tokens.colors.borderLight,
  },
  countValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  countLabel: {
    fontSize: 11,
    color: tokens.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  errorListTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: tokens.spacing.sm,
  },
  errorList: {
    maxHeight: 200,
    marginBottom: tokens.spacing.md,
  },
  errorItem: {
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.borderLight,
  },
  errorRowNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F44336',
  },
  errorReason: {
    fontSize: 12,
    marginTop: 2,
  },
  doneBtn: {
    marginTop: tokens.spacing.sm,
  },
});
