import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Linking,
  TouchableOpacity,
  Animated,
  Platform,
  KeyboardAvoidingView,
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
  Switch,
  Searchbar,
  List,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { appointmentApi, bookingApi, crmApi, integrationApi } from '../services/api';
import { useAppointmentStore, Appointment } from '../store/useAppointmentStore';
import { ScreenHeader, EmptyState, ConfirmDialog } from '@components/global';
import { tokens } from '../theme/tokens';

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

export default function AppointmentScreen({ navigation, route }: any) {
  const theme = useTheme();
  const { appointments, setAppointments, addAppointment, updateAppointment } =
    useAppointmentStore();


  // ── State ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'past'>('today');

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [snackMsg, setSnackMsg] = useState('');

  // Booking dialog
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [autoGenerateMeet, setAutoGenerateMeet] = useState(false);
  const [pickedDate, setPickedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [booking, setBooking] = useState(false);

  // Action confirmation
  const [actionAppt, setActionAppt] = useState<Appointment | null>(null);
  const [actionType, setActionType] = useState<'complete' | 'cancel' | 'noshow' | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);

  // Meet Duration dialog
  const [showMeetDurationDialog, setShowMeetDurationDialog] = useState(false);
  const [meetDurationAppt, setMeetDurationAppt] = useState<Appointment | null>(null);
  const [meetDurationMinutes, setMeetDurationMinutes] = useState(60);

  // Detail dialog
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Google Meet
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // ── Contact Picker State ──────────────────────────────────────────────────
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');

  // ── Data Fetching ─────────────────────────────────────────────────────────

  const fetchAppointments = useCallback(async () => {
    try {
      const apptRes = await appointmentApi.getAll();
      setAppointments(apptRes.data);
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
      // Check Google connection status
      try {
        const gRes = await integrationApi.getGoogleStatus();
        setGoogleConnected(gRes.data.connected);
      } catch { setGoogleConnected(false); }
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
    if (!title.trim()) {
      setSnackMsg('❌ Title is required.');
      return;
    }
    setBooking(true);
    try {
      const res = await appointmentApi.book({
        contactId: selectedContactId,
        appointmentDateTime: pickedDate.toISOString(),
        title: title.trim(),
        meetingLink: meetingLink.trim() || undefined,
        clientEmail: clientEmail.trim() || undefined,
        generateMeetLink: autoGenerateMeet,
        durationMinutes: durationMinutes,
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
    setClientEmail('');
    setAutoGenerateMeet(false);
    setDurationMinutes(60);
    setPickedDate(new Date());
  };

  // ── Generate Google Meet Link ─────────────────────────────────────────────

  const handleGenerateMeetLink = async (appt: Appointment, duration: number = 60) => {
    if (!googleConnected) {
      // Redirect user to connect Google
      try {
        const res = await integrationApi.getGoogleAuthUrl();
        Linking.openURL(res.data.url);
      } catch (e) {
        setSnackMsg('❌ Could not get Google auth URL.');
      }
      return;
    }
    setGeneratingMeetId(appt.id);
    setShowMeetDurationDialog(false);
    try {
      const res = await appointmentApi.generateMeetLink(appt.id, duration);
      const link = res.data.meetLink;
      updateAppointment(appt.id, { ...appt, meetingLink: link });
      setSnackMsg('✅ Google Meet link generated and emailed to client!');
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Failed to generate Meet link.';
      const code = e?.response?.data?.code;
      if (code === 'GOOGLE_NOT_CONNECTED') {
        setGoogleConnected(false);
        setSnackMsg('⚠️ Please connect your Google account first.');
      } else {
        setSnackMsg(`❌ ${msg}`);
      }
    } finally {
      setGeneratingMeetId(null);
    }
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



  // ── Render helpers ────────────────────────────────────────────────────────

  const renderApptCard = (appt: Appointment) => {
    const cfg = STATUS_CONFIG[appt.status];
    const isScheduled = appt.status === 'SCHEDULED';

    // Theme-aware status colors
    const statusColor = theme.dark 
      ? (appt.status === 'SCHEDULED' ? '#90CAF9' : appt.status === 'COMPLETED' ? '#A5D6A7' : appt.status === 'CANCELLED' ? '#EF9A9A' : '#FFCC80')
      : cfg.color;
    const statusBg = theme.dark
      ? (appt.status === 'SCHEDULED' ? 'rgba(21, 101, 192, 0.2)' : appt.status === 'COMPLETED' ? 'rgba(46, 125, 50, 0.2)' : appt.status === 'CANCELLED' ? 'rgba(183, 28, 28, 0.2)' : 'rgba(230, 81, 0, 0.2)')
      : cfg.bg;

    return (
      <TouchableOpacity 
        key={appt.id} 
        style={[styles.apptCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
        onPress={() => { setSelectedDetail(appt); setShowDetailDialog(true); }}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Top row */}
          <View style={styles.cardRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.apptTitle, { color: theme.colors.onSurface }]}>{appt.title}</Text>
              <Text style={[styles.apptMeta, { color: theme.colors.onSurfaceVariant }]}>
                {formatDateTime(appt.appointmentDateTime)}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={{ color: statusColor, fontSize: 10, fontWeight: '700' }}>{cfg.label}</Text>
            </View>
          </View>

          {/* Owner & Source Badges */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            {appt.ownerName && (
              <View style={[styles.ownerBadge, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', marginBottom: 0 }]}>
                <Text style={[styles.ownerText, { color: theme.colors.onSurfaceVariant }]}>Agent: {appt.ownerName}</Text>
              </View>
            )}
            {appt.source && appt.source !== 'MANUAL' && (
              <View style={[styles.ownerBadge, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', marginBottom: 0 }]}>
                <Text style={[styles.ownerText, { color: theme.colors.onSurfaceVariant }]}>
                  {appt.source === 'WHATSAPP' ? '📱 WhatsApp' : appt.source === 'WEB_BOT' ? '🌐 Web Bot' : appt.source}
                </Text>
              </View>
            )}
          </View>

          {/* Contact row */}
          <TouchableOpacity
            style={[styles.contactRow, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}
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
          {appt.collectedData && Object.keys(appt.collectedData).length > 0 && (
            <Text style={[styles.notesText, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
              📝 {Object.entries(appt.collectedData).map(([k, v]) => `${k}: ${v}`).join(' · ')}
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
                ) : (
                  <Button
                    mode="contained-tonal"
                    compact
                    icon="google"
                    loading={generatingMeetId === appt.id}
                    disabled={generatingMeetId === appt.id}
                    onPress={() => {
                      if (!googleConnected) {
                        handleGenerateMeetLink(appt, 60);
                      } else {
                        setMeetDurationAppt(appt);
                        setMeetDurationMinutes(60);
                        setShowMeetDurationDialog(true);
                      }
                    }}
                    style={[
                      styles.actionBtn,
                      { backgroundColor: theme.dark ? 'rgba(66,133,244,0.15)' : '#E8F0FE' }
                    ]}
                    textColor={theme.dark ? '#90CAF9' : '#1565C0'}
                  >
                    {googleConnected ? 'Meet' : 'Connect'}
                  </Button>
                )}
                <Button
                  mode="contained-tonal"
                  compact
                  icon="check"
                  onPress={() => openAction(appt, 'complete')}
                  style={[
                    styles.actionBtn, 
                    { 
                      backgroundColor: theme.dark 
                        ? 'rgba(34, 197, 94, 0.15)' 
                        : '#E8F5E9' 
                    }
                  ]}
                  textColor={theme.dark ? '#4ADE80' : '#2E7D32'}
                >
                  Done
                </Button>
                <Button
                  mode="contained-tonal"
                  compact
                  icon="account-cancel"
                  onPress={() => openAction(appt, 'noshow')}
                  style={[
                    styles.actionBtn, 
                    { 
                      backgroundColor: theme.dark 
                        ? 'rgba(245, 158, 11, 0.15)' 
                        : '#FFF3E0' 
                    }
                  ]}
                  textColor={theme.dark ? '#FBBF24' : '#E65100'}
                >
                  No Show
                </Button>
                <IconButton
                  icon="close-circle-outline"
                  size={20}
                  iconColor={theme.dark ? '#EF9A9A' : '#B71C1C'}
                  onPress={() => openAction(appt, 'cancel')}
                />
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };



  // ── Lead selector ─────────────────────────────────────────────────────────

  const selectedContact = contacts.find((c) => c.id === selectedContactId);

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Meetings" onBack={() => navigation.goBack()} />
      
      {/* Pill Navigation */}
      <View style={[styles.pillContainer, { borderBottomColor: theme.colors.outlineVariant }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: tokens.spacing.md }}>
          <TouchableOpacity 
            style={[
              styles.pill, 
              activeTab === 'today' 
                ? { backgroundColor: theme.colors.primary } 
                : { backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
            ]}
            onPress={() => setActiveTab('today')}
          >
            <Text 
              style={[
                styles.pillText, 
                activeTab === 'today' 
                  ? { color: '#fff', fontWeight: 'bold' } 
                  : { color: theme.colors.onSurfaceVariant }
              ]}
            >
              Today ({todayAppts.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.pill, 
              activeTab === 'upcoming' 
                ? { backgroundColor: theme.colors.primary } 
                : { backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
            ]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text 
              style={[
                styles.pillText, 
                activeTab === 'upcoming' 
                  ? { color: '#fff', fontWeight: 'bold' } 
                  : { color: theme.colors.onSurfaceVariant }
              ]}
            >
              Upcoming ({upcomingAppts.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.pill, 
              activeTab === 'past' 
                ? { backgroundColor: theme.colors.primary } 
                : { backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
            ]}
            onPress={() => setActiveTab('past')}
          >
            <Text 
              style={[
                styles.pillText, 
                activeTab === 'past' 
                  ? { color: '#fff', fontWeight: 'bold' } 
                  : { color: theme.colors.onSurfaceVariant }
              ]}
            >
              Past ({pastAppts.length})
            </Text>
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

          {activeTab === 'past' && (
            <>
              {pastAppts.length === 0 ? (
                <EmptyState title="No Past Appointments" description="You have no previous appointments on record." icon={<Ionicons name="time-outline" size={48} color={theme.colors.onSurfaceVariant} />} />
              ) : (
                pastAppts.map(renderApptCard)
              )}
            </>
          )}
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
          style={[styles.detailDialog, { maxHeight: '90%', backgroundColor: '#FFFFFF', padding: 0 }]}
        >
          <View style={styles.dialogHeader}>
            <View>
              <Text variant="titleLarge" style={styles.dialogTitleText}>
                New Appointment
              </Text>
              <Text style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>Schedule a meeting with a contact</Text>
            </View>
            <IconButton icon="close" size={20} onPress={() => { setShowBookingDialog(false); resetBookingForm(); }} style={styles.closeIcon} />
          </View>

          <Divider style={styles.divider} />

          <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flexShrink: 1 }}>
              <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={styles.dialogScrollContent}>
                {/* Contact selector (Searchable Picker) */}
                <Text variant="labelMedium" style={styles.modernSectionLabel}>Select Contact (Optional)</Text>
                
                <TouchableOpacity 
                  onPress={() => setShowContactPicker(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    borderRadius: 8,
                    marginBottom: 16,
                    backgroundColor: '#F8FAFC'
                  }}
                >
                  <Text style={{ color: selectedContactId ? '#0F172A' : '#94A3B8', fontSize: 14 }}>
                    {selectedContactId 
                      ? contacts.find(c => c.id === selectedContactId)?.name || contacts.find(c => c.id === selectedContactId)?.waId || 'Unknown Contact'
                      : 'Search and select a contact...'}
                  </Text>
                  <Ionicons name="search" size={20} color="#94A3B8" />
                </TouchableOpacity>

                {/* Title */}
                <TextInput
                  label="Title *"
                  value={title}
                  onChangeText={setTitle}
                  mode="outlined"
                  placeholder="e.g. Product Demo, Sales Call"
                  style={styles.modernInput}
                  outlineColor="#E2E8F0" activeOutlineColor="#0F766E"
                />

                {/* Client Email Override */}
                <TextInput
                  label="Client Email(s) (optional)"
                  value={clientEmail}
                  onChangeText={setClientEmail}
                  mode="outlined"
                  placeholder="e.g. client@email.com, other@email.com"
                  left={<TextInput.Icon icon="email" />}
                  style={styles.modernInput}
                  outlineColor="#E2E8F0" activeOutlineColor="#0F766E"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                {/* Date & Time pickers */}
                <Text variant="labelMedium" style={[styles.modernSectionLabel, { marginTop: 8 }]}>Date & Time *</Text>
                {Platform.OS === 'web' ? (
                  <View style={styles.dateTimeRow}>
                    {React.createElement('input', {
                      type: 'date',
                      value: `${pickedDate.getFullYear()}-${String(pickedDate.getMonth() + 1).padStart(2, '0')}-${String(pickedDate.getDate()).padStart(2, '0')}`,
                      onChange: (e: any) => {
                        if (e.target.value) {
                           const [y, m, d] = e.target.value.split('-');
                           const updated = new Date(pickedDate);
                           updated.setFullYear(parseInt(y), parseInt(m) - 1, parseInt(d));
                           setPickedDate(updated);
                        }
                      },
                      style: { flex: 1, marginRight: 8, padding: 10, borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 14, fontFamily: 'inherit', color: '#0F172A', outline: 'none' }
                    })}
                    {React.createElement('input', {
                      type: 'time',
                      value: `${String(pickedDate.getHours()).padStart(2, '0')}:${String(pickedDate.getMinutes()).padStart(2, '0')}`,
                      onChange: (e: any) => {
                        if (e.target.value) {
                           const [h, m] = e.target.value.split(':');
                           const updated = new Date(pickedDate);
                           updated.setHours(parseInt(h, 10), parseInt(m, 10));
                           setPickedDate(updated);
                        }
                      },
                      style: { flex: 1, padding: 10, borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 14, fontFamily: 'inherit', color: '#0F172A', outline: 'none' }
                    })}
                  </View>
                ) : (
                  <View style={styles.dateTimeRow}>
                    <Button
                      mode="outlined"
                      icon="calendar"
                      onPress={() => setShowDatePicker(true)}
                      style={{ flex: 1, marginRight: 8, borderColor: '#E2E8F0' }}
                      textColor="#0F172A"
                    >
                      {pickedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Button>
                    <Button
                      mode="outlined"
                      icon="clock-outline"
                      onPress={() => setShowTimePicker(true)}
                      style={{ flex: 1, borderColor: '#E2E8F0' }}
                      textColor="#0F172A"
                    >
                      {pickedDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </Button>
                  </View>
                )}

                {Platform.OS !== 'web' && showDatePicker && (
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

                {Platform.OS !== 'web' && showTimePicker && (
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

                {/* Meeting duration */}
                <Text variant="labelMedium" style={[styles.modernSectionLabel, { marginTop: 16 }]}>Duration</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingVertical: 8 }}>
                  {[15, 30, 45, 60, 90, 120].map(m => (
                    <Chip
                      key={m}
                      selected={durationMinutes === m}
                      onPress={() => setDurationMinutes(m)}
                      style={{ 
                        marginRight: 8, 
                        backgroundColor: durationMinutes === m ? tokens.colors.primary + '20' : '#F1F5F9',
                        borderColor: durationMinutes === m ? tokens.colors.primary : 'transparent',
                        borderWidth: 1
                      }}
                      textStyle={{ color: durationMinutes === m ? tokens.colors.primary : '#475569' }}
                    >
                      {m} min
                    </Chip>
                  ))}
                </ScrollView>

                {/* Meeting link */}
                {!autoGenerateMeet && (
                  <TextInput
                    label="Meeting Link (optional)"
                    value={meetingLink}
                    onChangeText={setMeetingLink}
                    mode="outlined"
                    placeholder="https://meet.google.com/..."
                    left={<TextInput.Icon icon="video" />}
                    style={[styles.modernInput, { marginTop: 8 }]}
                    outlineColor="#E2E8F0" activeOutlineColor="#0F766E"
                  />
                )}

                {/* Auto Generate Meet Link Switch */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 16, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <View style={{ flex: 1, marginRight: 16 }}>
                    <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 14 }}>Google Meet</Text>
                    <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Auto-generate and attach link</Text>
                  </View>
                  <Switch
                    value={autoGenerateMeet}
                    onValueChange={setAutoGenerateMeet}
                    color={tokens.colors.primary}
                  />
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </Dialog.ScrollArea>

          <View style={styles.dialogFooter}>
            <Button onPress={() => { setShowBookingDialog(false); resetBookingForm(); }} textColor="#64748B">
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleBook}
              loading={booking}
              disabled={!title.trim() || booking}
              style={styles.primaryBtn}
              contentStyle={{ paddingHorizontal: 12 }}
            >
              Book Appointment
            </Button>
          </View>
        </Dialog>

        {/* ── Contact Picker Dialog ───────────────────────────────────────── */}
        <Dialog
          visible={showContactPicker}
          onDismiss={() => { setShowContactPicker(false); setContactSearchQuery(''); }}
          style={[styles.detailDialog, { maxHeight: '90%', backgroundColor: '#FFFFFF', padding: 0 }]}
        >
          <View style={styles.dialogHeader}>
            <Text variant="titleLarge" style={styles.dialogTitleText}>
              Select Contact
            </Text>
            <IconButton icon="close" size={20} onPress={() => { setShowContactPicker(false); setContactSearchQuery(''); }} style={styles.closeIcon} />
          </View>
          <Divider style={styles.divider} />
          
          <View style={{ padding: 12 }}>
            <Searchbar
              placeholder="Search by name, email, or ID"
              onChangeText={setContactSearchQuery}
              value={contactSearchQuery}
              style={{ backgroundColor: '#F1F5F9', elevation: 0 }}
              inputStyle={{ fontSize: 14 }}
              iconColor="#64748B"
            />
          </View>

          <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 16 }}>
              {contacts
                .filter(c => {
                  if (!contactSearchQuery.trim()) return true;
                  const q = contactSearchQuery.toLowerCase();
                  return (
                    (c.name && c.name.toLowerCase().includes(q)) ||
                    (c.email && c.email.toLowerCase().includes(q)) ||
                    (c.waId && c.waId.toLowerCase().includes(q)) ||
                    (c.id && c.id.toLowerCase().includes(q)) ||
                    (c.displayId && c.displayId.toLowerCase().includes(q))
                  );
                })
                .map((c) => (
                  <List.Item
                    key={c.id}
                    title={c.name || c.waId || 'Unknown'}
                    description={c.email ? c.email : `ID: ${c.displayId || c.id.substring(0,6)}`}
                    left={props => <List.Icon {...props} icon="account-circle-outline" color={tokens.colors.primary} />}
                    right={props => selectedContactId === c.id ? <List.Icon {...props} icon="check" color={tokens.colors.primary} /> : null}
                    onPress={() => {
                      setSelectedContactId(c.id);
                      setShowContactPicker(false);
                      setContactSearchQuery('');
                    }}
                    style={{
                      borderBottomWidth: 1,
                      borderBottomColor: '#F1F5F9',
                      backgroundColor: selectedContactId === c.id ? tokens.colors.primary + '10' : 'transparent'
                    }}
                    titleStyle={{ color: '#0F172A', fontWeight: selectedContactId === c.id ? '700' : '400' }}
                    descriptionStyle={{ color: '#64748B' }}
                  />
                ))}
              {contacts.length > 0 && contacts.filter(c => {
                if (!contactSearchQuery.trim()) return true;
                const q = contactSearchQuery.toLowerCase();
                return (
                  (c.name && c.name.toLowerCase().includes(q)) ||
                  (c.email && c.email.toLowerCase().includes(q)) ||
                  (c.waId && c.waId.toLowerCase().includes(q)) ||
                  (c.id && c.id.toLowerCase().includes(q)) ||
                  (c.displayId && c.displayId.toLowerCase().includes(q))
                );
              }).length === 0 && (
                <Text style={{ textAlign: 'center', color: '#94A3B8', marginTop: 24 }}>No contacts match "{contactSearchQuery}"</Text>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          
          <View style={[styles.dialogFooter, { justifyContent: 'space-between' }]}>
            <Button 
              onPress={() => {
                setSelectedContactId(null);
                setShowContactPicker(false);
                setContactSearchQuery('');
              }} 
              textColor="#EF4444"
            >
              Clear Selection
            </Button>
            <Button onPress={() => { setShowContactPicker(false); setContactSearchQuery(''); }} textColor="#64748B">
              Close
            </Button>
          </View>
        </Dialog>

        {/* ── Action Confirmation Dialog ──────────────────────────────────── */}
        <ConfirmDialog
          visible={showActionDialog}
          title={
            actionType === 'complete' ? 'Mark as Completed?' :
            actionType === 'cancel' ? 'Cancel Appointment?' :
            'Mark as No Show?'
          }
          message={
            actionType === 'complete' ? `"${actionAppt?.title}" will be marked as completed.` :
            actionType === 'cancel' ? `"${actionAppt?.title}" will be cancelled.` :
            `"${actionAppt?.title}" — contact didn't show up.`
          }
          onConfirm={confirmAction}
          onCancel={() => setShowActionDialog(false)}
          confirmLabel="Confirm"
          cancelLabel="No"
          destructive={actionType === 'cancel'}
        />

        {/* ── Detail Dialog (Modernized to match TicketScreen) ──────────────────────────────────────────────── */}
        <Dialog 
          visible={showDetailDialog} 
          onDismiss={() => { setShowDetailDialog(false); setSelectedDetail(null); }}
          style={[styles.detailDialog, { maxHeight: '90%', backgroundColor: '#FFFFFF', padding: 0 }]}
        >
          <View style={styles.dialogHeader}>
            <View>
              <Text style={[styles.ticketNum, { color: theme.colors.primary, fontSize: 13 }]}>
                Appointment Details
              </Text>
              <Text variant="titleLarge" style={styles.dialogTitleText}>
                {selectedDetail?.title || 'Details'}
              </Text>
            </View>
            <IconButton icon="close" size={20} onPress={() => { setShowDetailDialog(false); setSelectedDetail(null); }} style={styles.closeIcon} />
          </View>

          <Divider style={styles.divider} />

          <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
            <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={styles.dialogScrollContent}>
              <View style={styles.infoGrid}>
                {selectedDetail?.collectedData && Object.keys(selectedDetail.collectedData).length > 0 ? (
                  Object.entries(selectedDetail.collectedData).map(([key, value], idx) => (
                    <View key={idx} style={styles.infoBlockContainer}>
                      <View style={styles.infoBlockContent}>
                        <Text style={styles.infoBlockLabel}>
                          {key.replace(/_/g, ' ')}
                        </Text>
                        <Text style={styles.infoBlockValue}>{String(value)}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={{ fontSize: 32 }}>📝</Text>
                    <Text variant="titleMedium" style={{ color: '#888', marginTop: 8 }}>No extra details</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </Dialog.ScrollArea>

          <View style={styles.dialogFooter}>
            <Button 
              mode="contained" 
              onPress={() => { setShowDetailDialog(false); setSelectedDetail(null); }} 
              style={styles.primaryBtn} 
              contentStyle={{ paddingHorizontal: 12 }}
            >
              Done
            </Button>
          </View>
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
  ownerBadge: {
    marginTop: tokens.spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  ownerText: {
    fontSize: tokens.typography.labelSmall.fontSize,
    color: '#666',
    fontWeight: '500',
  },
  
  // --- Modern Ticket Detail Dialog Styles (Copied from TicketScreen) ---
  modernSectionLabel: { color: '#0F172A', fontWeight: '700', marginBottom: 12 },
  modernInput: { marginBottom: 16, backgroundColor: '#FFFFFF' },
  detailDialog: { borderRadius: 20, marginHorizontal: 8 },
  dialogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingBottom: 16 },
  dialogTitleText: { fontWeight: '700', color: '#0F172A', marginTop: 4 },
  closeIcon: { margin: 0 },
  divider: { backgroundColor: '#E2E8F0' },
  dialogScrollContent: { padding: 20, paddingBottom: 40 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  infoBlockContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC', 
    padding: 12, 
    borderRadius: 12, 
    width: '48%', 
    borderWidth: 1, 
    borderColor: '#F1F5F9' 
  },
  infoBlockContent: { flex: 1 },
  infoBlockLabel: { 
    color: '#64748B', 
    fontSize: 11, 
    fontWeight: '600', 
    marginBottom: 2, 
    textTransform: 'uppercase' 
  },
  infoBlockValue: { color: '#0F172A', fontSize: 13, fontWeight: '500' },
  dialogFooter: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    padding: 16, 
    borderTopWidth: 1, 
    borderTopColor: '#E2E8F0', 
    backgroundColor: '#F8FAFC', 
    gap: 12 
  },
  primaryBtn: { borderRadius: 8, backgroundColor: tokens.colors.primary },
  ticketNum: { fontFamily: 'monospace', fontSize: 12, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingTop: 40, width: '100%' },
});
