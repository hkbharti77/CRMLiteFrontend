import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Linking,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  useTheme,
  FAB,
  Portal,
  Dialog,
  Button,
  TextInput,
  Chip,
  Card,
  Avatar,
  IconButton,
  Divider,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { appointmentApi, bookingApi, crmApi } from '../services/api';
import { useAppointmentStore, Appointment } from '../store/useAppointmentStore';
import { useBookingStore, Booking } from '../store/useBookingStore';

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatTimeOnly(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

function isPast(iso: string): boolean {
  return new Date(iso) < new Date();
}

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Appointment['status'],
  { color: string; bg: string; label: string; icon: string }
> = {
  SCHEDULED:  { color: '#1565C0', bg: '#E3F2FD', label: 'Scheduled',  icon: 'calendar-outline' },
  COMPLETED:  { color: '#2E7D32', bg: '#E8F5E9', label: 'Completed',  icon: 'checkmark-circle-outline' },
  CANCELLED:  { color: '#B71C1C', bg: '#FFEBEE', label: 'Cancelled',  icon: 'close-circle-outline' },
  NO_SHOW:    { color: '#E65100', bg: '#FFF3E0', label: 'No Show',    icon: 'alert-circle-outline' },
};

// ── Main Component ───────────────────────────────────────────────────────────

export default function BookingScreen({ navigation }: any) {
  const theme = useTheme();
  const { appointments, setAppointments, addAppointment, updateAppointment } =
    useAppointmentStore();
  const { bookings, setBookings, updateBooking } = useBookingStore();

  // ── State ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = React.useState<'appointments' | 'bookings'>('appointments');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [snackMsg, setSnackMsg] = useState('');

  // Booking dialog
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [pickedDate, setPickedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [booking, setBooking] = useState(false);

  // Action confirmation
  const [actionAppt, setActionAppt] = useState<Appointment | null>(null);
  const [actionType, setActionType] = useState<'complete' | 'cancel' | 'noshow' | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchAppointments = useCallback(async () => {
    try {
      const [apptRes, bookRes] = await Promise.all([
        appointmentApi.getAll(),
        bookingApi.getAll(),
      ]);
      setAppointments(apptRes.data);
      setBookings(bookRes.data);
    } catch (e) {
      console.error('Error fetching data:', e);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await crmApi.getLeads();
      // Only show active leads (not closed)
      const active = res.data.filter(
        (l: any) => l.status !== 'CLOSED_WON' && l.status !== 'CLOSED_LOST'
      );
      setLeads(active);
    } catch (e) {
      console.error('Error fetching leads:', e);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchAppointments(), fetchLeads()]);
      setLoading(false);
    };
    init();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  }, []);

  // ── Grouping ──────────────────────────────────────────────────────────────

  const todayAppts = appointments.filter(
    (a) => isToday(a.appointmentDateTime) && a.status === 'SCHEDULED'
  );
  const upcomingAppts = appointments.filter(
    (a) => !isToday(a.appointmentDateTime) && !isPast(a.appointmentDateTime) && a.status === 'SCHEDULED'
  );
  const pastAppts = appointments.filter(
    (a) => isPast(a.appointmentDateTime) || a.status !== 'SCHEDULED'
  );

  // ── Book appointment ───────────────────────────────────────────────────────

  const handleBook = async () => {
    if (!selectedLeadId || !title.trim()) return;
    setBooking(true);
    try {
      const res = await appointmentApi.book({
        leadId: selectedLeadId,
        appointmentDateTime: pickedDate.toISOString(),
        title: title.trim(),
        meetingLink: meetingLink.trim() || undefined,
      });
      addAppointment(res.data);
      setSnackMsg('✅ Appointment booked! Lead moved to BOOKED stage.');
      resetBookingForm();
      setShowBookingDialog(false);
    } catch (e) {
      console.error('Booking error:', e);
      setSnackMsg('❌ Booking failed. Try again.');
    } finally {
      setBooking(false);
    }
  };

  const resetBookingForm = () => {
    setSelectedLeadId(null);
    setTitle('');
    setMeetingLink('');
    setPickedDate(new Date());
  };

  // ── Actions (complete / cancel / noshow) ──────────────────────────────────

  const openAction = (appt: Appointment, type: 'complete' | 'cancel' | 'noshow') => {
    setActionAppt(appt);
    setActionType(type);
    setShowActionDialog(true);
  };

  const confirmAction = async () => {
    if (!actionAppt || !actionType) return;
    try {
      let res;
      if (actionType === 'complete') res = await appointmentApi.complete(actionAppt.id);
      else if (actionType === 'cancel') res = await appointmentApi.cancel(actionAppt.id);
      else res = await appointmentApi.noShow(actionAppt.id);
      updateAppointment(actionAppt.id, res.data);
      setSnackMsg(`✅ Marked as ${res.data.status}`);
    } catch (e) {
      setSnackMsg('❌ Action failed.');
    } finally {
      setShowActionDialog(false);
      setActionAppt(null);
    }
  };

  const handleBookingAction = async (booking: Booking, type: 'complete' | 'cancel' | 'noshow') => {
    try {
      let res;
      if (type === 'complete') res = await bookingApi.complete(booking.id);
      else if (type === 'cancel') res = await bookingApi.cancel(booking.id);
      else res = await bookingApi.noShow(booking.id);
      updateBooking(booking.id, res.data);
      setSnackMsg(`✅ Booking marked as ${res.data.status}`);
    } catch (e) {
      setSnackMsg('❌ Action failed.');
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderApptCard = (appt: Appointment) => {
    const cfg = STATUS_CONFIG[appt.status];
    const isScheduled = appt.status === 'SCHEDULED';

    return (
      <Card key={appt.id} style={styles.apptCard} elevation={1}>
        <Card.Content style={styles.cardContent}>
          {/* Top row */}
          <View style={styles.cardRow}>
            <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text variant="titleSmall" style={styles.apptTitle}>{appt.title}</Text>
              <Text variant="bodySmall" style={styles.apptMeta}>
                {formatDateTime(appt.appointmentDateTime)}
              </Text>
            </View>
            <Chip
              compact
              style={[styles.statusChip, { backgroundColor: cfg.bg }]}
              textStyle={{ color: cfg.color, fontSize: 10, fontWeight: '700' }}
            >
              {cfg.label}
            </Chip>
          </View>

          {/* Contact row */}
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => navigation.navigate('ContactProfile', { contactId: appt.contactId })}
          >
            <Avatar.Text
              size={28}
              label={appt.contactName?.split(' ').map((n) => n[0]).join('') || '?'}
              style={{ backgroundColor: theme.colors.primaryContainer }}
              labelStyle={{ color: theme.colors.primary, fontSize: 11 }}
            />
            <Text variant="labelSmall" style={[styles.contactName, { color: theme.colors.primary }]}>
              {appt.contactName}
            </Text>
          </TouchableOpacity>

          {/* Notes */}
          {!!appt.notes && (
            <Text variant="bodySmall" style={styles.notesText} numberOfLines={2}>
              📝 {appt.notes}
            </Text>
          )}

          {/* Actions */}
          {isScheduled && (
            <>
              <Divider style={{ marginVertical: 8 }} />
              <View style={styles.actionsRow}>
                {appt.meetingLink ? (
                  <Button
                    mode="contained-tonal"
                    compact
                    icon="video"
                    onPress={() => Linking.openURL(appt.meetingLink!)}
                    style={styles.actionBtn}
                  >
                    Join
                  </Button>
                ) : null}
                <Button
                  mode="contained-tonal"
                  compact
                  icon="check"
                  onPress={() => openAction(appt, 'complete')}
                  style={[styles.actionBtn, { backgroundColor: '#E8F5E9' }]}
                  textColor="#2E7D32"
                >
                  Done
                </Button>
                <Button
                  mode="contained-tonal"
                  compact
                  icon="account-cancel"
                  onPress={() => openAction(appt, 'noshow')}
                  style={[styles.actionBtn, { backgroundColor: '#FFF3E0' }]}
                  textColor="#E65100"
                >
                  No Show
                </Button>
                <IconButton
                  icon="close-circle-outline"
                  size={20}
                  iconColor="#B71C1C"
                  onPress={() => openAction(appt, 'cancel')}
                />
              </View>
            </>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderSection = (label: string, icon: string, data: Appointment[], emptyText: string) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon as any} size={16} color={theme.colors.primary} />
        <Text variant="titleSmall" style={[styles.sectionLabel, { color: theme.colors.primary }]}>
          {label}
        </Text>
        <Chip compact style={styles.countChip}>{data.length}</Chip>
      </View>
      {data.length === 0 ? (
        <Text variant="bodySmall" style={styles.emptyText}>{emptyText}</Text>
      ) : (
        data.map(renderApptCard)
      )}
    </View>
  );

  // ── Lead selector ─────────────────────────────────────────────────────────

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  // ── Main render ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary bar */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text variant="headlineSmall" style={[styles.summaryNum, { color: theme.colors.primary }]}>
              {todayAppts.length}
            </Text>
            <Text variant="labelSmall" style={styles.summaryLabel}>Today</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: theme.colors.outlineVariant }]} />
          <View style={styles.summaryItem}>
            <Text variant="headlineSmall" style={[styles.summaryNum, { color: '#1565C0' }]}>
              {upcomingAppts.length}
            </Text>
            <Text variant="labelSmall" style={styles.summaryLabel}>Upcoming</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: theme.colors.outlineVariant }]} />
          <View style={styles.summaryItem}>
            <Text variant="headlineSmall" style={[styles.summaryNum, { color: '#666' }]}>
              {bookings.length}
            </Text>
            <Text variant="labelSmall" style={styles.summaryLabel}>Bookings</Text>
          </View>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          <Button
            mode={activeTab === 'appointments' ? 'contained' : 'outlined'}
            onPress={() => setActiveTab('appointments')}
            style={styles.tabBtn}
            compact
          >
            📅 Appointments
          </Button>
          <Button
            mode={activeTab === 'bookings' ? 'contained' : 'outlined'}
            onPress={() => setActiveTab('bookings')}
            style={styles.tabBtn}
            compact
          >
            🎉 Bookings
          </Button>
        </View>

        {activeTab === 'appointments' ? (
          <>
            {renderSection('Today', 'today-outline', todayAppts, 'No appointments today 🎉')}
            {renderSection('Upcoming', 'calendar-outline', upcomingAppts, 'No upcoming appointments')}
            {renderSection('Past & Completed', 'time-outline', pastAppts, 'No past appointments')}
          </>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bookmark-outline" size={16} color={theme.colors.primary} />
              <Text variant="titleSmall" style={[styles.sectionLabel, { color: theme.colors.primary }]}>
                All Bookings
              </Text>
              <Chip compact style={styles.countChip}>{bookings.length}</Chip>
            </View>
            {bookings.length === 0 ? (
              <Text variant="bodySmall" style={styles.emptyText}>No bookings yet</Text>
            ) : (
              bookings.map((b) => (
                <Card key={b.id} style={styles.apptCard} elevation={1}>
                  <Card.Content style={styles.cardContent}>
                    <View style={styles.cardRow}>
                      <View style={[styles.statusDot, { backgroundColor:
                        b.status === 'CONFIRMED' ? '#1565C0' :
                        b.status === 'COMPLETED' ? '#2E7D32' : '#B71C1C'
                      }]} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text variant="titleSmall" style={styles.apptTitle}>{b.service}</Text>
                        {b.preferredSlot && (
                          <Text variant="bodySmall" style={styles.apptMeta}>🕐 {b.preferredSlot}</Text>
                        )}
                      </View>
                      <Chip compact style={[styles.statusChip, { backgroundColor:
                        b.status === 'CONFIRMED' ? '#E3F2FD' :
                        b.status === 'COMPLETED' ? '#E8F5E9' : '#FFEBEE'
                      }]} textStyle={{ color:
                        b.status === 'CONFIRMED' ? '#1565C0' :
                        b.status === 'COMPLETED' ? '#2E7D32' : '#B71C1C',
                        fontSize: 10, fontWeight: '700'
                      }}>
                        {b.status}
                      </Chip>
                    </View>
                    <TouchableOpacity
                      style={styles.contactRow}
                      onPress={() => navigation.navigate('ContactProfile', { contactId: b.contactId })}
                    >
                      <Avatar.Text size={28}
                        label={b.contactName?.split(' ').map((n: string) => n[0]).join('') || '?'}
                        style={{ backgroundColor: theme.colors.primaryContainer }}
                        labelStyle={{ color: theme.colors.primary, fontSize: 11 }}
                      />
                      <Text variant="labelSmall" style={[styles.contactName, { color: theme.colors.primary }]}>
                        {b.contactName}
                      </Text>
                    </TouchableOpacity>
                    {b.collectedData && Object.keys(b.collectedData).length > 0 && (
                      <Text variant="bodySmall" style={styles.notesText} numberOfLines={2}>
                        📝 {Object.entries(b.collectedData).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </Text>
                    )}
                    {b.status === 'CONFIRMED' && (
                      <>
                        <Divider style={{ marginVertical: 8 }} />
                        <View style={styles.actionsRow}>
                          <Button mode="contained-tonal" compact icon="check"
                            onPress={() => handleBookingAction(b, 'complete')}
                            style={[styles.actionBtn, { backgroundColor: '#E8F5E9' }]} textColor="#2E7D32">
                            Done
                          </Button>
                          <Button mode="contained-tonal" compact icon="account-cancel"
                            onPress={() => handleBookingAction(b, 'noshow')}
                            style={[styles.actionBtn, { backgroundColor: '#FFF3E0' }]} textColor="#E65100">
                            No Show
                          </Button>
                          <IconButton icon="close-circle-outline" size={20} iconColor="#B71C1C"
                            onPress={() => handleBookingAction(b, 'cancel')} />
                        </View>
                      </>
                    )}
                  </Card.Content>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => setShowBookingDialog(true)}
        label="Book Meeting"
      />

      <Portal>
        {/* ── Booking Dialog ──────────────────────────────────────────────── */}
        <Dialog
          visible={showBookingDialog}
          onDismiss={() => { setShowBookingDialog(false); resetBookingForm(); }}
          style={styles.dialog}
        >
          <Dialog.Title>📅 New Appointment</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 480 }}>
            <ScrollView>
              {/* Lead selector */}
              <Text variant="labelMedium" style={styles.fieldLabel}>Select Lead *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 12 }}
              >
                {leads.map((l) => (
                  <Chip
                    key={l.id}
                    selected={selectedLeadId === l.id}
                    onPress={() => setSelectedLeadId(l.id)}
                    style={[
                      styles.leadChip,
                      selectedLeadId === l.id && { backgroundColor: theme.colors.primaryContainer },
                    ]}
                    textStyle={selectedLeadId === l.id ? { color: theme.colors.primary } : undefined}
                  >
                    {l.contact?.name || 'Unknown'}
                  </Chip>
                ))}
              </ScrollView>

              {/* Title */}
              <TextInput
                label="Title *"
                value={title}
                onChangeText={setTitle}
                mode="outlined"
                placeholder="e.g. Product Demo, Sales Call"
                style={styles.input}
              />

              {/* Date & Time pickers */}
              <Text variant="labelMedium" style={styles.fieldLabel}>Date & Time *</Text>
              <View style={styles.dateTimeRow}>
                <Button
                  mode="outlined"
                  icon="calendar"
                  onPress={() => setShowDatePicker(true)}
                  style={{ flex: 1, marginRight: 8 }}
                >
                  {pickedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Button>
                <Button
                  mode="outlined"
                  icon="clock-outline"
                  onPress={() => setShowTimePicker(true)}
                  style={{ flex: 1 }}
                >
                  {pickedDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </Button>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={pickedDate}
                  mode="date"
                  minimumDate={new Date()}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, d) => {
                    setShowDatePicker(false);
                    if (d) {
                      const updated = new Date(pickedDate);
                      updated.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                      setPickedDate(updated);
                    }
                  }}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={pickedDate}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, d) => {
                    setShowTimePicker(false);
                    if (d) {
                      const updated = new Date(pickedDate);
                      updated.setHours(d.getHours(), d.getMinutes());
                      setPickedDate(updated);
                    }
                  }}
                />
              )}

              {/* Meeting link */}
              <TextInput
                label="Meeting Link (optional)"
                value={meetingLink}
                onChangeText={setMeetingLink}
                mode="outlined"
                placeholder="https://meet.google.com/..."
                left={<TextInput.Icon icon="video" />}
                style={styles.input}
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => { setShowBookingDialog(false); resetBookingForm(); }}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleBook}
              loading={booking}
              disabled={!selectedLeadId || !title.trim() || booking}
            >
              Book ✓
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* ── Action Confirmation Dialog ──────────────────────────────────── */}
        <Dialog visible={showActionDialog} onDismiss={() => setShowActionDialog(false)}>
          <Dialog.Title>
            {actionType === 'complete' && '✅ Mark as Completed?'}
            {actionType === 'cancel'   && '❌ Cancel Appointment?'}
            {actionType === 'noshow'   && '⚠️ Mark as No Show?'}
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {actionType === 'complete' &&
                `"${actionAppt?.title}" will be marked as completed.`}
              {actionType === 'cancel' &&
                `"${actionAppt?.title}" will be cancelled.`}
              {actionType === 'noshow' &&
                `"${actionAppt?.title}" — contact didn't show up.`}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowActionDialog(false)}>No</Button>
            <Button mode="contained" onPress={confirmAction}>Confirm</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={!!snackMsg}
        onDismiss={() => setSnackMsg('')}
        duration={3000}
      >
        {snackMsg}
      </Snackbar>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },

  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNum: { fontWeight: 'bold', fontSize: 28 },
  summaryLabel: { color: '#888', marginTop: 2 },
  summaryDivider: { width: 1, marginHorizontal: 12 },

  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  sectionLabel: { fontWeight: '700', flex: 1 },
  countChip: { height: 24, backgroundColor: 'rgba(0,0,0,0.06)' },
  emptyText: { color: '#999', textAlign: 'center', paddingVertical: 16 },

  apptCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
  },
  cardContent: { padding: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  apptTitle: { fontWeight: '700', fontSize: 14 },
  apptMeta: { color: '#888', marginTop: 2 },
  statusChip: { marginLeft: 8 },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  contactName: { fontWeight: '600', textDecorationLine: 'underline' },
  notesText: { color: '#666', marginTop: 8, fontStyle: 'italic' },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionBtn: { marginRight: 4 },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    borderRadius: 28,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    borderRadius: 20,
  },

  dialog: { borderRadius: 20 },
  fieldLabel: { marginBottom: 8, marginTop: 4, color: '#555' },
  input: { marginBottom: 12 },
  leadChip: { marginRight: 8, height: 36 },
  dateTimeRow: { flexDirection: 'row', marginBottom: 12 },
});
