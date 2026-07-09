import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Modal, Portal, Text, useTheme, IconButton } from 'react-native-paper';
import { X } from 'lucide-react-native';

import { TemplateDownloadCard } from './TemplateDownloadCard';
import { UploadDataCard } from './UploadDataCard';
import { ValidationSettingsPanel } from './ValidationSettingsPanel';
import { ResultScreen, BulkUploadResult } from './ResultScreen';
import { bulkLeadApi, userApi } from '../../services/api';
import { tokens } from '../../theme/tokens';

type ModalState = 'IDLE' | 'FILE_SELECTED' | 'UPLOADING' | 'RESULT' | 'ERROR';

export interface BulkUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Bottom-sheet modal for the bulk lead upload flow.
 *
 * State machine: IDLE → FILE_SELECTED → UPLOADING → RESULT
 *                                                 └── ERROR (retry available)
 *
 * Requirements 1.3, 1.4; design.md §1
 */
export function BulkUploadModal({ visible, onClose, onSuccess }: BulkUploadModalProps) {
  const theme = useTheme();

  const [modalState, setModalState] = useState<ModalState>('IDLE');
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [sendNotifications, setSendNotifications] = useState(false);
  const [result, setResult] = useState<BulkUploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Reset all state when modal closes
  useEffect(() => {
    if (!visible) {
      setModalState('IDLE');
      setSelectedFile(null);
      setSendNotifications(false);
      setResult(null);
      setErrorMessage(null);
    }
  }, [visible]);

  // Load user role on open to gate admin panel
  useEffect(() => {
    if (!visible) return;
    userApi.getProfile()
      .then((res: any) => {
        const role: string = res.data?.role ?? '';
        setIsAdmin(role === 'OWNER' || role === 'ADMIN');
      })
      .catch(() => setIsAdmin(false));
  }, [visible]);

  const handleFilePick = (file: any) => {
    setSelectedFile(file);
    setModalState('FILE_SELECTED');
  };

  const handleInvalidFile = () => {
    setSelectedFile(null);
    setModalState('IDLE');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setModalState('UPLOADING');
    try {
      const res = await bulkLeadApi.uploadLeads(selectedFile, sendNotifications);
      setResult(res.data);
      setModalState('RESULT');

      // Trigger pipeline refresh after full success
      const data: BulkUploadResult = res.data;
      if (data.failedCount === 0 && data.skippedCount === 0) {
        onSuccess();
      }
    } catch (err: any) {
      const status: number = err?.response?.status;
      let msg = 'An unexpected error occurred. Please try again.';
      if (status === 413) msg = 'File too large (max 5 MB). Please reduce the file size.';
      else if (status === 422) msg = 'Missing required column: name. Check your file headers.';
      else if (status === 400) msg = 'File has no data rows. Please add lead data and retry.';
      setErrorMessage(msg);
      setModalState('ERROR');
    }
  };

  const handleRetry = () => {
    setModalState(selectedFile ? 'FILE_SELECTED' : 'IDLE');
    setErrorMessage(null);
    setResult(null);
  };

  const handleClose = () => {
    onClose();
  };

  const showResult = modalState === 'RESULT' || modalState === 'ERROR';

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleClose}
        contentContainerStyle={[
          styles.sheet,
          { backgroundColor: theme.colors.background },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: tokens.colors.borderLight }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            Bulk Lead Upload
          </Text>
          <IconButton
            icon={() => <X size={20} color={tokens.colors.textSecondary} />}
            onPress={handleClose}
            size={20}
          />
        </View>

        {showResult ? (
          /* ── Result / Error ── */
          <ScrollView contentContainerStyle={styles.content}>
            <ResultScreen
              result={result}
              error={errorMessage}
              onClose={handleClose}
              onRetry={handleRetry}
            />
          </ScrollView>
        ) : (
          /* ── Upload Flow ── */
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <TemplateDownloadCard />
            <UploadDataCard
              selectedFile={selectedFile}
              sendNotifications={sendNotifications}
              uploading={modalState === 'UPLOADING'}
              onFilePick={handleFilePick}
              onInvalidFile={handleInvalidFile}
              onToggleNotifications={setSendNotifications}
              onUpload={handleUpload}
            />
            <ValidationSettingsPanel visible={isAdmin} />
          </ScrollView>
        )}
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    marginHorizontal: 0,
    marginBottom: 0,
    marginTop: 'auto',
    borderTopLeftRadius: tokens.borderRadius.xl ?? 20,
    borderTopRightRadius: tokens.borderRadius.xl ?? 20,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: tokens.spacing.lg,
    paddingRight: tokens.spacing.sm,
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: tokens.typography.titleMedium.fontSize,
    fontWeight: '700',
  },
  content: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
  },
});
