import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { Card, Title, Text, TextInput, Button, useTheme } from 'react-native-paper';
import { ChevronLeft, Info, PaintBucket, Image as ImageIcon } from 'lucide-react-native';

interface CustomBrandingViewProps {
  accountProfile: any;
  setAccountProfile: (profile: any) => void;
  handleSaveProfile: () => void;
  loading: boolean;
  onBack: () => void;
}

const CustomBrandingView: React.FC<CustomBrandingViewProps> = ({
  accountProfile,
  setAccountProfile,
  handleSaveProfile,
  loading,
  onBack,
}) => {
  const theme = useTheme();
  
  // Validate plan access
  const isFreeOrMin = accountProfile.planType === 'FREE' || accountProfile.planType === 'MIN';
  const isPro = accountProfile.planType === 'PRO';
  const isEnterprise = accountProfile.planType === 'ENTERPRISE';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ChevronLeft color="#0f172a" size={24} />
          </TouchableOpacity>
          <View>
            <Title style={styles.headerTitle}>Custom Branding</Title>
            <Text style={styles.headerSubtitle}>Personalize your chat widget</Text>
          </View>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            {isFreeOrMin ? (
              <View style={styles.upgradeNotice}>
                <Info color="#0f172a" size={24} style={{ marginBottom: 10 }} />
                <Title style={styles.upgradeTitle}>Upgrade Required</Title>
                <Text style={styles.upgradeText}>
                  Custom Branding is only available on PRO and ENTERPRISE plans. 
                  Upgrade your plan to customize the widget colors and logo!
                </Text>
              </View>
            ) : (
              <View style={styles.formContainer}>
                
                <View style={[styles.inputGroup, !isEnterprise && { opacity: 0.6 }]}>
                  <View style={styles.labelRow}>
                    <ImageIcon color="#64748b" size={18} />
                    <Text style={styles.label}>Business Logo URL</Text>
                    {!isEnterprise && (
                      <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 }}>
                        <Text style={{ fontSize: 10, color: '#d97706', fontWeight: '600' }}>ENTERPRISE ONLY</Text>
                      </View>
                    )}
                  </View>
                  <TextInput
                    mode="outlined"
                    placeholder="https://example.com/logo.png"
                    value={accountProfile.logoUrl}
                    onChangeText={(val) => setAccountProfile({ ...accountProfile, logoUrl: val })}
                    style={styles.input}
                    outlineColor="#e2e8f0"
                    activeOutlineColor="#3b82f6"
                    disabled={!isEnterprise}
                  />
                  {accountProfile.logoUrl && isEnterprise ? (
                    <Image source={{ uri: accountProfile.logoUrl }} style={styles.logoPreview} resizeMode="contain" />
                  ) : null}
                  {!isEnterprise ? (
                    <Text style={styles.hint}>Upgrade to Enterprise to add a custom logo.</Text>
                  ) : (
                    <Text style={styles.hint}>Square aspect ratio recommended (e.g. 500x500).</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <PaintBucket color="#64748b" size={18} />
                    <Text style={styles.label}>Primary Color (Hex)</Text>
                  </View>
                  <TextInput
                    mode="outlined"
                    placeholder="#3b82f6"
                    value={accountProfile.primaryColor}
                    onChangeText={(val) => setAccountProfile({ ...accountProfile, primaryColor: val })}
                    style={styles.input}
                    outlineColor="#e2e8f0"
                    activeOutlineColor={accountProfile.primaryColor || "#3b82f6"}
                  />
                  <Text style={styles.hint}>Main theme color for buttons and headers.</Text>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <PaintBucket color="#64748b" size={18} />
                    <Text style={styles.label}>Secondary Color (Hex)</Text>
                  </View>
                  <TextInput
                    mode="outlined"
                    placeholder="#1e40af"
                    value={accountProfile.secondaryColor}
                    onChangeText={(val) => setAccountProfile({ ...accountProfile, secondaryColor: val })}
                    style={styles.input}
                    outlineColor="#e2e8f0"
                    activeOutlineColor={accountProfile.secondaryColor || "#1e40af"}
                  />
                  <Text style={styles.hint}>Secondary theme color for hover states.</Text>
                </View>

                <Button 
                  mode="contained" 
                  onPress={handleSaveProfile} 
                  loading={loading}
                  style={styles.saveBtn}
                  labelStyle={styles.saveBtnLabel}
                >
                  Save Branding
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingHorizontal: 4 },
  backButton: { marginRight: 16, padding: 8, backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  headerSubtitle: { fontSize: 14, color: '#64748b', marginTop: 2 },
  card: { borderRadius: 16, backgroundColor: '#fff', elevation: 2 },
  formContainer: { paddingTop: 8 },
  inputGroup: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginLeft: 8 },
  input: { backgroundColor: '#fff', fontSize: 15 },
  hint: { fontSize: 12, color: '#94a3b8', marginTop: 6 },
  logoPreview: { width: 80, height: 80, marginTop: 12, borderRadius: 8, backgroundColor: '#f1f5f9', alignSelf: 'center' },
  saveBtn: { marginTop: 12, borderRadius: 10, backgroundColor: '#3b82f6', paddingVertical: 6 },
  saveBtnLabel: { fontSize: 16, fontWeight: '600' },
  upgradeNotice: { padding: 24, alignItems: 'center', justifyContent: 'center' },
  upgradeTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  upgradeText: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 }
});

export default CustomBrandingView;
