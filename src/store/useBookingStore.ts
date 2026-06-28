import { create } from 'zustand';

export interface Booking {
  id: string;
  contactName: string;
  contactWaId: string;
  contactId: string;
  service: string;
  preferredSlot?: string;
  /** Structured data collected from WhatsApp flow */
  collectedData?: Record<string, string>;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  createdAt: string;
  updatedAt?: string;
  ownerName?: string;
  source?: string;
}

interface BookingState {
  bookings: Booking[];
  isLoading: boolean;
  setBookings: (list: Booking[]) => void;
  addBooking: (b: Booking) => void;
  updateBooking: (id: string, b: Booking) => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  bookings: [],
  isLoading: false,

  setBookings: (list) => set({ bookings: list }),

  addBooking: (b) =>
    set((state) => ({ bookings: [b, ...state.bookings] })),

  updateBooking: (id, updated) =>
    set((state) => ({
      bookings: state.bookings.map((b) => (b.id === id ? updated : b)),
    })),
}));
