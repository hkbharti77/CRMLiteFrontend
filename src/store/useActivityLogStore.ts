import { create } from 'zustand';

/**
 * Mirrors the ActivityLog entity from the backend.
 * A single, unified entry in the CRM customer timeline.
 */
export interface ActivityLogEntry {
  id: string;
  entityType: 'LEAD' | 'BOOKING' | 'APPOINTMENT' | 'CONTACT';
  entityId?: string;
  activityType: string;   // e.g. 'LEAD_CREATED', 'BOOKING_CONFIRMED'
  source: string;         // 'FLOW' | 'MANUAL' | 'API' | 'SYSTEM'
  summary: string;        // Human-readable description for the UI
  payload?: string;       // Optional JSON string for detail
  createdAt: string;
}

/** Color + icon config for each activityType */
export const ACTIVITY_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  LEAD_CREATED:           { color: '#1565C0', bg: '#E3F2FD', icon: 'account-plus-outline' },
  LEAD_STATUS_CHANGED:    { color: '#6A1B9A', bg: '#F3E5F5', icon: 'swap-horizontal' },
  LEAD_ENQUIRY_ADDED:     { color: '#00695C', bg: '#E0F2F1', icon: 'comment-plus-outline' },
  BOOKING_CONFIRMED:      { color: '#1B5E20', bg: '#E8F5E9', icon: 'bookmark-check-outline' },
  BOOKING_CANCELLED:      { color: '#B71C1C', bg: '#FFEBEE', icon: 'bookmark-remove-outline' },
  BOOKING_COMPLETED:      { color: '#2E7D32', bg: '#E8F5E9', icon: 'check-circle-outline' },
  BOOKING_NO_SHOW:        { color: '#E65100', bg: '#FFF3E0', icon: 'account-cancel-outline' },
  APPOINTMENT_SCHEDULED:  { color: '#1565C0', bg: '#E3F2FD', icon: 'calendar-check-outline' },
  APPOINTMENT_CANCELLED:  { color: '#B71C1C', bg: '#FFEBEE', icon: 'calendar-remove-outline' },
  APPOINTMENT_COMPLETED:  { color: '#2E7D32', bg: '#E8F5E9', icon: 'calendar-check' },
  APPOINTMENT_NO_SHOW:    { color: '#E65100', bg: '#FFF3E0', icon: 'calendar-alert' },
};

/** Get color config for an activity type (with fallback) */
export function getActivityConfig(activityType: string) {
  return ACTIVITY_CONFIG[activityType] ?? { color: '#555', bg: '#F5F5F5', icon: 'information-outline' };
}

interface ActivityLogState {
  // Per-contact timelines keyed by contactId
  timelineByContact: Record<string, ActivityLogEntry[]>;
  isLoadingTimeline: boolean;

  setTimeline: (contactId: string, entries: ActivityLogEntry[]) => void;
  setLoadingTimeline: (loading: boolean) => void;
}

export const useActivityLogStore = create<ActivityLogState>((set) => ({
  timelineByContact: {},
  isLoadingTimeline: false,

  setTimeline: (contactId, entries) =>
    set((state) => ({
      timelineByContact: { ...state.timelineByContact, [contactId]: entries },
    })),

  setLoadingTimeline: (loading) => set({ isLoadingTimeline: loading }),
}));
