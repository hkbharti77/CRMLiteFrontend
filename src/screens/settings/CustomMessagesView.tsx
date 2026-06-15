import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, List, Divider, IconButton, Icon } from 'react-native-paper';
import { ChevronLeft } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { whatsappApi } from '../../services/api';
import { colors, typography, sharedStyles } from '../../theme';

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

  let messages: CustomQuickMessage[] = [];
  try {
    if (customMessagesJson) {
      messages = JSON.parse(customMessagesJson);
    }
  } catch (e) {
    console.error('Failed to parse customMessagesJson', e);
  }

  const initialMessages: CustomQuickMessage[] = Array.from({ length: 6 }, (_, i) => ({
    id: `custom_msg_${i + 1}`,
    name: messages[i]?.name || `Quick Response ${i + 1}`,
    response: messages[i]?.response || '',
    imageUrl: messages[i]?.imageUrl || '',
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
      Alert.alert('Error', 'API not initialized. Please try again.');
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
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
    <View style={sharedStyles.container}>
      {/* Header */}
      <View style={sharedStyles.header}>
        <TouchableOpacity style={sharedStyles.backButton} onPress={onBack}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <View style={sharedStyles.headerContent}>
          <Text style={typography.pageTitle}>Quick Responses</Text>
          <Text style={[typography.description, { marginTop: 4 }]}>
            Define up to 6 direct text responses. Link buttons to these messages in the button editor.
          </Text>
        </View>
      </View>

      <ScrollView
        style={sharedStyles.tabContent}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <List.AccordionGroup
          expandedId={activeAccordion}
          onAccordionPress={(id) => setActiveAccordion(id)}
        >
          {currentMessages.map((msg, idx) => (
            <View key={msg.id} style={[sharedStyles.modernCard, { marginBottom: 8 }]}>
              <List.Accordion
                title={msg.name || `Slot ${idx + 1}`}
                id={`msg_${idx + 1}`}
                left={(props) => (
                  <List.Icon {...props} icon="message-text-outline" color={colors.primary} />
                )}
                titleStyle={[typography.cardTitle, { color: colors.text }]}
                style={{ backgroundColor: colors.card }}
              >
                <View style={styles.cardContent}>
                  <TextInput
                    label="Internal Name (Label for you)"
                    value={msg.name}
                    onChangeText={(v) => updateMessage(idx, 'name', v)}
                    mode="outlined"
                    style={sharedStyles.input}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    placeholder="e.g. Welcome Greeting"
                  />
                  <TextInput
                    label="Response Text (Sent to customer)"
                    value={msg.response}
                    onChangeText={(v) => updateMessage(idx, 'response', v)}
                    mode="outlined"
                    multiline
                    numberOfLines={4}
                    style={sharedStyles.input}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    placeholder="What should the bot say back immediately?"
                  />
                  <View style={styles.imageSection}>
                    <Text style={typography.metaText}>Optional Image</Text>
                    {msg.imageUrl ? (
                      <View style={styles.previewContainer}>
                        <Image source={{ uri: msg.imageUrl }} style={styles.previewImage} />
                        <IconButton
                          icon="close-circle"
                          iconColor={colors.error}
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
                        textColor={colors.primary}
                        style={{ borderColor: colors.border }}
                      >
                        Upload Image
                      </Button>
                    )}
                  </View>
                </View>
              </List.Accordion>
            </View>
          ))}
        </List.AccordionGroup>
      </ScrollView>

      {/* Sticky Save Footer */}
      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleSave}
          buttonColor={colors.primary}
          icon="check"
          style={[sharedStyles.button, { width: '100%' }]}
          contentStyle={{ paddingVertical: 4 }}
        >
          Save All Quick Responses
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContent: {
    padding: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  imageSection: {
    marginTop: 4,
    marginBottom: 8,
  },
  previewContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
    width: '100%',
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: colors.border,
  },
  removeImageIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.card,
  },
});

export default CustomMessagesView;
