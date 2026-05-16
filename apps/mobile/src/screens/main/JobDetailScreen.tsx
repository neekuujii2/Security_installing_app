import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { jobAPI } from '../../services/api';
import { locationService } from '../../services/locationService';

type JobDetailRouteProp = RouteProp<{ JobDetail: { jobId: string } }, 'JobDetail'>;

interface Job {
  id: string;
  jobNumber: string;
  clientName: string;
  siteName: string;
  siteAddress: string;
  siteLatitude: number;
  siteLongitude: number;
  jobType: string;
  description: string;
  priority: string;
  status: string;
  scheduledAt: string;
  materialsRequired: string[];
  isHighSecurity: boolean;
}

export default function JobDetailScreen() {
  const route = useRoute<JobDetailRouteProp>();
  const navigation = useNavigation<any>();
  const { jobId } = route.params;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [canCheckIn, setCanCheckIn] = useState(false);

  const fetchJob = useCallback(async () => {
    try {
      const response = await jobAPI.getJob(jobId);
      setJob(response.data);
    } catch (error) {
      console.error('Failed to fetch job:', error);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  useEffect(() => {
    const checkProximity = async () => {
      if (!job) return;

      try {
        const location = await locationService.getCurrentLocation();
        setCurrentLocation({ lat: location.latitude, lng: location.longitude });

        const dist = locationService.calculateDistance(
          location.latitude,
          location.longitude,
          job.siteLatitude,
          job.siteLongitude
        );
        setDistance(dist);
        setCanCheckIn(dist <= 100);
      } catch (error) {
        console.error('Failed to get location:', error);
      }
    };

    checkProximity();
    const interval = setInterval(checkProximity, 10000);
    return () => clearInterval(interval);
  }, [job]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJob();
    setRefreshing(false);
  }, [fetchJob]);

  const handleCheckIn = () => {
    if (!currentLocation || !job) return;
    navigation.navigate('CheckIn', {
      jobId: job.id,
      latitude: currentLocation.lat,
      longitude: currentLocation.lng,
      siteLat: job.siteLatitude,
      siteLng: job.siteLongitude,
    });
  };

  const getStatusColor = () => {
    switch (job?.status) {
      case 'pending': return colors.warning;
      case 'assigned': return colors.secondary;
      case 'in_progress': return colors.primary;
      case 'completed': return colors.success;
      default: return colors.gray;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.errorContainer}>
        <Text>Job not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.jobNumber}>{job.jobNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{job.status.replace('_', ' ')}</Text>
          </View>
        </View>
        <Text style={styles.clientName}>{job.clientName}</Text>
        <Text style={styles.siteName}>{job.siteName}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Job Details</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Type:</Text>
          <Text style={styles.infoValue}>{job.jobType}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Priority:</Text>
          <Text style={[styles.infoValue, { color: job.priority === 'urgent' ? colors.danger : colors.text }]}>
            {job.priority}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Scheduled:</Text>
          <Text style={styles.infoValue}>{new Date(job.scheduledAt).toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Site Location</Text>
        <Text style={styles.address}>{job.siteAddress}</Text>
        {distance !== null && (
          <View style={styles.distanceContainer}>
            <Text style={styles.distanceLabel}>Distance to site:</Text>
            <Text style={[styles.distanceValue, canCheckIn && styles.distanceClose]}>
              {Math.round(distance)}m
              {canCheckIn && ' ✓'}
            </Text>
          </View>
        )}
        {job.isHighSecurity && (
          <View style={styles.highSecurityBadge}>
            <Text style={styles.highSecurityText}>🔒 High Security Site</Text>
          </View>
        )}
      </View>

      {job.materialsRequired.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Materials to Carry</Text>
          <View style={styles.materialsList}>
            {job.materialsRequired.map((item, index) => (
              <View key={index} style={styles.materialItem}>
                <Text style={styles.materialIcon}>☐</Text>
                <Text style={styles.materialText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{job.description}</Text>
      </View>

      {job.status === 'assigned' && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.checkInButton,
              !canCheckIn && styles.checkInButtonDisabled,
            ]}
            onPress={handleCheckIn}
            disabled={!canCheckIn}
          >
            <View style={styles.checkInContent}>
              <Text style={styles.checkInText}>
                {canCheckIn ? 'Check In' : 'Get within 100m to check in'}
              </Text>
              {canCheckIn && <Text style={styles.checkInSubtext}>GPS active</Text>}
            </View>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  jobNumber: {
    fontSize: typography.caption.fontSize,
    color: colors.gray,
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  clientName: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  siteName: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500',
    color: colors.text,
  },
  address: {
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  distanceContainer: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distanceLabel: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  distanceValue: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  distanceClose: {
    color: colors.success,
  },
  highSecurityBadge: {
    marginTop: spacing.md,
    backgroundColor: colors.warning + '20',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  highSecurityText: {
    color: colors.warning,
    fontWeight: '600',
  },
  materialsList: {
    gap: spacing.sm,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  materialIcon: {
    fontSize: 18,
    color: colors.gray,
  },
  materialText: {
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  description: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  actionContainer: {
    marginTop: spacing.lg,
  },
  checkInButton: {
    backgroundColor: colors.success,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  checkInButtonDisabled: {
    backgroundColor: colors.gray,
  },
  checkInContent: {
    alignItems: 'center',
  },
  checkInText: {
    color: colors.surface,
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
  },
  checkInSubtext: {
    color: colors.surface,
    fontSize: typography.caption.fontSize,
    marginTop: spacing.xs,
    opacity: 0.8,
  },
});