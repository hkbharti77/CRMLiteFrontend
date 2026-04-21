import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Text, TextInput, Button, SegmentedButtons, ActivityIndicator, Switch, Menu, Divider } from 'react-native-paper';
import { flowConfigApi } from '../../services/api';

interface MenuButtonsViewProps {
  menuItems: { title: string; desc: string; isCatalog?: boolean }[];
  setMenuItems: (items: { title: string; desc: string; isCatalog?: boolean }[]) => void;
  menuType: string;
  setMenuType: (type: string) => void;
  welcomeMessage: string;
  setWelcomeMessage: (val: string) => void;
  returningMessage: string;
  setReturningMessage: (val: string) => void;
  handleSaveMenu: () => void;
  handleSaveGreetings: () => void;
  loading: boolean;
  onBack: () => void;
  tenantCategory: string;
  tenantSubCategory: string;
  showAboutContact: boolean;
  setShowAboutContact: (val: boolean) => void;
  reviewUrl: string;
  setReviewUrl: (val: string) => void;
  offerText: string;
  setOfferText: (val: string) => void;
  sosNote: string;
  setSosNote: (val: string) => void;
  thirdButtonType: string;
  setThirdButtonType: (val: string) => void;
  showTrustButton: boolean;
  setShowTrustButton: (val: boolean) => void;
  showOfferButton: boolean;
  setShowOfferButton: (val: boolean) => void;
  showSosButton: boolean;
  setShowSosButton: (val: boolean) => void;
  customSubMenusJson: string;
  customMessagesJson: string;
}

const MenuButtonsView: React.FC<MenuButtonsViewProps> = ({
  menuItems,
  setMenuItems,
  menuType,
  setMenuType,
  handleSaveMenu,
  handleSaveGreetings,
  loading,
  onBack,
  tenantCategory,
  tenantSubCategory,
  welcomeMessage,
  setWelcomeMessage,
  returningMessage,
  setReturningMessage,
  showAboutContact,
  setShowAboutContact,
  reviewUrl,
  setReviewUrl,
  offerText,
  setOfferText,
  sosNote,
  setSosNote,
  thirdButtonType,
  setThirdButtonType,
  showTrustButton,
  setShowTrustButton,
  showOfferButton,
  setShowOfferButton,
  showSosButton,
  setShowSosButton,
  customSubMenusJson,
  customMessagesJson
}) => {
  const [menuVisible, setMenuVisible] = useState<number | null>(null);

  // Parse custom menu names for the dropdown
  let customNames = ['Custom Menu 1', 'Custom Menu 2', 'Custom Menu 3', 'Custom Menu 4'];
  try {
     if (customSubMenusJson) {
       const parsed = JSON.parse(customSubMenusJson);
       parsed.forEach((m: any, idx: number) => {
          if (m.triggerLabel && idx < 4) customNames[idx] = m.triggerLabel;
       });
     }
  } catch(e) {}

  let customMsgNames = ['Quick Response 1', 'Quick Response 2', 'Quick Response 3', 'Quick Response 4', 'Quick Response 5', 'Quick Response 6'];
  try {
      if (customMessagesJson) {
        const parsed = JSON.parse(customMessagesJson);
        parsed.forEach((m: any, idx: number) => {
           if (m.name && idx < 6) customMsgNames[idx] = m.name;
        });
      }
  } catch(e) {}

  const [triggerButtonLabel, setTriggerButtonLabel] = useState<string>('Chat with us');
  const [triggerListLabel, setTriggerListLabel]     = useState<string>('Select an Option');
  const [loadingLabels, setLoadingLabels]            = useState(true);
  const [isEditingGreetings, setIsEditingGreetings] = useState(false);
  const [isEditingButtons, setIsEditingButtons]     = useState(false);
  const [isEditingFeatures, setIsEditingFeatures]   = useState(false);
  const [featureLabels, setFeatureLabels]           = useState<Record<string, string>>({
    SOS: '🆘 Human Support',
    TRUST: '⭐ Trust & Reviews',
    OFFER: '🎁 Special Offer',
    ABOUT: '📂 About & Contact'
  });

  // Fetch the fixed trigger labels from backend based on tenant's sub-category
  useEffect(() => {
    setLoadingLabels(true);
    // 1. Fetch Trigger Labels
    flowConfigApi.getTriggerLabels()
      .then((res: any) => {
        setTriggerButtonLabel(res.data?.triggerButtonLabel || '📅 Book Now');
        setTriggerListLabel(res.data?.triggerListLabel   || '📅 Book / Enquire Now');
      })
      .catch(() => {})
      .finally(() => setLoadingLabels(false));

    // 2. Fetch Feature Labels (Trust, SOS, etc)
    const { whatsappApi } = require('../../services/api');
    whatsappApi.getFeatureLabels()
      .then((res: any) => {
        if (res.data) setFeatureLabels(res.data);
      })
      .catch(() => {});
  }, [tenantSubCategory]);

  // Decide the fixed trigger label to display based on current menu type
  const fixedTriggerLabel = menuType === 'button' ? triggerButtonLabel : triggerListLabel;

  // Placeholder examples for editable slots (index 1+)
  const resolvePlaceholders = (): string[] => {
    const cat = (tenantCategory || '').toLowerCase();
    if (cat.includes('health') || cat.includes('care')) {
      return ['View Services', 'Contact Us', 'Follow Up', 'Pricing Info', 'Location'];
    } else if (cat.includes('education') || cat.includes('fitness')) {
      return ['View Schedule', 'Fee Structure', 'Contact Us', 'Branches', 'Offer'];
    } else if (cat.includes('real estate') || cat.includes('sales')) {
      return ['View Listings', 'Call Back', 'Our Services', 'Testimonials', 'Location'];
    } else if (cat.includes('freelancer') || cat.includes('creative')) {
      return ['View Portfolio', 'Pricing', 'Contact Us', 'Our Work', 'Reviews'];
    }
    return ['View Services', 'Contact Us', 'Pricing', 'Location', 'Follow Up'];
  };

  const placeholders = resolvePlaceholders();

  // ── DYNAMIC SLOT CALCULATION ──────────────────────────────────────────
  // Calculate which features are enabled to show them as "Occupied"
  const reservedFeatures: string[] = [];
  if (showTrustButton && reviewUrl) reservedFeatures.push(featureLabels.TRUST);
  if (showOfferButton && offerText) reservedFeatures.push(featureLabels.OFFER);
  if (showAboutContact) reservedFeatures.push(featureLabels.ABOUT);
  if (showSosButton) reservedFeatures.push(featureLabels.SOS);

  // Total visible slots is 3 for buttons, 10 for list.
  // We always have 1 fixed trigger at the top.
  // In button mode, the 3rd slot is ALWAYS reserved for a feature/about.
  // In list mode, SOS, About, Trust, and Offer occupy slots at the bottom.
  const reservedCount = menuType === 'button' ? 1 : reservedFeatures.length;
  const maxManualSlots = (menuType === 'button' ? 1 : 9) - (menuType === 'list' ? reservedCount : 0);

  return (
    <View style={{ flex: 1, paddingBottom: 40 }}>
      <Button icon="arrow-left" mode="text" onPress={onBack} style={{ alignSelf: 'flex-start', marginBottom: 8 }}>
        Back to Settings
      </Button>

      {/* ─── SECTION 1: CUSTOM GREETINGS ────────────────────────────────────── */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Automated Greetings</Title>
          <Text style={styles.subtitle}>These messages are sent right before your menu buttons appear.</Text>
          
          <View style={styles.greetingContainer}>
             <TextInput
               label="First-Time Welcome Message"
               value={welcomeMessage}
               onChangeText={setWelcomeMessage}
               mode="outlined"
               style={styles.greetingInput}
               multiline
               numberOfLines={4}
               placeholder="Sent to NEW leads only"
               editable={isEditingGreetings}
             />
             <TextInput
               label="Returning Customer Greeting"
               value={returningMessage}
               onChangeText={setReturningMessage}
               mode="outlined"
               style={styles.greetingInput}
               multiline
               numberOfLines={3}
               placeholder="Sent to repeat customers"
               editable={isEditingGreetings}
             />
             <View style={styles.hintBox}>
                <Text style={styles.hintTitle}>💡 Personalize your message:</Text>
                <Text style={styles.hintText}>• Use <Text style={styles.hintTag}>{"{{name}}"}</Text> for Customer Name</Text>
                <Text style={styles.hintText}>• Use <Text style={styles.hintTag}>{"{{business}}"}</Text> for Business Name</Text>
             </View>
          </View>

          {isEditingGreetings ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button
                mode="outlined"
                onPress={() => setIsEditingGreetings(false)}
                style={[styles.button, { flex: 1 }]}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={async () => {
                  await handleSaveGreetings();
                  setIsEditingGreetings(false);
                }}
                loading={loading}
                disabled={loading}
                style={[styles.button, { flex: 1 }]}
                buttonColor="#075E54"
                icon="check"
              >
                Save Greetings
              </Button>
            </View>
          ) : (
            <Button
              mode="contained"
              onPress={() => setIsEditingGreetings(true)}
              style={styles.button}
              buttonColor="#075E54"
              icon="pencil"
            >
              Edit Greetings
            </Button>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Menu Buttons Configuration</Title>
          <Text style={styles.subtitle}>
            Create an interactive menu for your customers. The first slot is automatically set as your booking/enquiry trigger.
          </Text>

          {/* Category Badge */}
          {tenantCategory ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>🏷️ {tenantCategory}</Text>
            </View>
          ) : null}

          {/* Menu Type Selector */}
          <Text style={[styles.subtitle, { marginTop: 8, marginBottom: 8 }]}>Choose Formatting Style</Text>
          <SegmentedButtons
            value={menuType}
            onValueChange={setMenuType}
            buttons={[
              { value: 'list', label: 'List  (Up to 10)', disabled: !isEditingButtons },
              { value: 'button', label: 'Quick Buttons (Up to 3)', disabled: !isEditingButtons }
            ]}
          style={{ marginBottom: 20 }}
          />

          {/* ─── ABOUT & CONTACT TOGGLE ──────────────────────────────────────── */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: 12,
            backgroundColor: '#e3f2fd',
            borderRadius: 8,
            marginBottom: 10
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold', color: '#1976d2' }}>📋 Include "About & Contact" button</Text>
              <Text style={{ fontSize: 12, color: '#666' }}>Shows your business info and maps location.</Text>
            </View>
            <Switch 
              value={showAboutContact} 
              onValueChange={setShowAboutContact}
              color="#075E54"
              disabled={!isEditingButtons}
            />
          </View>
        </Card.Content>
      </Card>

      {/* ─── SECTION 1.5: DYNAMIC FEATURE DATA ──────────────────────────────── */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Dynamic Feature Buttons</Title>
          <Text style={styles.subtitle}>
            Manage the data for your special buttons. One of these can be set as the 3rd button in the main menu.
          </Text>

          <View style={styles.featureContainer}>
            <View style={styles.featureHeader}>
               <Text style={styles.featureTitle}>{featureLabels.TRUST}</Text>
               <Switch 
                 value={showTrustButton} 
                 onValueChange={setShowTrustButton}
                 color="#075E54"
                 disabled={!isEditingFeatures}
               />
            </View>
            <TextInput
              label="Review URL"
              value={reviewUrl}
              onChangeText={setReviewUrl}
              mode="outlined"
              style={styles.featureInput}
              placeholder="e.g. Google Maps Review URL"
              editable={isEditingFeatures && showTrustButton}
              left={<TextInput.Icon icon="star-outline" />}
            />

            <View style={styles.featureHeader}>
               <Text style={styles.featureTitle}>{featureLabels.OFFER}</Text>
               <Switch 
                 value={showOfferButton} 
                 onValueChange={setShowOfferButton}
                 color="#075E54"
                 disabled={!isEditingFeatures}
               />
            </View>
            <TextInput
              label="Offer Details"
              value={offerText}
              onChangeText={setOfferText}
              mode="outlined"
              style={styles.featureInput}
              multiline
              numberOfLines={2}
              placeholder="e.g. Use code SAVE20 for 20% off!"
              editable={isEditingFeatures && showOfferButton}
              left={<TextInput.Icon icon="gift-outline" />}
            />

            <View style={styles.featureHeader}>
               <Text style={styles.featureTitle}>{featureLabels.SOS}</Text>
               <Switch 
                 value={showSosButton} 
                 onValueChange={setShowSosButton}
                 color="#075E54"
                 disabled={!isEditingFeatures}
               />
            </View>
            <TextInput
              label="Support Contact"
              value={sosNote}
              onChangeText={setSosNote}
              mode="outlined"
              style={styles.featureInput}
              placeholder="e.g. Call us at +91 98765 43210"
              editable={isEditingFeatures && showSosButton}
              left={<TextInput.Icon icon="account-supervisor-circle" />}
            />
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 10 }]}>Main Menu: Choose 3rd Button</Text>
          <SegmentedButtons
            value={thirdButtonType}
            onValueChange={setThirdButtonType}
            buttons={[
              { value: 'ABOUT', label: 'About', disabled: !isEditingFeatures },
              { value: 'TRUST', label: 'Trust', disabled: !isEditingFeatures },
              { value: 'OFFER', label: 'Offer', disabled: !isEditingFeatures },
              { value: 'SOS', label: 'SOS', disabled: !isEditingFeatures },
            ]}
            style={{ marginBottom: 20 }}
          />

          {isEditingFeatures ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button
                mode="outlined"
                onPress={() => setIsEditingFeatures(false)}
                style={[styles.button, { flex: 1 }]}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={async () => {
                  await handleSaveGreetings(); // Reusing the greeting save logic which saves full config
                  setIsEditingFeatures(false);
                }}
                loading={loading}
                disabled={loading}
                style={[styles.button, { flex: 1 }]}
                buttonColor="#075E54"
                icon="check"
              >
                Save Features
              </Button>
            </View>
          ) : (
            <Button
              mode="contained"
              onPress={() => setIsEditingFeatures(true)}
              style={styles.button}
              buttonColor="#075E54"
              icon="pencil"
            >
              Edit Dynamic Content
            </Button>
          )}
        </Card.Content>
      </Card>

      {/* ─── SECTION 2: MENU BUTTONS ────────────────────────────────────────── */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Interactive Button Layout</Title>
          <Text style={styles.subtitle}>Configure the quick buttons or list items that customers see.</Text>

          <View style={styles.fixedSlot}>
            <View style={styles.fixedSlotHeader}>
              <Text style={styles.fixedSlotBadge}>🔒 Fixed Flow Trigger</Text>
              <Text style={styles.fixedSlotNote}>Auto-set · Cannot be changed</Text>
            </View>
            {loadingLabels ? (
              <ActivityIndicator size="small" color="#075E54" style={{ marginVertical: 8 }} />
            ) : (
              <TextInput
                label="Trigger Button (Fixed)"
                value={fixedTriggerLabel}
                editable={false}
                mode="outlined"
                style={styles.fixedInput}
                outlineColor="#075E54"
                activeOutlineColor="#075E54"
                left={<TextInput.Icon icon="lock" color="#075E54" />}
              />
            )}
            <Text style={styles.fixedHint}>
              When a customer taps this, the automated {menuType === 'button' ? 'button' : 'list option'} will guide them through the booking/enquiry chat flow.
            </Text>
          </View>

          {/* ─── SLOTS 1+: EDITABLE MENU OPTIONS ─────────────────────────────── */}
          <Text style={styles.sectionLabel}>Customizable Options</Text>

          {menuItems.map((item, index) => {
            if (index >= maxManualSlots) return null; 
            const editIndex = index;
            return (
              <View key={index} style={[styles.editableSlot, item.isCatalog && styles.catalogSlotHighlight]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <Text style={styles.optionLabel}>Manual Option {editIndex + 2}</Text>
                  {item.isCatalog && <Text style={{ color: '#1976d2', fontWeight: 'bold', fontSize: 10 }}>🛍️ Catalog Link</Text>}
                </View>

                <TextInput
                  label={`Title (e.g. ${placeholders[editIndex] ?? 'Option'})`}
                  value={item.title}
                  onChangeText={(v) => {
                    const newItems = [...menuItems];
                    newItems[editIndex] = { ...newItems[editIndex], title: v };
                    setMenuItems(newItems);
                  }}
                  mode="outlined"
                  style={{ backgroundColor: '#fff', marginBottom: menuType === 'list' ? 8 : 4, height: 40 }}
                  maxLength={24}
                  editable={isEditingButtons}
                />
                
                {menuType === 'list' && (
                  <TextInput
                    label="Description (Optional)"
                    value={item.desc}
                    onChangeText={(v) => {
                      const newItems = [...menuItems];
                      newItems[editIndex] = { ...newItems[editIndex], desc: v };
                      setMenuItems(newItems);
                    }}
                    mode="outlined"
                    style={{ backgroundColor: '#fff', height: 40, marginBottom: 8 }}
                    maxLength={72}
                    editable={isEditingButtons}
                  />
                )}

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <Button 
                      mode={item.isCatalog ? "contained" : "outlined"}
                      compact
                      onPress={() => {
                          const newItems = menuItems.map((it, idx) => {
                              if (idx !== editIndex) return it;
                              return {
                                ...it,
                                isCatalog: !it.isCatalog,
                                customListId: '' // Clear action if catalog is enabled
                              };
                          });
                          setMenuItems(newItems);
                      }}
                      disabled={!isEditingButtons}
                      icon={item.isCatalog ? "store-check" : "link-variant"}
                      style={{ flex: 1 }}
                      labelStyle={{ fontSize: 10 }}
                      buttonColor={item.isCatalog ? "#1976d2" : undefined}
                  >
                      {item.isCatalog ? "Catalog" : "Link Catalog"}
                  </Button>

                  <View style={{ flex: 1.5 }}>
                    <Menu
                      visible={menuVisible === editIndex}
                      onDismiss={() => setMenuVisible(null)}
                      anchor={
                        <Button 
                          mode={item.customListId ? "contained" : "outlined"}
                          compact
                          onPress={() => setMenuVisible(editIndex)}
                          disabled={!isEditingButtons}
                          icon="format-list-bulleted"
                          style={{ width: '100%' }}
                          labelStyle={{ fontSize: 10 }}
                          buttonColor={item.customListId ? "#673ab7" : undefined}
                        >
                          {item.customListId ? (item.customListId.startsWith('custom_list') ? "Linked List" : "Quick Response") : "Link Action"}
                        </Button>
                      }
                    >
                      {[1, 2, 3, 4].map(num => (
                        <Menu.Item 
                          key={`list_${num}`}
                          onPress={() => {
                            const newItems = menuItems.map((it, idx) => {
                                if (idx !== editIndex) return it;
                                return {
                                  ...it,
                                  isCatalog: false, // Mutual exclusion
                                  customListId: `custom_list_${num}`
                                };
                            });
                            setMenuItems(newItems);
                            setMenuVisible(null);
                          }} 
                          title={customNames[num-1]} 
                          leadingIcon="view-list"
                        />
                      ))}
                      <Divider />
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <Menu.Item 
                          key={`msg_${num}`}
                          onPress={() => {
                            const newItems = menuItems.map((it, idx) => {
                                if (idx !== editIndex) return it;
                                return {
                                  ...it,
                                  isCatalog: false, // Mutual exclusion
                                  customListId: `custom_msg_${num}`
                                };
                            });
                            setMenuItems(newItems);
                            setMenuVisible(null);
                          }} 
                          title={customMsgNames[num-1]} 
                          leadingIcon="message-text"
                        />
                      ))}
                      <Divider />
                      <Menu.Item 
                        onPress={() => {
                           const newItems = menuItems.map((it, idx) => ({
                              ...it,
                              customListId: idx === editIndex ? '' : it.customListId
                           }));
                           setMenuItems(newItems);
                           setMenuVisible(null);
                        }} 
                        title="None" 
                        leadingIcon="close-circle"
                      />
                    </Menu>
                  </View>
                </View>
              </View>
            );
          })}

          {/* ─── RESERVED / OCCUPIED SLOTS ─────────────────────────────────── */}
          {menuType === 'button' ? (
             <View style={styles.occupiedSlot}>
               <Text style={styles.occupiedLabel}>Option 3 (Reserved)</Text>
               <View style={styles.occupiedContent}>
                  <Text style={styles.occupiedText}>🔒 Occupied by: {thirdButtonType}</Text>
               </View>
             </View>
          ) : (
             reservedFeatures.map((feat, i) => (
                <View key={`res-${i}`} style={styles.occupiedSlot}>
                   <Text style={styles.occupiedLabel}>Option {maxManualSlots + i + 2} (Reserved)</Text>
                   <View style={styles.occupiedContent}>
                      <Text style={styles.occupiedText}>🔒 Occupied by: {feat}</Text>
                   </View>
                </View>
             ))
          )}

          {reservedCount + maxManualSlots < 9 && menuType === 'list' && (
             <View style={{ padding: 10, backgroundColor: '#f5f5f5', borderRadius: 8, marginTop: 10 }}>
                <Text style={{ fontSize: 11, color: '#999', textAlign: 'center' }}>
                  Additional slots are hidden to respect WhatsApp's 10-item limit.
                </Text>
             </View>
          )}

          {isEditingButtons ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button
                mode="outlined"
                onPress={() => setIsEditingButtons(false)}
                style={[styles.button, { flex: 1 }]}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={async () => {
                  await handleSaveMenu();
                  setIsEditingButtons(false);
                }}
                loading={loading}
                disabled={loading}
                style={[styles.button, { flex: 1 }]}
                buttonColor="#075E54"
                icon="check"
              >
                Save Layout
              </Button>
            </View>
          ) : (
            <Button
              mode="contained"
              onPress={() => setIsEditingButtons(true)}
              style={styles.button}
              buttonColor="#075E54"
              icon="pencil"
            >
              Edit Menu Layout
            </Button>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#075E54',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  button: {
    marginTop: 12,
    paddingVertical: 4,
  },
  categoryBadge: {
    backgroundColor: '#e8f5e9',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  categoryBadgeText: {
    fontSize: 13,
    color: '#2e7d32',
    fontWeight: '600',
  },
  // ── Fixed Trigger Slot ──────────────────────────────────────────────────
  fixedSlot: {
    backgroundColor: '#f0f8f4',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#075E54',
    padding: 12,
    marginBottom: 20,
  },
  fixedSlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fixedSlotBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: '#075E54',
  },
  fixedSlotNote: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  fixedInput: {
    backgroundColor: '#e8f5e9',
    height: 48,
  },
  fixedHint: {
    fontSize: 12,
    color: '#555',
    marginTop: 6,
    fontStyle: 'italic',
  },
  // ── Editable Slots ──────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 10,
  },
  editableSlot: {
    marginBottom: 14,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  optionLabel: {
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
    fontSize: 13,
  },
  catalogSlotHighlight: {
    borderColor: '#1976d2',
    borderWidth: 1,
    backgroundColor: '#e3f2fd',
  },
  greetingContainer: {
     marginBottom: 20,
     padding: 10,
     backgroundColor: '#fffbe6',
     borderRadius: 8,
     borderWidth: 1,
     borderColor: '#ffe58f',
  },
  greetingInput: {
     backgroundColor: '#fff',
     marginBottom: 10,
  },
  hintBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fffbe6',
    borderWidth: 1,
    borderColor: '#ffe58f',
    borderRadius: 6,
  },
  hintTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 18,
  },
  hintTag: {
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#075E54',
  },
  featureContainer: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  featureInput: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  featureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureTitle: {
    fontWeight: 'bold',
    color: '#075E54',
  },
  occupiedSlot: {
    marginBottom: 10,
    backgroundColor: '#fff0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffa39e',
    padding: 10,
    borderStyle: 'dashed',
  },
  occupiedLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#cf1322',
    marginBottom: 4,
  },
  occupiedContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  occupiedText: {
    fontSize: 13,
    color: '#555',
    fontStyle: 'italic',
  },
});

export default MenuButtonsView;
