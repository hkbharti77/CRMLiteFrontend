import { create } from 'zustand';
import { ticketApi } from '../services/api';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_CUSTOMER' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketSource = 'MANUAL' | 'SUPPORT_FORM' | 'WHATSAPP' | 'EMAIL';

export interface TicketComment {
  id: string;
  authorName: string;
  authorRole: string;
  message: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  source: TicketSource;
  category?: string;
  submitterName?: string;
  submitterEmail?: string;
  submitterPhone?: string;
  contactId?: string;
  contactName?: string;
  contactWaId?: string;
  assignedToId?: string;
  assignedToName?: string;
  slaStatus?: string;
  slaBreached?: boolean;
  firstResponseDueAt?: string;
  resolutionDueAt?: string;
  firstRespondedAt?: string;
  comments?: TicketComment[];
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string;
  createdAtHuman?: string;
  isNew?: boolean;
}

export interface TicketStats {
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  totalTickets: number;
  slaBreachedTickets: number;
}

interface TicketStore {
  // State
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  loading: boolean;
  error: string | null;
  stats: TicketStats | null;
  
  // Filters
  searchQuery: string;
  statusFilter: TicketStatus | 'ALL';
  
  // Actions
  fetchTickets: () => Promise<void>;
  searchTickets: (query: string) => Promise<void>;
  createTicket: (data: {
    subject: string;
    description: string;
    submitterName?: string;
    submitterEmail?: string;
    submitterPhone?: string;
    priority?: TicketPriority;
    category?: string;
    contactId?: string;
    assignedToId?: string;
  }) => Promise<Ticket>;
  updateTicketStatus: (id: string, status: TicketStatus) => Promise<void>;
  updateTicketPriority: (id: string, priority: TicketPriority) => Promise<void>;
  addComment: (id: string, message: string, internal?: boolean) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  
  // Utility actions
  setSelectedTicket: (ticket: Ticket | null) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: TicketStatus | 'ALL') => void;
  clearError: () => void;
  refreshStats: () => Promise<void>;
}

export const useTicketStore = create<TicketStore>((set, get) => ({
  // Initial state
  tickets: [],
  selectedTicket: null,
  loading: false,
  error: null,
  stats: null,
  searchQuery: '',
  statusFilter: 'ALL',

  // Fetch all tickets
  fetchTickets: async () => {
    set({ loading: true, error: null });
    try {
      const response = await ticketApi.getAll(0, 50);
      const tickets = response.data.content || response.data || [];
      set({ tickets, loading: false });
      
      // Calculate stats
      const stats: TicketStats = {
        totalTickets: tickets.length,
        openTickets: tickets.filter((t: Ticket) => t.status === 'OPEN').length,
        inProgressTickets: tickets.filter((t: Ticket) => t.status === 'IN_PROGRESS').length,
        resolvedTickets: tickets.filter((t: Ticket) => t.status === 'RESOLVED').length,
        slaBreachedTickets: tickets.filter((t: Ticket) => t.slaBreached).length,
      };
      set({ stats });
    } catch (error: any) {
      console.error('Failed to fetch tickets:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch tickets', 
        loading: false 
      });
    }
  },

  // Search tickets
  searchTickets: async (query: string) => {
    set({ loading: true, error: null, searchQuery: query });
    try {
      if (query.trim().length < 2) {
        await get().fetchTickets();
        return;
      }
      
      const response = await ticketApi.search(query);
      const tickets = response.data.content || response.data || [];
      set({ tickets, loading: false });
    } catch (error: any) {
      console.error('Failed to search tickets:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to search tickets', 
        loading: false 
      });
    }
  },

  // Create new ticket
  createTicket: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await ticketApi.create(data);
      const newTicket = response.data;
      
      set((state) => ({
        tickets: [newTicket, ...state.tickets],
        loading: false
      }));
      
      // Refresh stats
      await get().refreshStats();
      
      return newTicket;
    } catch (error: any) {
      console.error('Failed to create ticket:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to create ticket', 
        loading: false 
      });
      throw error;
    }
  },

  // Update ticket status
  updateTicketStatus: async (id: string, status: TicketStatus) => {
    try {
      const response = await ticketApi.updateStatus(id, status);
      const updatedTicket = response.data;
      
      set((state) => ({
        tickets: state.tickets.map((t) => 
          t.id === id ? updatedTicket : t
        ),
        selectedTicket: state.selectedTicket?.id === id ? updatedTicket : state.selectedTicket
      }));
      
      await get().refreshStats();
    } catch (error: any) {
      console.error('Failed to update ticket status:', error);
      set({ error: error.response?.data?.message || 'Failed to update status' });
      throw error;
    }
  },

  // Update ticket priority
  updateTicketPriority: async (id: string, priority: TicketPriority) => {
    try {
      const response = await ticketApi.updatePriority(id, priority);
      const updatedTicket = response.data;
      
      set((state) => ({
        tickets: state.tickets.map((t) => 
          t.id === id ? updatedTicket : t
        ),
        selectedTicket: state.selectedTicket?.id === id ? updatedTicket : state.selectedTicket
      }));
    } catch (error: any) {
      console.error('Failed to update ticket priority:', error);
      set({ error: error.response?.data?.message || 'Failed to update priority' });
      throw error;
    }
  },

  // Add comment to ticket
  addComment: async (id: string, message: string, internal = false) => {
    try {
      const response = await ticketApi.addComment(id, message, internal);
      const updatedTicket = response.data;
      
      set((state) => ({
        tickets: state.tickets.map((t) => 
          t.id === id ? updatedTicket : t
        ),
        selectedTicket: state.selectedTicket?.id === id ? updatedTicket : state.selectedTicket
      }));
    } catch (error: any) {
      console.error('Failed to add comment:', error);
      set({ error: error.response?.data?.message || 'Failed to add comment' });
      throw error;
    }
  },

  // Delete ticket
  deleteTicket: async (id: string) => {
    try {
      await ticketApi.delete(id);
      
      set((state) => ({
        tickets: state.tickets.filter((t) => t.id !== id),
        selectedTicket: state.selectedTicket?.id === id ? null : state.selectedTicket
      }));
      
      await get().refreshStats();
    } catch (error: any) {
      console.error('Failed to delete ticket:', error);
      set({ error: error.response?.data?.message || 'Failed to delete ticket' });
      throw error;
    }
  },

  // Utility actions
  setSelectedTicket: (ticket: Ticket | null) => {
    set({ selectedTicket: ticket });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setStatusFilter: (status: TicketStatus | 'ALL') => {
    set({ statusFilter: status });
  },

  clearError: () => {
    set({ error: null });
  },

  // Refresh stats
  refreshStats: async () => {
    const { tickets } = get();
    const stats: TicketStats = {
      totalTickets: tickets.length,
      openTickets: tickets.filter((t) => t.status === 'OPEN').length,
      inProgressTickets: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
      resolvedTickets: tickets.filter((t) => t.status === 'RESOLVED').length,
      slaBreachedTickets: tickets.filter((t) => t.slaBreached).length,
    };
    set({ stats });
  },
}));

// Selectors for filtered data
export const useFilteredTickets = () => {
  const { tickets, statusFilter } = useTicketStore();
  
  return tickets.filter((ticket) => {
    if (statusFilter === 'ALL') return true;
    return ticket.status === statusFilter;
  });
};

export const useTicketStats = () => {
  const { stats } = useTicketStore();
  return stats;
};
