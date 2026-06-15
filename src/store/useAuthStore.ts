import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  userToken: string | null;
  userId: string | null;   // User UUID — used for public bot embed data-business-id
  tenantId: string | null; // Tenant UUID — used for WebSocket topic and API client header
  email: string | null;
  businessName: string | null;
  businessSubType: string | null;
  flowType: 'LEAD' | 'APPOINTMENT' | 'BOOKING' | null;
  forceShowBooking: boolean | null;
  forceShowAppointment: boolean | null;
  forceShowLeads: boolean | null;
  onboardingCompleted: boolean;
  isLoading: boolean;
  setToken: (token: string, userId: string, tenantId: string, email: string, businessName: string, onboardingCompleted: boolean) => Promise<void>;
  setOnboardingCompleted: (completed: boolean) => Promise<void>;
  clearToken: () => Promise<void>;
  restoreToken: () => Promise<void>;
  fetchProfileOverrides: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  userToken: null,
  userId: null,
  tenantId: null,
  email: null,
  businessName: null,
  businessSubType: null,
  flowType: null,
  forceShowBooking: null,
  forceShowAppointment: null,
  forceShowLeads: null,
  onboardingCompleted: false,
  isLoading: true,

  setToken: async (token, userId, tenantId, email, businessName, onboardingCompleted) => {
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userId', userId);
    await AsyncStorage.setItem('tenantId', tenantId);
    await AsyncStorage.setItem('email', email);
    await AsyncStorage.setItem('businessName', businessName);
    await AsyncStorage.setItem('onboardingCompleted', JSON.stringify(onboardingCompleted));
    set({ userToken: token, userId, tenantId, email, businessName, onboardingCompleted });
    
    // Fetch latest profile after login
    try {
      const { userApi } = require('../services/api');
      const { getFlowTypeFromNiche } = require('../utils/flowMapping');
      const response = await userApi.getProfile();
      const profile = response.data;
      const subType = profile.businessSubType;
      const forceShowBooking = profile.forceShowBooking;
      const forceShowAppointment = profile.forceShowAppointment;
      const forceShowLeads = profile.forceShowLeads;

      await AsyncStorage.setItem('businessSubType', subType || '');
      if (forceShowBooking !== null && forceShowBooking !== undefined) {
        await AsyncStorage.setItem('forceShowBooking', JSON.stringify(forceShowBooking));
      }
      if (forceShowAppointment !== null && forceShowAppointment !== undefined) {
        await AsyncStorage.setItem('forceShowAppointment', JSON.stringify(forceShowAppointment));
      }
      if (forceShowLeads !== null && forceShowLeads !== undefined) {
        await AsyncStorage.setItem('forceShowLeads', JSON.stringify(forceShowLeads));
      }

      set({ 
        businessSubType: subType, 
        flowType: getFlowTypeFromNiche(subType),
        forceShowBooking: forceShowBooking ?? null,
        forceShowAppointment: forceShowAppointment ?? null,
        forceShowLeads: forceShowLeads ?? null,
        isLoading: false
      });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  setOnboardingCompleted: async (completed) => {
    await AsyncStorage.setItem('onboardingCompleted', JSON.stringify(completed));
    set({ onboardingCompleted: completed });
  },

  clearToken: async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('tenantId');
    await AsyncStorage.removeItem('email');
    await AsyncStorage.removeItem('businessName');
    await AsyncStorage.removeItem('businessSubType');
    await AsyncStorage.removeItem('forceShowBooking');
    await AsyncStorage.removeItem('forceShowAppointment');
    await AsyncStorage.removeItem('forceShowLeads');
    await AsyncStorage.removeItem('onboardingCompleted');
    set({ userToken: null, userId: null, tenantId: null, email: null, businessName: null, businessSubType: null, flowType: null, forceShowBooking: null, forceShowAppointment: null, forceShowLeads: null, onboardingCompleted: false, isLoading: false });
  },

  restoreToken: async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');
      const tenantId = await AsyncStorage.getItem('tenantId');
      const email = await AsyncStorage.getItem('email');
      const businessName = await AsyncStorage.getItem('businessName');
      const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
      const businessSubType = await AsyncStorage.getItem('businessSubType');
      const forceShowBookingStr = await AsyncStorage.getItem('forceShowBooking');
      const forceShowAppointmentStr = await AsyncStorage.getItem('forceShowAppointment');
      const forceShowLeadsStr = await AsyncStorage.getItem('forceShowLeads');

      const { getFlowTypeFromNiche } = require('../utils/flowMapping');
      
      set({ 
        userToken: token, 
        userId,
        tenantId,
        email, 
        businessName,
        businessSubType: businessSubType,
        flowType: getFlowTypeFromNiche(businessSubType),
        forceShowBooking: forceShowBookingStr ? JSON.parse(forceShowBookingStr) : null,
        forceShowAppointment: forceShowAppointmentStr ? JSON.parse(forceShowAppointmentStr) : null,
        forceShowLeads: forceShowLeadsStr ? JSON.parse(forceShowLeadsStr) : null,
        onboardingCompleted: onboardingCompleted ? JSON.parse(onboardingCompleted) : false,
        isLoading: false 
      });

      // Background sync
      if (token) {
        get().fetchProfileOverrides();
      }
    } catch (e) {
      set({ isLoading: false });
    }
  },

  fetchProfileOverrides: async () => {
    try {
      const { userApi } = require('../services/api');
      const { getFlowTypeFromNiche } = require('../utils/flowMapping');
      const response = await userApi.getProfile();
      const profile = response.data;
      const subType = profile.businessSubType;
      const forceShowBooking = profile.forceShowBooking;
      const forceShowAppointment = profile.forceShowAppointment;
      const forceShowLeads = profile.forceShowLeads;

      await AsyncStorage.setItem('businessSubType', subType || '');
      if (forceShowBooking !== null && forceShowBooking !== undefined) {
        await AsyncStorage.setItem('forceShowBooking', JSON.stringify(forceShowBooking));
      } else {
        await AsyncStorage.removeItem('forceShowBooking');
      }
      
      if (forceShowAppointment !== null && forceShowAppointment !== undefined) {
        await AsyncStorage.setItem('forceShowAppointment', JSON.stringify(forceShowAppointment));
      } else {
        await AsyncStorage.removeItem('forceShowAppointment');
      }

      if (forceShowLeads !== null && forceShowLeads !== undefined) {
        await AsyncStorage.setItem('forceShowLeads', JSON.stringify(forceShowLeads));
      } else {
        await AsyncStorage.removeItem('forceShowLeads');
      }

      set({ 
        businessSubType: subType, 
        flowType: getFlowTypeFromNiche(subType),
        forceShowBooking: forceShowBooking ?? null,
        forceShowAppointment: forceShowAppointment ?? null,
        forceShowLeads: forceShowLeads ?? null,
      });
    } catch (error) {
      console.warn("Failed to sync profile overrides in background", error);
    }
  },
}));
