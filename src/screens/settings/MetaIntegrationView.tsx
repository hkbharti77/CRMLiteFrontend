import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Text, TextInput, Button } from 'react-native-paper';
import { SERVER_HOST } from '../../services/api';

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
    <View style={{ flex: 1, paddingBottom: 40 }}>
      <Button icon="arrow-left" mode="text" onPress={onBack} style={{ alignSelf: 'flex-start', marginBottom: 8 }}>
        Back to Settings
      </Button>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>WhatsApp Integration</Title>
          <Text style={styles.subtitle}>
            Enter your Meta for Developers credentials to enable WhatsApp messaging for your account.
          </Text>

          <TextInput
            label="Phone Number ID"
            value={phoneNumberId}
            onChangeText={setPhoneNumberId}
            mode="outlined"
            style={styles.input}
            placeholder="e.g. 123456789012345"
            editable={isEditing}
          />

          <TextInput
            label="WABA ID (Optional)"
            value={wabaId}
            onChangeText={setWabaId}
            mode="outlined"
            style={styles.input}
            placeholder="WhatsApp Business Account ID"
            editable={isEditing}
          />

          <TextInput
            label="Permanent Access Token"
            value={accessToken}
            onChangeText={setAccessToken}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={3}
            editable={isEditing}
          />

          <TextInput
            label="Webhook Verify Token"
            value={verifyToken}
            onChangeText={setVerifyToken}
            mode="outlined"
            style={styles.input}
            editable={isEditing}
          />

          <TextInput
            label="App Secret"
            value={appSecret}
            onChangeText={setAppSecret}
            mode="outlined"
            style={styles.input}
            placeholder="Your Meta App Secret for webhook signature verification"
            secureTextEntry={!isEditing}
            editable={isEditing}
          />

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
                  await handleSaveMeta();
                  setIsEditing(false);
                }}
                loading={loading}
                disabled={loading}
                style={[styles.button, { flex: 1 }]}
                buttonColor="#075E54"
              >
                Save Meta Config
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
              Edit Meta Config
            </Button>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.infoCard}>
        <Card.Content>
          <Title style={styles.infoTitle}>Webhook Info</Title>
          <Text style={styles.infoText}>
            Use the following URL in your Meta App Webhook settings:
          </Text>
          <Text style={styles.urlText}>
            {SERVER_HOST}/api/v1/webhook/whatsapp
          </Text>
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

export default MetaIntegrationView;
