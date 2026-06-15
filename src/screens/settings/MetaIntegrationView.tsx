import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { ChevronLeft } from 'lucide-react-native';
import { SERVER_HOST } from '../../services/api';
import { colors, typography, sharedStyles } from '../../theme';

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
  handleSaveMeta: () => void;
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
  handleSaveMeta,
  loading,
  onBack,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);

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
        <View style={[sharedStyles.modernCard, { padding: 16 }]}>
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
        </View>

        <View style={[sharedStyles.modernCard, { padding: 16, backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
          <Text style={[typography.cardTitle, { color: '#166534', marginBottom: 8 }]}>Webhook Info</Text>
          <Text style={[typography.description, { color: '#15803D' }]}>
            Use the following URL in your Meta App Webhook settings:
          </Text>
          <Text style={[typography.cardTitle, { color: '#14532D', marginTop: 8 }]}>
            {SERVER_HOST}/api/v1/webhook/whatsapp
          </Text>
        </View>
      </ScrollView>
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

