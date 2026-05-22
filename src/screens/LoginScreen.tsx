import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme } from 'react-native-paper';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useWebSocketStore } from '../store/useWebSocketStore';

export default function LoginScreen() {
  const { setToken } = useAuthStore();
  const { connect } = useWebSocketStore();
  const theme = useTheme();
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!email) return Alert.alert('Error', 'Please enter your email address');
    
    setLoading(true);
    setErrorMsg(null);
    console.log('Attempting to send OTP to:', email);
    try {
      const response = await authApi.login(email);
      console.log('Login request successful:', response.data);
      setStep(2);
    } catch (error: any) {
      console.error('Login request failed:', error);
      const message = error.response?.data || error.message || 'Failed to send OTP';
      setErrorMsg(message);
      Alert.alert('Error', 'Failed to send OTP. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return Alert.alert('Error', 'Please enter OTP');

    setLoading(true);
    setErrorMsg(null);
    console.log('Attempting to verify OTP for:', email);
    try {
      const response = await authApi.verifyOtp(email, otp);
      console.log('Verification successful:', response.data);
      const { token, userId, tenantId, businessName, onboardingCompleted } = response.data;
      await setToken(token, userId, tenantId, email, businessName || 'My Business', onboardingCompleted);
      // Connect WebSocket immediately after login using the correct tenantId topic prefix
      if (tenantId && token) connect(token, tenantId);
    } catch (error: any) {
      console.error('Verification failed:', error);
      const message = error.response?.data || error.message || 'Invalid OTP';
      setErrorMsg(message);
      Alert.alert('Error', 'Invalid OTP or verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Surface style={styles.surface} elevation={1}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
          <Text style={{ fontSize: 40 }}>💬</Text>
        </View>
        
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
          ChatCRM Lite
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          {step === 1 ? 'WhatsApp-first CRM for your business' : 'Verify your email'}
        </Text>

        {errorMsg && (
          <Text style={{ color: theme.colors.error, marginBottom: 16, textAlign: 'center' }}>
            {errorMsg}
          </Text>
        )}

        <View style={styles.inputSection}>
          {step === 1 ? (
            <TextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              style={styles.input}
              placeholder="example@business.com"
              autoCapitalize="none"
              left={<TextInput.Icon icon="email" />}
            />
          ) : (
            <TextInput
              label="6-Digit OTP"
              value={otp}
              onChangeText={setOtp}
              mode="outlined"
              keyboardType="number-pad"
              style={styles.input}
              placeholder="123456"
              left={<TextInput.Icon icon="lock" />}
            />
          )}

          <Button 
            mode="contained" 
            onPress={step === 1 ? handleSendOtp : handleVerifyOtp}
            style={styles.button}
            contentStyle={styles.buttonContent}
            loading={loading}
            disabled={loading}
          >
            {step === 1 ? 'Send OTP' : 'Login'}
          </Button>

          {step === 2 && (
            <Button 
              mode="text" 
              onPress={() => setStep(1)} 
              disabled={loading}
              textColor={theme.colors.secondary}
            >
              Change Email Address
            </Button>
          )}
        </View>
      </Surface>
      
      <Text style={styles.footerText}>
        By continuing, you agree to our Terms of Service
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  surface: {
    padding: 32,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
  },
  inputSection: {
    width: '100%',
  },
  input: {
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  button: {
    borderRadius: 12,
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  footerText: {
    textAlign: 'center',
    marginTop: 24,
    color: '#999',
    fontSize: 12,
  },
});
