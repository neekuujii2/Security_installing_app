import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function requestUserPermission(): Promise<boolean> {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
    return true;
  }
  return false;
}

export async function getFCMToken(): Promise<string | null> {
  try {
    const fcmToken = await messaging().getToken();
    console.log('FCM Token:', fcmToken);
    return fcmToken;
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    return null;
  }
}

export async function registerDeviceWithServer(fcmToken: string): Promise<void> {
  try {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) return;

    await fetch('http://localhost:3000/notifications/register-device', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        fcmToken,
        platform: Platform.OS,
      }),
    });
  } catch (error) {
    console.error('Failed to register device:', error);
  }
}

export function setupFCMHandlers(navigation: any): void {
  messaging().onMessage(async (remoteMessage) => {
    console.log('Foreground message:', remoteMessage);

    const { data } = remoteMessage;
    if (data?.jobId) {
      navigation.navigate('JobDetail', { jobId: data.jobId });
    }
  });

  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('Notification opened app:', remoteMessage);

    const { data } = remoteMessage;
    if (data?.jobId) {
      navigation.navigate('JobDetail', { jobId: data.jobId });
    }
  });

  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('Initial notification:', remoteMessage);
        const { data } = remoteMessage;
        if (data?.jobId) {
          setTimeout(() => {
            navigation.navigate('JobDetail', { jobId: data.jobId });
          }, 1000);
        }
      }
    });
}

export async function setupFCM(navigation: any): Promise<void> {
  const hasPermission = await requestUserPermission();
  
  if (hasPermission) {
    const fcmToken = await getFCMToken();
    if (fcmToken) {
      await registerDeviceWithServer(fcmToken);
    }
  }

  setupFCMHandlers(navigation);
}

export default {
  requestUserPermission,
  getFCMToken,
  registerDeviceWithServer,
  setupFCM,
  setupFCMHandlers,
};