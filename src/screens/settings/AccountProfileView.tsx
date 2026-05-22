import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Clipboard, Alert } from 'react-native';
import { Card, Title, Text, TextInput, Button, Snackbar } from 'react-native-paper';
import { categoryApi, SERVER_HOST } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

interface AccountProfileViewProps {
  accountProfile: any;
  setAccountProfile: (profile: any) => void;
  handleSaveProfile: () => void;
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

  const { userId } = useAuthStore();

  // Backend base URL — same as chat-widget.js API_BASE
  const API_BASE = SERVER_HOST;

  const embedCode = userId
    ? `<link rel="stylesheet" href="${API_BASE}/styles.css">\n<script src="${API_BASE}/chat-widget.js"\n  data-business-id="${userId}">\n</script>`
    : '';

  const parseMapsUrl = () => {
    if (!mapsUrl) return;
    
    // Pattern 1: @lat,lng
    // e.g. https://www.google.com/maps/place/Data/@12.9716,77.5946,15z/...
    const coordPattern = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = mapsUrl.match(coordPattern);
    
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      setAccountProfile({
        ...accountProfile,
        latitude: lat,
        longitude: lng
      });
      return;
    }

    // Pattern 2: query parameter ll=lat,lng or q=lat,lng
    const queryPattern = /[?&](ll|q)=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const qMatch = mapsUrl.match(queryPattern);
    if (qMatch) {
      setAccountProfile({
        ...accountProfile,
        latitude: parseFloat(qMatch[2]),
        longitude: parseFloat(qMatch[3])
      });
      return;
    }

    alert("Could not extract coordinates. Please ensure the URL contains @latitude,longitude (e.g. from your browser address bar).");
  };

  useEffect(() => {
    categoryApi.getAll()
      .then(res => setCategories(res.data || {}))
      .catch(() => setCategories({}))
      .finally(() => setCategoriesLoading(false));
  }, []);

  return (
    <View style={{ flex: 1, paddingBottom: 40 }}>
      <Button icon="arrow-left" mode="text" onPress={onBack} style={{ alignSelf: 'flex-start', marginBottom: 8 }}>
        Back to Settings
      </Button>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Account Profile</Title>
          <Text style={styles.subtitle}>Update your tenant details and business profile here.</Text>

          <TextInput
            label="Email (Read Only)"
            value={accountProfile.email}
            disabled
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Display Name"
            value={accountProfile.displayName}
            onChangeText={(v) => setAccountProfile({ ...accountProfile, displayName: v })}
            mode="outlined"
            style={styles.input}
            editable={isEditing}
          />
          <TextInput
            label="Phone"
            value={accountProfile.phone}
            onChangeText={(v) => setAccountProfile({ ...accountProfile, phone: v })}
            mode="outlined"
            style={styles.input}
            editable={isEditing}
          />
          <TextInput
            label="Business Name"
            value={accountProfile.businessName}
            onChangeText={(v) => setAccountProfile({ ...accountProfile, businessName: v })}
            mode="outlined"
            style={styles.input}
            editable={isEditing}
          />
          <Text style={styles.label}>Business Category</Text>
          <TouchableOpacity
            style={[styles.dropdown, !isEditing && { backgroundColor: '#f9f9f9', borderColor: '#e0e0e0' }]}
            onPress={() => {
              if (!isEditing) {
                setIsEditing(true);
              }
              setShowCategoryDropdown(!showCategoryDropdown);
            }}
          >
            <Text style={accountProfile.businessType ? styles.dropdownSelected : styles.dropdownPlaceholder}>
              {categoriesLoading ? 'Fetching categories...' : (accountProfile.businessType || 'Select Category')}
            </Text>
            <Text style={styles.dropdownArrow}>{showCategoryDropdown ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showCategoryDropdown && (
            <View style={styles.dropdownList}>
              {categoriesLoading ? (
                <View style={styles.dropdownItem}>
                  <Text style={styles.dropdownItemText}>Loading industries...</Text>
                </View>
              ) : Object.keys(categories).length > 0 ? (
                Object.keys(categories).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.dropdownItem,
                      accountProfile.businessType === cat && { backgroundColor: '#e8f5e9' }
                    ]}
                    onPress={() => {
                      setAccountProfile({ ...accountProfile, businessType: cat, businessSubType: '' });
                      setShowCategoryDropdown(false);
                      setShowSubTypeDropdown(true); // Auto-open sub-type for better flow
                    }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      accountProfile.businessType === cat && { fontWeight: 'bold', color: '#075E54' }
                    ]}>{cat}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.dropdownItem}>
                  <Text style={styles.dropdownItemText}>No categories found</Text>
                </View>
              )}
            </View>
          )}

          {accountProfile.businessType ? (
            <>
              <Text style={styles.label}>Sub Category</Text>
              <TouchableOpacity
                style={[styles.dropdown, !isEditing && { backgroundColor: '#f5f5f5' }]}
                onPress={() => isEditing && setShowSubTypeDropdown(!showSubTypeDropdown)}
                disabled={!isEditing}
              >
                <Text style={accountProfile.businessSubType ? styles.dropdownSelected : styles.dropdownPlaceholder}>
                  {categoriesLoading ? 'Loading...' : (accountProfile.businessSubType || 'Select Sub Category')}
                </Text>
                <Text style={styles.dropdownArrow}>{showSubTypeDropdown ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {showSubTypeDropdown && !categoriesLoading && (
                <View style={styles.dropdownList}>
                  {(categories[accountProfile.businessType] || []).map((subType) => (
                    <TouchableOpacity
                      key={subType}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setAccountProfile({ ...accountProfile, businessSubType: subType });
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
          <TextInput
            label="Address"
            value={accountProfile.address}
            onChangeText={(v) => setAccountProfile({ ...accountProfile, address: v })}
            mode="outlined"
            style={styles.input}
            multiline
            editable={isEditing}
          />

          <TextInput
            label="About Us / Business Description"
            value={accountProfile.aboutUs}
            onChangeText={(v) => setAccountProfile({ ...accountProfile, aboutUs: v })}
            mode="outlined"
            style={[styles.input, { height: 100 }]}
            multiline
            numberOfLines={4}
            editable={isEditing}
            placeholder="Tell your customers about your business, values, and services..."
          />

          <View style={styles.separator} />
          <Text style={styles.sectionTitle}>📍 Business Location (Map)</Text>
          <Text style={styles.sectionSubtitle}>These coordinates will be used to send your shop's location map to customers on WhatsApp.</Text>

          <TextInput
            label="Google Maps Link"
            value={mapsUrl}
            onChangeText={setMapsUrl}
            mode="outlined"
            style={styles.input}
            placeholder="https://www.google.com/maps/..."
            editable={isEditing}
            right={<TextInput.Icon icon="map-marker-outline" />}
          />

          <Button 
            mode="outlined" 
            onPress={parseMapsUrl}
            style={{ marginBottom: 16 }}
            disabled={!isEditing || !mapsUrl}
            icon="auto-fix"
          >
            Fetch Coordinates from Link
          </Button>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              label="Latitude"
              value={accountProfile.latitude?.toString() || ''}
              onChangeText={(v) => {
                const num = parseFloat(v);
                setAccountProfile({ ...accountProfile, latitude: isNaN(num) ? null : num });
              }}
              mode="outlined"
              style={[styles.input, { flex: 1 }]}
              keyboardType="numeric"
              editable={isEditing}
            />
            <TextInput
              label="Longitude"
              value={accountProfile.longitude?.toString() || ''}
              onChangeText={(v) => {
                const num = parseFloat(v);
                setAccountProfile({ ...accountProfile, longitude: isNaN(num) ? null : num });
              }}
              mode="outlined"
              style={[styles.input, { flex: 1 }]}
              keyboardType="numeric"
              editable={isEditing}
            />
          </View>

          {isEditing ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button
                mode="outlined"
                onPress={() => setIsEditing(false)}
                style={[styles.button, { flex: 1 }]}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={async () => {
                  await handleSaveProfile();
                  setIsEditing(false);
                  setShowCategoryDropdown(false);
                  setShowSubTypeDropdown(false);
                }}
                loading={loading}
                disabled={loading}
                style={[styles.button, { flex: 1 }]}
                buttonColor="#075E54"
              >
                Save Profile
              </Button>
            </View>
          ) : (
            <Button
              mode="contained"
              onPress={() => setIsEditing(true)}
              style={styles.button}
              buttonColor="#075E54"
              icon="pencil"
            >
              Edit Profile
            </Button>
          )}
        </Card.Content>
      </Card>

      {/* ── Web Bot Embed Section ─────────────────────────────────────── */}
      <Card style={styles.embedCard}>
        <Card.Content>
          <Title style={styles.embedTitle}>🤖 Web Bot Embed</Title>
          <Text style={styles.embedSubtitle}>
            Copy this code and paste it inside the {'<body>'} tag of any website to embed your AI chat bot.
          </Text>

          {/* Business UUID display */}
          <View style={styles.uuidRow}>
            <Text style={styles.uuidLabel}>Your Business ID</Text>
            <TouchableOpacity
              style={styles.uuidBox}
              onPress={() => {
                if (userId) {
                  Clipboard.setString(userId);
                  setCopySnackbar(true);
                }
              }}
            >
              <Text style={styles.uuidText} numberOfLines={1} ellipsizeMode="middle">
                {userId || 'Not available'}
              </Text>
              <Text style={styles.copyHint}>📋 Tap to copy</Text>
            </TouchableOpacity>
          </View>

          {/* Embed code block */}
          <View style={styles.codeBlock}>
            <Text style={styles.codeLabel}># Paste inside {'<body>'} tag</Text>
            <Text style={styles.codeText} selectable>
              {embedCode}
            </Text>
          </View>

          <Button
            mode="contained"
            icon="content-copy"
            buttonColor="#0f172a"
            style={styles.copyBtn}
            onPress={() => {
              if (embedCode) {
                Clipboard.setString(embedCode);
                setCopySnackbar(true);
              }
            }}
          >
            Copy Embed Code
          </Button>

          <Button
            mode="outlined"
            icon="open-in-new"
            style={[styles.copyBtn, { marginTop: 8 }]}
            onPress={() => {
              Alert.alert(
                'Test Your Bot',
                `Open this URL in your browser to test the widget:\n\n${API_BASE}/test.html?businessId=${userId}`,
                [{ text: 'OK' }]
              );
            }}
          >
            View Test Page URL
          </Button>
        </Card.Content>
      </Card>

      <Snackbar
        visible={copySnackbar}
        onDismiss={() => setCopySnackbar(false)}
        duration={2000}
        style={{ backgroundColor: '#075E54' }}
      >
        ✅ Copied to clipboard!
      </Snackbar>
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
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 8,
    paddingVertical: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 5,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#79747e', // Material 3 outline color approx
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dropdownPlaceholder: {
    color: '#aaa',
    fontSize: 16,
  },
  dropdownSelected: {
    color: '#1d1b20',
    fontSize: 16,
  },
  dropdownArrow: {
    color: '#888',
    fontSize: 11,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginTop: -10,
    marginBottom: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
    zIndex: 10,
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
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#075E54',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    lineHeight: 18,
  },
  // ── Embed section styles ───────────────────────────────────────────────
  embedCard: {
    marginBottom: 16,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  embedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  embedSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 18,
  },
  uuidRow: {
    marginBottom: 16,
  },
  uuidLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  uuidBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uuidText: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#0f172a',
    flex: 1,
  },
  copyHint: {
    fontSize: 11,
    color: '#3b82f6',
    marginLeft: 8,
  },
  codeBlock: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  codeLabel: {
    color: '#3b82f6',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  codeText: {
    color: '#94a3b8',
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 18,
  },
  copyBtn: {
    borderRadius: 8,
  },
});

export default AccountProfileView;
