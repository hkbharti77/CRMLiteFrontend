import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform, TextInput } from 'react-native';
import { Text, Button, ActivityIndicator, List, IconButton, Snackbar, Chip, Modal, Portal } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ragApi, faqApi, FaqItemDto } from '../../services/api';
import ConfirmDialog from '@components/global/Modal/ConfirmDialog';
import { ChevronLeft, ChevronRight, Plus, Search, HelpCircle, Zap, Tag, Edit3, Trash2, Upload, Download, FileSpreadsheet, Layers } from 'lucide-react-native';
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
  const [activeTab, setActiveTab] = useState<'rag' | 'faq'>('rag');

  // RAG Documents State
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);

  // FAQ State
  const [faqs, setFaqs] = useState<FaqItemDto[]>([]);
  const [faqLoading, setFaqLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // 10-Card Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // FAQ Modal Form State
  const [faqModalVisible, setFaqModalVisible] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItemDto | null>(null);
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formKeywords, setFormKeywords] = useState('');
  const [savingFaq, setSavingFaq] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<string | null>(null);
  const [deleteFaqDialogVisible, setDeleteFaqDialogVisible] = useState(false);

  // Bulk FAQ Upload Modal State
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [parsedBulkFaqs, setParsedBulkFaqs] = useState<Partial<FaqItemDto>[]>([]);
  const [pickedFileNames, setPickedFileNames] = useState<string[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchFaqs();
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
    } finally {
      setLoading(false);
    }
  };

  const fetchFaqs = async () => {
    try {
      setFaqLoading(true);
      const response = await faqApi.getFaqs();
      if (response.data) {
        setFaqs(response.data);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setFaqLoading(false);
    }
  };

  const handleUpload = async () => {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      Alert.alert('Not Logged In', 'Your session has expired. Please log in again.');
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

      const response = await ragApi.uploadDocument(file);
      setSnackbarMsg(response.data?.message || 'Document uploaded! Ingestion started.');
      setSnackbarVisible(true);
      fetchDocuments();
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.response?.data?.message || 'Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  const confirmDeleteDoc = async () => {
    if (!docToDelete) return;
    setDeleteDialogVisible(false);
    try {
      setLoading(true);
      await ragApi.deleteDocument(docToDelete);
      setSnackbarMsg('Document deleted successfully');
      setSnackbarVisible(true);
      fetchDocuments();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete document.');
      setLoading(false);
    } finally {
      setDocToDelete(null);
    }
  };

  // FAQ Single Handlers
  const handleOpenCreateFaq = () => {
    setEditingFaq(null);
    setFormQuestion('');
    setFormAnswer('');
    setFormCategory('General');
    setFormKeywords('');
    setFaqModalVisible(true);
  };

  const handleOpenEditFaq = (faq: FaqItemDto) => {
    setEditingFaq(faq);
    setFormQuestion(faq.question);
    setFormAnswer(faq.answer);
    setFormCategory(faq.category || 'General');
    setFormKeywords(faq.keywords || '');
    setFaqModalVisible(true);
  };

  const handleSaveFaq = async () => {
    if (!formQuestion.trim() || !formAnswer.trim()) {
      Alert.alert('Validation Error', 'Question and Answer are required.');
      return;
    }

    setSavingFaq(true);
    try {
      if (editingFaq && editingFaq.id) {
        await faqApi.updateFaq(editingFaq.id, {
          question: formQuestion.trim(),
          answer: formAnswer.trim(),
          category: formCategory.trim(),
          keywords: formKeywords.trim(),
        });
        setSnackbarMsg('FAQ updated successfully!');
      } else {
        await faqApi.createFaq({
          question: formQuestion.trim(),
          answer: formAnswer.trim(),
          category: formCategory.trim(),
          keywords: formKeywords.trim(),
          isActive: true,
        });
        setSnackbarMsg('FAQ created and vector indexed!');
      }
      setFaqModalVisible(false);
      setSnackbarVisible(true);
      fetchFaqs();
    } catch (error) {
      Alert.alert('Error', 'Failed to save FAQ item.');
    } finally {
      setSavingFaq(false);
    }
  };

  const handleToggleFaqActive = async (faq: FaqItemDto) => {
    if (!faq.id) return;
    try {
      await faqApi.updateFaq(faq.id, { isActive: !faq.isActive });
      setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, isActive: !f.isActive } : f));
    } catch (error) {
      console.error('Failed to toggle FAQ state', error);
    }
  };

  const confirmDeleteFaq = async () => {
    if (!faqToDelete) return;
    setDeleteFaqDialogVisible(false);
    try {
      await faqApi.deleteFaq(faqToDelete);
      setSnackbarMsg('FAQ item deleted.');
      setSnackbarVisible(true);
      fetchFaqs();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete FAQ item.');
    } finally {
      setFaqToDelete(null);
    }
  };

  // Bulk FAQ Handlers
  const parseCsvText = (text: string): Partial<FaqItemDto>[] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length <= 1) return [];

    const items: Partial<FaqItemDto>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const matches = lines[i].match(/(?:^|,)(?:"([^"]*)"|([^,]*))/g);
      if (matches) {
        const row = matches.map(cell => {
          let val = cell.replace(/^,/, '').trim();
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.substring(1, val.length - 1);
          }
          return val;
        });
        if (row[0] && row[1]) {
          items.push({
            question: row[0].trim(),
            answer: row[1].trim(),
            category: row[2] ? row[2].trim() : 'General',
            keywords: row[3] ? row[3].trim() : '',
            isActive: true,
          });
        }
      }
    }
    return items;
  };

  const handlePickBulkCsvFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'text/plain'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets) return;

      let newItems: Partial<FaqItemDto>[] = [];
      let names: string[] = [];

      for (const asset of result.assets) {
        names.push(asset.name);
        if (Platform.OS === 'web' && asset.file) {
          const text = await asset.file.text();
          newItems = [...newItems, ...parseCsvText(text)];
        } else if (asset.uri) {
          const res = await fetch(asset.uri);
          const text = await res.text();
          newItems = [...newItems, ...parseCsvText(text)];
        }
      }

      setPickedFileNames(prev => [...prev, ...names]);
      setParsedBulkFaqs(prev => [...prev, ...newItems]);
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to read CSV files.');
    }
  };

  const handleDownloadTemplate = () => {
    if (Platform.OS === 'web') {
      const csvContent = 
        `Question,Answer,Category,Keywords\n` +
        `"What are your store hours?","We are open Mon-Fri 9 AM - 6 PM EST.","General","hours, open, timing"\n` +
        `"Where is your office located?","100 Innovation Way, Suite 400.","General","location, office"\n`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'faq_upload_template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Alert.alert(
        'CSV Template Format',
        'Header required: Question,Answer,Category,Keywords\n\nExample row:\n"What are your hours?","Mon-Fri 9am-6pm","General","hours, open"'
      );
    }
  };

  const handleBulkSubmit = async () => {
    if (parsedBulkFaqs.length === 0) return;

    setBulkUploading(true);
    try {
      const res = await faqApi.createBatchFaqs(parsedBulkFaqs);
      setSnackbarMsg(`Successfully batch imported ${res.data?.length || parsedBulkFaqs.length} FAQs!`);
      setSnackbarVisible(true);
      setBulkModalVisible(false);
      setParsedBulkFaqs([]);
      setPickedFileNames([]);
      fetchFaqs();
    } catch (error) {
      Alert.alert('Error', 'Failed to batch upload FAQ items.');
    } finally {
      setBulkUploading(false);
    }
  };

  // Reset pagination to page 1 on search or category filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const categories = Array.from(new Set(['General', ...faqs.map(f => f.category || 'General')]));

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (faq.keywords && faq.keywords.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'ALL' || (faq.category || 'General') === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalPages = Math.max(1, Math.ceil(filteredFaqs.length / itemsPerPage));
  const paginatedFaqs = filteredFaqs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <View style={sharedStyles.container}>
      {/* Header */}
      <View style={sharedStyles.header}>
        <TouchableOpacity style={sharedStyles.backButton} onPress={onBack}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <View style={sharedStyles.headerContent}>
          <Text style={typography.pageTitle}>AI Knowledge & FAQ Engine</Text>
          <Text style={[typography.description, { marginTop: 4 }]}>
            Train your personalized AI assistant with business documents or configure 85% high-confidence instant FAQs.
          </Text>
        </View>
      </View>

      {/* Sub Navigation Tabs */}
      <View style={styles.tabHeader}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'rag' && styles.activeTabButton]}
          onPress={() => setActiveTab('rag')}
        >
          <Text style={[styles.tabText, activeTab === 'rag' && styles.activeTabText]}>
            RAG Documents
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'faq' && styles.activeTabButton]}
          onPress={() => setActiveTab('faq')}
        >
          <Text style={[styles.tabText, activeTab === 'faq' && styles.activeTabText]}>
            FAQ Engine (85% Match)
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB CONTENT: RAG DOCUMENTS */}
      {activeTab === 'rag' ? (
        <View style={[sharedStyles.tabContent, { flex: 1, paddingBottom: 40 }]}>
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

          <Text style={[typography.sectionTitle, { marginTop: 16, marginBottom: 16 }]}>
            Trained RAG Documents
          </Text>

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
                        <Text style={{ color: colors.success, fontSize: 12, fontWeight: 'bold' }}>
                          Processed and trained
                        </Text>
                        {doc.totalChunks !== undefined && (
                          <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>
                            • Total AI Chunks: {doc.totalChunks}
                          </Text>
                        )}
                      </View>
                    )}
                    left={props => <List.Icon {...props} icon="file-document-outline" color={colors.primary} />}
                    right={props => (
                      <IconButton
                        {...props}
                        icon="delete-outline"
                        iconColor={colors.error}
                        onPress={() => {
                          setDocToDelete(doc.documentId);
                          setDeleteDialogVisible(true);
                        }}
                      />
                    )}
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      ) : (
        /* TAB CONTENT: FAQ ENGINE */
        <View style={[sharedStyles.tabContent, { flex: 1, paddingBottom: 40 }]}>
          <View style={[sharedStyles.modernCard, { padding: 16, marginBottom: 12 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text }}>Instant FAQ Fast Path</Text>
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                  Queries matching &ge;85% similarity respond immediately with zero LLM API cost & zero latency.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setParsedBulkFaqs([]);
                    setPickedFileNames([]);
                    setBulkModalVisible(true);
                  }}
                  compact
                >
                  Bulk Upload
                </Button>
                <Button
                  mode="contained"
                  onPress={handleOpenCreateFaq}
                  buttonColor={colors.primary}
                  compact
                >
                  + Add FAQ
                </Button>
              </View>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search FAQs, keywords..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.muted}
            />
          </View>

          {/* Category Chips */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={{ marginBottom: 12, flexGrow: 0, maxHeight: 42 }}
            contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 2 }}
          >
            <TouchableOpacity
              style={[styles.chip, selectedCategory === 'ALL' && styles.activeChip]}
              onPress={() => setSelectedCategory('ALL')}
            >
              <Text style={[styles.chipText, selectedCategory === 'ALL' && styles.activeChipText]}>
                All ({faqs.length})
              </Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, selectedCategory === cat && styles.activeChip]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.chipText, selectedCategory === cat && styles.activeChipText]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* FAQ List */}
          {faqLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : filteredFaqs.length === 0 ? (
            <View style={[sharedStyles.modernCard, styles.emptyCard]}>
              <Text style={{ textAlign: 'center', color: colors.muted }}>
                No FAQs found. Click "+ Add FAQ" or "Bulk Upload" to get started.
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <ScrollView style={{ flex: 1 }}>
                {paginatedFaqs.map(faq => (
                  <View key={faq.id} style={[styles.compactFaqCard, !faq.isActive && styles.inactiveCard]}>
                    {/* Header: Category Badge (left) | Hits, Active Badge, Edit, Delete (right) */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={styles.catTag}>
                        <Text style={styles.catTagText}>{faq.category || 'General'}</Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 10, color: colors.muted }}>
                          Hits: <Text style={{ fontWeight: 'bold', color: colors.text }}>{faq.hitCount || 0}</Text>
                        </Text>

                        <TouchableOpacity
                          onPress={() => handleToggleFaqActive(faq)}
                          style={[styles.badge, faq.isActive ? styles.activeBadge : styles.inactiveBadge]}
                        >
                          <Text style={[styles.badgeText, faq.isActive ? styles.activeBadgeText : styles.inactiveBadgeText]}>
                            {faq.isActive ? 'Active' : 'Inactive'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleOpenEditFaq(faq)}
                          style={{ padding: 4 }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Edit3 size={15} color={colors.primary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            if (faq.id) {
                              setFaqToDelete(faq.id);
                              setDeleteFaqDialogVisible(true);
                            }
                          }}
                          style={{ padding: 4 }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 size={15} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Question */}
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 4 }}>
                      {faq.question}
                    </Text>

                    {/* Answer */}
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 16 }}>
                      {faq.answer}
                    </Text>

                    {/* Keywords if present */}
                    {faq.keywords ? (
                      <Text style={{ fontSize: 10, color: colors.muted, marginTop: 3 }}>
                        Keywords: {faq.keywords}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </ScrollView>

              {/* 10-Card Pagination Controls Bar */}
              {filteredFaqs.length > 0 && (
                <View style={styles.paginationContainer}>
                  <Text style={styles.paginationText}>
                    Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredFaqs.length)} of {filteredFaqs.length} FAQs
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity
                      disabled={currentPage === 1}
                      onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                    >
                      <ChevronLeft size={16} color={currentPage === 1 ? colors.muted : colors.primary} />
                      <Text style={[styles.pageButtonText, currentPage === 1 && { color: colors.muted }]}>Prev</Text>
                    </TouchableOpacity>

                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text, marginHorizontal: 4 }}>
                      {currentPage} / {totalPages}
                    </Text>

                    <TouchableOpacity
                      disabled={currentPage >= totalPages}
                      onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      style={[styles.pageButton, currentPage >= totalPages && styles.pageButtonDisabled]}
                    >
                      <Text style={[styles.pageButtonText, currentPage >= totalPages && { color: colors.muted }]}>Next</Text>
                      <ChevronRight size={16} color={currentPage >= totalPages ? colors.muted : colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* SINGLE FAQ CREATE / EDIT MODAL */}
      <Portal>
        <Modal
          visible={faqModalVisible}
          onDismiss={() => setFaqModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 12 }}>
            {editingFaq ? 'Edit FAQ Item' : 'Add New FAQ Item'}
          </Text>

          <Text style={styles.inputLabel}>Question (Triggers 85% Match)</Text>
          <TextInput
            style={styles.formInput}
            value={formQuestion}
            onChangeText={setFormQuestion}
            placeholder="e.g. What are your store operating hours?"
          />

          <Text style={styles.inputLabel}>Direct Answer</Text>
          <TextInput
            style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
            multiline
            value={formAnswer}
            onChangeText={setFormAnswer}
            placeholder="Pre-approved response returned directly..."
          />

          <Text style={styles.inputLabel}>Category</Text>
          <TextInput
            style={styles.formInput}
            value={formCategory}
            onChangeText={setFormCategory}
            placeholder="e.g. General, Pricing"
          />

          <Text style={styles.inputLabel}>Keywords (Optional)</Text>
          <TextInput
            style={styles.formInput}
            value={formKeywords}
            onChangeText={setFormKeywords}
            placeholder="e.g. hours, open, timing"
          />

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button onPress={() => setFaqModalVisible(false)} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveFaq}
              loading={savingFaq}
              disabled={savingFaq}
              buttonColor={colors.primary}
            >
              Save FAQ
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* BULK UPLOAD MODAL WITH TWO CARDS */}
      <Portal>
        <Modal
          visible={bulkModalVisible}
          onDismiss={() => setBulkModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 }}>
            Bulk FAQ Import & Vector Ingestion
          </Text>
          <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 12 }}>
            Upload multiple CSV files to batch import FAQs into your knowledge base.
          </Text>

          {/* CARD 1: TEMPLATE DOWNLOAD */}
          <View style={[styles.cardBox, { marginBottom: 12 }]}>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.text, marginBottom: 4 }}>
              Card 1: Download Templates
            </Text>
            <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 8 }}>
              Header format: Question, Answer, Category, Keywords
            </Text>
            <Button
              mode="outlined"
              icon="download"
              onPress={handleDownloadTemplate}
              compact
            >
              Download Sample Template
            </Button>
          </View>

          {/* CARD 2: FILE PICKER */}
          <View style={styles.cardBox}>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.text, marginBottom: 4 }}>
              Card 2: Select Multi-File CSV
            </Text>
            <Button
              mode="contained"
              icon="file-document-multiple-outline"
              onPress={handlePickBulkCsvFiles}
              buttonColor={colors.primary}
              compact
              style={{ marginBottom: 8 }}
            >
              Browse & Select CSV Files
            </Button>

            {pickedFileNames.length > 0 && (
              <View style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.success }}>
                  Files ({pickedFileNames.length}): {pickedFileNames.join(', ')}
                </Text>
                <Text style={{ fontSize: 11, color: colors.text, marginTop: 2 }}>
                  Parsed FAQs: <Text style={{ fontWeight: 'bold' }}>{parsedBulkFaqs.length}</Text>
                </Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button onPress={() => setBulkModalVisible(false)} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleBulkSubmit}
              loading={bulkUploading}
              disabled={parsedBulkFaqs.length === 0 || bulkUploading}
              buttonColor={colors.primary}
            >
              Upload {parsedBulkFaqs.length} FAQs
            </Button>
          </View>
        </Modal>
      </Portal>

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
        message="Are you sure you want to delete this document from your knowledge base?"
        confirmLabel="Delete"
        destructive={true}
        onConfirm={confirmDeleteDoc}
        onCancel={() => {
          setDeleteDialogVisible(false);
          setDocToDelete(null);
        }}
      />

      <ConfirmDialog
        visible={deleteFaqDialogVisible}
        title="Delete FAQ Item"
        message="Are you sure you want to delete this FAQ item?"
        confirmLabel="Delete"
        destructive={true}
        onConfirm={confirmDeleteFaq}
        onCancel={() => {
          setDeleteFaqDialogVisible(false);
          setFaqToDelete(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  tabHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  emptyCard: {
    padding: 24,
    elevation: 0,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  searchContainer: {
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: colors.text,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
    height: 32,
  },
  activeChip: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
  },
  activeChipText: {
    color: '#ffffff',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeBadge: {
    backgroundColor: '#dcfce7',
  },
  inactiveBadge: {
    backgroundColor: '#f1f5f9',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeBadgeText: {
    color: '#166534',
  },
  inactiveBadgeText: {
    color: colors.muted,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  cardBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#f8fafc',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: colors.text,
  },
  compactFaqCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  inactiveCard: {
    opacity: 0.6,
    backgroundColor: '#f8fafc',
  },
  catTag: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  catTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  paginationText: {
    fontSize: 11,
    color: colors.muted,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#ffffff',
  },
  pageButtonDisabled: {
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    opacity: 0.5,
  },
  pageButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default AiKnowledgeBaseView;
