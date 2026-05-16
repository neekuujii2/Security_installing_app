import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, Dimensions } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { jobAPI } from '../../services/api';
import { database } from '../../database';

type PhotoCaptureRouteProp = RouteProp<{ PhotoCapture: { jobId: string; type: 'before' | 'after' } }, 'PhotoCapture'>;

const MIN_PHOTOS = 2;
const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - spacing.lg * 2 - spacing.sm) / 2;

export default function PhotoCaptureScreen() {
  const route = useRoute<PhotoCaptureRouteProp>();
  const navigation = useNavigation<any>();
  const { jobId, type } = route.params;

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const camera = useRef<Camera>(null);

  const [photos, setPhotos] = useState<string[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const takePhoto = useCallback(async () => {
    if (!camera.current || capturing) return;

    setCapturing(true);
    try {
      const photo = await camera.current.takePhoto({
        qualityPrioritization: 'balanced',
      });
      const uri = `file://${photo.path}`;
      
      setPhotos((prev) => [...prev, uri]);

      await database.write(async () => {
        await database.get('photos').create((p: any) => {
          p.jobId = jobId;
          p.type = type;
          p.uri = uri;
          p.uploaded = false;
        });
      });
    } catch (error) {
      console.error('Failed to take photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setCapturing(false);
    }
  }, [capturing, jobId, type]);

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const uploadPhotos = useCallback(async () => {
    if (photos.length < MIN_PHOTOS) {
      Alert.alert('Error', `Please take at least ${MIN_PHOTOS} photos`);
      return;
    }

    setUploading(true);
    try {
      for (const photo of photos) {
        await jobAPI.uploadPhoto(jobId, photo, type);
      }
      
      if (type === 'before') {
        navigation.replace('PhotoCapture', { jobId, type: 'after' });
      } else {
        navigation.replace('Signature', { jobId });
      }
    } catch (error) {
      console.error('Failed to upload photos:', error);
      Alert.alert('Error', 'Failed to upload photos. Will sync when online.');
      navigation.replace('Signature', { jobId });
    } finally {
      setUploading(false);
    }
  }, [photos, jobId, type, navigation]);

  const skipPhotos = useCallback(() => {
    if (type === 'before') {
      navigation.replace('PhotoCapture', { jobId, type: 'after' });
    } else {
      navigation.replace('Signature', { jobId });
    }
  }, [jobId, type, navigation]);

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera permission is required to take photos</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>No camera device found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {type === 'before' ? 'Before Photos' : 'After Photos'}
        </Text>
        <Text style={styles.subtitle}>
          Take at least {MIN_PHOTOS} photos of the installation
        </Text>
        <Text style={styles.counter}>
          {photos.length} / {MIN_PHOTOS} minimum
        </Text>
      </View>

      <View style={styles.cameraContainer}>
        <Camera
          ref={camera}
          style={styles.camera}
          device={device}
          isActive={true}
          photo={true}
        />
        
        <View style={styles.cameraOverlay}>
          <View style={styles.gridLines}>
            <View style={styles.gridLineH1} />
            <View style={styles.gridLineH2} />
            <View style={styles.gridLineV1} />
            <View style={styles.gridLineV2} />
          </View>
        </View>
      </View>

      <View style={styles.captureButtonContainer}>
        <TouchableOpacity
          style={[styles.captureButton, capturing && styles.captureButtonDisabled]}
          onPress={takePhoto}
          disabled={capturing}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </View>

      {photos.length > 0 && (
        <View style={styles.photosContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.photosGrid}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoWrapper}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Text style={styles.removePhotoText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.skipButton} onPress={skipPhotos}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.uploadButton,
            (photos.length < MIN_PHOTOS || uploading) && styles.uploadButtonDisabled,
          ]}
          onPress={uploadPhotos}
          disabled={photos.length < MIN_PHOTOS || uploading}
        >
          <Text style={styles.uploadButtonText}>
            {uploading ? 'Uploading...' : photos.length >= MIN_PHOTOS ? 'Continue' : `Take ${MIN_PHOTOS - photos.length} more`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  permissionText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  permissionButtonText: {
    color: colors.surface,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
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
  counter: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.secondary,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  cameraContainer: {
    height: 300,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridLines: {
    width: '80%',
    height: '80%',
    position: 'relative',
  },
  gridLineH1: {
    position: 'absolute',
    top: '33%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  gridLineH2: {
    position: 'absolute',
    top: '66%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  gridLineV1: {
    position: 'absolute',
    left: '33%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  gridLineV2: {
    position: 'absolute',
    left: '66%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  captureButtonContainer: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.primary,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
  },
  photosContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  photosGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: borderRadius.md,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  skipButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  skipButtonText: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    fontWeight: '500',
  },
  uploadButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: colors.surface,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
});