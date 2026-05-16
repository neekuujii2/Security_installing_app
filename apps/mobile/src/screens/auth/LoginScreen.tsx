import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, borderRadius, typography } from '../../theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      await login(phone, 'demo');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Smart Security</Text>
        <Text style={styles.subtitle}>Technician Login</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          placeholderTextColor={colors.lightGray}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Continue'}</Text>
        </TouchableOpacity>

        <Text style={styles.helpText}>Demo: use any phone number</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  title: { fontSize: typography.h1.fontSize, fontWeight: '700', color: colors.primary },
  subtitle: { fontSize: typography.body.fontSize, color: colors.textSecondary, marginTop: spacing.xs },
  form: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg },
  label: { fontSize: typography.bodySmall.fontSize, fontWeight: '500', color: colors.text, marginBottom: spacing.sm },
  input: { backgroundColor: colors.background, borderRadius: borderRadius.md, padding: spacing.md, fontSize: typography.body.fontSize, marginBottom: spacing.md },
  button: { backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.md },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.surface, fontSize: typography.body.fontSize, fontWeight: '600' },
  helpText: { fontSize: typography.caption.fontSize, color: colors.lightGray, textAlign: 'center', marginTop: spacing.md },
});