import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { spacing, borderRadius, shadows } from '../theme';

const { width } = Dimensions.get('window');

interface OtpVerificationScreenProps {
  email: string;
  onVerify: (otp: string) => Promise<void>;
  onChangeEmail: () => void;
  loading: boolean;
}

export default function OtpVerificationScreen({
  email,
  onVerify,
  onChangeEmail,
  loading,
}: OtpVerificationScreenProps) {
  const theme = useTheme();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<any[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Timer for resend functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Initial animation
  useEffect(() => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-focus first input
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    const numValue = value.replace(/[^0-9]/g, '');
    
    if (numValue.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = numValue;
      setOtp(newOtp);
      setError('');

      // Auto-focus next input
      if (numValue && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-verify if all digits entered
      if (newOtp.every((digit) => digit !== '')) {
        handleVerify(newOtp.join(''));
      }
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpValue?: string) => {
    const fullOtp = otpValue || otp.join('');

    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    try {
      await onVerify(fullOtp);
    } catch (err) {
      setError('Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setResendTimer(60);
    setError('');
    // Call API to resend OTP
    // await resendOtp(email);
  };

  const otpCode = otp.join('');

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
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
        <View style={styles.header}>
          <View
            style={[
              styles.statusIcon,
              { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
            ]}
          >
            <Text style={styles.statusEmoji}>✉️</Text>
          </View>

          <Text style={[styles.title, { color: theme.colors.primary }]}>
            Verify Your Email
          </Text>

          <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
            We've sent a 6-digit code to{' '}
            <Text style={{ fontWeight: '700', color: theme.colors.primary }}>
              {email}
            </Text>
          </Text>
        </View>

        {/* ===== OTP INPUT CARD ===== */}
        <View
          style={[
            styles.otpCard,
            {
              backgroundColor: theme.colors.surface,
              ...shadows.md,
              borderColor: theme.colors.outline,
            },
          ]}
        >
          {/* OTP Digit Inputs */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <OtpInput
                key={index}
                value={digit}
                onChangeText={(value) => handleOtpChange(index, value)}
                onKeyPress={(key) => handleKeyPress(index, key)}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                isFocused={false}
                theme={theme}
                index={index}
              />
            ))}
          </View>

          {/* Error Message */}
          {error && (
            <Text
              style={[
                styles.errorMessage,
                { color: theme.colors.error },
              ]}
            >
              {error}
            </Text>
          )}

          {/* Verify Button */}
          <TouchableOpacity
            onPress={() => handleVerify()}
            disabled={loading || otpCode.length !== 6}
            style={[
              styles.verifyButton,
              {
                backgroundColor:
                  loading || otpCode.length !== 6
                    ? theme.colors.onSurfaceVariant
                    : theme.colors.primary,
                opacity: loading || otpCode.length !== 6 ? 0.5 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.surface} size="small" />
            ) : (
              <Text style={[styles.verifyButtonText, { color: theme.colors.surface }]}>
                Verify Code
              </Text>
            )}
          </TouchableOpacity>

          {/* Resend OTP */}
          <View style={styles.resendSection}>
            <Text style={[styles.resendLabel, { color: theme.colors.onSurfaceVariant }]}>
              Didn't receive the code?
            </Text>

            <TouchableOpacity
              onPress={handleResend}
              disabled={resendTimer > 0 || loading}
              style={styles.resendButton}
            >
              <Text
                style={[
                  styles.resendButtonText,
                  {
                    color:
                      resendTimer > 0
                        ? theme.colors.onSurfaceVariant
                        : theme.colors.primary,
                    fontWeight: '600',
                  },
                ]}
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Change Email */}
          <TouchableOpacity
            onPress={onChangeEmail}
            disabled={loading}
            style={styles.changeEmailButton}
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
        </View>

        {/* ===== FOOTER ===== */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
            This code will expire in 10 minutes
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

// ============================================================================
// OTP INPUT COMPONENT
// ============================================================================
interface OtpInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onKeyPress: (key: string) => void;
  isFocused: boolean;
  theme: any;
  index: number;
}

const OtpInput = React.forwardRef<any, OtpInputProps>(
  ({ value, onChangeText, onKeyPress, isFocused, theme, index }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <View
        style={[
          styles.otpInputBox,
          {
            borderColor: focused
              ? theme.colors.primary
              : value
                ? theme.colors.primary
                : theme.colors.outline,
            borderWidth: focused || value ? 2 : 1.5,
            backgroundColor: focused ? 'rgba(15, 118, 110, 0.05)' : 'transparent',
          },
        ]}
      >
        <Text
          style={[
            styles.otpInputText,
            { color: theme.colors.onSurface, fontSize: 20 },
          ]}
        >
          {value}
        </Text>
      </View>
    );
  }
);

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  content: {
    width: '100%',
  },

  // ===== HEADER =====
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statusEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ===== OTP CARD =====
  otpCard: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
  },

  // ===== OTP CONTAINER =====
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  otpInputBox: {
    width: '13%',
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  otpInputText: {
    fontWeight: '700',
    textAlign: 'center',
  },

  // ===== ERROR MESSAGE =====
  errorMessage: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: spacing.md,
    textAlign: 'center',
  },

  // ===== VERIFY BUTTON =====
  verifyButton: {
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: 'rgba(15, 118, 110, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // ===== RESEND SECTION =====
  resendSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  resendLabel: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: spacing.sm,
  },
  resendButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  resendButtonText: {
    fontSize: 14,
  },

  // ===== CHANGE EMAIL =====
  changeEmailButton: {
    paddingVertical: spacing.md,
  },
  changeEmailText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ===== FOOTER =====
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
  },
});
