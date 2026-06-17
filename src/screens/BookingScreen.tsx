import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Linking,
  Platform,
  TouchableOpacity,
  Animated,
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
  Snackbar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { appointmentApi, bookingApi, crmApi } from '../services/api';
import { useAppointmentStore, Appointment } from '../store/useAppointmentStore';
import { useBookingStore, Booking } from '../store/useBookingStore';
import { ScreenHeader } from '@components/global/Header/ScreenHeader';
import { tokens } from '../theme/tokens';
import { EmptyState } from '@components/global/EmptyState/EmptyState';

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

// ── SKELETON LOADER ─────────────────────────────────────────────────────────
const BookingSkeleton = () => {
  const theme = useTheme();
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const skeletonColor = theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  return (
    <View style={{ padding: tokens.spacing.md }}>
      <Animated.View style={{ opacity: anim }}>
        {/* Pills */}
        <View style={{ flexDirection: 'row', marginBottom: tokens.spacing.lg }}>
          <View style={{ width: 100, height: 40, backgroundColor: skeletonColor, borderRadius: 20, marginRight: 10 }} />
          <View style={{ width: 100, height: 40, backgroundColor: skeletonColor, borderRadius: 20, marginRight: 10 }} />
          <View style={{ width: 100, height: 40, backgroundColor: skeletonColor, borderRadius: 20 }} />
        </View>
        {/* List Skeleton */}
        <View style={{ height: 120, backgroundColor: skeletonColor, borderRadius: tokens.borderRadius.lg, marginBottom: tokens.spacing.md }} />
        <View style={{ height: 120, backgroundColor: skeletonColor, borderRadius: tokens.borderRadius.lg, marginBottom: tokens.spacing.md }} />
        <View style={{ height: 120, backgroundColor: skeletonColor, borderRadius: tokens.borderRadius.lg }} />
      </Animated.View>
    </View>
  );
};

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

export default function BookingScreen({ navigation, route }: any) {
  const theme = useTheme();
  const { appointments, setAppointments, addAppointment, updateAppointment } =
    useAppointmentStore();
  const { bookings, setBookings, updateBooking } = useBookingStore();

  // ── State ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'bookings'>('today');

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [snackMsg, setSnackMsg] = useState('');

  // Booking dialog
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
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

  const fetchContacts = useCallback(async () => {
    try {
      const res = await crmApi.getContacts();
      setContacts(res.data);
    } catch (e) {
      console.error('Error fetching contacts:', e);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchAppointments(), fetchContacts()]);
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
    if (!selectedContactId || !title.trim()) return;
    setBooking(true);
    try {
      const res = await appointmentApi.book({
        contactId: selectedContactId,
        appointmentDateTime: pickedDate.toISOString(),
        title: title.trim(),
        meetingLink: meetingLink.trim() || undefined,
      });
      addAppointment(res.data);
      setSnackMsg('✅ Appointment booked successfully.');
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
    setSelectedContactId(null);
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
      <View key={appt.id} style={[styles.apptCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
        <View style={styles.cardContent}>
          {/* Top row */}
          <View style={styles.cardRow}>
            <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.apptTitle, { color: theme.colors.onSurface }]}>{appt.title}</Text>
              <Text style={[styles.apptMeta, { color: theme.colors.onSurfaceVariant }]}>
                {formatDateTime(appt.appointmentDateTime)}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
              <Text style={{ color: cfg.color, fontSize: 10, fontWeight: '700' }}>{cfg.label}</Text>
            </View>
          </View>

          {/* Contact row */}
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => navigation.navigate('ContactProfile', { contactId: appt.contactId })}
          >
            <Avatar.Text
              size={32}
              label={appt.contactName?.split(' ').map((n) => n[0]).join('') || '?'}
              style={{ backgroundColor: `${tokens.colors.primary}15` }}
              labelStyle={{ color: tokens.colors.primary, fontSize: 12, fontWeight: 'bold' }}
            />
            <Text style={[styles.contactName, { color: theme.colors.onSurface }]}>
              {appt.contactName}
            </Text>
          </TouchableOpacity>

          {/* Notes */}
          {!!appt.notes && (
            <Text style={[styles.notesText, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
              📝 {appt.notes}
            </Text>
          )}

          {/* Actions */}
          {isScheduled && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
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
        </View>
      </View>
    );
  };

  const renderBookings = () => {
    if (bookings.length === 0) {
      return <EmptyState title="No Bookings" description="You don't have any customer bookings." icon={<Ionicons name="bookmark-outline" size={48} color={theme.colors.onSurfaceVariant} />} />;
    }

    return bookings.map((b) => (
      <View key={b.id} style={[styles.apptCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
        <View style={styles.cardContent}>
          <View style={styles.cardRow}>
            <View style={[styles.statusDot, { backgroundColor:
              b.status === 'CONFIRMED' ? '#1565C0' :
              b.status === 'COMPLETED' ? '#2E7D32' : '#B71C1C'
            }]} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.apptTitle, { color: theme.colors.onSurface }]}>{b.service}</Text>
              {b.preferredSlot && (
                <Text style={[styles.apptMeta, { color: theme.colors.onSurfaceVariant }]}>🕐 {b.preferredSlot}</Text>
              )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor:
              b.status === 'CONFIRMED' ? '#E3F2FD' :
              b.status === 'COMPLETED' ? '#E8F5E9' : '#FFEBEE'
            }]}>
              <Text style={{ color:
                b.status === 'CONFIRMED' ? '#1565C0' :
                b.status === 'COMPLETED' ? '#2E7D32' : '#B71C1C',
                fontSize: 10, fontWeight: '700'
              }}>{b.status}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => navigation.navigate('ContactProfile', { contactId: b.contactId })}
          >
            <Avatar.Text size={32}
              label={b.contactName?.split(' ').map((n: string) => n[0]).join('') || '?'}
              style={{ backgroundColor: `${tokens.colors.primary}15` }}
              labelStyle={{ color: tokens.colors.primary, fontSize: 12, fontWeight: 'bold' }}
            />
            <Text style={[styles.contactName, { color: theme.colors.onSurface }]}>
              {b.contactName}
            </Text>
          </TouchableOpacity>
          {b.collectedData && Object.keys(b.collectedData).length > 0 && (
            <Text style={[styles.notesText, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
              📝 {Object.entries(b.collectedData).map(([k, v]) => `${k}: ${v}`).join(' · ')}
            </Text>
          )}
          {b.status === 'CONFIRMED' && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
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
        </View>
      </View>
    ));
  };

  // ── Lead selector ─────────────────────────────────────────────────────────

  const selectedContact = contacts.find((c) => c.id === selectedContactId);

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Meetings" onBack={() => navigation.goBack()} />
      
      {/* Pill Navigation */}
      <View style={styles.pillContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: tokens.spacing.md }}>
          <TouchableOpacity 
            style={[styles.pill, activeTab === 'today' && { backgroundColor: tokens.colors.primary }]}
            onPress={() => setActiveTab('today')}
          >
            <Text style={[styles.pillText, activeTab === 'today' && { color: '#fff', fontWeight: 'bold' }]}>Today ({todayAppts.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.pill, activeTab === 'upcoming' && { backgroundColor: tokens.colors.primary }]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.pillText, activeTab === 'upcoming' && { color: '#fff', fontWeight: 'bold' }]}>Upcoming ({upcomingAppts.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.pill, activeTab === 'bookings' && { backgroundColor: tokens.colors.primary }]}
            onPress={() => setActiveTab('bookings')}
          >
            <Text style={[styles.pillText, activeTab === 'bookings' && { color: '#fff', fontWeight: 'bold' }]}>Bookings ({bookings.length})</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <BookingSkeleton />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'today' && (
            <>
              {todayAppts.length === 0 ? (
                <EmptyState title="No Appointments Today" description="Your schedule is clear for today! 🎉" icon={<Ionicons name="today-outline" size={48} color={theme.colors.onSurfaceVariant} />} />
              ) : (
                todayAppts.map(renderApptCard)
              )}
            </>
          )}

          {activeTab === 'upcoming' && (
            <>
              {upcomingAppts.length === 0 ? (
                <EmptyState title="No Upcoming Appointments" description="Nothing scheduled for the future." icon={<Ionicons name="calendar-outline" size={48} color={theme.colors.onSurfaceVariant} />} />
              ) : (
                upcomingAppts.map(renderApptCard)
              )}
            </>
          )}

          {activeTab === 'bookings' && renderBookings()}
        </ScrollView>
      )}

      {/* Premium FAB */}
      <FAB
        icon="calendar-plus"
        style={[styles.fab, { backgroundColor: tokens.colors.primary }]}
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
              {/* Contact selector */}
              <Text style={styles.fieldLabel}>Select Contact *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 12 }}
              >
                {contacts.map((c) => (
                  <Chip
                    key={c.id}
                    selected={selectedContactId === c.id}
                    onPress={() => setSelectedContactId(c.id)}
                    style={[
                      styles.leadChip,
                      selectedContactId === c.id && { backgroundColor: theme.colors.primaryContainer },
                    ]}
                    textStyle={selectedContactId === c.id ? { color: theme.colors.primary } : undefined}
                  >
                    {c.name || c.waId || 'Unknown'}
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
              <Text style={styles.fieldLabel}>Date & Time *</Text>
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
              disabled={!selectedContactId || !title.trim() || booking}
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
            <Text>
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
  pillContainer: {
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginRight: 10,
  },
  pillText: {
    fontSize: tokens.typography.bodyMedium.fontSize,
    color: '#666',
  },
  scrollContent: { padding: 16, paddingBottom: 100 },

  apptCard: {
    borderRadius: tokens.borderRadius.xl,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: { padding: 16 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  apptTitle: { fontWeight: '700', fontSize: 16, marginBottom: 2 },
  apptMeta: { fontSize: 13 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 10,
    borderRadius: 12,
    gap: 12,
  },
  contactName: { fontWeight: '600', fontSize: 14 },
  notesText: { fontSize: 13, marginTop: 12, fontStyle: 'italic' },
  divider: { height: 1, marginVertical: 12 },

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

  dialog: { borderRadius: 20 },
  fieldLabel: { marginBottom: 8, marginTop: 4, color: '#555', fontSize: 12, fontWeight: '600' },
  input: { marginBottom: 12 },
  leadChip: { marginRight: 8, height: 36 },
  dateTimeRow: { flexDirection: 'row', marginBottom: 12 },
});
