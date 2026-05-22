import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, Alert, Platform } from 'react-native';
import { Appbar, FAB, Card, Title, Paragraph, Button, Portal, Modal, TextInput, ActivityIndicator, IconButton, Text, useTheme } from 'react-native-paper';
import { businessServiceApi } from '../services/api';
import * as DocumentPicker from 'expo-document-picker';
import { SERVER_HOST } from '../services/api';

export default function BusinessServicesScreen() {
  const theme = useTheme();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await businessServiceApi.getAll();
      setServices(res.data);
    } catch (err: any) {
      console.error('Failed to fetch services', err);
      Alert.alert('Error', 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFile(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    
    if (name.length > 24) {
      Alert.alert('Error', 'Name must be 24 characters or fewer for WhatsApp menu limits.');
      return;
    }

    try {
      setSubmitting(true);
      const data = { name, description, file };

      if (editingId) {
        await businessServiceApi.update(editingId, data);
      } else {
        await businessServiceApi.create(data);
      }
      
      setModalVisible(false);
      fetchServices();
      resetForm();
    } catch (err: any) {
      const errorMsg = err.response?.data || 'Failed to save service';
      Alert.alert('Error', typeof errorMsg === 'string' ? errorMsg : 'Failed to save service');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this service?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await businessServiceApi.delete(id);
          fetchServices();
        } catch (err) {
          Alert.alert('Error', 'Failed to delete service');
        }
      }}
    ]);
  };

  const openModal = (service?: any) => {
    if (service) {
      setEditingId(service.id);
      setName(service.name);
      setDescription(service.description);
      setFile(null); // Existing picture isn't previewed in picker, just stays if not changed
    } else {
      resetForm();
    }
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setFile(null);
  };

  const renderItem = ({ item }: { item: any }) => (
    <Card style={styles.card}>
      {item.imageUrl && (
        <Card.Cover source={{ uri: item.imageUrl }} />
      )}
      <Card.Content style={styles.cardContent}>
        <Title>{item.name}</Title>
        {item.description ? <Paragraph numberOfLines={3}>{item.description}</Paragraph> : null}
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => openModal(item)}>Edit</Button>
        <Button color="red" onPress={() => handleDelete(item.id)}>Delete</Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : services.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No services found. Add some to display in your WhatsApp menu!</Text>
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        color="white"
        onPress={() => openModal()}
      />

      <Portal>
        <Modal visible={isModalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modalContainer}>
          <Title style={styles.modalTitle}>{editingId ? 'Edit Service' : 'Add Service'}</Title>
          
          <TextInput
            label="Service Name (Max 24 chars)"
            value={name}
            onChangeText={setName}
            maxLength={24}
            style={styles.input}
            mode="outlined"
          />
          
          <TextInput
            label="Description / FAQs"
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={4}
          />
          
          <View style={styles.imagePickerRow}>
            <Button icon="camera" mode="contained-tonal" onPress={handlePickImage} style={styles.imageButton}>
              {file ? 'Change Image' : 'Add Image'}
            </Button>
            {file && <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>}
          </View>

          <View style={styles.modalActions}>
            <Button onPress={() => setModalVisible(false)} style={styles.actionBtn}>Cancel</Button>
            <Button mode="contained" onPress={handleSubmit} loading={submitting} style={styles.actionBtn}>
              Save
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  list: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 16,
  },
  cardContent: {
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  imagePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  imageButton: {
    marginRight: 10,
  },
  fileName: {
    flex: 1,
    fontSize: 12,
    color: 'gray',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    marginLeft: 8,
  },
});
