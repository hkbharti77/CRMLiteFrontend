import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { TextInput, Button, Title, Card, Text, Snackbar, ActivityIndicator, useTheme, Portal, Dialog, List } from 'react-native-paper';
import { whatsappApi, userApi } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import AccountProfileView from './settings/AccountProfileView';
import MetaIntegrationView from './settings/MetaIntegrationView';
import MenuButtonsView from './settings/MenuButtonsView';
import SecurityDashboard from './settings/SecurityDashboard';
import AiKnowledgeBaseView from './settings/AiKnowledgeBaseView';
import BusinessServicesScreen from './BusinessServicesScreen';
import CustomSubMenusView from './settings/CustomSubMenusView';
import CustomMessagesView from './settings/CustomMessagesView';

const SettingsScreen = () => {
  const theme = useTheme();
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('chatcrm_secret_token');
  const [interactiveMenuJson, setInteractiveMenuJson] = useState('');
  const [menuType, setMenuType] = useState('list');
  const [menuItems, setMenuItems] = useState(
    Array(9).fill(null).map(() => ({ title: '', desc: '', isCatalog: false, customListId: '' }))
  );
  const [showAboutContact, setShowAboutContact] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [returningMessage, setReturningMessage] = useState('');
  
  // New Dynamic Menu States
  const [reviewUrl, setReviewUrl] = useState('');
  const [offerText, setOfferText] = useState('');
  const [sosNote, setSosNote] = useState('');
  const [thirdButtonType, setThirdButtonType] = useState('ABOUT');
  const [showTrustButton, setShowTrustButton] = useState(true);
  const [showOfferButton, setShowOfferButton] = useState(true);
  const [showSosButton, setShowSosButton] = useState(true);
  const [customSubMenusJson, setCustomSubMenusJson] = useState('[]');
  const [customMessagesJson, setCustomMessagesJson] = useState('[]');
  
  const [accountProfile, setAccountProfile] = useState({
    displayName: '',
    email: '',
    phone: '',
    businessName: '',
    businessType: '',
    businessSubType: '',
    address: '',
    aboutUs: '',
    latitude: null as number | null,
    longitude: null as number | null,
    logoUrl: ''
  });

  const [activeView, setActiveView] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const { clearToken } = useAuthStore();
  
  const [triggerLabels, setTriggerLabels] = useState({ button: '📅 Book Now', list: '📅 Book / Enquire Now', services: '📋 View Services' });

  useEffect(() => {
    fetchConfig();
    fetchProfile();
    fetchTriggerLabels();
  }, []);

  const fetchTriggerLabels = async () => {
    try {
      const { flowConfigApi } = require('../services/api');
      const response = await flowConfigApi.getTriggerLabels();
      if (response.data) {
        setTriggerLabels({
          button: response.data.triggerButtonLabel,
          list: response.data.triggerListLabel,
          services: response.data.servicesLabel || '📋 View Services'
        });
      }
    } catch (e) {}
  };

  const fetchProfile = async () => {
    try {
      const response = await userApi.getProfile();
      if (response.data) {
        setAccountProfile({
          displayName: response.data.displayName || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          businessName: response.data.businessName || '',
          businessType: response.data.businessType || '',
          businessSubType: response.data.businessSubType || '',
          address: response.data.address || '',
          aboutUs: response.data.aboutUs || '',
          latitude: response.data.latitude || null,
          longitude: response.data.longitude || null,
          logoUrl: response.data.logoUrl || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await whatsappApi.getConfig();
      if (response.data) {
        setPhoneNumberId(response.data.phoneNumberId || '');
        setWabaId(response.data.wabaId || '');
        setAccessToken(response.data.accessToken || '');
        setVerifyToken(response.data.verifyToken || 'chatcrm_secret_token');
        
        const existingJson = response.data.interactiveMenuJson || '';
        setInteractiveMenuJson(existingJson);
        setWelcomeMessage(response.data.welcomeMessage || '');
        setReturningMessage(response.data.returningMessage || '');
        setShowAboutContact(response.data.showAboutContact !== false); // default true
        
        // Dynamic Buttons
        setReviewUrl(response.data.reviewUrl || '');
        setOfferText(response.data.offerText || '');
        setSosNote(response.data.sosNote || '');
        setThirdButtonType(response.data.thirdButtonType || 'ABOUT');
        setShowTrustButton(response.data.showTrustButton !== false);
        setShowOfferButton(response.data.showOfferButton !== false);
        setShowSosButton(response.data.showSosButton !== false);
        setCustomSubMenusJson(response.data.customSubMenusJson || '[]');
        setCustomMessagesJson(response.data.customMessagesJson || '[]');

        // Pre-fill visual form
        if (existingJson) {
           try {
             const parsed = JSON.parse(existingJson);
             if (parsed.type) setMenuType(parsed.type);
             
             let loaded: any[] = [];
             if (parsed.sections) {
                parsed.sections.forEach((s: any) => {
                  if(s.rows) {
                     s.rows.forEach((r: any) => {
                       if (r.id !== 'trigger_flow') {
                         loaded.push({ 
                            title: r.title, 
                            desc: r.description,
                            isCatalog: r.id === 'view_services'
                         });
                       }
                     });
                  }
                });
             }
             // Pad to 9 slots
             while (loaded.length < 9) loaded.push({ title: '', desc: '', isCatalog: false });
             setMenuItems(loaded.slice(0, 9));
           } catch(e) {}
        }
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error fetching config:', error);
      }
    } finally {
      setFetching(false);
    }
  };

  const handleSaveMeta = async () => {
    if (!phoneNumberId || !accessToken) {
      Alert.alert('Error', 'Phone Number ID and Access Token are required');
      return;
    }

    setLoading(true);
    try {
      await whatsappApi.saveConfig({
        phoneNumberId,
        wabaId,
        accessToken,
        verifyToken,
        interactiveMenuJson,
        welcomeMessage,
        returningMessage,
        showAboutContact,
        reviewUrl,
        offerText,
        sosNote,
        thirdButtonType,
        showTrustButton,
        showOfferButton,
        showSosButton,
        customSubMenusJson,
        customMessagesJson
      });
      setSnackbarMsg('Meta credentials saved successfully!');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error saving meta config:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMenu = async () => {
    const newJson = compileMenu();
    if (!newJson) return;

    setLoading(true);
    try {
      await whatsappApi.saveConfig({
        phoneNumberId,
        wabaId,
        accessToken,
        verifyToken,
        interactiveMenuJson: newJson,
        welcomeMessage,
        returningMessage,
        showAboutContact,
        reviewUrl,
        offerText,
        sosNote,
        thirdButtonType,
        showTrustButton,
        showOfferButton,
        showSosButton,
        customSubMenusJson,
        customMessagesJson
      });
      setInteractiveMenuJson(newJson);
      setSnackbarMsg('Menu saved successfully!');
      setSnackbarVisible(true);
    } catch (error: any) {
      console.error('Error saving menu config:', error);
      const errorMsg = error.response?.data || 'Failed to save menu. Please try again.';
      Alert.alert('Save Error', typeof errorMsg === 'string' ? errorMsg : 'Invalid menu configuration detected.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGreetings = async () => {
    setLoading(true);
    try {
      await whatsappApi.saveConfig({
        phoneNumberId,
        wabaId,
        accessToken,
        verifyToken,
        interactiveMenuJson,
        welcomeMessage,
        returningMessage,
        showAboutContact,
        reviewUrl,
        offerText,
        sosNote,
        thirdButtonType,
        showTrustButton,
        showOfferButton,
        showSosButton,
        customSubMenusJson,
        customMessagesJson
      });
      setSnackbarMsg('Greetings updated successfully!');
      setSnackbarVisible(true);
    } catch (error: any) {
      console.error('Error saving greetings:', error);
      Alert.alert('Error', 'Failed to save greetings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const compileMenu = () => {
    // ── DYNAMIC SLOT CALCULATION ──────────────────────────────────────────
    // Count how many slots are taken by enabled dynamic features
    const reservedFeatureCount = (showSosButton ? 1 : 0) + 
                                (showAboutContact ? 1 : 0) + 
                                ((showTrustButton && reviewUrl) ? 1 : 0) + 
                                ((showOfferButton && offerText) ? 1 : 0);

    const maxManualAllowed = (menuType === 'button' ? 1 : 9) - (menuType === 'list' ? reservedFeatureCount : 0);

    // Filter only the items that fit in the remaining manual capacity
    const validItems = menuItems.slice(0, maxManualAllowed).filter(i => i.title.trim() !== '');

    if (validItems.length === 0 && !showAboutContact && !showSosButton) {
      Alert.alert('Validation Error', 'Please add at least one menu item or enable a feature.');
      return null;
    }

    const platformMax = menuType === 'button' ? 3 : 10;
    const fixedLabel = menuType === 'button' ? triggerLabels.button : triggerLabels.list;
    
    if (validItems.length + 1 > platformMax) {
      Alert.alert('Validation Error', `Maximum ${platformMax} items total allowed (including fixed trigger).`);
      return null;
    }

    const triggerRow = {
      id: "trigger_flow",
      title: fixedLabel,
      description: menuType === 'list' ? "Automated flow trigger" : undefined
    };

    const payload = {
      type: menuType,
      title: "Our Services",
      button: menuType === 'list' ? "View Options" : undefined,
      sections: [
        {
          title: "Available Options",
          rows: [
            triggerRow,
            ...validItems.map((item, index) => ({
               id: item.isCatalog ? "view_services" : 
                   item.customListId ? item.customListId : `item_${index}`,
               title: item.title.substring(0, 25).trim(),
               description: (menuType === 'list' && item.desc) ? item.desc.substring(0, 72).trim() : undefined
            }))
          ]
        }
      ]
    };
    return JSON.stringify(payload);
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await userApi.updateProfile(accountProfile);
      setSnackbarMsg('Account profile updated successfully!');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setLogoutDialogVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutDialogVisible(false);
    await clearToken();
  };

  const generateClinicTemplate = () => {
    const template = {
      title: "SmileCare Clinic",
      button: "View Options",
      sections: [
        {
          title: "Dental Services",
          rows: [
            { id: "srv_root_canal", title: "Root Canal", description: "Safe and painless procedure" },
            { id: "srv_cleaning", title: "Teeth Cleaning", description: "Deep scaling & polishing" },
            { id: "srv_braces", title: "Braces/Aligners", description: "Orthodontic consultation" }
          ]
        },
        {
          title: "Consultation & Booking",
          rows: [
            { id: "book_appt", title: "Book Appointment", description: "Schedule a visit" },
            { id: "speak_dr", title: "Speak to Doctor", description: "Request a callback" }
          ]
        }
      ]
    };
    setInteractiveMenuJson(JSON.stringify(template, null, 2));
    setSnackbarMsg('Clinic template generated!');
    setSnackbarVisible(true);
  };

  const renderPlaceholder = (title: string, desc: string) => (
    <View style={{ flex: 1, paddingBottom: 40 }}>
      <Button icon="arrow-left" mode="text" onPress={() => setActiveView(null)} style={{ alignSelf: 'flex-start', marginBottom: 8 }}>
        Back to Settings
      </Button>
      <Card style={styles.card}>
        <Card.Content>
          <Title>{title}</Title>
          <Text style={{ marginTop: 16 }}>{desc}</Text>
        </Card.Content>
      </Card>
    </View>
  );

  const renderContent = () => {
    if (activeView === 'account') {
      return (
        <AccountProfileView
          accountProfile={accountProfile}
          setAccountProfile={setAccountProfile}
          handleSaveProfile={handleSaveProfile}
          loading={loading}
          onBack={() => setActiveView(null)}
        />
      );
    }
    
    if (activeView === 'security') {
      return (
        <SecurityDashboard
          onBack={() => setActiveView(null)}
        />
      );
    }
    
    if (activeView === 'buttons') {
      return (
        <MenuButtonsView
          menuItems={menuItems}
          setMenuItems={setMenuItems}
          menuType={menuType}
          setMenuType={setMenuType}
          handleSaveMenu={handleSaveMenu}
          handleSaveGreetings={handleSaveGreetings}
          loading={loading}
          onBack={() => setActiveView(null)}
          tenantCategory={accountProfile.businessType}
          tenantSubCategory={accountProfile.businessSubType || ''}
          welcomeMessage={welcomeMessage}
          setWelcomeMessage={setWelcomeMessage}
          returningMessage={returningMessage}
          setReturningMessage={setReturningMessage}
          showAboutContact={showAboutContact}
          setShowAboutContact={setShowAboutContact}
          reviewUrl={reviewUrl}
          setReviewUrl={setReviewUrl}
          offerText={offerText}
          setOfferText={setOfferText}
          sosNote={sosNote}
          setSosNote={setSosNote}
          thirdButtonType={thirdButtonType}
          setThirdButtonType={setThirdButtonType}
          showTrustButton={showTrustButton}
          setShowTrustButton={setShowTrustButton}
          showOfferButton={showOfferButton}
          setShowOfferButton={setShowOfferButton}
          showSosButton={showSosButton}
          setShowSosButton={setShowSosButton}
          customSubMenusJson={customSubMenusJson}
          customMessagesJson={customMessagesJson}
          whatsappApi={whatsappApi}
        />
      );
    }
    
    if (activeView === 'messages') {
      return (
        <CustomMessagesView
          customMessagesJson={customMessagesJson}
          whatsappApi={whatsappApi}
          onSave={async (json) => {
            setCustomMessagesJson(json);
            try {
              setLoading(true);
              await whatsappApi.saveConfig({
                phoneNumberId, wabaId, accessToken, verifyToken,
                interactiveMenuJson, welcomeMessage, returningMessage,
                showAboutContact, reviewUrl, offerText, sosNote,
                thirdButtonType, showTrustButton, showOfferButton, showSosButton,
                customSubMenusJson,
                customMessagesJson: json
              });
              setSnackbarMsg('Quick responses saved!');
              setSnackbarVisible(true);
            } catch (e) {} finally { setLoading(false); }
            setActiveView(null);
          }}
          onBack={() => setActiveView(null)}
        />
      );
    }

    if (activeView === 'meta') {
      return (
        <MetaIntegrationView
          phoneNumberId={phoneNumberId}
          setPhoneNumberId={setPhoneNumberId}
          wabaId={wabaId}
          setWabaId={setWabaId}
          accessToken={accessToken}
          setAccessToken={setAccessToken}
          verifyToken={verifyToken}
          setVerifyToken={setVerifyToken}
          handleSaveMeta={handleSaveMeta}
          loading={loading}
          onBack={() => setActiveView(null)}
        />
      );
    }

    if (activeView === 'knowledge_base') {
      return (
        <AiKnowledgeBaseView
          onBack={() => setActiveView(null)}
        />
      );
    }

    if (activeView === 'services') {
      return (
        <View style={{ flex: 1 }}>
          <Button icon="arrow-left" mode="text" onPress={() => setActiveView(null)} style={{ alignSelf: 'flex-start', marginBottom: 8 }}>
            Back to Settings
          </Button>
          <BusinessServicesScreen />
        </View>
      );
    }

    if (activeView === 'custom_menus') {
      return (
        <CustomSubMenusView
          customSubMenusJson={customSubMenusJson}
          setCustomSubMenusJson={setCustomSubMenusJson}
          handleSave={handleSaveGreetings}
          loading={loading}
          onBack={() => setActiveView(null)}
          whatsappApi={whatsappApi}
        />
      );
    }



    return (
      <View style={{ flex: 1, paddingBottom: 40 }}>
        <List.Section style={{ backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', elevation: 2 }}>
          <List.Subheader style={{ fontSize: 18, fontWeight: 'bold', color: '#075E54' }}>App Settings</List.Subheader>
          
          <List.Item
            title="Account"
            description="Manage your account profile"
            left={props => <List.Icon {...props} icon="account" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setActiveView('account')}
            style={styles.listItem}
          />
          <List.Item
            title="Sign in & security"
            description="Password and authentication methods"
            left={props => <List.Icon {...props} icon="shield-account" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setActiveView('security')}
            style={styles.listItem}
          />
          <List.Item
            title="Meta Configuration"
            description="WhatsApp integration API credentials"
            left={props => <List.Icon {...props} icon="whatsapp" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setActiveView('meta')}
            style={styles.listItem}
          />
          <List.Item
            title="Button Changes"
            description="Manage and customize UI buttons"
            left={props => <List.Icon {...props} icon="gesture-tap-button" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setActiveView('buttons')}
            style={styles.listItem}
          />
          <List.Item
            title="Products & Services"
            description="Manage your business catalog"
            left={props => <List.Icon {...props} icon="store" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setActiveView('services')}
            style={styles.listItem}
          />
          <List.Item
            title="Custom Sub-Menus"
            description="Create custom lists for your bot"
            left={props => <List.Icon {...props} icon="format-list-bulleted-type" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setActiveView('custom_menus')}
            style={styles.listItem}
          />
          <List.Item
            title="Custom Quick Responses"
            description="Define direct text + image replies"
            left={props => <List.Icon {...props} icon="message-text-clock-outline" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setActiveView('messages')}
            style={styles.listItem}
          />
          <List.Item
            title="AI Knowledge Base"
            description="Upload documents to train your RAG bot"
            left={props => <List.Icon {...props} icon="brain" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setActiveView('knowledge_base')}
            style={styles.listItem}
          />

        </List.Section>

        <Button
          mode="text"
          onPress={handleLogout}
          style={styles.logoutButton}
          textColor={theme.colors.error}
          icon="logout"
        >
          Sign Out
        </Button>
      </View>
    );
  };

  if (fetching) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#075E54" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {renderContent()}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: '#075E54' }}
      >
        {snackbarMsg}
      </Snackbar>

      <Portal>
        <Dialog 
          visible={logoutDialogVisible} 
          onDismiss={() => setLogoutDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Icon icon="logout" color={theme.colors.error} />
          <Dialog.Title style={styles.dialogTitle}>Sign Out</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">Are you sure you want to sign out of your account?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogoutDialogVisible(false)}>Cancel</Button>
            <Button 
              onPress={confirmLogout} 
              textColor={theme.colors.error}
              mode="text"
            >
              Sign Out
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  jsonInput: {
    marginBottom: 16,
    backgroundColor: '#fafafa',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
  },
  button: {
    marginTop: 8,
    paddingVertical: 4,
  },
  logoutButton: {
    marginTop: 24,
    marginBottom: 24,
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoCard: {
    backgroundColor: '#e8f5e9',
    elevation: 0,
  },
  infoTitle: {
    fontSize: 16,
    color: '#2e7d32',
  },
  infoText: {
    fontSize: 12,
    color: '#4caf50',
  },
  urlText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1b5e20',
    marginTop: 4,
  },
  dialog: {
    borderRadius: 24,
    backgroundColor: '#fff',
  },
  dialogTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default SettingsScreen;

