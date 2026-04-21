import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const SERVER_HOST = 'http://localhost:8080'; // Change to match your environment (e.g. your IP)
export const API_BASE_URL = `${SERVER_HOST}/api/v1`;
export const WS_URL = `${SERVER_HOST}/ws`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
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
  getLeads: () => api.get('/leads'),
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
  }) =>
    api.post('/whatsapp-config', config),
  uploadMedia: (file: any) => {
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
    leadId: string;
    appointmentDateTime: string;
    title: string;
    meetingLink?: string;
  }) => api.post('/appointments', data),
  getAll: () => api.get('/appointments'),
  getToday: () => api.get('/appointments/today'),
  getTodayCount: () => api.get('/appointments/today/count'),
  getForLead: (leadId: string) => api.get(`/appointments/lead/${leadId}`),
  complete: (id: string) => api.patch(`/appointments/${id}/complete`),
  cancel: (id: string) => api.patch(`/appointments/${id}/cancel`),
  noShow: (id: string) => api.patch(`/appointments/${id}/noshow`),
};

export const bookingApi = {
  create: (data: { leadId: string; service: string; preferredSlot?: string }) =>
    api.post('/bookings', data),
  getAll: () => api.get('/bookings'),
  getForLead: (leadId: string) => api.get(`/bookings/lead/${leadId}`),
  getByStatus: (status: string) => api.get(`/bookings/status/${status}`),
  complete: (id: string) => api.patch(`/bookings/${id}/complete`),
  cancel: (id: string) => api.patch(`/bookings/${id}/cancel`),
  noShow: (id: string) => api.patch(`/bookings/${id}/noshow`),
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
  }) => api.put('/users/me', data),
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

// Returns fixed trigger button/list labels based on tenant's business sub-category
export const flowConfigApi = {
  getTriggerLabels: () => api.get('/flow-config/trigger-labels'),
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
  trainText: (content: string) => api.post('/knowledge-base/train', { content }),
};

export {
  authApi,
  crmApi,
  whatsappApi,
  messageApi,
  onboardingApi,
  appointmentApi,
  bookingApi,
  userApi,
  categoryApi,
  businessServiceApi,
  flowConfigApi,
  ragApi
};

export default api;
