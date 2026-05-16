import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, borderRadius, typography } from '../../theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [biometrics, setBiometrics] = React.useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.fullName?.charAt(0) || 'T'}</Text>
        </View>
        <Text style={styles.name}>{user?.fullName || 'Technician'}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Biometric Login</Text>
            <Text style={styles.settingDesc}>Use fingerprint to unlock app</Text>
          </View>
          <Switch
            value={biometrics}
            onValueChange={setBiometrics}
            trackColor={{ true: colors.primary }}
          />
        </View>

        <TouchableOpacity style={styles.settingRow} onPress={logout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  profileHeader: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 32, color: colors.surface, fontWeight: '600' },
  name: { fontSize: typography.h3.fontSize, fontWeight: '600', color: colors.text, marginTop: spacing.md },
  phone: { fontSize: typography.body.fontSize, color: colors.textSecondary, marginTop: spacing.xs },
  section: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md },
  sectionTitle: { fontSize: typography.bodySmall.fontSize, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.md },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  settingLabel: { fontSize: typography.body.fontSize, color: colors.text },
  settingDesc: { fontSize: typography.caption.fontSize, color: colors.textSecondary },
  logoutText: { color: colors.danger, fontSize: typography.body.fontSize, fontWeight: '500' },
});