import React, { useState } from 'react';
import { View, StyleSheet, Platform, Linking } from 'react-native';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';
import { Download, CheckCircle, AlertCircle } from 'lucide-react-native';
import { AppCard } from '@components/global/Card/AppCard';
import { bulkLeadApi } from '../../services/api';
import { tokens } from '../../theme/tokens';

type DownloadState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Card 1 of the BulkUploadModal.
 * Lets users download a pre-formatted Excel or CSV template.
 *
 * Requirement 2; design.md §2 Card 1
 */
export function TemplateDownloadCard() {
  const theme = useTheme();
  const [xlsxState, setXlsxState] = useState<DownloadState>('idle');
  const [csvState, setCsvState] = useState<DownloadState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDownload = async (format: 'xlsx' | 'csv') => {
    const setState = format === 'xlsx' ? setXlsxState : setCsvState;
    setState('loading');
    setErrorMsg(null);

    try {
      const response = await bulkLeadApi.downloadTemplate(format);
      const mimeType =
        format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv';
      const filename = `lead-template.${format}`;

      if (Platform.OS === 'web') {
        // Web: create a temporary anchor element for download
        const blob = new Blob([response.data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
      } else {
        // Mobile: use expo-file-system + expo-sharing
        try {
          const FileSystem = require('expo-file-system');
          const Sharing = require('expo-sharing');
          const fileUri = `${FileSystem.cacheDirectory}${filename}`;
          await FileSystem.writeAsStringAsync(fileUri, response.data, {
            encoding: FileSystem.EncodingType.UTF8,
          });
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, { mimeType, dialogTitle: `Save ${filename}` });
          }
        } catch {
          // Graceful fallback — nothing to do, download is best-effort on mobile
        }
      }

      setState('success');
      // Reset success indicator after 3s
      setTimeout(() => setState('idle'), 3000);
    } catch (err: any) {
      setState('error');
      setErrorMsg(`Failed to download ${format.toUpperCase()} template`);
      setTimeout(() => setState('idle'), 4000);
    }
  };

  const renderButton = (format: 'xlsx' | 'csv', label: string, state: DownloadState) => (
    <View
      style={[
        styles.downloadBtn,
        { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryContainer + '40' },
        state === 'loading' && styles.btnDisabled,
      ]}
    >
      {state === 'loading' ? (
        <ActivityIndicator size={14} color={theme.colors.primary} />
      ) : state === 'success' ? (
        <CheckCircle size={14} color="#4CAF50" />
      ) : state === 'error' ? (
        <AlertCircle size={14} color={tokens.colors.error ?? '#F44336'} />
      ) : (
        <Download size={14} color={theme.colors.primary} />
      )}
      <Text
        style={[styles.btnText, { color: theme.colors.primary }]}
        onPress={state === 'loading' ? undefined : () => handleDownload(format)}
      >
        {label}
      </Text>
    </View>
  );

  return (
    <AppCard style={styles.card} elevation="sm">
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
          <Download size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Download Template
          </Text>
          <Text style={[styles.subtitle, { color: tokens.colors.textSecondary }]}>
            Get the required format for your data
          </Text>
        </View>
      </View>

      <View style={styles.btnRow}>
        {renderButton('xlsx', 'Excel (.xlsx)', xlsxState)}
        {renderButton('csv', 'CSV', csvState)}
      </View>

      {errorMsg && (
        <Text style={styles.errorText}>{errorMsg}</Text>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: tokens.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.md,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: tokens.typography.titleMedium.fontSize,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: tokens.typography.bodySmall?.fontSize ?? 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  downloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.borderRadius.md,
    borderWidth: 1.5,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    marginTop: tokens.spacing.sm,
    fontSize: 12,
    color: '#F44336',
  },
});
