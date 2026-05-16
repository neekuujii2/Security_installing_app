import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme';

import LoginScreen from '../screens/auth/LoginScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import PinSetupScreen from '../screens/auth/PinSetupScreen';

import HomeScreen from '../screens/main/HomeScreen';
import JobsScreen from '../screens/main/JobsScreen';
import JobDetailScreen from '../screens/main/JobDetailScreen';
import MapScreen from '../screens/main/MapScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

import CheckInScreen from '../screens/workflow/CheckInScreen';
import SiteSurveyScreen from '../screens/workflow/SiteSurveyScreen';
import PhotoCaptureScreen from '../screens/workflow/PhotoCaptureScreen';
import SignatureScreen from '../screens/workflow/SignatureScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  OTPVerification: { phone: string; jobId?: string };
  PinSetup: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  JobDetail: { jobId: string };
  CheckIn: { jobId: string; latitude: number; longitude: number; siteLat: number; siteLng: number };
  SiteSurvey: { jobId: string };
  PhotoCapture: { jobId: string; type: 'before' | 'after' };
  Signature: { jobId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Jobs: undefined;
  Map: undefined;
  Profile: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <AuthStack.Screen name="PinSetup" component={PinSetupScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Jobs"
        component={JobsScreen}
        options={{
          tabBarLabel: 'Jobs',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="briefcase" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: 'Map',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="map" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="user" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <MainStack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name="JobDetail"
        component={JobDetailScreen}
        options={{ title: 'Job Details' }}
      />
      <MainStack.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{ title: 'Check In' }}
      />
      <MainStack.Screen
        name="SiteSurvey"
        component={SiteSurveyScreen}
        options={{ title: 'Site Survey' }}
      />
      <MainStack.Screen
        name="PhotoCapture"
        component={PhotoCaptureScreen}
        options={{ title: 'Take Photos' }}
      />
      <MainStack.Screen
        name="Signature"
        component={SignatureScreen}
        options={{ title: 'Signature' }}
      />
    </MainStack.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return null;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

import { View } from 'react-native';
const TabIcon = ({ name, color, size }: { name: string; color: string; size: number }) => {
  const icons: Record<string, string> = {
    home: '🏠',
    briefcase: '💼',
    map: '🗺️',
    user: '👤',
  };
  return <View style={{ fontSize: size }}>{icons[name]}</View>;
};

export { colors } from '../theme';