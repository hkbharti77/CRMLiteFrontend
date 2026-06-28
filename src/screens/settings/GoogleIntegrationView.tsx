import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { Card, Title, Text, Button, Divider, ActivityIndicator, List } from 'react-native-paper';
import { integrationApi } from '../../services/api';
import { tokens } from '../../theme/tokens';
import { Ionicons } from '@expo/vector-icons';

interface GoogleIntegrationViewProps {
  onBack: () => void;
}

const GoogleIntegrationView: React.FC<GoogleIntegrationViewProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchGoogleStatus();
  }, []);

  const fetchGoogleStatus = async () => {
    setLoading(true);
    try {
      const res = await integrationApi.getGoogleStatus();
      setConnected(res.data.connected);
    } catch (e) {
      console.error('Failed to fetch Google status:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setActionLoading(true);
    try {
      const res = await integrationApi.getGoogleAuthUrl();
      if (res.data.url) {
        Linking.openURL(res.data.url);
      } else {
        Alert.alert('Error', 'Failed to generate Google authorization link.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not initiate Google connection.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect Google',
      'Are you sure you want to disconnect your Google Account? You will not be able to generate Google Meet links for appointments.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await integrationApi.disconnectGoogle();
              setConnected(false);
              Alert.alert('Success', 'Google Account disconnected successfully.');
            } catch (e) {
              Alert.alert('Error', 'Failed to disconnect Google Account.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button icon="arrow-left" mode="text" onPress={onBack} textColor="#64748B" style={styles.backBtn}>
          Back to Settings
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="logo-google" size={48} color="#4285F4" />
            </View>

            <Title style={styles.title}>Google Calendar & Meet</Title>
            <Text style={styles.description}>
              Connect your Google Calendar to automatically schedule online meetings and generate Google Meet invite links for appointments.
            </Text>

            <Divider style={styles.divider} />

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <View style={[styles.badge, connected ? styles.connectedBadge : styles.disconnectedBadge]}>
                <Text style={[styles.badgeText, connected ? styles.connectedText : styles.disconnectedText]}>
                  {connected ? 'Connected' : 'Not Connected'}
                </Text>
              </View>
            </View>

            {connected ? (
              <Button
                mode="outlined"
                textColor="#EF4444"
                onPress={handleDisconnect}
                style={styles.disconnectBtn}
                contentStyle={styles.btnContent}
              >
                Disconnect Google Account
              </Button>
            ) : (
              <Button
                mode="contained"
                buttonColor="#4285F4"
                textColor="#FFF"
                onPress={handleConnect}
                loading={actionLoading}
                disabled={actionLoading}
                style={styles.connectBtn}
                contentStyle={styles.btnContent}
                icon="google"
              >
                Connect Google Account
              </Button>
            )}
          </Card.Content>
        </Card>

        <Card style={[styles.card, { marginTop: 16 }]}>
          <Card.Content>
            <Title style={styles.sectionTitle}>How it works</Title>
            <List.Item
              title="1. Link your account"
              description="Authorize CRMLite to access your Google Calendar."
              left={(props) => <List.Icon {...props} icon="link" color="#64748B" />}
            />
            <List.Item
              title="2. Book appointments"
              description="When booking a meeting, choose to generate a Google Meet link."
              left={(props) => <List.Icon {...props} icon="calendar-plus" color="#64748B" />}
            />
            <List.Item
              title="3. Auto-invite client"
              description="Your client will get a Calendar invite & email containing the Google Meet link."
              left={(props) => <List.Icon {...props} icon="mail" color="#64748B" />}
            />
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  backBtn: {
    alignSelf: 'flex-start',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 42,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: tokens.borderRadius.lg,
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '700',
    fontSize: 20,
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  divider: {
    width: '100%',
    marginVertical: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusLabel: {
    fontSize: 15,
    color: '#334155',
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectedBadge: {
    backgroundColor: '#DCFCE7',
  },
  disconnectedBadge: {
    backgroundColor: '#F1F5F9',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  connectedText: {
    color: '#15803D',
  },
  disconnectedText: {
    color: '#64748B',
  },
  connectBtn: {
    width: '90%',
    borderRadius: tokens.borderRadius.md,
  },
  disconnectBtn: {
    width: '90%',
    borderRadius: tokens.borderRadius.md,
    borderColor: '#EF4444',
  },
  btnContent: {
    paddingVertical: 6,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 8,
  },
});

export default GoogleIntegrationView;
