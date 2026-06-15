import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Clipboard, Alert, ScrollView, SafeAreaView, Platform, TextInput as RNTextInput } from 'react-native';
import { Card, Title, Text, TextInput, Button, Snackbar, Switch } from 'react-native-paper';
import { categoryApi, SERVER_HOST } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { ChevronLeft, Copy, MapPin, Eye, EyeOff, AlertCircle, Check } from 'lucide-react-native';

interface AccountProfileViewProps {
  accountProfile: any;
  setAccountProfile: (profile: any) => void;
  handleSaveProfile: (overrideProfile?: any) => void;
  loading: boolean;
  onBack: () => void;
}

const AccountProfileView: React.FC<AccountProfileViewProps> = ({
  accountProfile,
  setAccountProfile,
  handleSaveProfile,
  loading,
  onBack,
}) => {
  const [showSubTypeDropdown, setShowSubTypeDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categories, setCategories] = useState<Record<string, string[]>>({});
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [mapsUrl, setMapsUrl] = useState('');
  const [copySnackbar, setCopySnackbar] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [descriptionLength, setDescriptionLength] = useState(accountProfile.aboutUs?.length || 0);
  const [changes, setChanges] = useState(false);

  const { userId, flowType } = useAuthStore();

  const API_BASE = SERVER_HOST;

  const embedCode = userId
    ? `<link rel="stylesheet" href="${API_BASE}/styles.css">\n<script src="${API_BASE}/chat-widget.js"\n  data-business-id="${userId}">\n</script>`
    : '';

  const handleFieldChange = (field: string, value: any) => {
    setAccountProfile({ ...accountProfile, [field]: value });
    setChanges(true);
    if (field === 'aboutUs') {
      setDescriptionLength(value.length);
    }
  };

  const parseMapsUrl = () => {
    if (!mapsUrl) return;
    
    const coordPattern = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = mapsUrl.match(coordPattern);
    
    if (match) {
      handleFieldChange('latitude', parseFloat(match[1]));
      handleFieldChange('longitude', parseFloat(match[2]));
      Alert.alert('Success', 'Coordinates extracted from link!');
      return;
    }

    const queryPattern = /[?&](ll|q)=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const qMatch = mapsUrl.match(queryPattern);
    if (qMatch) {
      handleFieldChange('latitude', parseFloat(qMatch[2]));
      handleFieldChange('longitude', parseFloat(qMatch[3]));
      Alert.alert('Success', 'Coordinates extracted from link!');
      return;
    }

    Alert.alert("Error", "Could not extract coordinates. Please ensure the URL contains @latitude,longitude");
  };

  const copyToClipboard = (text: string, field: string) => {
    Clipboard.setString(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  useEffect(() => {
    categoryApi.getAll()
      .then(res => setCategories(res.data || {}))
      .catch(() => setCategories({}))
      .finally(() => setCategoriesLoading(false));
  }, []);

  const handleSave = async () => {
    await handleSaveProfile();
    setIsEditing(false);
    setChanges(false);
    setShowCategoryDropdown(false);
    setShowSubTypeDropdown(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== HEADER ===== */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ChevronLeft size={24} color="#0F766E" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.pageTitle}>Account Profile</Text>
            <Text style={styles.pageSubtitle}>Manage your account and business details</Text>
          </View>
        </View>

        {/* ===== PROFILE CARD ===== */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {accountProfile.displayName?.charAt(0).toUpperCase() || 'H'}
              </Text>
            </View>
            <TouchableOpacity style={styles.changePhotoButton}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{accountProfile.displayName || 'Admin Account'}</Text>
            <Text style={styles.profileEmail}>{accountProfile.email || 'Email not set'}</Text>
            <View style={styles.badgeContainer}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Admin</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ===== CONTACT INFORMATION SECTION ===== */}
        <SectionCard title="Contact Information">
          <FormField
            label="Display Name"
            value={accountProfile.displayName}
            onChangeText={(v) => handleFieldChange('displayName', v)}
            editable={isEditing}
            placeholder="Your full name"
          />
          <FormField
            label="Phone Number"
            value={accountProfile.phone}
            onChangeText={(v) => handleFieldChange('phone', v)}
            editable={isEditing}
            placeholder="+1 (555) 000-0000"
            keyboardType="phone-pad"
          />
        </SectionCard>

        {/* ===== BUSINESS INFORMATION SECTION ===== */}
        <SectionCard title="Business Information" style={{ zIndex: 100, elevation: 100 }}>
          <FormField
            label="Business Name"
            value={accountProfile.businessName}
            onChangeText={(v) => handleFieldChange('businessName', v)}
            editable={isEditing}
            placeholder="Your business name"
          />

          <View style={[styles.dropdownContainer, { zIndex: 2000, elevation: 2000 }]}>
            <Text style={styles.fieldLabel}>Business Category</Text>
            <DropdownField
              value={accountProfile.businessType}
              placeholder="Select category"
              isOpen={showCategoryDropdown}
              onPress={() => isEditing && setShowCategoryDropdown(!showCategoryDropdown)}
              onClose={() => setShowCategoryDropdown(false)}
              options={Object.keys(categories)}
              onSelect={(cat) => {
                handleFieldChange('businessType', cat);
                handleFieldChange('businessSubType', '');
                setShowCategoryDropdown(false);
                setShowSubTypeDropdown(true);
              }}
              loading={categoriesLoading}
              disabled={!isEditing}
            />
          </View>

          {accountProfile.businessType && (
            <View style={[styles.dropdownContainer, { zIndex: 1000, elevation: 1000 }]}>
              <Text style={styles.fieldLabel}>Sub Category</Text>
              <DropdownField
                value={accountProfile.businessSubType}
                placeholder="Select sub category"
                isOpen={showSubTypeDropdown}
                onPress={() => isEditing && setShowSubTypeDropdown(!showSubTypeDropdown)}
                onClose={() => setShowSubTypeDropdown(false)}
                options={categories[accountProfile.businessType] || []}
                onSelect={(subType) => {
                  handleFieldChange('businessSubType', subType);
                  setShowSubTypeDropdown(false);
                }}
                disabled={!isEditing}
              />
            </View>
          )}
        </SectionCard>

        {/* ===== BUSINESS LOCATION SECTION ===== */}
        <SectionCard title="Business Location" style={{ zIndex: 10, elevation: 10 }}>
          <Text style={styles.fieldHelper}>📍 These coordinates will be used to share your shop location on WhatsApp</Text>
          
          <FormField
            label="Google Maps Link"
            value={mapsUrl}
            onChangeText={setMapsUrl}
            editable={isEditing}
            placeholder="https://www.google.com/maps/..."
            icon={<MapPin size={18} color="#0F766E" />}
          />

          {isEditing && (
            <TouchableOpacity 
              style={[styles.extractButton, !mapsUrl && styles.extractButtonDisabled]}
              onPress={parseMapsUrl}
              disabled={!mapsUrl}
            >
              <Text style={styles.extractButtonText}>Extract Coordinates</Text>
            </TouchableOpacity>
          )}

          <View style={styles.coordinatesRow}>
            <FormField
              label="Latitude"
              value={accountProfile.latitude?.toString() || ''}
              onChangeText={(v) => {
                const num = parseFloat(v);
                handleFieldChange('latitude', isNaN(num) ? null : num);
              }}
              editable={isEditing}
              placeholder="0.0000"
              keyboardType="decimal-pad"
              containerStyle={{ flex: 1, marginRight: 8 }}
            />
            <FormField
              label="Longitude"
              value={accountProfile.longitude?.toString() || ''}
              onChangeText={(v) => {
                const num = parseFloat(v);
                handleFieldChange('longitude', isNaN(num) ? null : num);
              }}
              editable={isEditing}
              placeholder="0.0000"
              keyboardType="decimal-pad"
              containerStyle={{ flex: 1, marginLeft: 8 }}
            />
          </View>
        </SectionCard>

        {/* ===== ABOUT BUSINESS SECTION ===== */}
        <SectionCard title="About Business">
          <View style={styles.aboutContainer}>
            <View style={styles.characterCounter}>
              <Text style={styles.counterLabel}>Business Description</Text>
              <Text style={[styles.counterText, descriptionLength > 500 && styles.counterWarning]}>
                {descriptionLength}/500
              </Text>
            </View>
            <TextInput
              label=""
              value={accountProfile.aboutUs}
              onChangeText={(v) => handleFieldChange('aboutUs', v.slice(0, 500))}
              editable={isEditing}
              placeholder="Tell your customers about your business, values, and services..."
              mode="outlined"
              multiline
              numberOfLines={5}
              style={[styles.aboutInput, !isEditing && styles.inputDisabled]}
              contentStyle={styles.aboutContent}
            />
          </View>
        </SectionCard>

        {/* ===== APP MODULES SECTION ===== */}
        <SectionCard title="App Modules" icon="⚙️">
          <Text style={styles.embedHelper}>Enable or disable specific features based on your business needs.</Text>
          
          <View style={styles.switchRow}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.switchLabel}>Leads & Pipeline Module</Text>
              <Text style={styles.switchDescription}>Manage customer inquiries and sales pipeline</Text>
            </View>
            <Switch
              value={flowType === 'LEAD' ? true : (accountProfile.forceShowLeads ?? false)}
              disabled={flowType === 'LEAD'}
              onValueChange={async (val) => {
                const updates: any = { forceShowLeads: val };
                if (val) {
                  if (flowType !== 'APPOINTMENT') updates.forceShowAppointment = false;
                  if (flowType !== 'BOOKING') updates.forceShowBooking = false;
                }
                const newProfile = { ...accountProfile, ...updates };
                setAccountProfile(newProfile);
                try { await handleSaveProfile(newProfile); } catch (e) {}
              }}
              color="#0F766E"
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.switchLabel}>Appointments Module</Text>
              <Text style={styles.switchDescription}>Allow customers to schedule appointments</Text>
            </View>
            <Switch
              value={flowType === 'APPOINTMENT' ? true : (accountProfile.forceShowAppointment ?? false)}
              disabled={flowType === 'APPOINTMENT'}
              onValueChange={async (val) => {
                const updates: any = { forceShowAppointment: val };
                if (val) {
                  if (flowType !== 'LEAD') updates.forceShowLeads = false;
                  if (flowType !== 'BOOKING') updates.forceShowBooking = false;
                }
                const newProfile = { ...accountProfile, ...updates };
                setAccountProfile(newProfile);
                try { await handleSaveProfile(newProfile); } catch (e) {}
              }}
              color="#0F766E"
            />
          </View>

          <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.switchLabel}>Bookings Module</Text>
              <Text style={styles.switchDescription}>Allow customers to book your services</Text>
            </View>
            <Switch
              value={flowType === 'BOOKING' ? true : (accountProfile.forceShowBooking ?? false)}
              disabled={flowType === 'BOOKING'}
              onValueChange={async (val) => {
                const updates: any = { forceShowBooking: val };
                if (val) {
                  if (flowType !== 'LEAD') updates.forceShowLeads = false;
                  if (flowType !== 'APPOINTMENT') updates.forceShowAppointment = false;
                }
                const newProfile = { ...accountProfile, ...updates };
                setAccountProfile(newProfile);
                try { await handleSaveProfile(newProfile); } catch (e) {}
              }}
              color="#0F766E"
            />
          </View>
        </SectionCard>

        {/* ===== WEB BOT EMBED SECTION ===== */}
        <SectionCard title="Website Chat Widget" icon="🤖">
          <Text style={styles.embedHelper}>Connect your website with AI-powered chat</Text>

          <View style={styles.businessIdCard}>
            <View style={styles.businessIdLeft}>
              <Text style={styles.businessIdLabel}>Business ID</Text>
              <Text style={styles.businessIdValue}>{userId || 'Loading...'}</Text>
            </View>
            <TouchableOpacity 
              style={styles.copyIconButton}
              onPress={() => userId && copyToClipboard(userId, 'businessId')}
            >
              <Copy size={18} color={copiedField === 'businessId' ? '#10B981' : '#0F766E'} />
              <Text style={[styles.copyLabel, copiedField === 'businessId' && { color: '#10B981' }]}>
                {copiedField === 'businessId' ? 'Copied' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.installationSteps}>
            <InstallationStep number={1} title="Copy Code" />
            <InstallationStep number={2} title="Paste before closing body tag" />
          </View>

          <View style={styles.codeBlockContainer}>
            <View style={styles.codeBlockHeader}>
              <Text style={styles.codeBlockLabel}>Code Snippet</Text>
              <TouchableOpacity 
                onPress={() => copyToClipboard(embedCode, 'embedCode')}
                style={styles.copyCodeButton}
              >
                <Copy size={16} color="#fff" />
                <Text style={styles.copyCodeText}>
                  {copiedField === 'embedCode' ? 'Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text style={styles.codeBlockText} selectable>
                {embedCode}
              </Text>
            </ScrollView>
          </View>

          <View style={styles.embedActionsContainer}>
            <TouchableOpacity style={[styles.embedActionButton, styles.previewButton]}>
              <Eye size={18} color="#0F766E" />
              <Text style={styles.embedActionText}>Preview Widget</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.embedActionButton, styles.docsButton]}
              onPress={() => Alert.alert('Documentation', 'Visit our documentation for more details')}
            >
              <Text style={styles.docsButtonText}>📖 Documentation</Text>
            </TouchableOpacity>
          </View>
        </SectionCard>

        {/* ===== BOTTOM SPACER ===== */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ===== STICKY ACTION BAR ===== */}
      <View style={styles.stickyActionBar}>
        {isEditing ? (
          <View style={styles.actionBarContent}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => {
                setIsEditing(false);
                setChanges(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.saveButton, loading && styles.saveButtonLoading]}
              onPress={handleSave}
              disabled={loading || !changes}
            >
              <Check size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      <Snackbar
        visible={copySnackbar}
        onDismiss={() => setCopySnackbar(false)}
        duration={2000}
        style={{ backgroundColor: '#10B981' }}
      >
        ✅ Copied to clipboard!
      </Snackbar>
    </SafeAreaView>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface SectionCardProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  style?: any;
}

function SectionCard({ title, icon, children, style }: SectionCardProps) {
  return (
    <View style={[styles.sectionCard, style]}>
      <View style={styles.sectionHeader}>
        {icon && <Text style={styles.sectionIcon}>{icon}</Text>}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  editable?: boolean;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'phone-pad' | 'email-address';
  icon?: React.ReactNode;
  containerStyle?: any;
  multiline?: boolean;
  numberOfLines?: number;
}

function FormField({
  label,
  value,
  onChangeText,
  editable = true,
  placeholder,
  keyboardType = 'default',
  icon,
  containerStyle,
  multiline = false,
  numberOfLines
}: FormFieldProps) {
  return (
    <View style={[styles.formField, containerStyle]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldInputContainer, !editable && styles.fieldDisabled]}>
        {icon && <View style={styles.fieldIcon}>{icon}</View>}
        <TextInput
          mode="outlined"
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          placeholder={placeholder}
          keyboardType={keyboardType}
          style={[styles.fieldInput, !editable && styles.inputDisabled]}
          contentStyle={styles.fieldInputContent}
          multiline={multiline}
          numberOfLines={numberOfLines}
        />
      </View>
    </View>
  );
}

interface DropdownFieldProps {
  value: string;
  placeholder: string;
  isOpen: boolean;
  onPress: () => void;
  onClose: () => void;
  options: string[];
  onSelect: (option: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

function DropdownField({
  value,
  placeholder,
  isOpen,
  onPress,
  onClose,
  options,
  onSelect,
  loading = false,
  disabled = false
}: DropdownFieldProps) {
  return (
    <View style={styles.dropdownWrapper}>
      <TouchableOpacity
        style={[styles.dropdownTrigger, disabled && styles.dropdownDisabled]}
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={[styles.dropdownValue, !value && styles.dropdownPlaceholder]} numberOfLines={1} ellipsizeMode="tail">
          {loading ? 'Loading...' : (value || placeholder)}
        </Text>
        <Text style={[styles.dropdownArrow, isOpen && styles.dropdownArrowOpen]}>▼</Text>
      </TouchableOpacity>

      {isOpen && !disabled && (
        <View style={styles.dropdownMenu}>
          {loading ? (
            <View style={styles.dropdownItem}>
              <Text style={styles.dropdownItemText}>Loading...</Text>
            </View>
          ) : options.length > 0 ? (
            options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.dropdownItem,
                  value === option && styles.dropdownItemSelected
                ]}
                onPress={() => onSelect(option)}
              >
                <Text style={[
                  styles.dropdownItemText,
                  value === option && styles.dropdownItemTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.dropdownItem}>
              <Text style={styles.dropdownItemText}>No options</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

interface InstallationStepProps {
  number: number;
  title: string;
}

function InstallationStep({ number, title }: InstallationStepProps) {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <Text style={styles.stepTitle}>{title}</Text>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  // ===== HEADER =====
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flex: 1,
    paddingTop: 4,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },

  // ===== PROFILE CARD =====
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0F766E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  changePhotoButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F766E',
  },
  profileInfo: {
    flex: 1,
    paddingTop: 2,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: '#F0F9FC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F766E',
  },

  // ===== SECTION CARD =====
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // ===== FORM FIELD =====
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  fieldInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  fieldDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  fieldIcon: {
    marginRight: 8,
  },
  fieldInput: {
    flex: 1,
    height: 44,
    padding: 0,
    borderWidth: 0,
    fontSize: 14,
    backgroundColor: 'transparent',
  },
  fieldInputContent: {
    paddingVertical: 10,
  },
  inputDisabled: {
    opacity: 0.6,
  },

  // ===== DROPDOWN =====
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex: 10,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
    minHeight: 44,
  },
  dropdownDisabled: {
    backgroundColor: '#F8FAFC',
    opacity: 0.6,
  },
  dropdownValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },
  dropdownPlaceholder: {
    color: '#94A3B8',
  },
  dropdownArrow: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 8,
  },
  dropdownArrowOpen: {
    color: '#0F766E',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 300,
    zIndex: 100,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  dropdownItemSelected: {
    backgroundColor: '#F0F9FC',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#64748B',
  },
  dropdownItemTextSelected: {
    color: '#0F766E',
    fontWeight: '600',
  },

  // ===== ABOUT SECTION =====
  aboutContainer: {
    marginBottom: 8,
  },
  characterCounter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  counterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  counterText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  counterWarning: {
    color: '#EF4444',
    fontWeight: '600',
  },
  aboutInput: {
    backgroundColor: '#fff',
  },
  aboutContent: {
    minHeight: 120,
    paddingVertical: 12,
  },

  // ===== BUSINESS ID CARD =====
  businessIdCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  businessIdLeft: {
    flex: 1,
  },
  businessIdLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  businessIdValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'monospace',
  },
  copyIconButton: {
    alignItems: 'center',
    gap: 4,
  },
  copyLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F766E',
  },

  // ===== INSTALLATION STEPS =====
  installationSteps: {
    marginBottom: 16,
    gap: 12,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    borderWidth: 2,
    borderColor: '#0F766E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F766E',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },

  // ===== CODE BLOCK =====
  codeBlockContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  codeBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  codeBlockLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  copyCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#0F766E',
    borderRadius: 8,
  },
  copyCodeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  codeBlockText: {
    padding: 14,
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#94A3B8',
    lineHeight: 18,
  },

  // ===== EMBED HELPER TEXT =====
  fieldHelper: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  embedHelper: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },

  // ===== SWITCHES =====
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 12,
    color: '#64748B',
  },

  // ===== COORDINATES ROW =====
  coordinatesRow: {
    flexDirection: 'row',
    gap: 12,
  },

  // ===== EXTRACT BUTTON =====
  extractButton: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  extractButtonDisabled: {
    opacity: 0.5,
  },
  extractButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // ===== EMBED ACTIONS =====
  embedActionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  embedActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  previewButton: {
    backgroundColor: '#F0F9FC',
    borderWidth: 1.5,
    borderColor: '#E0F2FE',
  },
  embedActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F766E',
  },
  docsButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  docsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },

  // ===== STICKY ACTION BAR =====
  stickyActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  actionBarContent: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  saveButton: {
    backgroundColor: '#0F766E',
  },
  saveButtonLoading: {
    opacity: 0.8,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  editButton: {
    backgroundColor: '#0F766E',
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});


export default AccountProfileView;
