import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { onboardingApi, categoryApi } from '../services/api';
const TOTAL_STEPS = 5;

export default function OnboardingScreen() {
  const { setOnboardingCompleted } = useAuthStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Dynamic categories from API
  const [categories, setCategories] = useState<Record<string, string[]>>({});
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    categoryApi.getAll()
      .then(res => setCategories(res.data || {}))
      .catch(() => setCategories({}))
      .finally(() => setCategoriesLoading(false));
  }, []);

  // Step 1
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  // Step 2
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [businessSubType, setBusinessSubType] = useState('');
  const [showSubTypeDropdown, setShowSubTypeDropdown] = useState(false);
  // Step 3
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [verifyToken] = useState('crm_' + Math.random().toString(36).substring(7));
  // Step 4
  const [consentMessages, setConsentMessages] = useState(false);
  const [consentData, setConsentData] = useState(false);
  // Step 5
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const handleSkip = async () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1); // Skip current step, move to next
    } else {
      // Last step — persist to backend so login never shows onboarding again
      try {
        await onboardingApi.skip();
      } catch (e) {
        // Even if backend fails, mark locally so user isn't stuck
      }
      await setOnboardingCompleted(true);
    }
  };

  const handleNext = () => {
    if (step === 1 && !displayName.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }
    if (step === 1 && !phone.trim()) {
      Alert.alert('Required', 'Please enter your mobile number');
      return;
    }
    if (step === 1 && !/^[6-9]\d{9}$/.test(phone.trim())) {
      Alert.alert('Invalid', 'Please enter a valid 10-digit Indian mobile number');
      return;
    }
    if (step === 2 && (!businessName.trim() || !businessType || !businessSubType)) {
      Alert.alert('Required', 'Please fill in both Category and Sub-category');
      return;
    }
    if (step === 3 && (!phoneNumberId.trim() || !accessToken.trim())) {
      Alert.alert('Required', 'WhatsApp credentials are mandatory');
      return;
    }
    if (step === 4 && (!consentMessages || !consentData)) {
      Alert.alert('Required', 'Please accept all permissions');
      return;
    }
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onboardingApi.submit({
        displayName,
        phone,
        businessName,
        businessType,
        businessSubType,
        phoneNumberId,
        accessToken,
        verifyToken,
        consentAccepted: consentMessages && consentData,
        address,
        logoUrl,
      });
      await setOnboardingCompleted(true); // await properly
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const progressWidth = `${(step / TOTAL_STEPS) * 100}%` as any;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── WHITE CARD ── */}
        <View style={styles.card}>

          {/* Card Header */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Setup Your Account</Text>
            <View style={styles.headerRight}>
              <Text style={styles.stepCounter}>Step {step}/{TOTAL_STEPS}</Text>
              {/* Skip only on WhatsApp Setup (step 3) and Optional Info (step 5) */}
              {(step === 3 || step === 5) && (
                <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
                  <Text style={styles.skipBtnText}>Skip</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: progressWidth }]} />
          </View>

          {/* ── STEP CONTENT ── */}

          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Let's start with you</Text>
              <Text style={styles.stepSubtitle}>How should we address you?</Text>
              <Text style={styles.label}>Your Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                placeholderTextColor="#aaa"
              />
              <Text style={styles.label}>Mobile Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                placeholderTextColor="#aaa"
              />
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Business Details</Text>
              <Text style={styles.label}>Business Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your Business Name"
                value={businessName}
                onChangeText={setBusinessName}
                placeholderTextColor="#aaa"
              />
              <Text style={styles.label}>Business Category</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowTypeDropdown(!showTypeDropdown)}
              >
                <Text style={businessType ? styles.dropdownSelected : styles.dropdownPlaceholder}>
                  {categoriesLoading ? 'Loading...' : (businessType || 'Select Category')}
                </Text>
                <Text style={styles.dropdownArrow}>{showTypeDropdown ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {showTypeDropdown && !categoriesLoading && (
                <View style={styles.dropdownList}>
                  {Object.keys(categories).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setBusinessType(type);
                        setBusinessSubType('');
                        setShowTypeDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {businessType ? (
                <>
                  <Text style={styles.label}>Sub Category</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setShowSubTypeDropdown(!showSubTypeDropdown)}
                  >
                    <Text style={businessSubType ? styles.dropdownSelected : styles.dropdownPlaceholder}>
                      {businessSubType || 'Select Sub Category'}
                    </Text>
                    <Text style={styles.dropdownArrow}>{showSubTypeDropdown ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  {showSubTypeDropdown && (
                    <View style={styles.dropdownList}>
                      {(categories[businessType] || []).map((subType) => (
                        <TouchableOpacity
                          key={subType}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setBusinessSubType(subType);
                            setShowSubTypeDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{subType}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              ) : null}
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>WhatsApp Setup</Text>
              <Text style={styles.stepSubtitle}>Connect your Meta Cloud API credentials</Text>
              <Text style={styles.label}>Phone Number ID</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1092837465"
                value={phoneNumberId}
                onChangeText={setPhoneNumberId}
                keyboardType="numeric"
                placeholderTextColor="#aaa"
              />
              <Text style={styles.label}>Access Token</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Paste your access token"
                value={accessToken}
                onChangeText={setAccessToken}
                multiline
                numberOfLines={3}
                placeholderTextColor="#aaa"
              />
              <Text style={styles.label}>Webhook Verify Token</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={verifyToken}
                editable={false}
              />
              <Text style={styles.hintText}>↑ Use this token in Meta Developer Portal</Text>
            </View>
          )}

          {step === 4 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Permissions</Text>
              <Text style={styles.stepSubtitle}>Please accept to continue</Text>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setConsentMessages(!consentMessages)}
              >
                <View style={[styles.checkbox, consentMessages && styles.checkboxChecked]}>
                  {consentMessages && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  I consent to send messages to customers via WhatsApp Cloud API
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setConsentData(!consentData)}
              >
                <View style={[styles.checkbox, consentData && styles.checkboxChecked]}>
                  {consentData && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  I allow ChatCRM Lite to store and process chat data for my business
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 5 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Almost Done!</Text>
              <Text style={styles.stepSubtitle}>These are optional — you can fill them later</Text>
              <Text style={styles.label}>Business Address</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Your business address"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={2}
                placeholderTextColor="#aaa"
              />
              <Text style={styles.label}>Logo URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChangeText={setLogoUrl}
                autoCapitalize="none"
                placeholderTextColor="#aaa"
              />
            </View>
          )}

          {/* ── FOOTER BUTTONS ── */}
          <View style={styles.footer}>
            {step > 1 && (
              <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.nextBtn, loading && styles.nextBtnDisabled, step === 1 && { flex: 1 }]}
              onPress={handleNext}
              disabled={loading}
            >
              <Text style={styles.nextBtnText}>
                {loading ? 'Please wait...' : step === TOTAL_STEPS ? '🎉 Finish' : 'Continue →'}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
        {/* ── END WHITE CARD ── */}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 0,
  },

  /* ── CARD ── */
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 0,
    padding: 24,
    paddingTop: 32,
  },

  /* ── CARD HEADER ── */
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#006A4E',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepCounter: {
    fontSize: 12,
    color: '#888',
  },
  skipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  skipBtnText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },

  /* ── PROGRESS BAR ── */
  progressTrack: {
    height: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 20,
  },
  progressFill: {
    height: 5,
    backgroundColor: '#006A4E',
    borderRadius: 4,
  },

  /* ── STEP CONTENT ── */
  stepContent: {
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 14,
  },

  /* ── INPUTS ── */
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    fontSize: 14,
    color: '#222',
    backgroundColor: '#fafafa',
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#888',
  },
  hintText: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },

  /* ── DROPDOWN ── */
  dropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fafafa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownPlaceholder: {
    color: '#aaa',
    fontSize: 14,
  },
  dropdownSelected: {
    color: '#222',
    fontSize: 14,
  },
  dropdownArrow: {
    color: '#888',
    fontSize: 11,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#222',
  },

  /* ── CHECKBOX ── */
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#aaa',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#006A4E',
    borderColor: '#006A4E',
  },
  checkmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    lineHeight: 19,
  },

  /* ── FOOTER BUTTONS ── */
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  backBtn: {
    borderWidth: 1.5,
    borderColor: '#006A4E',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    color: '#006A4E',
    fontSize: 14,
    fontWeight: '600',
  },
  nextBtn: {
    flex: 1,
    backgroundColor: '#006A4E',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnDisabled: {
    backgroundColor: '#7aab9a',
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
