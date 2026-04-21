import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, Card, Title, Button, ActivityIndicator, List, IconButton, Snackbar } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ragApi } from '../../services/api';
import ConfirmDialog from '../../components/ConfirmDialog';

interface DocumentFile {
  documentId: string;
  name: string;
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
    // 🔑 Check token FIRST — show clear error if not logged in
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

  return (
    <View style={{ flex: 1, paddingBottom: 40 }}>
      <Button 
        icon="arrow-left" 
        mode="text" 
        onPress={onBack} 
        style={{ alignSelf: 'flex-start', marginBottom: 8 }}
      >
        Back to Settings
      </Button>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>AI Knowledge Base</Title>
          <Text style={styles.subtitle}>
            Upload your business documents (PDFs, Word docs) to train your personalized support AI. The AI will use these to answer customer queries automatically.
          </Text>

          <Button 
            mode="contained" 
            icon="cloud-upload" 
            onPress={handleUpload}
            loading={uploading}
            disabled={uploading}
            style={styles.uploadBtn}
            buttonColor="#075E54"
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </Card.Content>
      </Card>

      <Title style={styles.sectionTitle}>Trained Documents</Title>

      {loading && !uploading ? (
        <ActivityIndicator color="#075E54" style={{ marginTop: 20 }} />
      ) : documents.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text style={{ textAlign: 'center', color: '#666' }}>
              No documents found. Upload a file above to get started.
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {documents.map((doc, index) => (
            <Card key={doc.documentId || index} style={styles.docCard}>
              <List.Item
                title={doc.name}
                titleStyle={{ fontSize: 14, fontWeight: '500' }}
                description="Processed and trained"
                descriptionStyle={{ color: '#4caf50', fontSize: 12 }}
                left={props => <List.Icon {...props} icon="file-document-outline" color="#075E54" />}
                right={props => (
                  <IconButton
                    {...props}
                    icon="delete-outline"
                    iconColor="#d32f2f"
                    onPress={() => handleDeleteClick(doc.documentId)}
                  />
                )}
              />
            </Card>
          ))}
        </ScrollView>
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: '#075E54' }}
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
  card: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#fff',
  },
  docCard: {
    marginBottom: 8,
    elevation: 1,
    backgroundColor: '#fff',
  },
  emptyCard: {
    elevation: 0,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#075E54',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 12,
    marginTop: 8,
  },
  uploadBtn: {
    borderRadius: 8,
    paddingVertical: 4,
  }
});

export default AiKnowledgeBaseView;
