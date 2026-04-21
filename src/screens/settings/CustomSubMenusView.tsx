import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { Card, Title, Text, TextInput, Button, List, Divider, IconButton, ActivityIndicator } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { whatsappApi } from '../../services/api';

interface CustomItem {
  title: string;
  desc: string;
  response: string;
  imageUrl?: string;
}

interface CustomSubMenu {
  id: string; // custom_list_1, custom_list_2 etc
  triggerLabel: string;
  headerTitle: string;
  bodyText: string;
  headerImageUrl?: string;
  items: CustomItem[];
}

interface CustomSubMenusViewProps {
  customSubMenusJson: string;
  whatsappApi: any;
  setCustomSubMenusJson: (val: string) => void;
  handleSave: () => void;
  loading: boolean;
  onBack: () => void;
}

const CustomSubMenusView: React.FC<CustomSubMenusViewProps> = ({
  customSubMenusJson,
  whatsappApi: passedApi,
  setCustomSubMenusJson,
  handleSave,
  loading,
  onBack,
}) => {
  const [activeAccordion, setActiveAccordion] = useState<string | number | undefined>('custom_list_1');
  const [uploadingField, setUploadingField] = useState<string | null>(null); // e.g., 'm0_header' or 'm0_i1'

  // Parse existing data
  let subMenus: CustomSubMenu[] = [];
  try {
    subMenus = JSON.parse(customSubMenusJson);
  } catch (e) {
    subMenus = [];
  }

  // Ensure 4 slots exist
  const ensureSlots = () => {
    const newMenus = [...subMenus];
    for (let i = 1; i <= 4; i++) {
        const id = `custom_list_${i}`;
        if (!newMenus.find(m => m.id === id)) {
            newMenus.push({
                id,
                triggerLabel: `Custom Menu ${i}`,
                headerTitle: 'Our Options',
                bodyText: 'Please select an option below:',
                items: [{ title: 'Example Option', desc: 'Description here', response: 'Thank you for selecting this!' }]
            });
        }
    }
    // Sort by ID
    return newMenus.sort((a, b) => a.id.localeCompare(b.id));
  };

  const currentMenus = ensureSlots();

  const updateMenu = (index: number, updated: CustomSubMenu) => {
    const newMenus = [...currentMenus];
    newMenus[index] = updated;
    setCustomSubMenusJson(JSON.stringify(newMenus));
  };

  const addItem = (menuIndex: number) => {
    const menu = { ...currentMenus[menuIndex] };
    if (menu.items.length >= 10) return;
    menu.items.push({ title: '', desc: '', response: '' });
    updateMenu(menuIndex, menu);
  };

  const removeItem = (menuIndex: number, itemIndex: number) => {
    const menu = { ...currentMenus[menuIndex] };
    menu.items.splice(itemIndex, 1);
    updateMenu(menuIndex, menu);
  };

  const updateItem = (menuIndex: number, itemIndex: number, field: keyof CustomItem, value: string) => {
    const menu = { ...currentMenus[menuIndex] };
    const items = [...menu.items];
    items[itemIndex] = { ...items[itemIndex], [field]: value };
    menu.items = items;
    updateMenu(menuIndex, menu);
  };

  const handlePicker = async (fieldId: string, onUpload: (url: string) => void) => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'image/*',
            copyToCacheDirectory: true
        });

        if (result.canceled) return;

        const asset = result.assets[0];
        setUploadingField(fieldId);

        // Convert URI to Blob-like object for FormData
        const resp = await passedApi.uploadMedia(asset);
        onUpload(resp.data.url);
    } catch (error: any) {
        console.error('Upload error:', error);
        Alert.alert('Upload Failed', error.response?.data || 'Could not upload image.');
    } finally {
        setUploadingField(null);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Button icon="arrow-left" mode="text" onPress={onBack} style={{ alignSelf: 'flex-start', marginBottom: 8 }}>
        Back to Settings
      </Button>

      <Card style={styles.headerCard}>
        <Card.Content>
          <Title style={styles.title}>Custom Sub-Menus</Title>
          <Text style={styles.subtitle}>
            Define up to 4 custom lists that your bot can show when a customer clicks a specific button.
          </Text>
        </Card.Content>
      </Card>

      <ScrollView style={{ flex: 1 }}>
        <List.AccordionGroup
            expandedId={activeAccordion}
            onAccordionPress={(id) => setActiveAccordion(activeAccordion === id ? undefined : id)}
        >
          {currentMenus.map((menu, mIdx) => (
            <Card key={menu.id} style={styles.menuCard}>
              <List.Accordion
                title={menu.triggerLabel || `Custom Menu ${mIdx + 1}`}
                id={menu.id}
                left={props => <List.Icon {...props} icon="format-list-bulleted" color="#075E54" />}
                titleStyle={{ fontWeight: 'bold', color: '#075E54' }}
              >
                <View style={styles.accordionContent}>
                  <TextInput
                    label="Config Name (Dashboard only)"
                    value={menu.triggerLabel}
                    onChangeText={(v) => updateMenu(mIdx, { ...menu, triggerLabel: v })}
                    mode="outlined"
                    style={styles.input}
                    placeholder="e.g. Our Schools"
                  />
                  <Divider style={styles.divider} />
                  
                  <Text style={styles.sectionLabel}>WhatsApp Message Content</Text>
                  <TextInput
                    label="Header Title (Shown on WhatsApp)"
                    value={menu.headerTitle}
                    onChangeText={(v) => updateMenu(mIdx, { ...menu, headerTitle: v })}
                    mode="outlined"
                    style={styles.input}
                    placeholder="e.g. List of Branches"
                  />
                  <TextInput
                    label="Body Text"
                    value={menu.bodyText}
                    onChangeText={(v) => updateMenu(mIdx, { ...menu, bodyText: v })}
                    mode="outlined"
                    multiline
                    numberOfLines={2}
                    style={styles.input}
                    placeholder="Instructions for the user"
                  />
                  

                  <Divider style={styles.divider} />
                  <View style={styles.itemsHeader}>
                    <Text style={styles.sectionLabel}>Menu Items ({menu.items.length}/10)</Text>
                    <Button icon="plus" onPress={() => addItem(mIdx)} disabled={menu.items.length >= 10}>
                        Add Item
                    </Button>
                  </View>

                  {menu.items.map((item, iIdx) => (
                    <View key={iIdx} style={styles.itemBox}>
                        <View style={styles.itemRow}>
                            <TextInput
                                label="Item Title"
                                value={item.title}
                                onChangeText={(v) => updateItem(mIdx, iIdx, 'title', v)}
                                mode="outlined"
                                style={[styles.input, { flex: 1, marginRight: 8 }]}
                                maxLength={24}
                            />
                            <IconButton icon="delete-outline" iconColor="red" onPress={() => removeItem(mIdx, iIdx)} />
                        </View>
                        <TextInput
                            label="Description (Optional)"
                            value={item.desc}
                            onChangeText={(v) => updateItem(mIdx, iIdx, 'desc', v)}
                            mode="outlined"
                            style={styles.input}
                            maxLength={72}
                        />
                        <TextInput
                            label="Response Message (Sent when clicked)"
                            value={item.response}
                            onChangeText={(v) => updateItem(mIdx, iIdx, 'response', v)}
                            mode="outlined"
                            multiline
                            numberOfLines={3}
                            style={styles.input}
                            placeholder="What should the bot say back?"
                        />

                        <View style={styles.imageSection}>
                            {item.imageUrl ? (
                                <View style={styles.previewContainer}>
                                    <Image source={{ uri: item.imageUrl }} style={styles.previewImageSmall} />
                                    <IconButton icon="close-circle" iconColor="red" size={16} style={styles.removeImageIconSmall} onPress={() => updateItem(mIdx, iIdx, 'imageUrl', '')} />
                                </View>
                            ) : (
                                <Button 
                                    mode="text" 
                                    icon="image-plus" 
                                    onPress={() => handlePicker(`m${mIdx}_i${iIdx}`, (url) => updateItem(mIdx, iIdx, 'imageUrl', url))}
                                    loading={uploadingField === `m${mIdx}_i${iIdx}`}
                                    disabled={!!uploadingField}
                                    labelStyle={{ fontSize: 12 }}
                                >
                                    Add Item Image
                                </Button>
                            )}
                        </View>
                    </View>
                  ))}
                </View>
              </List.Accordion>
            </Card>
          ))}
        </List.AccordionGroup>
      </ScrollView>

      <View style={styles.footer}>
        <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            buttonColor="#075E54"
            icon="check"
            style={styles.saveButton}
        >
            Save All Sub-Menus
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerCard: {
    margin: 16,
    backgroundColor: '#e8f5e9',
  },
  menuCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#075E54',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  accordionContent: {
    padding: 12,
    backgroundColor: '#fff',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  divider: {
    marginVertical: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 8,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemBox: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 8,
  },
  saveButton: {
    paddingVertical: 4,
  },
  imageSection: {
    marginBottom: 16,
  },
  imageLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  previewContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  previewImageSmall: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  removeImageIcon: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
  },
  removeImageIconSmall: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
  }
});

export default CustomSubMenusView;
