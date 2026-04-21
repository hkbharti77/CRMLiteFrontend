import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Title, Text, TextInput, Button } from 'react-native-paper';
import { categoryApi } from '../../services/api';

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
});

export default AccountProfileView;
