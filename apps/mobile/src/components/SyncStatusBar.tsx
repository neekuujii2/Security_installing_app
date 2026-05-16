import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSync } from '../contexts/SyncContext';
import { colors, spacing, borderRadius, typography } from '../theme';

export function SyncStatusBar() {
  const { isOnline, isSyncing, pendingCount, lastSyncAt, forceSync } = useSync();

  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  const formatLastSync = () => {
    if (!lastSyncAt) return 'Never';
    const diff = Date.now() - lastSyncAt.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  return (
    <View style={styles.container}>
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <View style={styles.offlineIndicator} />
          <Text style={styles.offlineText}>You're offline</Text>
          <Text style={styles.offlineSubtext}>
            Data will sync when you reconnect
          </Text>
        </View>
      )}

      {isOnline && isSyncing && (
        <View style={styles.syncingBanner}>
          <ActivityIndicator size="small" color={colors.warning} />
          <Text style={styles.syncingText}>Syncing...</Text>
        </View>
      )}

      {isOnline && !isSyncing && pendingCount > 0 && (
        <View style={styles.pendingBanner}>
          <View style={styles.pendingContent}>
            <View style={styles.pendingIndicator} />
            <View>
              <Text style={styles.pendingText}>
                {pendingCount} item{pendingCount > 1 ? 's' : ''} pending sync
              </Text>
              <Text style={styles.pendingSubtext}>
                Last sync: {formatLastSync()}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.syncButton}
            onPress={forceSync}
          >
            <Text style={styles.syncButtonText}>Sync Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {isOnline && !isSyncing && pendingCount === 0 && lastSyncAt && (
        <View style={styles.syncedBanner}>
          <View style={styles.syncedIndicator} />
          <Text style={styles.syncedText}>All synced</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  offlineBanner: {
    backgroundColor: colors.warning,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  offlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
  offlineText: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: typography.bodySmall.fontSize,
  },
  offlineSubtext: {
    color: colors.surface,
    fontSize: typography.caption.fontSize,
    flex: 1,
    opacity: 0.9,
  },
  syncingBanner: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  syncingText: {
    color: colors.warning,
    fontWeight: '500',
    fontSize: typography.bodySmall.fontSize,
  },
  pendingBanner: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.warning,
  },
  pendingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  pendingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning,
  },
  pendingText: {
    color: colors.text,
    fontWeight: '500',
    fontSize: typography.bodySmall.fontSize,
  },
  pendingSubtext: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
  },
  syncButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  syncButtonText: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: typography.bodySmall.fontSize,
  },
  syncedBanner: {
    backgroundColor: colors.success + '10',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.success + '30',
  },
  syncedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  syncedText: {
    color: colors.success,
    fontWeight: '500',
    fontSize: typography.bodySmall.fontSize,
  },
});

export default SyncStatusBar;