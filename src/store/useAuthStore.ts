import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  userToken: string | null;
  userId: string | null;   // Tenant UUID — used for WebSocket topic
  email: string | null;
  businessName: string | null;
  onboardingCompleted: boolean;
  isLoading: boolean;
  setToken: (token: string, userId: string, email: string, businessName: string, onboardingCompleted: boolean) => Promise<void>;
  setOnboardingCompleted: (completed: boolean) => Promise<void>;
  clearToken: () => Promise<void>;
  restoreToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  userToken: null,
  userId: null,
  email: null,
  businessName: null,
  onboardingCompleted: false,
  isLoading: true,

  setToken: async (token, userId, email, businessName, onboardingCompleted) => {
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userId', userId);
    await AsyncStorage.setItem('email', email);
    await AsyncStorage.setItem('businessName', businessName);
    await AsyncStorage.setItem('onboardingCompleted', JSON.stringify(onboardingCompleted));
    set({ userToken: token, userId, email, businessName, onboardingCompleted, isLoading: false });
  },

  setOnboardingCompleted: async (completed) => {
    await AsyncStorage.setItem('onboardingCompleted', JSON.stringify(completed));
    set({ onboardingCompleted: completed });
  },

  clearToken: async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('email');
    await AsyncStorage.removeItem('businessName');
    set({ userToken: null, email: null, businessName: null, isLoading: false });
  },

  restoreToken: async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');
      const email = await AsyncStorage.getItem('email');
      const businessName = await AsyncStorage.getItem('businessName');
      const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
      set({ 
        userToken: token, 
        userId,
        email, 
        businessName, 
        onboardingCompleted: onboardingCompleted ? JSON.parse(onboardingCompleted) : false,
        isLoading: false 
      });
    } catch (e) {
      set({ isLoading: false });
    }
  },
}));
