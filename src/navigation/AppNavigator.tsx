import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useWebSocketStore } from '../store/useWebSocketStore';
import { useTheme } from 'react-native-paper';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ChatListScreen from '../screens/ChatListScreen';
import PipelineScreen from '../screens/PipelineScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import ContactProfileScreen from '../screens/ContactProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import BookingScreen from '../screens/BookingScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
  ChatRoom: { chatId: string; name: string };
  ContactProfile: { contactId: string };
};

export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Inbox: undefined;
  Pipeline: undefined;
  Booking: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

function MainNavigator() {
  const theme = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help-circle';
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Inbox') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'Pipeline') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Booking') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: '#fff',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Inbox" component={ChatListScreen} />
      <Tab.Screen name="Pipeline" component={PipelineScreen} />
      <Tab.Screen name="Booking" component={BookingScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { userToken, userId, onboardingCompleted, isLoading, restoreToken } = useAuthStore();
  const { connect, isConnected } = useWebSocketStore();

  useEffect(() => {
    restoreToken();
  }, []);

  // ── Auto-connect WebSocket when logged in ──────────────────────
  useEffect(() => {
    if (userToken && userId && !isConnected) {
      console.log('🔄 Attempting WebSocket connection from AppNavigator...');
      connect(userToken, userId);
    }
  }, [userToken, userId, isConnected]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#075E54" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userToken == null ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : !onboardingCompleted ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen 
            name="ChatRoom" 
            component={ChatRoomScreen} 
            options={({ route }) => ({ 
              headerShown: true, 
              title: route.params.name,
              headerStyle: { backgroundColor: '#075E54' },
              headerTintColor: '#fff'
            })} 
          />
          <Stack.Screen 
            name="ContactProfile" 
            component={ContactProfileScreen} 
            options={{ 
              headerShown: true, 
              title: 'Contact Details',
              headerStyle: { backgroundColor: '#075E54' },
              headerTintColor: '#fff'
            }} 
          />
        </>
      )}
    </Stack.Navigator>
  );
}

