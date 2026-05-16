import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Keyboard } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { jobAPI } from '../../services/api';

type OTPVerificationRouteProp = RouteProp<{ OTPVerification: { jobId: string } }, 'OTPVerification'>;

const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 60;

export default function OTPVerificationScreen() {
  const route = useRoute<OTPVerificationRouteProp>();
  const navigation = useNavigation<any>();
  const { jobId } = route.params;

  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [timeLeft, setTimeLeft] = useState(RESEND_TIMEOUT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleOTPChange = (index: number, value: string) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(null);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((digit) => digit) && index === OTP_LENGTH - 1) {
      verifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOTP = async (otpCode: string) => {
    if (isLoading) return;
    setIsLoading(true);
    Keyboard.dismiss();

    try {
      await jobAPI.verifyOTP(jobId, otpCode);
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (err: any) {
      setError('Invalid OTP. Please try again.');
      setOtp(new Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0 || isResending) return;
    setIsResending(true);

    try {
      await jobAPI.getJob(jobId);
      setTimeLeft(RESEND_TIMEOUT);
      setError(null);
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit OTP provided by the site manager
        </Text>
      </View>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref!)}
            style={[styles.otpInput, error && styles.otpInputError]}
            value={digit}
            onChangeText={(value) => {
              if (/^\d*$/.test(value)) {
                handleOTPChange(index, value);
              }
            }}
            onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={1}
            editable={!isLoading}
            selectTextOnFocus
          />
        ))}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.timerContainer}>
        {timeLeft > 0 ? (
          <Text style={styles.timerText}>
            Resend OTP in {formatTime(timeLeft)}
          </Text>
        ) : (
          <TouchableOpacity onPress={handleResend} disabled={isResending}>
            <Text style={styles.resendText}>
              {isResending ? 'Sending...' : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={() => verifyOTP(otp.join(''))}
        disabled={isLoading || otp.some((d) => !d)}
      >
        <Text style={styles.submitButtonText}>
          {isLoading ? 'Verifying...' : 'Verify OTP'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.helpText}>
        For demo purposes, use any 6-digit OTP
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  otpInput: {
    width: 50,
    height: 60,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.text,
  },
  otpInputError: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.bodySmall.fontSize,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    height: 30,
  },
  timerText: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
  },
  resendText: {
    color: colors.secondary,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.surface,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  helpText: {
    color: colors.lightGray,
    fontSize: typography.caption.fontSize,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});