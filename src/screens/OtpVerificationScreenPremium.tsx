/**
 * ChatCRM Lite - Premium OTP Verification Screen
 * 
 * Alternative standalone OTP verification screen with premium design
 * Can be used as a separate screen or integrated into LoginScreen
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Lock, RotateCw } from 'lucide-react-native';
import { spacing, borderRadius, shadows } from '../theme';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useWebSocketStore } from '../store/useWebSocketStore';

const { width, height } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

interface OtpVerificationScreenProps {
  email: string;
  onSuccess?: () => void;
  onChangeEmail?: () => void;
}

interface OtpState {
  digits: string[];
  loading: boolean;
  error: string;
  resendTimer: number;
  verified: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function OtpVerificationScreen({
  email,
  onSuccess,
  onChangeEmail,
}: OtpVerificationScreenProps) {
  const theme = useTheme();
  const { setToken } = useAuthStore();
  const { connect } = useWebSocketStore();

  // ===== STATE =====
  const [state, setState] = useState<OtpState>({
    digits: ['', '', '', '', '', ''],
    loading: false,
    error: '',
    resendTimer: 0,
    verified: false,
  });

  // ===== ANIMATIONS =====
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const inputRefs = useRef<any[]>([]);

  // ===== EFFECTS =====
  useEffect(() => {
    triggerEntryAnimation();
    focusFirstInput();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state.resendTimer > 0) {
      interval = setInterval(() => {
        setState((prev) => ({
          ...prev,
          resendTimer: prev.resendTimer - 1,
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state.resendTimer]);

  // ===== ANIMATION FUNCTIONS =====
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
    ]).start();
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  // ===== INPUT HANDLING =====
  const focusFirstInput = () => {
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);
  };

  const handleDigitChange = (index: number, value: string) => {
    // Only allow numbers
    const digit = value.replace(/[^0-9]/g, '');

    if (digit.length <= 1) {
      const newDigits = [...state.digits];
      newDigits[index] = digit;
      setState((prev) => ({
        ...prev,
        digits: newDigits,
        error: '',
      }));

      // Auto-focus next field
      if (digit && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-verify when all digits filled
      if (newDigits.every((d) => d !== '')) {
        handleVerifyOtp(newDigits.join(''));
      }
    }
  };

  const handleBackspace = (index: number) => {
    if (!state.digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ===== OTP VERIFICATION =====
  const handleVerifyOtp = async (otpValue?: string) => {
    const otp = otpValue || state.digits.join('');

    if (otp.length !== 6) {
      setState((prev) => ({
        ...prev,
        error: 'Please enter all 6 digits',
      }));
      triggerShake();
      return;
    }

    setState((prev) => ({
      ...prev,
      loading: true,
      error: '',
    }));

    try {
      const response = await authApi.verifyOtp(email, otp);
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

      setState((prev) => ({
        ...prev,
        verified: true,
        loading: false,
      }));

      if (onSuccess) {
        setTimeout(onSuccess, 500);
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        'Invalid code. Please try again.';

      setState((prev) => ({
        ...prev,
        error: message,
        loading: false,
        digits: ['', '', '', '', '', ''],
      }));

      triggerShake();
      focusFirstInput();
    }
  };

  // ===== RESEND OTP =====
  const handleResendOtp = async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: '',
      digits: ['', '', '', '', '', ''],
    }));

    try {
      await authApi.login(email);
      setState((prev) => ({
        ...prev,
        loading: false,
        resendTimer: 60,
      }));
      focusFirstInput();
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        'Failed to resend code. Please try again.';

      setState((prev) => ({
        ...prev,
        error: message,
        loading: false,
      }));
    }
  };

  const otpCode = state.digits.join('');

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
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* ===== HEADER ===== */}
          <View style={styles.headerSection}>
            <View
              style={[
                styles.statusIcon,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <Text style={styles.statusEmoji}>✉️</Text>
            </View>

            <Text style={[styles.title, { color: theme.colors.primary }]}>
              Verify Your Email
            </Text>

            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              We've sent a 6-digit code to
            </Text>
            <Text style={[styles.emailValue, { color: theme.colors.primary }]}>
              {email}
            </Text>
          </View>

          {/* ===== CARD ===== */}
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
            {/* Error Message */}
            {state.error && (
              <View
                style={[
                  styles.errorBanner,
                  { backgroundColor: '#FEE2E2' },
                ]}
              >
                <Text style={[styles.errorText, { color: '#DC2626' }]}>
                  {state.error}
                </Text>
              </View>
            )}

            {/* OTP Input Grid */}
            <View style={styles.otpContainer}>
              {state.digits.map((digit, index) => (
                <OtpInput
                  key={index}
                  digit={digit}
                  index={index}
                  onChangeText={(value) => handleDigitChange(index, value)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace') {
                      handleBackspace(index);
                    }
                  }}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  isFocused={false}
                  theme={theme}
                  shakeAnim={shakeAnim}
                />
              ))}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              onPress={() => handleVerifyOtp()}
              disabled={state.loading || otpCode.length !== 6}
              style={[
                styles.primaryButton,
                {
                  backgroundColor:
                    state.loading || otpCode.length !== 6
                      ? theme.colors.onSurfaceVariant
                      : theme.colors.primary,
                  opacity: state.loading || otpCode.length !== 6 ? 0.6 : 1,
                },
              ]}
            >
              {state.loading ? (
                <ActivityIndicator color={theme.colors.surface} size={22} />
              ) : (
                <Text style={[styles.buttonText, { color: theme.colors.surface }]}>
                  Verify Code
                </Text>
              )}
            </TouchableOpacity>

            {/* Resend Section */}
            <View style={styles.resendSection}>
              <Text
                style={[
                  styles.resendLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Didn't receive the code?
              </Text>

              <TouchableOpacity
                onPress={handleResendOtp}
                disabled={state.resendTimer > 0 || state.loading}
                style={styles.resendButton}
              >
                <Text
                  style={[
                    styles.resendButtonText,
                    {
                      color:
                        state.resendTimer > 0
                          ? theme.colors.onSurfaceVariant
                          : theme.colors.primary,
                    },
                  ]}
                >
                  {state.resendTimer > 0
                    ? `Resend in ${state.resendTimer}s`
                    : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Change Email Link */}
            {onChangeEmail && (
              <TouchableOpacity
                onPress={onChangeEmail}
                disabled={state.loading}
                style={styles.changeEmailLink}
              >
                <Text
                  style={[
                    styles.changeEmailText,
                    { color: theme.colors.primary },
                  ]}
                >
                  ← Use Different Email
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ===== FOOTER ===== */}
          <View style={styles.footerSection}>
            <Text style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
              This code will expire in 10 minutes
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// OTP INPUT COMPONENT
// ============================================================================

interface OtpInputProps {
  digit: string;
  index: number;
  onChangeText: (value: string) => void;
  onKeyPress: (event: any) => void;
  isFocused: boolean;
  theme: any;
  shakeAnim: Animated.Value;
}

const OtpInput = React.forwardRef<any, OtpInputProps>(
  (
    {
      digit,
      index,
      onChangeText,
      onKeyPress,
      isFocused,
      theme,
      shakeAnim,
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const borderColor = focused
      ? theme.colors.primary
      : digit
        ? theme.colors.primary
        : theme.colors.outline;

    return (
      <Animated.View
        style={[
          styles.otpInputWrapper,
          {
            transform: [
              {
                translateX: Animated.divide(shakeAnim, index + 1),
              },
            ],
          },
        ]}
      >
        <View
          style={[
            styles.otpInput,
            {
              borderColor,
              borderWidth: focused || digit ? 2 : 1.5,
              backgroundColor: focused
                ? 'rgba(15, 118, 110, 0.04)'
                : 'transparent',
            },
          ]}
        >
          <Text style={[styles.otpDigit, { color: theme.colors.onSurface }]}>
            {digit}
          </Text>
        </View>
      </Animated.View>
    );
  }
);

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
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
  statusIcon: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statusEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emailValue: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },

  // ===== CARD =====
  formCard: {
    maxWidth: 400,
    width: '100%',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
  },

  // ===== ERROR =====
  errorBanner: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // ===== OTP INPUT GRID =====
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  otpInputWrapper: {
    flex: 1,
  },
  otpInput: {
    aspectRatio: 1,
    minHeight: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpDigit: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },

  // ===== BUTTON =====
  primaryButton: {
    width: '100%',
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // ===== RESEND =====
  resendSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: spacing.lg,
  },
  resendLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  resendButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // ===== CHANGE EMAIL =====
  changeEmailLink: {
    paddingVertical: spacing.md,
  },
  changeEmailText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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
  },
});

