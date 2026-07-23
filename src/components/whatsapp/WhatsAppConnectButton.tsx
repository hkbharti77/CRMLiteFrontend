import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Facebook } from 'lucide-react-native';
import { initFacebookSdk } from '../../utils/facebookSdk';
import { integrationsApi } from '../../services/api';

interface WhatsAppConnectButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  hasExistingConfig?: boolean;
}

export const WhatsAppConnectButton: React.FC<WhatsAppConnectButtonProps> = ({ onSuccess, onError, hasExistingConfig }) => {
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const appId = process.env.EXPO_PUBLIC_META_APP_ID || '';
  const configId = process.env.EXPO_PUBLIC_META_CONFIG_ID || '';

  useEffect(() => {
    if (!appId) {
      console.warn('Facebook App ID is missing from environment variables');
      return;
    }
    initFacebookSdk(appId).then(() => {
      setIsSdkLoaded(true);
    });
  }, [appId]);

  const handleConnect = () => {
    if (!isSdkLoaded || !window.FB) {
      Alert.alert('Error', 'Facebook SDK is not loaded yet.');
      return;
    }

    if (!configId) {
      Alert.alert('Configuration Error', 'Meta Config ID is missing from environment variables.');
      return;
    }

    if (hasExistingConfig) {
      Alert.alert(
        'Overwrite Warning',
        'You already have an existing WhatsApp configuration. Connecting via Tech Provider will overwrite your current settings. Do you want to proceed?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Proceed', style: 'destructive', onPress: launchFbLogin },
        ]
      );
    } else {
      launchFbLogin();
    }
  };

  const launchFbLogin = () => {
    // Launch Meta Embedded Signup Popup
    window.FB.login(
      (response: any) => {
        if (response.authResponse && response.authResponse.code) {
          const code = response.authResponse.code;
          exchangeToken(code);
        } else {
          setIsConnecting(false);
          const errorMsg = 'User cancelled login or did not fully authorize.';
          if (onError) onError(errorMsg);
          else Alert.alert('Connection Cancelled', errorMsg);
        }
      },
      {
        config_id: configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: '',
          sessionInfoVersion: '3',
        },
      }
    );
  };

  const exchangeToken = async (code: string) => {
    setIsConnecting(true);
    try {
      const res = await integrationsApi.connectEmbeddedWhatsApp(code);
      if (res.data) {
        Alert.alert('Success', 'WhatsApp account successfully connected!');
        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data || 'Failed to exchange token with server.';
      if (onError) onError(errorMsg);
      else Alert.alert('Connection Failed', errorMsg);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, (!isSdkLoaded || isConnecting) && styles.buttonDisabled]}
        onPress={handleConnect}
        disabled={!isSdkLoaded || isConnecting}
      >
        {isConnecting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Facebook color="#fff" size={20} style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Connect with Meta WhatsApp</Text>
          </>
        )}
      </TouchableOpacity>
      {!appId || !configId ? (
        <Text style={styles.errorText}>
          Missing App ID or Config ID in environment variables.
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#1877F2', // Facebook Blue
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 250,
  },
  buttonDisabled: {
    backgroundColor: '#9CB4D8',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginTop: 8,
    fontSize: 12,
  },
});
