import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Linking,
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

import { useBookingStore, Booking } from '../store/useBookingStore';
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


// ── Main Component ───────────────────────────────────────────────────────────

export default function BookingScreen({ navigation, route }: any) {
  const theme = useTheme();
  const { bookings, setBookings, updateBooking } = useBookingStore();

  // ── State ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  // Detail dialog
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchBookings = useCallback(async () => {
    try {
      const bookRes = await bookingApi.getAll();
      setBookings(bookRes.data);
    } catch (e) {
      console.error('Error fetching data:', e);
    }
  }, []);


  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchBookings();
      setLoading(false);
    };
    init();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, []);



  const renderBookings = () => {
    if (bookings.length === 0) {
      return <EmptyState title="No Bookings" description="You don't have any customer bookings." icon={<Ionicons name="bookmark-outline" size={48} color={theme.colors.onSurfaceVariant} />} />;
    }

    return bookings.map((b) => (
      <TouchableOpacity 
        key={b.id} 
        style={[styles.apptCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
        onPress={() => { setSelectedDetail(b); setShowDetailDialog(true); }}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardRow}>
            <View 
              style={[
                styles.statusDot, 
                { 
                  backgroundColor:
                    b.status === 'CONFIRMED' ? (theme.dark ? '#90CAF9' : '#1565C0') :
                    b.status === 'COMPLETED' ? (theme.dark ? '#A5D6A7' : '#2E7D32') : 
                    (theme.dark ? '#EF9A9A' : '#B71C1C')
                }
              ]} 
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.apptTitle, { color: theme.colors.onSurface }]}>{b.service}</Text>
              {b.preferredSlot && (
                <Text style={[styles.apptMeta, { color: theme.colors.onSurfaceVariant }]}>🕐 {b.preferredSlot}</Text>
              )}
            </View>
            <View 
              style={[
                styles.statusBadge, 
                { 
                  backgroundColor:
                    b.status === 'CONFIRMED' ? (theme.dark ? 'rgba(21, 101, 192, 0.2)' : '#E3F2FD') :
                    b.status === 'COMPLETED' ? (theme.dark ? 'rgba(46, 125, 50, 0.2)' : '#E8F5E9') : 
                    (theme.dark ? 'rgba(183, 28, 28, 0.2)' : '#FFEBEE')
                }
              ]}
            >
              <Text 
                style={{ 
                  color:
                    b.status === 'CONFIRMED' ? (theme.dark ? '#90CAF9' : '#1565C0') :
                    b.status === 'COMPLETED' ? (theme.dark ? '#A5D6A7' : '#2E7D32') : 
                    (theme.dark ? '#EF9A9A' : '#B71C1C'),
                  fontSize: 10, 
                  fontWeight: '700'
                }}
              >
                {b.status}
              </Text>
            </View>
          </View>

          {/* Owner & Source Badges */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            {b.ownerName && (
              <View style={[styles.ownerBadge, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', marginBottom: 0 }]}>
                <Text style={[styles.ownerText, { color: theme.colors.onSurfaceVariant }]}>Agent: {b.ownerName}</Text>
              </View>
            )}
            {b.source && b.source !== 'MANUAL' && (
              <View style={[styles.ownerBadge, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', marginBottom: 0 }]}>
                <Text style={[styles.ownerText, { color: theme.colors.onSurfaceVariant }]}>
                  {b.source === 'WHATSAPP' ? '📱 WhatsApp' : b.source === 'WEB_BOT' ? '🌐 Web Bot' : b.source}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[styles.contactRow, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}
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
                <Button 
                  mode="contained-tonal" 
                  compact 
                  icon="check"
                  onPress={() => handleBookingAction(b, 'complete')}
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
                  onPress={() => handleBookingAction(b, 'noshow')}
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
                  onPress={() => handleBookingAction(b, 'cancel')} 
                />
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    ));
  };

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Bookings" onBack={() => navigation.goBack()} />
      
      {loading ? (
        <BookingSkeleton />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {renderBookings()}
        </ScrollView>
      )}

      <Portal>


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
