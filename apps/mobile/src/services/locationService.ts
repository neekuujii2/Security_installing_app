import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid } from 'react-native';
import { locationAPI } from './api';

interface Location {
  latitude: number;
  longitude: number;
  timestamp: number;
}

class LocationService {
  private watchId: number | null = null;
  private isTracking = false;
  private activeJobId: string | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private lastLocation: Location | null = null;

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const fineLocation = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to track job sites.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (fineLocation !== PermissionsAndroid.RESULTS.GRANTED) {
          return false;
        }

        if (Platform.Version >= 31) {
          const backgroundLocation = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
            {
              title: 'Background Location Permission',
              message: 'Allow background location access to track your position while working.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );

          return backgroundLocation === PermissionsAndroid.RESULTS.GRANTED;
        }

        return true;
      } catch (err) {
        console.error('Permission error:', err);
        return false;
      }
    }
    return true;
  }

  async getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          this.lastLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: position.timestamp,
          };
          resolve(this.lastLocation);
        },
        (error) => {
          console.error('Get location error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }

  async startTracking(jobId: string): Promise<void> {
    if (this.isTracking) {
      console.log('Already tracking');
      return;
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    this.activeJobId = jobId;
    this.isTracking = true;

    this.watchId = Geolocation.watchPosition(
      (position) => {
        this.lastLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp,
        };
      },
      (error) => {
        console.error('Watch position error:', error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        interval: 5000,
        fastestInterval: 2000,
      }
    );

    this.pingInterval = setInterval(async () => {
      if (this.lastLocation && this.activeJobId) {
        try {
          await locationAPI.pingLocation(
            this.lastLocation.latitude,
            this.lastLocation.longitude
          );
        } catch (error) {
          console.error('Location ping failed:', error);
        }
      }
    }, 30000);

    console.log('Location tracking started for job:', jobId);
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    this.isTracking = false;
    this.activeJobId = null;
    console.log('Location tracking stopped');
  }

  getLastLocation(): Location | null {
    return this.lastLocation;
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  isWithinRadius(lat1: number, lon1: number, lat2: number, lon2: number, radiusMeters: number): boolean {
    const distance = this.calculateDistance(lat1, lon1, lat2, lon2);
    return distance <= radiusMeters;
  }
}

export const locationService = new LocationService();
export default locationService;