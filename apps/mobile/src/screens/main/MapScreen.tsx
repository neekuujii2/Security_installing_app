import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { colors, spacing } from '../../theme';
import { locationService } from '../../services/locationService';

// ============================================================================
// MapPlex Integration - Google Maps Alternative
// When ready to migrate to Google Maps later, just change provider to PROVIDER_GOOGLE
// ============================================================================

export default function MapScreen() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [mapProvider] = useState('mapples'); // 'mapples' or change to PROVIDER_GOOGLE later

  useEffect(() => {
    loadJobsAndLocation();
  }, []);

  const loadJobsAndLocation = async () => {
    try {
      setLoading(true);
      
      // Get user's current location
      const currentLocation = await locationService.getCurrentLocation();
      setUserLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });

      // Fetch jobs with location data from API
      // const response = await jobsAPI.getJobsWithLocation();
      // setJobs(response.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading map data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </View>
    );
  }

  const getMarkerColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'available':
      case 'unassigned':
        return 'green';
      case 'in_progress':
      case 'assigned':
        return 'yellow';
      case 'completed':
        return 'red';
      case 'offline':
        return 'gray';
      default:
        return 'blue';
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={mapProvider} // MapPlex provider - easily changeable to PROVIDER_GOOGLE
        initialRegion={{
          latitude: userLocation?.latitude || 28.6139, // Delhi, India default
          longitude: userLocation?.longitude || 77.209,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}
      >
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="Your Location"
            description="Your current position"
            pinColor="blue"
          />
        )}

        {/* Job Location Markers */}
        {jobs && jobs.length > 0 ? (
          jobs.map((job) => (
            <Marker
              key={job.id}
              coordinate={{
                latitude: job.siteLatitude,
                longitude: job.siteLongitude,
              }}
              title={job.clientName}
              description={`${job.siteName} - ${job.status}`}
              pinColor={getMarkerColor(job.status)}
            />
          ))
        ) : (
          <Text style={styles.noJobsText}>No jobs to display</Text>
        )}
      </MapView>

      {/* Status Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Status Legend</Text>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#FFC107' }]} />
          <Text style={styles.legendText}>In Progress</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#F44336' }]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#2196F3' }]} />
          <Text style={styles.legendText}>You</Text>
        </View>
      </View>

      {/* MapPlex Provider Badge */}
      <View style={styles.providerBadge}>
        <Text style={styles.providerText}>📍 {mapProvider.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  map: {
    flex: 1,
  },
  noJobsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  providerBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  providerText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '500',
  },
});