import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { Text, Button, ActivityIndicator, List, IconButton, Snackbar, Icon } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ragApi } from '../../services/api';
import ConfirmDialog from '@components/global/Modal/ConfirmDialog';
import { ChevronLeft } from 'lucide-react-native';
import { colors, typography, sharedStyles } from '../../theme';

interface DocumentFile {
  documentId: string;
  name: string;
  totalChunks?: number;
  embeddingSize?: number;
  vectorModel?: string;
}

interface Props {
  onBack: () => void;
}

const AiKnowledgeBaseView: React.FC<Props> = ({ onBack }) => {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await ragApi.listDocuments();
      if (response.data) {
        setDocuments(response.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      Alert.alert('Error', 'Failed to load your knowledge base documents.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      Alert.alert(
        'Not Logged In',
        'Your session has expired. Please log out and log in again.',
      );
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setUploading(true);

      console.log('📤 Uploading file:', file.name, '| Token present:', !!token);
      const response = await ragApi.uploadDocument(file);
      
      setSnackbarMsg(response.data?.message || 'Document uploaded! Ingestion started.');
      setSnackbarVisible(true);
      fetchDocuments();
    } catch (error: any) {
      console.error('❌ Upload error:', error.response?.status, error.response?.data);
      const status = error.response?.status;
      const msg = error.response?.data?.error || error.response?.data?.message || error.message;
      if (status === 401) {
        Alert.alert('Session Expired', 'Please log out and log in again to upload documents.');
      } else if (status === 403) {
        Alert.alert('Access Denied', 'Your account does not have upload permissions.');
      } else {
        Alert.alert('Upload Failed', msg || 'Failed to upload. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (docId: string) => {
    setDocToDelete(docId);
    setDeleteDialogVisible(true);
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;
    
    setDeleteDialogVisible(false);
    try {
      setLoading(true);
      await ragApi.deleteDocument(docToDelete);
      setSnackbarMsg('Document deleted successfully');
      setSnackbarVisible(true);
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      Alert.alert('Error', 'Failed to delete document.');
      setLoading(false);
    } finally {
      setDocToDelete(null);
    }
  };

  const handleDownload = async (docId: string, filename: string) => {
    try {
      setSnackbarMsg('Starting download...');
      setSnackbarVisible(true);
      const response = await ragApi.downloadDocument(docId);
      
      if (Platform.OS === 'web') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${filename}.txt`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        Alert.alert('Download Started', 'The text file has been retrieved.');
      }
    } catch (error) {
      console.error('Download failed', error);
      Alert.alert('Download Failed', 'Failed to download the document text.');
    }
  };

  return (
    <View style={sharedStyles.container}>
      <View style={sharedStyles.header}>
        <TouchableOpacity style={sharedStyles.backButton} onPress={onBack}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <View style={sharedStyles.headerContent}>
          <Text style={typography.pageTitle}>AI Knowledge Base</Text>
          <Text style={[typography.description, { marginTop: 4 }]}>
            Upload your business documents (PDFs, Word docs) to train your personalized support AI. The AI will use these to answer customer queries automatically.
          </Text>
        </View>
      </View>

      <View style={[sharedStyles.tabContent, { paddingBottom: 40 }]}>
        <View style={[sharedStyles.modernCard, { padding: 16 }]}>
          <Button 
            mode="contained" 
            icon="cloud-upload" 
            onPress={handleUpload}
            loading={uploading}
            disabled={uploading}
            style={sharedStyles.button}
            buttonColor={colors.primary}
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </View>

        <Text style={[typography.sectionTitle, { marginTop: 16, marginBottom: 16 }]}>Trained Documents</Text>

        {loading && !uploading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : documents.length === 0 ? (
          <View style={[sharedStyles.modernCard, styles.emptyCard]}>
            <Text style={{ textAlign: 'center', color: colors.muted }}>
              No documents found. Upload a file above to get started.
            </Text>
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }}>
            {documents.map((doc, index) => (
              <View key={doc.documentId || index} style={[sharedStyles.modernCard, { marginBottom: 8 }]}>
                <List.Item
                  title={doc.name}
                  titleStyle={typography.cardTitle}
                  description={() => (
                    <View style={{ marginTop: 4 }}>
                      <Text style={{ color: colors.success, fontSize: 12, fontWeight: 'bold' }}>Processed and trained</Text>
                      {doc.totalChunks !== undefined && (
                        <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>
                          • Total AI Chunks: {doc.totalChunks}
                        </Text>
                      )}
                      {doc.vectorModel && (
                        <Text style={{ color: colors.muted, fontSize: 11 }}>
                          • Vector Model: {doc.vectorModel} ({doc.embeddingSize}d)
                        </Text>
                      )}
                    </View>
                  )}
                  left={props => <List.Icon {...props} icon="file-document-outline" color={colors.primary} />}
                  right={props => (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <IconButton
                        {...props}
                        icon="download-outline"
                        iconColor={colors.primary}
                        onPress={() => handleDownload(doc.documentId, doc.name)}
                      />
                      <IconButton
                        {...props}
                        icon="delete-outline"
                        iconColor={colors.error}
                        onPress={() => handleDeleteClick(doc.documentId)}
                      />
                    </View>
                  )}
                />
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: colors.primary }}
      >
        {snackbarMsg}
      </Snackbar>

      <ConfirmDialog
        visible={deleteDialogVisible}
        title="Delete Document"
        message="Are you sure you want to delete this document from your knowledge base? This will affect your AI bot's responses."
        confirmLabel="Delete"
        destructive={true}
        onConfirm={confirmDelete}
        onCancel={() => {
           setDeleteDialogVisible(false);
           setDocToDelete(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  emptyCard: {
    padding: 24,
    elevation: 0,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed'
  }
});

export default AiKnowledgeBaseView;

