import { create } from 'zustand';

export interface Appointment {
  id: string;
  leadId: string;
  leadStatus: string;
  contactName: string;
  contactWaId: string;
  contactId: string;
  appointmentDateTime: string;
  title: string;
  /** Structured data collected from WhatsApp flow */
  collectedData?: Record<string, string>;
  meetingLink?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  createdAt: string;
  updatedAt?: string;
}

interface AppointmentState {
  appointments: Appointment[];
  todayAppointments: Appointment[];
  isLoading: boolean;
  setAppointments: (list: Appointment[]) => void;
  setTodayAppointments: (list: Appointment[]) => void;
  addAppointment: (appt: Appointment) => void;
  updateAppointment: (id: string, appt: Appointment) => void;
  removeAppointment: (id: string) => void;
}

export const useAppointmentStore = create<AppointmentState>((set) => ({
  appointments: [],
  todayAppointments: [],
  isLoading: false,

  setAppointments: (list) => set({ appointments: list }),
  setTodayAppointments: (list) => set({ todayAppointments: list }),

  addAppointment: (appt) =>
    set((state) => ({ appointments: [appt, ...state.appointments] })),

  updateAppointment: (id, updated) =>
    set((state) => ({
      appointments: state.appointments.map((a) => (a.id === id ? updated : a)),
      todayAppointments: state.todayAppointments.map((a) => (a.id === id ? updated : a)),
    })),

  removeAppointment: (id) =>
    set((state) => ({
      appointments: state.appointments.filter((a) => a.id !== id),
      todayAppointments: state.todayAppointments.filter((a) => a.id !== id),
    })),
}));
