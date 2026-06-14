import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, List, Divider, IconButton, ActivityIndicator, Icon } from 'react-native-paper';
import { ChevronLeft } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { whatsappApi } from '../../services/api';
import { colors, typography, sharedStyles } from '../../theme';

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
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  let subMenus: CustomSubMenu[] = [];
  try {
    subMenus = JSON.parse(customSubMenusJson);
  } catch (e) {
    subMenus = [];
  }

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
    <View style={sharedStyles.container}>
      <View style={sharedStyles.header}>
        <TouchableOpacity style={sharedStyles.backButton} onPress={onBack}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <View style={sharedStyles.headerContent}>
          <Text style={typography.pageTitle}>Custom Sub-Menus</Text>
          <Text style={[typography.description, { marginTop: 4 }]}>
            Define up to 4 custom lists that your bot can show when a customer clicks a specific button.
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        <List.AccordionGroup
            expandedId={activeAccordion}
            onAccordionPress={(id) => setActiveAccordion(activeAccordion === id ? undefined : id)}
        >
          {currentMenus.map((menu, mIdx) => (
            <View key={menu.id} style={[sharedStyles.modernCard, { marginHorizontal: 16, marginTop: 16, marginBottom: 0 }]}>
              <List.Accordion
                title={menu.triggerLabel || `Custom Menu ${mIdx + 1}`}
                id={menu.id}
                left={props => <List.Icon {...props} icon="format-list-bulleted" color={colors.primary} />}
                titleStyle={[typography.cardTitle, { color: colors.primary }]}
                style={{ backgroundColor: colors.card }}
              >
                <View style={styles.accordionContent}>
                  <TextInput
                    label="Config Name (Dashboard only)"
                    value={menu.triggerLabel}
                    onChangeText={(v) => updateMenu(mIdx, { ...menu, triggerLabel: v })}
                    mode="outlined"
                    style={sharedStyles.input}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    placeholder="e.g. Our Schools"
                  />
                  <Divider style={sharedStyles.divider} />
                  
                  <Text style={[typography.cardTitle, { marginBottom: 12, marginTop: 12 }]}>WhatsApp Message Content</Text>
                  <TextInput
                    label="Header Title (Shown on WhatsApp)"
                    value={menu.headerTitle}
                    onChangeText={(v) => updateMenu(mIdx, { ...menu, headerTitle: v })}
                    mode="outlined"
                    style={sharedStyles.input}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    placeholder="e.g. List of Branches"
                  />
                  <TextInput
                    label="Body Text"
                    value={menu.bodyText}
                    onChangeText={(v) => updateMenu(mIdx, { ...menu, bodyText: v })}
                    mode="outlined"
                    multiline
                    numberOfLines={2}
                    style={sharedStyles.input}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    placeholder="Instructions for the user"
                  />
                  
                  <Divider style={sharedStyles.divider} />
                  <View style={styles.itemsHeader}>
                    <Text style={typography.cardTitle}>Menu Items ({menu.items.length}/10)</Text>
                    <Button 
                      icon="plus" 
                      mode="outlined"
                      onPress={() => addItem(mIdx)} 
                      disabled={menu.items.length >= 10}
                      textColor={colors.primary}
                      style={{ borderColor: colors.border }}
                    >
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
                                style={[sharedStyles.input, { flex: 1, marginRight: 8, marginBottom: 0 }]}
                                outlineColor={colors.border}
                                activeOutlineColor={colors.primary}
                                maxLength={24}
                            />
                            <IconButton icon="delete-outline" iconColor={colors.error} onPress={() => removeItem(mIdx, iIdx)} />
                        </View>
                        <TextInput
                            label="Description (Optional)"
                            value={item.desc}
                            onChangeText={(v) => updateItem(mIdx, iIdx, 'desc', v)}
                            mode="outlined"
                            style={sharedStyles.input}
                            outlineColor={colors.border}
                            activeOutlineColor={colors.primary}
                            maxLength={72}
                        />
                        <TextInput
                            label="Response Message (Sent when clicked)"
                            value={item.response}
                            onChangeText={(v) => updateItem(mIdx, iIdx, 'response', v)}
                            mode="outlined"
                            multiline
                            numberOfLines={3}
                            style={sharedStyles.input}
                            outlineColor={colors.border}
                            activeOutlineColor={colors.primary}
                            placeholder="What should the bot say back?"
                        />

                        <View style={styles.imageSection}>
                            {item.imageUrl ? (
                                <View style={styles.previewContainer}>
                                    <Image source={{ uri: item.imageUrl }} style={styles.previewImageSmall} />
                                    <IconButton icon="close-circle" iconColor={colors.error} size={16} style={styles.removeImageIconSmall} onPress={() => updateItem(mIdx, iIdx, 'imageUrl', '')} />
                                </View>
                            ) : (
                                <Button 
                                    mode="text" 
                                    icon="image-plus" 
                                    onPress={() => handlePicker(`m${mIdx}_i${iIdx}`, (url) => updateItem(mIdx, iIdx, 'imageUrl', url))}
                                    loading={uploadingField === `m${mIdx}_i${iIdx}`}
                                    disabled={!!uploadingField}
                                    labelStyle={{ fontSize: 12 }}
                                    textColor={colors.primary}
                                >
                                    Add Item Image
                                </Button>
                            )}
                        </View>
                    </View>
                  ))}
                </View>
              </List.Accordion>
            </View>
          ))}
        </List.AccordionGroup>
      </ScrollView>

      <View style={styles.footer}>
        <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            buttonColor={colors.primary}
            icon="check"
            style={[sharedStyles.button, { width: '100%' }]}
        >
            Save All Sub-Menus
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  accordionContent: {
    padding: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  itemBox: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    marginTop: 8,
  },
  previewContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  previewImageSmall: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  removeImageIconSmall: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.card,
  }
});

export default CustomSubMenusView;

