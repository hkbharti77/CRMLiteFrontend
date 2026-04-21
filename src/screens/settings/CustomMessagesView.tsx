import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { Card, Title, Text, TextInput, Button, List, Divider, IconButton, ActivityIndicator } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { whatsappApi } from '../../services/api';

interface CustomQuickMessage {
  id: string;
  name: string;
  response: string;
  imageUrl?: string;
}

interface CustomMessagesViewProps {
  customMessagesJson?: string;
  whatsappApi: any;
  onSave: (json: string) => void;
  onBack: () => void;
}

const CustomMessagesView: React.FC<CustomMessagesViewProps> = ({
  customMessagesJson,
  whatsappApi: passedApi,
  onSave,
  onBack,
}) => {
  const [activeAccordion, setActiveAccordion] = useState<string | number | undefined>('msg_1');
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Parse existing data or initialize 6 slots
  let messages: CustomQuickMessage[] = [];
  try {
    if (customMessagesJson) {
      messages = JSON.parse(customMessagesJson);
    }
  } catch (e) {
    console.error('Failed to parse customMessagesJson', e);
  }

  // Ensure exactly 6 slots
  const initialMessages: CustomQuickMessage[] = Array.from({ length: 6 }, (_, i) => ({
    id: `custom_msg_${i + 1}`,
    name: (messages[i]?.name) || `Quick Response ${i + 1}`,
    response: (messages[i]?.response) || '',
    imageUrl: (messages[i]?.imageUrl) || '',
  }));

  const [currentMessages, setCurrentMessages] = useState<CustomQuickMessage[]>(initialMessages);

  const updateMessage = (index: number, field: keyof CustomQuickMessage, value: string) => {
    const updated = [...currentMessages];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentMessages(updated);
  };

  const handlePicker = async (index: number) => {
    const apiToUse = passedApi || whatsappApi;
    if (!apiToUse) {
        console.error('whatsappApi is undefined in CustomMessagesView');
        Alert.alert('Error', 'API not initialized. Please try again.');
        return;
    }

    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'image/*',
            copyToCacheDirectory: true
        });

        if (result.canceled) return;

        const asset = result.assets[0];
        setUploadingField(`msg_${index}`);

        const resp = await apiToUse.uploadMedia(asset);
        updateMessage(index, 'imageUrl', resp.data.url);
    } catch (error: any) {
        console.error('Upload error:', error);
        Alert.alert('Upload Failed', error.response?.data || 'Could not upload image.');
    } finally {
        setUploadingField(null);
    }
  };

  const handleSave = () => {
    onSave(JSON.stringify(currentMessages));
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={onBack} />
          <Title>Custom Quick Responses (6 Slots)</Title>
        </View>
        <Text style={styles.subtitle}>
          Define up to 6 direct text responses. Use the button editor to link a button directly to these messages.
        </Text>
      </Card>

      <List.AccordionGroup
        expandedId={activeAccordion}
        onAccordionPress={(id) => setActiveAccordion(id)}
      >
        {currentMessages.map((msg, idx) => (
          <Card key={msg.id} style={styles.menuCard}>
            <List.Accordion
              title={msg.name || `Slot ${idx + 1}`}
              id={`msg_${idx + 1}`}
              left={(props) => <List.Icon {...props} icon="message-text-outline" />}
            >
              <View style={styles.cardContent}>
                <TextInput
                  label="Internal Name (Label for you)"
                  value={msg.name}
                  onChangeText={(v) => updateMessage(idx, 'name', v)}
                  mode="outlined"
                  style={styles.input}
                  placeholder="e.g. Welcome Greeting"
                />

                <TextInput
                  label="Response Text (Sent to customer)"
                  value={msg.response}
                  onChangeText={(v) => updateMessage(idx, 'response', v)}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  style={styles.input}
                  placeholder="What should the bot say back immediately?"
                />

                <View style={styles.imageSection}>
                  <Text style={styles.imageLabel}>Optional Image</Text>
                  {msg.imageUrl ? (
                    <View style={styles.previewContainer}>
                      <Image source={{ uri: msg.imageUrl }} style={styles.previewImage} />
                      <IconButton
                        icon="close-circle"
                        iconColor="red"
                        size={20}
                        style={styles.removeImageIcon}
                        onPress={() => updateMessage(idx, 'imageUrl', '')}
                      />
                    </View>
                  ) : (
                    <Button
                      mode="outlined"
                      icon="camera"
                      onPress={() => handlePicker(idx)}
                      loading={uploadingField === `msg_${idx}`}
                      disabled={!!uploadingField}
                    >
                      Upload Image
                    </Button>
                  )}
                </View>
              </View>
            </List.Accordion>
          </Card>
        ))}
      </List.AccordionGroup>

      <Button
        mode="contained"
        onPress={handleSave}
        style={styles.saveButton}
        contentStyle={styles.saveButtonContent}
      >
        Save All Quick Responses
      </Button>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  headerCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 48,
    marginTop: -8,
  },
  menuCard: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
    backgroundColor: '#fff',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: '#6200ee',
    borderRadius: 8,
  },
  saveButtonContent: {
    paddingVertical: 8,
  },
  imageSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  imageLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  previewContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
    width: '100%',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  removeImageIcon: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
  },
});

export default CustomMessagesView;
