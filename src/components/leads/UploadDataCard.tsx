import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Switch, ActivityIndicator, useTheme } from 'react-native-paper';
import { Upload, FileCheck, AlertCircle } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { AppCard } from '@components/global/Card/AppCard';
import { tokens } from '../../theme/tokens';

export interface UploadDataCardProps {
  selectedFile: any | null;
  sendNotifications: boolean;
  uploading: boolean;
  onFilePick: (file: any) => void;
  onInvalidFile: () => void;
  onToggleNotifications: (val: boolean) => void;
  onUpload: () => void;
}

/**
 * Card 2 of the BulkUploadModal.
 * Handles file selection, notification toggle, and the upload trigger.
 *
 * Requirements 3, 4.1, 4.2; design.md §2 Card 2
 */
export function UploadDataCard({
  selectedFile,
  sendNotifications,
  uploading,
  onFilePick,
  onInvalidFile,
  onToggleNotifications,
  onUpload,
}: UploadDataCardProps) {
  const theme = useTheme();
  const [fileError, setFileError] = useState<string | null>(null);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv',
          '*/*',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      const name: string = asset.name ?? '';
      const lower = name.toLowerCase();

      if (!lower.endsWith('.xlsx') && !lower.endsWith('.csv')) {
        setFileError('Only .xlsx and .csv files are supported');
        onInvalidFile();
        return;
      }

      setFileError(null);
      onFilePick(asset);
    } catch {
      setFileError('Could not open file picker. Please try again.');
    }
  };

  const canUpload = !!selectedFile && !uploading;

  return (
    <AppCard style={styles.card} elevation="sm">
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.secondaryContainer }]}>
          <Upload size={20} color={theme.colors.secondary} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Upload Lead Data
          </Text>
          <Text style={[styles.subtitle, { color: tokens.colors.textSecondary }]}>
            Select your filled Excel or CSV file
          </Text>
        </View>
      </View>

      {/* File Picker Button */}
      <View
        style={[
          styles.pickerBtn,
          {
            borderColor: selectedFile ? theme.colors.secondary : tokens.colors.borderLight,
            backgroundColor: selectedFile
              ? theme.colors.secondaryContainer + '40'
              : theme.colors.surfaceVariant,
          },
        ]}
        onStartShouldSetResponder={() => true}
        onResponderRelease={handlePickFile}
      >
        {selectedFile ? (
          <FileCheck size={16} color={theme.colors.secondary} />
        ) : (
          <Upload size={16} color={tokens.colors.textSecondary} />
        )}
        <Text
          style={[
            styles.pickerText,
            { color: selectedFile ? theme.colors.secondary : tokens.colors.textSecondary },
          ]}
          numberOfLines={1}
        >
          {selectedFile ? selectedFile.name : 'Choose file (.xlsx or .csv)'}
        </Text>
      </View>

      {fileError && (
        <View style={styles.errorRow}>
          <AlertCircle size={13} color="#F44336" />
          <Text style={styles.errorText}>{fileError}</Text>
        </View>
      )}

      {/* Notification Toggle — visible only when file is selected */}
      {selectedFile && (
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: theme.colors.onSurface }]}>
            Send email notifications to leads?
          </Text>
          <Switch
            value={sendNotifications}
            onValueChange={onToggleNotifications}
            color={theme.colors.primary}
          />
        </View>
      )}

      {/* Upload Button */}
      <View
        style={[
          styles.uploadBtn,
          {
            backgroundColor: canUpload ? theme.colors.primary : tokens.colors.borderLight,
            opacity: canUpload ? 1 : 0.6,
          },
        ]}
        onStartShouldSetResponder={() => canUpload}
        onResponderRelease={canUpload ? onUpload : undefined}
      >
        {uploading ? (
          <ActivityIndicator size={16} color="#fff" />
        ) : (
          <Upload size={16} color="#fff" />
        )}
        <Text style={styles.uploadBtnText}>
          {uploading ? 'Uploading...' : 'Upload'}
        </Text>
      </View>
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
  titleBlock: { flex: 1 },
  title: {
    fontSize: tokens.typography.titleMedium.fontSize,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: tokens.typography.bodySmall?.fontSize ?? 12,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.borderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: tokens.spacing.sm,
  },
  pickerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: tokens.spacing.sm,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing.sm,
    marginBottom: tokens.spacing.sm,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    marginRight: tokens.spacing.md,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
    paddingVertical: 12,
    borderRadius: tokens.borderRadius.md,
    marginTop: tokens.spacing.sm,
  },
  uploadBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
