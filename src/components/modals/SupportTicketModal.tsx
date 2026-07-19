import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Modal, Alert } from 'react-native';
import { Button, TextInput, Text, Card, IconButton, useTheme, ActivityIndicator } from 'react-native-paper';
import { X, Send } from 'lucide-react-native';

interface SupportTicketModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SupportTicketModal: React.FC<SupportTicketModalProps> = ({
  visible,
  onClose,
}) => {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in both subject and description.');
      return;
    }

    setSubmitting(true);
    try {
      const { userApi } = require('../../services/api');
      await userApi.createPlatformTicket(title, description);
      Alert.alert('Success', 'Your support ticket has been submitted to the platform owner. We will get back to you soon.');
      setTitle('');
      setDescription('');
      onClose();
    } catch (error: any) {
      console.error('Failed to submit ticket:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Need Help?</Text>
            <IconButton icon={() => <X size={24} color="#666" />} onPress={onClose} />
          </View>
          
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.infoText}>
              Describe your issue below and our platform support team will review it.
            </Text>

            <TextInput
              label="Subject"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={styles.input}
              placeholder="E.g., Issue with billing"
            />

            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={6}
              style={[styles.input, styles.textArea]}
              placeholder="Please provide details about the issue you are experiencing..."
            />

          </ScrollView>

          <View style={styles.footer}>
            <Button
              mode="outlined"
              onPress={onClose}
              style={styles.footerButton}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.footerButton}
              disabled={submitting}
              loading={submitting}
              icon={() => <Send size={18} color="#FFF" />}
            >
              Submit
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '60%',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  scrollContent: {
    padding: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 120,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#fff',
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});
