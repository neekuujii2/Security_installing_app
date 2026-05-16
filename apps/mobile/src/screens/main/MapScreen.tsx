import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors, spacing } from '../../theme';

export default function MapScreen() {
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    // Fetch jobs with location
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 28.6139,
          longitude: 77.209,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {jobs.map((job) => (
          <Marker
            key={job.id}
            coordinate={{ latitude: job.siteLatitude, longitude: job.siteLongitude }}
            title={job.clientName}
            description={job.siteName}
          />
        ))}
      </MapView>
      <View style={styles.legend}>
        <Text style={styles.legendText}>🟢 Available | 🟡 Busy | 🔴 Offline</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
  },
  legendText: { fontSize: 12 },
});