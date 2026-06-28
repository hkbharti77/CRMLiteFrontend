import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const SERVER_HOST = process.env.EXPO_PUBLIC_API_URL;
export const API_BASE_URL = `${SERVER_HOST}/api/v1`;
export const WS_URL = `${SERVER_HOST?.replace('http', 'ws')}/ws`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper for Trace ID
const generateTraceId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
};

// Interceptor to add JWT token and observability headers to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    const tenantId = (await AsyncStorage.getItem('tenantId')) || (await AsyncStorage.getItem('userId'));
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }
    
    // Always inject a Trace ID for distributed tracing
    config.headers['X-Trace-ID'] = generateTraceId();
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: auto-logout when the server rejects the token (401/403)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    // 401 = token invalid/expired; 403 on a protected route with a token = same root cause
    if (status === 401 || status === 403) {
      // Only clear session if we actually sent a token (avoid clearing on public routes)
      const sentToken = error?.config?.headers?.Authorization;
      if (sentToken) {
        console.warn('🔒 Token rejected by server — clearing session and redirecting to login.');
        await AsyncStorage.multiRemove(['userToken', 'userId', 'tenantId', 'email', 'businessName', 'onboardingCompleted']);
        // Force a full reload — AppNavigator will redirect to Login because userToken is gone
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string) => api.post('/auth/login', { email }),
  verifyOtp: (email: string, otp: string) => api.post('/auth/verify', { email, otp }),
};

export const crmApi = {
  getContacts: () => api.get('/contacts'),
  getContactById: (id: string) => api.get(`/contacts/${id}`),
  getLeads: (page = 0, size = 50, status?: string) => api.get(`/leads/paged?page=${page}&size=${size}${status ? `&status=${status}` : ''}`),
  updateLeadStatus: (leadId: string, status: string) => api.patch(`/leads/${leadId}/status?status=${status}`),
  updateContactTags: (contactId: string, tags: string[]) => api.patch(`/contacts/${contactId}/tags`, tags),
  // Enquiry CRUD
  getEnquiries: (leadId: string) => api.get(`/leads/${leadId}/enquiries`),
  addEnquiry: (leadId: string, data: { type?: string; message: string; source?: string; status?: string }) =>
    api.post(`/leads/${leadId}/enquiries`, data),
  updateEnquiry: (leadId: string, enquiryId: string, data: { type?: string; message?: string; source?: string; status?: string }) =>
    api.patch(`/leads/${leadId}/enquiries/${enquiryId}`, data),
  deleteEnquiry: (leadId: string, enquiryId: string) =>
    api.delete(`/leads/${leadId}/enquiries/${enquiryId}`),
  getLeadByContactId: (contactId: string) => api.get(`/leads/contact/${contactId}/latest`),
  getLeadsByContactId: (contactId: string) => api.get(`/leads/contact/${contactId}`),
  getPendingReminders: () => api.get('/reminders/pending'),
  createReminder: (data: any) => api.post('/reminders', data),
  completeReminder: (id: string) => api.patch(`/reminders/${id}/complete`),
  // Deal / Payment tracking
  updateLeadDeal: (leadId: string, data: {
    dealValue?: number;
    paymentStatus?: string;
    currency?: string;
    dealLabel?: string;
  }) => api.patch(`/leads/${leadId}/deal`, data),
  getRevenueReport: () => api.get('/leads/revenue'),
};

export const whatsappApi = {
  getConfig: () => api.get('/whatsapp-config'),
  getFeatureLabels: () => api.get('/whatsapp-config/feature-labels'),
  saveConfig: (config: { 
    phoneNumberId: string; 
    wabaId: string; 
    accessToken: string; 
    verifyToken: string; 
    appSecret?: string;
    interactiveMenuJson?: string;
    welcomeMessage?: string;
    returningMessage?: string;
    showAboutContact?: boolean;
    reviewUrl?: string;
    portfolioUrl?: string;
    offerText?: string;
    sosNote?: string;
    thirdButtonType?: string;
    showTrustButton?: boolean;
    showOfferButton?: boolean;
    showSosButton?: boolean;
    customSubMenusJson?: string;
    customMessagesJson?: string;
    flowCancelMenuJson?: string;
    flowCompletionMenuJson?: string;
    aiResponseMenuJson?: string;
    guardrailMessageAbuse?: string;
    guardrailMessageGibberish?: string;
  }) =>
    api.post('/whatsapp-config', config),
  uploadMedia: async (file: any) => {
    const formData = new FormData();
    if (Platform.OS === 'web' && file.file) {
      formData.append('file', file.file);
    } else {
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type || file.mimeType || 'image/jpeg'
      } as any);
    }
    return api.post('/whatsapp-config/upload-media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const messageApi = {
  getChats: () => api.get('/messages/chats'),
  getHistory: (contactId: string) => api.get(`/messages/${contactId}`),
  sendMessage: (contactId: string, text: string) => api.post(`/messages/${contactId}`, { text }),
  sendMenu: (contactId: string) => api.post(`/messages/${contactId}/menu`),
};

export const onboardingApi = {
  submit: (data: any) => api.post('/onboarding/submit', data),
  skip: () => api.post('/onboarding/skip'),
};

export const appointmentApi = {
  book: (data: {
    contactId?: string | null;
    appointmentDateTime: string;
    title: string;
    meetingLink?: string;
    generateMeetLink?: boolean;
  }) => api.post('/appointments', data),
  getAll: () => api.get('/appointments'),
  getToday: () => api.get('/appointments/today'),
  getTodayCount: () => api.get('/appointments/today/count'),
  getForContact: (contactId: string) => api.get(`/appointments/contact/${contactId}`),
  complete: (id: string) => api.patch(`/appointments/${id}/complete`),
  cancel: (id: string) => api.patch(`/appointments/${id}/cancel`),
  noShow: (id: string) => api.patch(`/appointments/${id}/noshow`),
  generateMeetLink: (id: string, durationMinutes?: number) => 
    api.post(`/appointments/${id}/generate-meet-link`, null, { params: { durationMinutes } }),
};

export const integrationApi = {
  getGoogleAuthUrl: () => api.get('/integrations/google/auth-url'),
  getGoogleStatus: () => api.get('/integrations/google/status'),
  disconnectGoogle: () => api.delete('/integrations/google/disconnect'),
};

export const bookingApi = {
  create: (data: { contactId: string; service: string; preferredSlot?: string }) =>
    api.post('/bookings', data),
  getAll: () => api.get('/bookings'),
  getForContact: (contactId: string) => api.get(`/bookings/contact/${contactId}`),
  getByStatus: (status: string) => api.get(`/bookings/status/${status}`),
  complete: (id: string) => api.patch(`/bookings/${id}/complete`),
  cancel: (id: string) => api.patch(`/bookings/${id}/cancel`),
  noShow: (id: string) => api.patch(`/bookings/${id}/noshow`),
};

/**
 * Unified CRM Activity Log API
 * Fetches the full customer interaction timeline — cross-module (Lead, Booking, Appointment)
 * without coupling the frontend to any specific domain's endpoint.
 */
export const activityApi = {
  /** Full timeline for a single contact (newest first) */
  getContactTimeline: (contactId: string) =>
    api.get(`/activity-logs/contact/${contactId}`),

  /** Quick-glance: most recent N activities for a contact */
  getRecentContactActivity: (contactId: string, limit = 10) =>
    api.get(`/activity-logs/contact/${contactId}/recent?limit=${limit}`),

  /** History for a specific entity (e.g. one booking's full log) */
  getEntityHistory: (entityType: 'LEAD' | 'BOOKING' | 'APPOINTMENT', entityId: string) =>
    api.get(`/activity-logs/entity/${entityType}/${entityId}`),

  /** Global CRM feed for the owner's dashboard */
  getOwnerFeed: () => api.get('/activity-logs/feed'),
};

export const dashboardApi = {
  getAggregate: () => api.get('/dashboard/aggregate'),
  exportReport: (format: 'csv' | 'pdf') => api.get(`/dashboard/export?format=${format}`, { responseType: 'blob' }),
};

export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: {
    displayName?: string;
    phone?: string;
    businessName?: string;
    businessType?: string;
    businessSubType?: string;
    address?: string;
    aboutUs?: string;
    latitude?: number;
    longitude?: number;
    logoUrl?: string;
    forceShowBooking?: boolean | null;
    forceShowLeads?: boolean | null;
    forceShowAppointment?: boolean | null;
  }) => api.put('/users/me', data),
  updateActiveFlowType: (flowType: 'lead' | 'appointment' | 'booking') => api.put('/users/me', {
    forceShowLeads: flowType === 'lead',
    forceShowAppointment: flowType === 'appointment',
    forceShowBooking: flowType === 'booking',
  }),
  getTenantStaff: () => api.get('/users/tenant-staff'),
  createStaffUser: (data: { email: string, displayName: string, role: string, phone?: string }) => api.post('/users/staff', data),
  deleteStaffUser: (staffId: string) => api.delete(`/users/staff/${staffId}`),
  updateStaffStatus: (staffId: string, status: string, reason?: string) => api.patch(`/users/staff/${staffId}/status?status=${status}${reason ? `&reason=${encodeURIComponent(reason)}` : ''}`),
  // Security Suite
  getSecurityDashboard: () => api.get('/users/me/security-dashboard'),
  getSessions: () => api.get('/users/me/sessions'),
  getSecurityLogs: () => api.get('/users/me/security-logs'),
  updatePassword: (data: { password: String }) => api.patch('/users/me/password', data),
  revokeSession: (sessionId: string) => api.delete(`/users/me/sessions/${sessionId}`),
  revokeAllSessions: () => api.delete('/users/me/sessions'),
  updateSecuritySettings: (data: { biometricsEnabled?: boolean; loginAlertsEnabled?: boolean; ipWhitelist?: string[] }) =>
    api.patch('/users/me/security-settings', data),
  killSwitch: () => api.post('/users/me/kill-switch'),
  exportData: () => api.get('/users/me/export-data'),
  recoverLeads: () => api.post('/users/me/recover-leads'),
};

// Returns { categoryName: [subcat1, subcat2, ...] } — open to all authenticated users
export const categoryApi = {
  // READ — used by all frontend dropdowns
  getAll: () => api.get('/business-categories'),

  // WRITE — owner/admin only (enforced by backend)
  createCategory: (name: string) => api.post('/business-categories', { name }),
  updateCategory: (id: number, name: string) => api.put(`/business-categories/${id}`, { name }),
  deleteCategory: (id: number) => api.delete(`/business-categories/${id}`),
  addSubCategory: (categoryId: number, name: string) => api.post(`/business-categories/${categoryId}/subcategories`, { name }),
  updateSubCategory: (subId: number, name: string) => api.put(`/business-categories/subcategories/${subId}`, { name }),
  deleteSubCategory: (subId: number) => api.delete(`/business-categories/subcategories/${subId}`),
};

export const businessServiceApi = {
  getAll: () => api.get('/business-services'),
  create: async (data: any) => {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);

    if (data.file) {
        if (Platform.OS === 'web' && data.file.file) {
            formData.append('file', data.file.file);
        } else {
            formData.append('file', {
                uri: data.file.uri,
                name: data.file.name,
                type: data.file.mimeType || 'application/octet-stream',
            } as any);
        }
    }

    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch(`${API_BASE_URL}/business-services`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    const resData = await response.json().catch(() => ({}));
    if (!response.ok) throw { response: { status: response.status, data: resData } };
    return { data: resData };
  },
  update: async (id: string, data: any) => {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);

    if (data.file) {
        if (Platform.OS === 'web' && data.file.file) {
            formData.append('file', data.file.file);
        } else {
            formData.append('file', {
                uri: data.file.uri,
                name: data.file.name,
                type: data.file.mimeType || 'application/octet-stream',
            } as any);
        }
    }

    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch(`${API_BASE_URL}/business-services/${id}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    const resData = await response.json().catch(() => ({}));
    if (!response.ok) throw { response: { status: response.status, data: resData } };
    return { data: resData };
  },
  delete: (id: string) => api.delete(`/business-services/${id}`),
};

export const flowConfigApi = {
  getTriggerLabels: () => api.get('/flow-config/trigger-labels'),
  getFlowFields: (flowType?: string) => api.get(`/flow-config/fields${flowType ? `?flowType=${flowType}` : ''}`),
  saveFlowFields: (fields: any[], flowType?: string) => api.post(`/flow-config/fields${flowType ? `?flowType=${flowType}` : ''}`, fields),
  getFlowGreeting: (flowType?: string) => api.get(`/flow-config/greeting${flowType ? `?flowType=${flowType}` : ''}`),
  saveFlowGreeting: (greetingMessage: string, flowType?: string) => api.post(`/flow-config/greeting${flowType ? `?flowType=${flowType}` : ''}`, { greetingMessage }),
};

export const ragApi = {
  uploadDocument: async (file: any) => {
    const formData = new FormData();
    
    // Web and Mobile handle FormData differently in React/Expo
    if (Platform.OS === 'web' && file.file) {
      // On Web, DocumentPicker provides the raw browser File object inside `file.file`
      formData.append('file', file.file);
    } else {
      // On iOS/Android, this `{ uri, name, type }` object structure is required
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      } as any);
    }

    const token = await AsyncStorage.getItem('userToken');

    const response = await fetch(`${API_BASE_URL}/rag/upload`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        // DO NOT set Content-Type manually; fetch will automatically set it with the correct boundary!
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw {
        response: { status: response.status, data: data }
      };
    }
    return { data };
  },
  listDocuments: () => api.get('/rag/documents'),
  getStatus: (docId: string) => api.get(`/rag/status/${docId}`),
  deleteDocument: (docId: string) => api.delete(`/rag/documents/${docId}`),
  downloadDocument: (docId: string) => api.get(`/rag/documents/${docId}/download`, { responseType: 'blob' }),
  trainText: (content: string) => api.post('/knowledge-base/train', { content }),
};


export const ticketApi = {
  // Tickets
  getAll: (page = 0, size = 20) => api.get(`/tickets?page=${page}&size=${size}`),
  search: (q: string, page = 0) => api.get(`/tickets/search?q=${encodeURIComponent(q)}&page=${page}`),
  create: (data: {
    subject: string;
    description: string;
    submitterName?: string;
    submitterEmail?: string;
    submitterPhone?: string;
    priority?: string;
    category?: string;
    contactId?: string;
    assignedToId?: string;
  }) => api.post('/tickets', data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/tickets/${id}/status?status=${status}`),
  updatePriority: (id: string, priority: string) =>
    api.patch(`/tickets/${id}/priority?priority=${priority}`),
  addComment: (id: string, message: string, internal = false) =>
    api.post(`/tickets/${id}/comments`, { message, internal }),
  delete: (id: string) => api.delete(`/tickets/${id}`),
};

export interface Contact {
  id: string;
  waId?: string;
  displayId?: string;
  name?: string;
  email?: string;
}

export const customEmailApi = {
  send: (data: {
    subject: string;
    body: string;
    ctaLabel?: string;
    ctaUrl?: string;
    recipientMode: 'ALL' | 'TAGGED' | 'MANUAL';
    tagsFilter?: string;
    manualRecipients?: string;
  }) => api.post('/custom-emails/send', data),
  saveDraft: (data: any) => api.post('/custom-emails/draft', data),
  getHistory: (page = 0, size = 20) => api.get(`/custom-emails?page=${page}&size=${size}`),
  getById: (id: string) => api.get(`/custom-emails/${id}`),
  resend: (id: string) => api.post(`/custom-emails/${id}/resend`),
};

export const supportFormConfigApi = {
  getConfig: () => api.get('/support-form-config'),
  updateConfig: (data: {
    formTitle?: string;
    formDescription?: string;
    successMessage?: string;
    phoneRequired?: boolean;
    categoryRequired?: boolean;
    categories?: string[];
    primaryColor?: string;
    logoUrl?: string;
    rateLimitEnabled?: boolean;
    duplicateDetectionEnabled?: boolean;
    defaultPriority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    enabled?: boolean;
  }) => api.put('/support-form-config', data),
  getCategoryTemplates: () => api.get('/support-form-config/category-templates'),
  resetConfig: () => api.post('/support-form-config/reset'),
};

export const monitoringApi = {
  getHealth: () => api.get(`${SERVER_HOST}/actuator/health`),
  getMetrics: () => api.get(`${SERVER_HOST}/actuator/metrics`),
  getMetricDetails: (name: string) => api.get(`${SERVER_HOST}/actuator/metrics/${name}`),
};

export const billingApi = {
  getSubscriptionStatus: () => api.get('/billing/subscription'),
  initiateCheckout: (data: { planId: string; billingCycle: string; gateway: string }) =>
    api.post('/billing/checkout', data),
  getTransactions: () => api.get('/billing/transactions'),
};

export default api;

