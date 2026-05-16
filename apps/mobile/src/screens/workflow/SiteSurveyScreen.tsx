import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { jobAPI } from '../../services/api';
import { database } from '../../database';

type SiteSurveyRouteProp = RouteProp<{ SiteSurvey: { jobId: string } }, 'SiteSurvey'>;

interface CameraModel {
  model: string;
  quantity: number;
}

interface SurveyFormValues {
  cameraCount: number;
  cameraModels: CameraModel[];
  dvrModel: string;
  cableLength: number;
  powerPoints: number;
  notes: string;
}

const validationSchema = Yup.object().shape({
  cameraCount: Yup.number().min(1, 'At least 1 camera required').required('Required'),
  cameraModels: Yup.array().of(
    Yup.object().shape({
      model: Yup.string().required('Model required'),
      quantity: Yup.number().min(1, 'Quantity must be at least 1'),
    })
  ),
  dvrModel: Yup.string().required('DVR model required'),
  cableLength: Yup.number().min(0, 'Invalid length').required('Required'),
  powerPoints: Yup.number().min(0, 'Invalid count').required('Required'),
});

export default function SiteSurveyScreen() {
  const route = useRoute<SiteSurveyRouteProp>();
  const navigation = useNavigation<any>();
  const { jobId } = route.params;

  const [submitting, setSubmitting] = useState(false);

  const initialValues: SurveyFormValues = {
    cameraCount: 1,
    cameraModels: [{ model: '', quantity: 1 }],
    dvrModel: '',
    cableLength: 0,
    powerPoints: 0,
    notes: '',
  };

  const handleSubmit = async (values: SurveyFormValues) => {
    setSubmitting(true);

    try {
      await jobAPI.submitSurvey(jobId, values);
      await database.write(async () => {
        await database.get('surveys').create((survey: any) => {
          survey.jobId = jobId;
          survey.cameraCount = values.cameraCount;
          survey.cameraModels = JSON.stringify(values.cameraModels);
          survey.dvrModel = values.dvrModel;
          survey.cableLength = values.cableLength;
          survey.powerPoints = values.powerPoints;
          survey.notes = values.notes;
          survey.synced = false;
        });
      });
      
      Alert.alert('Success', 'Survey submitted successfully', [
        { text: 'OK', onPress: () => navigation.navigate('PhotoCapture', { jobId, type: 'before' }) },
      ]);
    } catch (error) {
      console.error('Survey submission failed:', error);
      Alert.alert('Error', 'Failed to submit survey. Will sync when online.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Site Survey</Text>
      <Text style={styles.subtitle}>Fill in the installation details</Text>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Total Camera Count *</Text>
              <TextInput
                style={[styles.input, touched.cameraCount && errors.cameraCount && styles.inputError]}
                value={values.cameraCount.toString()}
                onChangeText={(text) => setFieldValue('cameraCount', parseInt(text) || 0)}
                onBlur={handleBlur('cameraCount')}
                keyboardType="number-pad"
                placeholder="Number of cameras"
              />
              {touched.cameraCount && errors.cameraCount && (
                <Text style={styles.errorText}>{errors.cameraCount}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Camera Models</Text>
              <FieldArray name="cameraModels">
                {({ push, remove }) => (
                  <>
                    {values.cameraModels.map((camera, index) => (
                      <View key={index} style={styles.cameraRow}>
                        <TextInput
                          style={[styles.input, styles.cameraInput]}
                          value={camera.model}
                          onChangeText={handleChange(`cameraModels.${index}.model`)}
                          placeholder="Model name"
                        />
                        <TextInput
                          style={[styles.input, styles.quantityInput]}
                          value={camera.quantity.toString()}
                          onChangeText={(text) => 
                            setFieldValue(`cameraModels.${index}.quantity`, parseInt(text) || 0)
                          }
                          keyboardType="number-pad"
                          placeholder="Qty"
                        />
                        {values.cameraModels.length > 1 && (
                          <TouchableOpacity 
                            style={styles.removeButton}
                            onPress={() => remove(index)}
                          >
                            <Text style={styles.removeButtonText}>✕</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => push({ model: '', quantity: 1 })}
                    >
                      <Text style={styles.addButtonText}>+ Add Camera Model</Text>
                    </TouchableOpacity>
                  </>
                )}
              </FieldArray>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>DVR/NVR Model *</Text>
              <TextInput
                style={[styles.input, touched.dvrModel && errors.dvrModel && styles.inputError]}
                value={values.dvrModel}
                onChangeText={handleChange('dvrModel')}
                onBlur={handleBlur('dvrModel')}
                placeholder="e.g., Hikvision DS-7608NI"
              />
              {touched.dvrModel && errors.dvrModel && (
                <Text style={styles.errorText}>{errors.dvrModel}</Text>
              )}
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Cable Length (meters) *</Text>
                <TextInput
                  style={[styles.input, touched.cableLength && errors.cableLength && styles.inputError]}
                  value={values.cableLength.toString()}
                  onChangeText={(text) => setFieldValue('cableLength', parseFloat(text) || 0)}
                  onBlur={handleBlur('cableLength')}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Power Points *</Text>
                <TextInput
                  style={[styles.input, touched.powerPoints && errors.powerPoints && styles.inputError]}
                  value={values.powerPoints.toString()}
                  onChangeText={(text) => setFieldValue('powerPoints', parseInt(text) || 0)}
                  onBlur={handleBlur('powerPoints')}
                  keyboardType="number-pad"
                  placeholder="0"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Additional Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={values.notes}
                onChangeText={handleChange('notes')}
                placeholder="Any special instructions or observations..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={() => handleSubmit(values)}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Submitting...' : 'Submit Survey'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
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
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.danger,
  },
  textArea: {
    minHeight: 100,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.caption.fontSize,
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  cameraRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  cameraInput: {
    flex: 2,
  },
  quantityInput: {
    flex: 1,
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.danger + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: colors.danger,
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    padding: spacing.sm,
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.secondary,
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.surface,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
});