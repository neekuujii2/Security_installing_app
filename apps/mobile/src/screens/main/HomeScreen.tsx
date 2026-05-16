import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { jobAPI } from '../../services/api';
import { locationService } from '../../services/locationService';
import { SyncStatusBar } from '../../components/SyncStatusBar';

interface Job {
  id: string;
  jobNumber: string;
  clientName: string;
  siteName: string;
  status: string;
  priority: string;
  scheduledAt: string;
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<'available' | 'busy' | 'off_duty'>('available');

  const fetchJobs = useCallback(async () => {
    try {
      const response = await jobAPI.getJobs();
      setJobs(response.data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  }, [fetchJobs]);

  const activeJobs = jobs.filter(j => j.status === 'assigned' || j.status === 'in_progress');
  const todaysJobs = jobs.filter(j => {
    const scheduled = new Date(j.scheduledAt);
    const today = new Date();
    return scheduled.toDateString() === today.toDateString();
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return colors.success;
      case 'busy': return colors.warning;
      case 'off_duty': return colors.gray;
      default: return colors.gray;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return colors.danger;
      case 'high': return colors.warning;
      case 'medium': return colors.secondary;
      default: return colors.gray;
    }
  };

  const handleStatusToggle = async (newStatus: 'available' | 'busy' | 'off_duty') => {
    setStatus(newStatus);
    if (newStatus === 'busy' || newStatus === 'available') {
      await locationService.startTracking('current');
    } else {
      locationService.stopTracking();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.subtitle}>Here's your work overview</Text>
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.sectionTitle}>Your Status</Text>
          <View style={styles.statusButtons}>
            {(['available', 'busy', 'off_duty'] as const).map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.statusButton,
                  status === s && styles.statusButtonActive,
                ]}
                onPress={() => handleStatusToggle(s)}
              >
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(s) }]} />
                <Text style={[
                  styles.statusButtonText,
                  status === s && styles.statusButtonTextActive,
                ]}>
                  {s.replace('_', ' ').toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{activeJobs.length}</Text>
            <Text style={styles.statLabel}>Active Jobs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{todaysJobs.length}</Text>
            <Text style={styles.statLabel}>Today's Jobs</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Jobs</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Jobs')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {activeJobs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No active jobs</Text>
              <Text style={styles.emptySubtext}>You're free to take new assignments</Text>
            </View>
          ) : (
            activeJobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                style={styles.jobCard}
                onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
              >
                <View style={styles.jobHeader}>
                  <Text style={styles.jobNumber}>{job.jobNumber}</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(job.priority) + '20' }]}>
                    <Text style={[styles.priorityText, { color: getPriorityColor(job.priority) }]}>
                      {job.priority}
                    </Text>
                  </View>
                </View>
                <Text style={styles.jobClient}>{job.clientName}</Text>
                <Text style={styles.jobSite}>{job.siteName}</Text>
                <View style={styles.jobFooter}>
                  <Text style={styles.jobStatus}>{job.status.replace('_', ' ')}</Text>
                  <Text style={styles.jobTime}>
                    {new Date(job.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Map')}
            >
              <Text style={styles.actionEmoji}>🗺️</Text>
              <Text style={styles.actionText}>View Map</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Jobs')}
            >
              <Text style={styles.actionEmoji}>📋</Text>
              <Text style={styles.actionText}>All Jobs</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <SyncStatusBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: typography.h2.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statusContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusButtonText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  statusButtonTextActive: {
    color: colors.surface,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: typography.h1.fontSize,
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewAllText: {
    color: colors.secondary,
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500',
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  emptySubtext: {
    fontSize: typography.caption.fontSize,
    color: colors.lightGray,
    marginTop: spacing.xs,
  },
  jobCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  jobNumber: {
    fontSize: typography.caption.fontSize,
    color: colors.gray,
    fontFamily: 'monospace',
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  jobClient: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  jobSite: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  jobStatus: {
    fontSize: typography.caption.fontSize,
    color: colors.secondary,
    fontWeight: '500',
  },
  jobTime: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  quickActions: {
    marginBottom: spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  actionEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  actionText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});