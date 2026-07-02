/**
 * ChatCRM Lite - Premium Mobile-First Login Screen
 * 
 * Design Principles:
 * - Mobile-first optimized layout
 * - Minimal whitespace, maximum usability
 * - Clear visual hierarchy
 * - Premium SaaS appearance (similar to Intercom, HubSpot, Linear, Slack)
 * - Smooth animations and transitions
 * - Accessible and responsive
 * 
 * Features:
 * - 2-step authentication (Email → OTP)
 * - Floating label inputs
 * - Loading and error states
 * - Dark mode support
 * - Smooth screen transitions
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Keyboard,
} from 'react-native';
import { TextInput, Text, useTheme } from 'react-native-paper';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useWebSocketStore } from '../store/useWebSocketStore';
import { spacing, borderRadius, shadows } from '../theme';
import { Mail, Lock, Loader } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type AuthStep = 'email' | 'otp';
type ErrorType = 'email_error' | 'otp_error' | 'network_error' | null;

interface AuthError {
  type: ErrorType;
  message: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LoginScreen() {
  const { setToken } = useAuthStore();
  const { connect } = useWebSocketStore();
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<AuthStep>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError>({ type: null, message: '' });

  // ===== FOCUS STATES =====
  const [emailFocused, setEmailFocused] = useState(false);
  const [otpFocused, setOtpFocused] = useState(false);

  // ===== ANIMATIONS =====
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Local form card transitions (avoids full page reload/refresh effect)
  const formFadeAnim = useRef(new Animated.Value(1)).current;
  const formSlideAnim = useRef(new Animated.Value(0)).current;

  // ===== EFFECTS =====
  useEffect(() => {
    triggerEntryAnimation();
  }, []);

  // ===== ANIMATIONS LOGIC =====
  const triggerEntryAnimation = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerStepTransition = (newStep: AuthStep) => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(formFadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(formSlideAnim, {
          toValue: -15,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setStep(newStep);
      formFadeAnim.setValue(0);
      formSlideAnim.setValue(15);

      Animated.parallel([
        Animated.timing(formSlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(formFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // ===== VALIDATION =====
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // ===== HANDLERS =====
  const handleSendOtp = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError({
        type: 'email_error',
        message: 'Please enter your email address',
      });
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError({
        type: 'email_error',
        message: 'Please enter a valid email address',
      });
      return;
    }

    setLoading(true);
    setError({ type: null, message: '' });

    try {
      await authApi.login(trimmedEmail);
      triggerStepTransition('otp');
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        'Failed to send verification code. Please try again.';
      setError({
        type: 'network_error',
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const trimmedOtp = otp.trim();

    if (!trimmedOtp) {
      setError({
        type: 'otp_error',
        message: 'Please enter your verification code',
      });
      return;
    }

    if (trimmedOtp.length !== 6) {
      setError({
        type: 'otp_error',
        message: 'Verification code must be 6 digits',
      });
      return;
    }

    setLoading(true);
    setError({ type: null, message: '' });

    try {
      const response = await authApi.verifyOtp(email, trimmedOtp);
      const { token, userId, tenantId, businessName, onboardingCompleted } =
        response.data;

      await setToken(
        token,
        userId,
        tenantId,
        email,
        businessName || 'My Business',
        onboardingCompleted
      );

      if (tenantId && token) {
        connect(token, tenantId);
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        'Invalid verification code. Please try again.';
      setError({
        type: 'otp_error',
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = () => {
    setOtp('');
    setError({ type: null, message: '' });
    triggerStepTransition('email');
  };

  // ===== RENDER =====
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {/* ===== HEADER ===== */}
          <HeaderSection step={step} theme={theme} />

          {/* ===== FORM CARD ===== */}
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline,
                ...shadows.lg,
              },
            ]}
          >
            {/* Error Banner */}
            {error.message && (
              <ErrorBanner message={error.message} theme={theme} />
            )}

            {/* Step Content */}
            <Animated.View
              style={{
                opacity: formFadeAnim,
                transform: [{ translateY: formSlideAnim }],
              }}
            >
              {step === 'email' ? (
                <EmailForm
                  email={email}
                  setEmail={setEmail}
                  emailFocused={emailFocused}
                  setEmailFocused={setEmailFocused}
                  loading={loading}
                  onSendOtp={handleSendOtp}
                  hasError={error.type === 'email_error'}
                  theme={theme}
                  navigation={navigation}
                />
              ) : (
                <OtpForm
                  email={email}
                  otp={otp}
                  setOtp={setOtp}
                  otpFocused={otpFocused}
                  setOtpFocused={setOtpFocused}
                  loading={loading}
                  onVerifyOtp={handleVerifyOtp}
                  onChangeEmail={handleChangeEmail}
                  hasError={error.type === 'otp_error'}
                  theme={theme}
                />
              )}
            </Animated.View>
          </View>

          {/* ===== FOOTER ===== */}
          <FooterSection theme={theme} />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// HEADER COMPONENT
// ============================================================================

interface HeaderSectionProps {
  step: AuthStep;
  theme: any;
}

function HeaderSection({ step, theme }: HeaderSectionProps) {
  return (
    <View style={styles.headerSection}>
      {/* Logo */}
      <View
        style={[
          styles.logoContainer,
          { backgroundColor: theme.colors.primaryContainer },
        ]}
      >
        <Text style={styles.logoEmoji}>💬</Text>
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: theme.colors.primary }]}>
        ChatCRM Lite
      </Text>

      {/* Subtitle */}
      <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        {step === 'email'
          ? 'Manage WhatsApp Leads & Customer Conversations'
          : 'We sent a code to your email'}
      </Text>
    </View>
  );
}

// ============================================================================
// ERROR BANNER COMPONENT
// ============================================================================

interface ErrorBannerProps {
  message: string;
  theme: any;
}

function ErrorBanner({ message, theme }: ErrorBannerProps) {
  return (
    <View style={[styles.errorBanner, { backgroundColor: '#FEE2E2' }]}>
      <Text style={[styles.errorBannerText, { color: '#DC2626' }]}>
        {message}
      </Text>
    </View>
  );
}

// ============================================================================
// EMAIL FORM COMPONENT
// ============================================================================

interface EmailFormProps {
  email: string;
  setEmail: (email: string) => void;
  emailFocused: boolean;
  setEmailFocused: (focused: boolean) => void;
  loading: boolean;
  onSendOtp: () => void;
  hasError: boolean;
  theme: any;
  navigation: any;
}

function EmailForm({
  email,
  setEmail,
  emailFocused,
  setEmailFocused,
  loading,
  onSendOtp,
  hasError,
  theme,
  navigation,
}: EmailFormProps) {
  return (
    <>
      {/* Email Input */}
      <View style={styles.inputWrapper}>
        <FloatingLabelInput
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
          isFocused={emailFocused}
          keyboardType="email-address"
          placeholder="you@company.com"
          icon="mail"
          hasError={hasError}
          theme={theme}
          onSubmitEditing={onSendOtp}
          returnKeyType="send"
        />
      </View>

      {/* Primary Button */}
      <PrimaryButton
        onPress={onSendOtp}
        label="Send OTP"
        loading={loading}
        disabled={loading || !email.trim()}
        theme={theme}
      />

      {/* Divider */}
      <Divider theme={theme} />

      {/* Secondary Button */}
      <SecondaryButton
        label="Continue with Google"
        theme={theme}
      />
    </>
  );
}

// ============================================================================
// OTP FORM COMPONENT
// ============================================================================

interface OtpFormProps {
  email: string;
  otp: string;
  setOtp: (otp: string) => void;
  otpFocused: boolean;
  setOtpFocused: (focused: boolean) => void;
  loading: boolean;
  onVerifyOtp: () => void;
  onChangeEmail: () => void;
  hasError: boolean;
  theme: any;
}

function OtpForm({
  email,
  otp,
  setOtp,
  otpFocused,
  setOtpFocused,
  loading,
  onVerifyOtp,
  onChangeEmail,
  hasError,
  theme,
}: OtpFormProps) {
  return (
    <>
      {/* Email Display */}
      <View
        style={[
          styles.emailDisplayBox,
          { backgroundColor: 'rgba(15, 118, 110, 0.08)' },
        ]}
      >
        <Text style={[styles.emailDisplayLabel, { color: theme.colors.onSurfaceVariant }]}>
          Verification code sent to
        </Text>
        <Text style={[styles.emailDisplayValue, { color: theme.colors.primary }]}>
          {email}
        </Text>
      </View>

      {/* OTP Input */}
      <View style={styles.inputWrapper}>
        <FloatingLabelInput
          label="6-Digit Code"
          value={otp}
          onChangeText={(text) => {
            const cleaned = text.replace(/[^0-9]/g, '');
            setOtp(cleaned.slice(0, 6));
          }}
          onFocus={() => setOtpFocused(true)}
          onBlur={() => setOtpFocused(false)}
          isFocused={otpFocused}
          keyboardType="number-pad"
          placeholder="000000"
          icon="lock"
          hasError={hasError}
          theme={theme}
          maxLength={6}
          onSubmitEditing={onVerifyOtp}
          returnKeyType="done"
        />
      </View>

      {/* Verify Button */}
      <PrimaryButton
        onPress={onVerifyOtp}
        label="Verify & Login"
        loading={loading}
        disabled={loading || otp.length !== 6}
        theme={theme}
      />

      {/* Change Email Link */}
      <TouchableOpacity
        onPress={onChangeEmail}
        disabled={loading}
        style={styles.changeEmailButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={[styles.changeEmailButtonText, { color: theme.colors.primary }]}>
          ← Use Different Email
        </Text>
      </TouchableOpacity>
    </>
  );
}

// ============================================================================
// FLOATING LABEL INPUT COMPONENT
// ============================================================================

interface FloatingLabelInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  isFocused: boolean;
  keyboardType?: 'email-address' | 'number-pad' | 'default';
  placeholder: string;
  icon: 'mail' | 'lock';
  hasError: boolean;
  theme: any;
  maxLength?: number;
  onSubmitEditing?: () => void;
  returnKeyType?: 'next' | 'go' | 'done' | 'send';
}

function FloatingLabelInput({
  label,
  value,
  onChangeText,
  onFocus,
  onBlur,
  isFocused,
  keyboardType = 'default',
  placeholder,
  icon,
  hasError,
  theme,
  maxLength,
  onSubmitEditing,
  returnKeyType,
}: FloatingLabelInputProps) {
  const hasValue = value.length > 0;

  const borderColor = hasError
    ? theme.colors.error
    : isFocused
      ? theme.colors.primary
      : theme.colors.outline;

  const backgroundColor = isFocused
    ? 'rgba(15, 118, 110, 0.04)'
    : 'transparent';

  return (
    <View>
      <View
        style={[
          styles.inputContainer,
          {
            borderColor,
            backgroundColor,
          },
        ]}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          {icon === 'mail' ? (
            <Mail
              size={20}
              color={isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant}
              strokeWidth={1.5}
            />
          ) : (
            <Lock
              size={20}
              color={isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant}
              strokeWidth={1.5}
            />
          )}
        </View>

        {/* Text Input Wrapper */}
        <View style={styles.inputTextWrapper}>
          {/* Floating Label */}
          <Animated.Text
            style={[
              styles.floatingLabel,
              {
                top: hasValue || isFocused ? -10 : 0,
                fontSize: hasValue || isFocused ? 11 : 14,
                color: hasError
                  ? theme.colors.error
                  : isFocused
                    ? theme.colors.primary
                    : theme.colors.onSurfaceVariant,
                opacity: hasValue || isFocused ? 1 : 0.7,
              },
            ]}
          >
            {label}
          </Animated.Text>

          {/* Text Input */}
          <TextInput
            value={value}
            onChangeText={onChangeText}
            onFocus={onFocus}
            onBlur={onBlur}
            keyboardType={keyboardType}
            placeholder={isFocused ? placeholder : ''}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            style={[
              styles.input,
              {
                color: theme.colors.onSurface,
              },
            ]}
            mode="flat"
            maxLength={maxLength}
            autoCapitalize="none"
            onSubmitEditing={onSubmitEditing}
            returnKeyType={returnKeyType}
          />
        </View>
      </View>

      {/* Error Message */}
      {hasError && (
        <Text style={[styles.inputErrorText, { color: theme.colors.error }]}>
          Please check your input
        </Text>
      )}
    </View>
  );
}

// ============================================================================
// BUTTON COMPONENTS
// ============================================================================

interface ButtonProps {
  onPress: () => void;
  label: string;
  loading?: boolean;
  disabled?: boolean;
  theme: any;
}

function PrimaryButton({
  onPress,
  label,
  loading = false,
  disabled = false,
  theme,
}: ButtonProps) {
  const backgroundColor = disabled
    ? theme.colors.onSurfaceVariant
    : theme.colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={[
        styles.primaryButton,
        {
          backgroundColor,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.surface} size={22} />
      ) : (
        <Text style={[styles.primaryButtonText, { color: theme.colors.surface }]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function SecondaryButton({ label, theme }: Omit<ButtonProps, 'onPress' | 'loading'>) {
  return (
    <TouchableOpacity
      style={[
        styles.secondaryButton,
        {
          borderColor: theme.colors.outline,
        },
      ]}
      activeOpacity={0.7}
    >
      <Text style={[styles.secondaryButtonText, { color: theme.colors.onSurface }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ============================================================================
// DIVIDER COMPONENT
// ============================================================================

interface DividerProps {
  theme: any;
}

function Divider({ theme }: DividerProps) {
  return (
    <View style={styles.dividerContainer}>
      <View
        style={[
          styles.dividerLine,
          { backgroundColor: theme.colors.outline },
        ]}
      />
      <Text style={[styles.dividerText, { color: theme.colors.onSurfaceVariant }]}>
        OR
      </Text>
      <View
        style={[
          styles.dividerLine,
          { backgroundColor: theme.colors.outline },
        ]}
      />
    </View>
  );
}

// ============================================================================
// FOOTER COMPONENT
// ============================================================================

interface FooterSectionProps {
  theme: any;
}

function FooterSection({ theme }: FooterSectionProps) {
  return (
    <View style={styles.footerSection}>
      <Text
        style={[
          styles.footerText,
          { color: theme.colors.onSurfaceVariant },
        ]}
      >
        By continuing, you agree to our{'\n'}
        <Text style={{ fontWeight: '600', color: theme.colors.primary }}>
          Terms of Service
        </Text>
        {' '}and{' '}
        <Text style={{ fontWeight: '600', color: theme.colors.primary }}>
          Privacy Policy
        </Text>
      </Text>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // ===== LAYOUT =====
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },

  // ===== HEADER =====
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },

  // ===== FORM CARD =====
  formCard: {
    maxWidth: 400,
    width: '100%',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // ===== ERROR BANNER =====
  errorBanner: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },

  // ===== INPUT =====
  inputWrapper: {
    marginBottom: spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 52,
    gap: spacing.md,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputTextWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    paddingHorizontal: 0,
    paddingVertical: 8,
    height: 'auto',
    backgroundColor: 'transparent',
  },
  floatingLabel: {
    position: 'absolute',
    fontWeight: '600',
    backgroundColor: 'transparent',
  },
  inputErrorText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    marginLeft: 4,
  },

  // ===== EMAIL DISPLAY =====
  emailDisplayBox: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: '#0F766E',
  },
  emailDisplayLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  emailDisplayValue: {
    fontSize: 15,
    fontWeight: '600',
  },

  // ===== BUTTONS =====
  primaryButton: {
    width: '100%',
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    width: '100%',
    height: 52,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  changeEmailButton: {
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  changeEmailButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ===== DIVIDER =====
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ===== FOOTER =====
  footerSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
  },
});
