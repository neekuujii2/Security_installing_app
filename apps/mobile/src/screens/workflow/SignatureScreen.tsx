import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import SignatureScreen from 'react-native-signature-canvas';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { jobAPI } from '../../services/api';

type SignatureRouteProp = RouteProp<{ Signature: { jobId: string } }, 'Signature'>;

export default function SignatureCaptureScreen() {
  const route = useRoute<SignatureRouteProp>();
  const navigation = useNavigation<any>();
  const { jobId } = route.params;

  const signatureRef = useRef<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClear = () => {
    signatureRef.current?.clearSignature();
  };

  const handleSignature = (signature: string) => {
    if (!signature) {
      Alert.alert('Error', 'Please provide a signature');
      return;
    }
    completeJob(signature);
  };

  const completeJob = async (signature: string) => {
    setIsSubmitting(true);
    try {
      await jobAPI.completeJob(jobId, signature);
      Alert.alert('Success', 'Job completed successfully!', [
        { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] }) },
      ]);
    } catch (error) {
      console.error('Failed to complete job:', error);
      Alert.alert('Error', 'Failed to submit. Will sync when online.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnd = () => {
    signatureRef.current?.readSignature();
  };

  const webStyle = `.m-signature-pad {
    box-shadow: none;
    border: none;
    margin: 0;
  }
  .m-signature-pad--body {
    border: none;
  }
  .m-signature-pad--footer {
    display: none;
  }
  body,html {
    background-color: #FFFFFF;
  }`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Client Signature</Text>
        <Text style={styles.subtitle}>
          Please sign below to confirm job completion
        </Text>
      </View>

      <View style={styles.signatureContainer}>
        <SignatureScreen
          ref={signatureRef}
          onOK={handleSignature}
          onEnd={handleEnd}
          webStyle={webStyle}
          backgroundColor={colors.surface}
          penColor={colors.text}
        />
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmButton, isSubmitting && styles.confirmButtonDisabled]}
          onPress={handleEnd}
          disabled={isSubmitting}
        >
          <Text style={styles.confirmButtonText}>
            {isSubmitting ? 'Submitting...' : 'Confirm & Complete'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          By signing, you confirm that the work has been completed as per the survey specifications.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  signatureContainer: {
    flex: 1,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  clearButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  clearButtonText: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: colors.surface,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  infoContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  infoText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});