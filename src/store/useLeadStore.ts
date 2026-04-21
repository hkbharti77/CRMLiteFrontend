import { create } from 'zustand';

export type LeadStatus = 'NEW' | 'INTERESTED' | 'FOLLOW_UP' | 'BOOKED' | 'CLOSED_WON' | 'CLOSED_LOST';

export interface Enquiry {
  id: string;
  type: 'WHATSAPP' | 'MANUAL' | 'AI' | 'FLOW' | string;
  message: string;
  source: string;
  status: 'OPEN' | 'RESOLVED' | 'FOLLOW_UP' | string;
  createdAt: string;
}

export interface Lead {
  id: string;
  contactId: string;
  name: string;
  lastMessage: string;
  time: string;
  status: LeadStatus;
  enquiries?: Enquiry[];
  // Deal / Payment fields
  dealValue?: number;
  paymentStatus?: 'NONE' | 'PENDING' | 'PARTIAL' | 'PAID';
  currency?: string;
  dealLabel?: string;
}

interface LeadState {
  leads: Lead[];
  isLoading: boolean;
  setLeads: (leads: Lead[]) => void;
  updateLeadStatus: (leadId: string, status: LeadStatus) => void;
  updateLeadDeal: (leadId: string, dealData: Partial<Lead>) => void;
  updateLeadEnquiries: (leadId: string, enquiries: Enquiry[]) => void;
  addLead: (lead: Lead) => void;
}

export const useLeadStore = create<LeadState>((set) => ({
  leads: [],
  isLoading: false,

  setLeads: (leads) => set({ leads }),

  updateLeadStatus: (leadId, status) => set((state) => ({
    leads: state.leads.map((lead) =>
      lead.id === leadId ? { ...lead, status } : lead
    ),
  })),

  updateLeadDeal: (leadId, dealData) => set((state) => ({
    leads: state.leads.map((lead) =>
      lead.id === leadId ? { ...lead, ...dealData } : lead
    ),
  })),

  updateLeadEnquiries: (leadId, enquiries) => set((state) => ({
    leads: state.leads.map((lead) =>
      lead.id === leadId ? { ...lead, enquiries } : lead
    ),
  })),

  addLead: (lead) => set((state) => ({
    leads: [lead, ...state.leads],
  })),
}));
