import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { ChevronLeft } from 'lucide-react-native';
import { SERVER_HOST } from '../../services/api';
import { colors, typography, sharedStyles } from '../../theme';
import { WhatsAppConnectButton } from '../../components/whatsapp/WhatsAppConnectButton';
import { authApi } from '../../services/api';
import { Dialog, Portal, Snackbar } from 'react-native-paper';

interface MetaIntegrationViewProps {
  phoneNumberId: string;
  setPhoneNumberId: (val: string) => void;
  wabaId: string;
  setWabaId: (val: string) => void;
  accessToken: string;
  setAccessToken: (val: string) => void;
  verifyToken: string;
  setVerifyToken: (val: string) => void;
  appSecret: string;
  setAppSecret: (val: string) => void;
  verifiedName?: string;
  displayPhoneNumber?: string;
  qualityRating?: string;
  accountStatus?: string;
  handleSaveMeta: () => void;
  handleDeleteMeta?: () => void;
  userEmail?: string;
  loading: boolean;
  onBack: () => void;
}

const MetaIntegrationView: React.FC<MetaIntegrationViewProps> = ({
  phoneNumberId,
  setPhoneNumberId,
  wabaId,
  setWabaId,
  accessToken,
  setAccessToken,
  verifyToken,
  setVerifyToken,
  appSecret,
  setAppSecret,
  verifiedName,
  displayPhoneNumber,
  qualityRating,
  accountStatus,
  handleSaveMeta,
  handleDeleteMeta,
  userEmail,
  loading,
  onBack,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [showLegacy, setShowLegacy] = React.useState(false);
  const [showOtpModal, setShowOtpModal] = React.useState(false);
  const [otp, setOtp] = React.useState('');
  const [otpLoading, setOtpLoading] = React.useState(false);

  const requestDisconnect = async () => {
    if (!userEmail) return;
    try {
      setOtpLoading(true);
      await authApi.login(userEmail);
      setShowOtpModal(true);
    } catch (e) {
      console.error(e);
    } finally {
      setOtpLoading(false);
    }
  };

  const confirmDisconnect = async () => {
    if (!userEmail || !otp) return;
    try {
      setOtpLoading(true);
      await authApi.verifyOtp(userEmail, otp);
      setShowOtpModal(false);
      setOtp('');
      if (handleDeleteMeta) {
        handleDeleteMeta();
      }
    } catch (e) {
      console.error(e);
      // optionally show an error message in the modal
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <View style={sharedStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft size={24} color="#0F766E" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={typography.pageTitle}>WhatsApp Integration</Text>
          <Text style={[typography.description, { marginTop: 4 }]}>
            Enter your Meta for Developers credentials to enable WhatsApp messaging for your account.
          </Text>
        </View>
      </View>

      <ScrollView style={sharedStyles.tabContent} contentContainerStyle={{ paddingBottom: 24 }}>
        
          {/* Tech Provider / Embedded Signup Flow */}
          <View style={[sharedStyles.modernCard, { padding: 16, marginBottom: 16, alignItems: 'center' }]}>
            <Text style={[typography.sectionTitle, { marginBottom: 8, textAlign: 'center' }]}>
              Connect via Tech Provider
            </Text>
            <Text style={{ textAlign: 'center', marginBottom: 16, color: '#666' }}>
              The fastest and easiest way to connect your WhatsApp Business account.
            </Text>

            {phoneNumberId && accountStatus ? (
              <View style={{ width: '100%', marginBottom: 16 }}>
                <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 16, alignItems: 'center' }}>
                  <Text style={{ color: '#166534', fontWeight: 'bold' }}>✅ Connected Successfully</Text>
                </View>

              {/* Display Meta Details */}
              <View style={{ backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' }}>
                <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>Verified Business Name</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 }}>
                  {verifiedName || 'N/A'}
                </Text>

                <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>Phone Number</Text>
                <Text style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}>
                  {displayPhoneNumber || 'N/A'}
                </Text>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>Account Status</Text>
                    <Text style={{ fontSize: 14, color: accountStatus === 'APPROVED' ? '#166534' : '#92400E', fontWeight: '500' }}>
                      {accountStatus || 'PENDING'}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>Quality Rating</Text>
                    <Text style={{ fontSize: 14, color: qualityRating === 'GREEN' ? '#166534' : qualityRating === 'YELLOW' ? '#92400E' : qualityRating === 'RED' ? '#991B1B' : '#374151', fontWeight: '500' }}>
                      {qualityRating || 'UNKNOWN'}
                    </Text>
                  </View>
                </View>
              </View>

              <Button
                mode="outlined"
                icon="link-variant-off"
                textColor="#DC2626"
                style={{ marginTop: 16, borderColor: '#FCA5A5' }}
                onPress={requestDisconnect}
                loading={otpLoading}
                disabled={otpLoading}
              >
                Disconnect Meta Account
              </Button>
            </View>
          ) : null}

            {!(phoneNumberId && accountStatus) && (
              <WhatsAppConnectButton 
                hasExistingConfig={!!phoneNumberId}
                onSuccess={() => {
                  // Reload credentials from API on success
                  // For now, the user can navigate back and forth to refresh
                }}
              />
            )}
          </View>

        {/* Legacy / Manual Configuration Flow */}
        {!showLegacy ? (
          <TouchableOpacity onPress={() => setShowLegacy(true)} style={{ padding: 16, alignItems: 'center' }}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Show Manual Configuration (Legacy)</Text>
          </TouchableOpacity>
        ) : (
          <View style={[sharedStyles.modernCard, { padding: 16 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={typography.sectionTitle}>Manual Configuration (Legacy)</Text>
              {phoneNumberId && !accountStatus && (
                <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                  <Text style={{ color: '#92400E', fontSize: 12, fontWeight: 'bold' }}>Legacy Connected</Text>
                </View>
              )}
            </View>
          <TextInput
            label="Phone Number ID"
            value={phoneNumberId}
            onChangeText={setPhoneNumberId}
            mode="outlined"
            style={sharedStyles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            placeholder="e.g. 123456789012345"
            editable={isEditing}
          />

          <TextInput
            label="WABA ID (Optional)"
            value={wabaId}
            onChangeText={setWabaId}
            mode="outlined"
            style={sharedStyles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            placeholder="WhatsApp Business Account ID"
            editable={isEditing}
          />

          <TextInput
            label="Permanent Access Token"
            value={accessToken}
            onChangeText={setAccessToken}
            mode="outlined"
            style={sharedStyles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            multiline
            numberOfLines={3}
            editable={isEditing}
          />

          <TextInput
            label="Webhook Verify Token"
            value={verifyToken}
            onChangeText={setVerifyToken}
            mode="outlined"
            style={sharedStyles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            editable={isEditing}
          />

          <TextInput
            label="App Secret"
            value={appSecret}
            onChangeText={setAppSecret}
            mode="outlined"
            style={sharedStyles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            placeholder="Your Meta App Secret for webhook signature verification"
            secureTextEntry={!isEditing}
            editable={isEditing}
          />

          {isEditing ? (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <Button
                mode="outlined"
                onPress={() => setIsEditing(false)}
                style={[sharedStyles.button, { flex: 1, borderColor: colors.border }]}
                textColor={colors.text}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={async () => {
                  await handleSaveMeta();
                  setIsEditing(false);
                }}
                loading={loading}
                disabled={loading}
                style={[sharedStyles.button, { flex: 1 }]}
                buttonColor={colors.primary}
              >
                Save Meta Config
              </Button>
            </View>
          ) : (
            <Button
              mode="contained"
              onPress={() => setIsEditing(true)}
              style={sharedStyles.button}
              buttonColor={colors.primary}
              icon="pencil"
            >
              Edit Meta Config
            </Button>
            )}

            <View style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', borderWidth: 1, padding: 16, borderRadius: 8, marginTop: 16 }}>
              <Text style={[typography.cardTitle, { color: '#166534', marginBottom: 8 }]}>Webhook Info</Text>
              <Text style={[typography.description, { color: '#15803D' }]}>
                Use the following URL in your Meta App Webhook settings:
              </Text>
              <Text style={[typography.cardTitle, { color: '#14532D', marginTop: 8 }]}>
                {SERVER_HOST}/api/v1/webhook/whatsapp
              </Text>
            </View>

          </View>
        )}

      </ScrollView>

      <Portal>
        <Dialog 
          visible={showOtpModal} 
          onDismiss={() => setShowOtpModal(false)}
          style={{ backgroundColor: '#fff', borderRadius: 12, maxWidth: 400, alignSelf: 'center', width: '90%' }}
        >
          <Dialog.Title>Verify Disconnect</Dialog.Title>
          <Dialog.Content>
            <Text style={{ marginBottom: 16, color: '#4B5563' }}>
              We've sent a 6-digit OTP to {userEmail}. Please enter it below to confirm disconnection.
            </Text>
            <TextInput
              label="Enter OTP"
              value={otp}
              onChangeText={setOtp}
              mode="outlined"
              keyboardType="number-pad"
              maxLength={6}
              style={{ backgroundColor: '#fff' }}
              activeOutlineColor={colors.primary}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowOtpModal(false)} textColor={colors.text}>Cancel</Button>
            <Button 
              onPress={confirmDisconnect} 
              loading={otpLoading} 
              disabled={otpLoading || otp.length < 6}
              textColor="#DC2626"
            >
              Verify & Disconnect
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 24,
    paddingTop: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
});

export default MetaIntegrationView;

