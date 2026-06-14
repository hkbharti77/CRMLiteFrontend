import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, SafeAreaView, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
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
import SupportCategoriesView from './settings/SupportCategoriesView';
import SystemHealthView from './settings/SystemHealthView';
import { 
  Settings, 
  Search, 
  ChevronRight, 
  LogOut, 
  User, 
  Shield, 
  MessageSquare, 
  Moon, 
  Bell, 
  HelpCircle,
  Zap,
  Code,
  ShoppingBag,
  FileText,
  Brain,
  Menu,
  Smartphone,
  Lock,
  Globe
} from 'lucide-react-native';

import { AppAvatar } from '@components/global/Avatar/AppAvatar';
import { AppSearchBar } from '@components/global/SearchBar/AppSearchBar';

const SettingsScreen = () => {
  const theme = useTheme();
  const { clearToken, businessName } = useAuthStore();
  
  // ===== SETTINGS DATA =====
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('chatcrm_secret_token');
  const [appSecret, setAppSecret] = useState('');
  const [interactiveMenuJson, setInteractiveMenuJson] = useState('');
  const [menuType, setMenuType] = useState('list');
  const [menuItems, setMenuItems] = useState<{ title: string; desc: string; isCatalog?: boolean; customListId?: string }[]>(
    Array(9).fill(null).map(() => ({ title: '', desc: '', isCatalog: false, customListId: '' }))
  );
  const [showAboutContact, setShowAboutContact] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [returningMessage, setReturningMessage] = useState('');
  
  // ===== DYNAMIC MENU STATES =====
  const [reviewUrl, setReviewUrl] = useState('');
  const [offerText, setOfferText] = useState('');
  const [sosNote, setSosNote] = useState('');
  const [thirdButtonType, setThirdButtonType] = useState('ABOUT');
  const [showTrustButton, setShowTrustButton] = useState(true);
  const [showOfferButton, setShowOfferButton] = useState(true);
  const [showSosButton, setShowSosButton] = useState(true);
  const [customSubMenusJson, setCustomSubMenusJson] = useState('[]');
  const [customMessagesJson, setCustomMessagesJson] = useState('[]');
  
  // ===== UI STATE =====
  const [accountProfile, setAccountProfile] = useState({
    displayName: '',
    email: '',
    phone: '',
    businessName: '',
    businessType: '',
    businessSubType: '',
    address: '',
    aboutUs: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    logoUrl: ''
  });
  const [activeView, setActiveView] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  
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
          latitude: response.data.latitude || undefined,
          longitude: response.data.longitude || undefined,
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
        setAppSecret(response.data.appSecret || '');
        
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
        appSecret,
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
        appSecret,
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
        appSecret,
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

  const handleSaveProfile = async (overrideProfile?: any) => {
    setLoading(true);
    try {
      await userApi.updateProfile(overrideProfile || accountProfile);
      useAuthStore.getState().fetchProfileOverrides();
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
        <SecurityDashboard onBack={() => setActiveView(null)} />
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
                phoneNumberId, wabaId, accessToken, verifyToken, appSecret,
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
          appSecret={appSecret}
          setAppSecret={setAppSecret}
          handleSaveMeta={handleSaveMeta}
          loading={loading}
          onBack={() => setActiveView(null)}
        />
      );
    }

    if (activeView === 'knowledge_base') {
      return (
        <AiKnowledgeBaseView onBack={() => setActiveView(null)} />
      );
    }

    if (activeView === 'services') {
      return (
        <BusinessServicesScreen onBack={() => setActiveView(null)} />
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

    if (activeView === 'support_categories') {
      return (
        <SupportCategoriesView onBack={() => setActiveView(null)} />
      );
    }

    if (activeView === 'system_health') {
      return (
        <SystemHealthView onBack={() => setActiveView(null)} />
      );
    }

    // ===== MAIN SETTINGS HOME =====
    return (
      <View style={styles.mainContainer}>
        {/* ===== USER PROFILE CARD ===== */}
        <ProfileCard accountProfile={accountProfile} onPress={() => setActiveView('account')} />

        {/* ===== SEARCH BAR ===== */}
        <View style={{ marginBottom: 24 }}>
          <AppSearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search settings..." />
        </View>

        {/* ===== ACCOUNT SECTION ===== */}
        <SettingsSection title="Account">
          <SettingsItem
            icon={<User size={20} color="#075E54" />}
            title="Account Profile"
            description="Manage your account details"
            onPress={() => setActiveView('account')}
          />
          <SettingsItem
            icon={<Shield size={20} color="#075E54" />}
            title="Security & Privacy"
            description="Password and authentication"
            onPress={() => setActiveView('security')}
            divider
          />
        </SettingsSection>

        {/* ===== APPEARANCE SECTION ===== */}
        <SettingsSection title="Appearance">
          <ToggleItem
            icon={<Moon size={20} color="#075E54" />}
            title="Dark Mode"
            description="Coming soon"
            enabled={darkMode}
            onToggle={setDarkMode}
            disabled
          />
        </SettingsSection>

        {/* ===== NOTIFICATIONS SECTION ===== */}
        <SettingsSection title="Notifications">
          <ToggleItem
            icon={<Bell size={20} color="#075E54" />}
            title="Enable Notifications"
            description="Stay updated with messages"
            enabled={notificationsEnabled}
            onToggle={setNotificationsEnabled}
          />
        </SettingsSection>

        {/* ===== CONFIGURATION SECTION ===== */}
        <SettingsSection title="Configuration">
          <SettingsItem
            icon={<Globe size={20} color="#075E54" />}
            title="Meta Integration"
            description="WhatsApp API credentials"
            onPress={() => setActiveView('meta')}
            divider
          />
          <SettingsItem
            icon={<Menu size={20} color="#075E54" />}
            title="Menu & Buttons"
            description="Customize UI buttons"
            onPress={() => setActiveView('buttons')}
            divider
          />
          <SettingsItem
            icon={<ShoppingBag size={20} color="#075E54" />}
            title="Products & Services"
            description="Manage your catalog"
            onPress={() => setActiveView('services')}
            divider
          />
          <SettingsItem
            icon={<Menu size={20} color="#075E54" />}
            title="Custom Sub-Menus"
            description="Create custom lists"
            onPress={() => setActiveView('custom_menus')}
            divider
          />
          <SettingsItem
            icon={<MessageSquare size={20} color="#075E54" />}
            title="Quick Responses"
            description="Direct text & image replies"
            onPress={() => setActiveView('messages')}
          />
        </SettingsSection>

        {/* ===== AI & KNOWLEDGE SECTION ===== */}
        <SettingsSection title="AI & Knowledge">
          <SettingsItem
            icon={<Brain size={20} color="#075E54" />}
            title="Knowledge Base"
            description="Train your RAG bot"
            onPress={() => setActiveView('knowledge_base')}
            divider
          />
          <SettingsItem
            icon={<HelpCircle size={20} color="#075E54" />}
            title="Support Categories"
            description="WhatsApp support requests"
            onPress={() => setActiveView('support_categories')}
          />
        </SettingsSection>

        {/* ===== SYSTEM SECTION ===== */}
        <SettingsSection title="System">
          <SettingsItem
            icon={<Zap size={20} color="#075E54" />}
            title="System Health"
            description="Backend telemetry & status"
            onPress={() => setActiveView('system_health')}
          />
        </SettingsSection>

        {/* ===== SUPPORT SECTION ===== */}
        <SettingsSection title="Support & Help">
          <TouchableOpacity style={styles.supportCard}>
            <View style={styles.supportContent}>
              <Text style={styles.supportTitle}>Need Help?</Text>
              <Text style={styles.supportDescription}>Contact our support team for assistance</Text>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>
        </SettingsSection>

        {/* ===== LOGOUT BUTTON ===== */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* ===== FOOTER =====  */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>ChatCRM Lite v1.0.0</Text>
          <Text style={styles.footerSubtext}>© 2025 All rights reserved</Text>
        </View>
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
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: '#F8FAFC' }]}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
            <Dialog.Icon icon="logout" color="#EF4444" />
            <Dialog.Title style={styles.dialogTitle}>Sign Out</Dialog.Title>
            <Dialog.Content>
              <Text style={styles.dialogContent}>Are you sure you want to sign out of your account?</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setLogoutDialogVisible(false)}>Cancel</Button>
              <Button 
                onPress={confirmLogout} 
                textColor="#EF4444"
                mode="text"
              >
                Sign Out
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ProfileCardProps {
  accountProfile: any;
  onPress: () => void;
}

function ProfileCard({ accountProfile, onPress }: ProfileCardProps) {
  return (
    <TouchableOpacity style={styles.profileCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.profileContent}>
        <View style={{ marginRight: 12 }}>
          <AppAvatar name={accountProfile.displayName || 'User'} imageUrl={accountProfile.logoUrl} size={56} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{accountProfile.displayName || 'User'}</Text>
          <Text style={styles.profileEmail}>{accountProfile.email || 'Email not set'}</Text>
          <Text style={styles.profileBusiness}>{accountProfile.businessName || 'Business'}</Text>
        </View>
      </View>
      <ChevronRight size={20} color="#999" />
    </TouchableOpacity>
  );
}



interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}

interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress?: () => void;
  divider?: boolean;
}

function SettingsItem({ icon, title, description, onPress, divider }: SettingsItemProps) {
  return (
    <>
      <TouchableOpacity 
        style={styles.settingItem} 
        onPress={onPress}
        activeOpacity={0.6}
      >
        <View style={styles.itemIconContainer}>{icon}</View>
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>{title}</Text>
          <Text style={styles.itemDescription}>{description}</Text>
        </View>
        <ChevronRight size={18} color="#999" />
      </TouchableOpacity>
      {divider && <View style={styles.divider} />}
    </>
  );
}

interface ToggleItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

function ToggleItem({ icon, title, description, enabled, onToggle, disabled }: ToggleItemProps) {
  return (
    <View style={styles.toggleItem}>
      <View style={styles.itemIconContainer}>{icon}</View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemDescription}>{description}</Text>
      </View>
      <TouchableOpacity 
        style={[styles.toggleSwitch, enabled && styles.toggleSwitchEnabled]}
        onPress={() => !disabled && onToggle(!enabled)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={[styles.toggleThumb, enabled && styles.toggleThumbEnabled]} />
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // ===== CONTAINERS =====
  safeContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  mainContainer: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ===== PROFILE CARD =====
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#075E54',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  profileBusiness: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // ===== SEARCH BAR =====
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 12,
    marginBottom: 24,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },

  // ===== SECTION =====
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  // ===== SETTINGS ITEM =====
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  itemIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0F9FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 12,
    color: '#94A3B8',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },

  // ===== TOGGLE ITEM =====
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 2,
  },
  toggleSwitchEnabled: {
    backgroundColor: '#075E54',
    alignItems: 'flex-end',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbEnabled: {
    backgroundColor: '#fff',
  },

  // ===== SUPPORT CARD =====
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F0F9FC',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E0F2FE',
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#075E54',
    marginBottom: 2,
  },
  supportDescription: {
    fontSize: 12,
    color: '#94A3B8',
  },

  // ===== LOGOUT BUTTON =====
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    marginTop: 8,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },

  // ===== FOOTER =====
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#94A3B8',
  },

  // ===== DIALOG =====
  dialog: {
    borderRadius: 24,
    backgroundColor: '#fff',
  },
  dialogTitle: {
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 18,
    color: '#0F172A',
  },
  dialogContent: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },

  // ===== LEGACY STYLES (for compatibility) =====
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
});

export default SettingsScreen;

