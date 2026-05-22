import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
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
  Menu,
  Searchbar,
  Badge,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTicketStore, useFilteredTickets, type Ticket, type TicketStatus, type TicketPriority } from '../store/useTicketStore';

// ── Types ────────────────────────────────────────────────────────────────────

interface Comment {
  id: string;
  authorName: string;
  authorRole: string;
  message: string;
  createdAt: string;
}

// ── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TicketStatus, { color: string; bg: string; label: string }> = {
  OPEN:                 { color: '#6366f1', bg: '#EEF2FF', label: 'Open' },
  IN_PROGRESS:          { color: '#d97706', bg: '#FFFBEB', label: 'In Progress' },
  WAITING_FOR_CUSTOMER: { color: '#7c3aed', bg: '#F5F3FF', label: 'Waiting' },
  RESOLVED:             { color: '#16a34a', bg: '#F0FDF4', label: 'Resolved' },
  CLOSED:               { color: '#6b7280', bg: '#F9FAFB', label: 'Closed' },
};

const PRIORITY_CONFIG: Record<TicketPriority, { color: string; bg: string; icon: string }> = {
  LOW:    { color: '#16a34a', bg: '#F0FDF4', icon: '↓' },
  MEDIUM: { color: '#d97706', bg: '#FFFBEB', icon: '→' },
  HIGH:   { color: '#dc2626', bg: '#FEF2F2', icon: '↑' },
  URGENT: { color: '#7c3aed', bg: '#F5F3FF', icon: '⚡' },
};

const STATUSES: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED'];
const PRIORITIES: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

// ── Main Component ───────────────────────────────────────────────────────────

export default function TicketScreen({ navigation }: any) {
  const theme = useTheme();

  // ── Store ────────────────────────────────────────────────────────────────
  const {
    loading,
    error,
    selectedTicket,
    searchQuery,
    statusFilter,
    fetchTickets,
    searchTickets,
    createTicket,
    updateTicketStatus,
    updateTicketPriority,
    assignTicket,
    addComment,
    deleteTicket,
    setSelectedTicket,
    setSearchQuery,
    setStatusFilter,
    clearError,
  } = useTicketStore();

  const filteredTickets = useFilteredTickets();

  // ── State ────────────────────────────────────────────────────────────────
  const [refreshing, setRefreshing] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');

  // Detail view
  const [showDetail, setShowDetail] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentInternal, setCommentInternal] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    description: '',
    submitterName: '',
    submitterEmail: '',
    submitterPhone: '',
    priority: 'MEDIUM' as TicketPriority,
    category: '',
  });

  // Status/priority menus
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);
  const [priorityMenuId, setPriorityMenuId] = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (error) {
      setSnackMsg(error);
      clearError();
    }
  }, [error]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  }, []);

  // ── Search ───────────────────────────────────────────────────────────────

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    await searchTickets(q);
  }, []);

  // ── Create ───────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!form.subject.trim() || !form.description.trim()) return;
    setCreating(true);
    try {
      await createTicket({
        subject: form.subject.trim(),
        description: form.description.trim(),
        submitterName: form.submitterName.trim() || undefined,
        submitterEmail: form.submitterEmail.trim() || undefined,
        submitterPhone: form.submitterPhone.trim() || undefined,
        priority: form.priority,
        category: form.category.trim() || undefined,
      });
      setSnackMsg('✅ Ticket created');
      setShowCreate(false);
      resetForm();
    } catch (e) {
      setSnackMsg('❌ Failed to create ticket');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () =>
    setForm({ subject: '', description: '', submitterName: '', submitterEmail: '',
              submitterPhone: '', priority: 'MEDIUM', category: '' });

  // ── Status / Priority update ──────────────────────────────────────────────

  const handleStatusChange = async (ticket: Ticket, status: TicketStatus) => {
    setStatusMenuId(null);
    try {
      await updateTicketStatus(ticket.id, status);
      setSnackMsg(`Status → ${STATUS_CONFIG[status].label}`);
    } catch (e) {
      setSnackMsg('❌ Update failed');
    }
  };

  const handlePriorityChange = async (ticket: Ticket, priority: TicketPriority) => {
    setPriorityMenuId(null);
    try {
      await updateTicketPriority(ticket.id, priority);
      setSnackMsg(`Priority → ${priority}`);
    } catch (e) {
      setSnackMsg('❌ Update failed');
    }
  };

  // ── Comment ───────────────────────────────────────────────────────────────

  const handleAddComment = async () => {
    if (!selectedTicket || !commentText.trim()) return;
    setSendingComment(true);
    try {
      await addComment(selectedTicket.id, commentText.trim(), commentInternal);
      setCommentText('');
      setSnackMsg('💬 Comment added');
    } catch (e) {
      setSnackMsg('❌ Comment failed');
    } finally {
      setSendingComment(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (ticket: Ticket) => {
    try {
      await deleteTicket(ticket.id);
      setShowDetail(false);
      setSnackMsg('🗑️ Ticket deleted');
    } catch (e) {
      setSnackMsg('❌ Delete failed');
    }
  };

  // ── Filtered list ─────────────────────────────────────────────────────────

  const openCount = filteredTickets.filter((t) => t.status === 'OPEN').length;

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderTicketCard = (ticket: Ticket) => {
    const sc = STATUS_CONFIG[ticket.status];
    const pc = PRIORITY_CONFIG[ticket.priority];

    return (
      <TouchableOpacity key={ticket.id} onPress={() => { setSelectedTicket(ticket); setShowDetail(true); }}>
        <Card style={[styles.card, ticket.slaBreached && styles.slaBreached]} elevation={1}>
          <Card.Content style={styles.cardContent}>
            {/* Header row */}
            <View style={styles.cardRow}>
              <Text style={[styles.ticketNum, { color: theme.colors.primary }]}>
                {ticket.ticketNumber}
              </Text>
              {ticket.isNew && (
                <Badge style={styles.newBadge}>NEW</Badge>
              )}
              {ticket.slaBreached && (
                <Chip compact style={styles.slaBadge} textStyle={{ color: '#fff', fontSize: 9 }}>
                  SLA ⚠️
                </Chip>
              )}
              <View style={{ flex: 1 }} />
              <Chip compact style={[styles.statusChip, { backgroundColor: sc.bg }]}
                textStyle={{ color: sc.color, fontSize: 10, fontWeight: '700' }}>
                {sc.label}
              </Chip>
            </View>

            {/* Subject */}
            <Text variant="titleSmall" style={styles.subject} numberOfLines={2}>
              {ticket.subject}
            </Text>

            {/* Meta row */}
            <View style={styles.metaRow}>
              <Chip compact style={[styles.priorityChip, { backgroundColor: pc.bg }]}
                textStyle={{ color: pc.color, fontSize: 10 }}>
                {pc.icon} {ticket.priority}
              </Chip>
              {ticket.submitterName && (
                <Text variant="bodySmall" style={styles.metaText}>
                  👤 {ticket.submitterName}
                </Text>
              )}
              {ticket.assignedToName && (
                <Text variant="bodySmall" style={styles.metaText}>
                  🧑‍💼 {ticket.assignedToName}
                </Text>
              )}
              <Text variant="bodySmall" style={[styles.metaText, { marginLeft: 'auto' }]}>
                {ticket.createdAtHuman}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search bar */}
      <Searchbar
        placeholder="Search tickets..."
        value={searchQuery}
        onChangeText={handleSearch}
        style={styles.searchBar}
        inputStyle={{ fontSize: 14 }}
      />

      {/* Status filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {(['ALL', ...STATUSES] as const).map((s) => (
          <Chip
            key={s}
            selected={statusFilter === s}
            onPress={() => setStatusFilter(s)}
            style={statusFilter === s ? { backgroundColor: theme.colors.primaryContainer } : undefined}
            textStyle={statusFilter === s ? { color: theme.colors.primary, fontWeight: '700' } : undefined}
            compact
          >
            {s === 'ALL' ? `All (${filteredTickets.length})` : `${STATUS_CONFIG[s].label} (${filteredTickets.filter(t => t.status === s).length})`}
          </Chip>
        ))}
      </ScrollView>

      {/* Ticket list */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredTickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48 }}>🎫</Text>
            <Text variant="titleMedium" style={{ color: '#888', marginTop: 12 }}>No tickets found</Text>
          </View>
        ) : (
          filteredTickets.map(renderTicketCard)
        )}
      </ScrollView>

      {/* FAB */}
      <FAB
        icon="plus"
        label="New Ticket"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => setShowCreate(true)}
      />

      <Portal>
        {/* ── Create Ticket Dialog ─────────────────────────────────────────── */}
        <Dialog visible={showCreate} onDismiss={() => { setShowCreate(false); resetForm(); }}
          style={styles.dialog}>
          <Dialog.Title>🎫 New Ticket</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 500 }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <ScrollView>
                <TextInput label="Subject *" value={form.subject}
                  onChangeText={(v) => setForm((f) => ({ ...f, subject: v }))}
                  mode="outlined" style={styles.input} />
                <TextInput label="Description *" value={form.description}
                  onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                  mode="outlined" multiline numberOfLines={4} style={styles.input} />
                <TextInput label="Customer Name" value={form.submitterName}
                  onChangeText={(v) => setForm((f) => ({ ...f, submitterName: v }))}
                  mode="outlined" style={styles.input} />
                <TextInput label="Customer Email" value={form.submitterEmail}
                  onChangeText={(v) => setForm((f) => ({ ...f, submitterEmail: v }))}
                  mode="outlined" keyboardType="email-address" style={styles.input} />
                <TextInput label="Customer Phone" value={form.submitterPhone}
                  onChangeText={(v) => setForm((f) => ({ ...f, submitterPhone: v }))}
                  mode="outlined" keyboardType="phone-pad" style={styles.input} />
                <TextInput label="Category" value={form.category}
                  onChangeText={(v) => setForm((f) => ({ ...f, category: v }))}
                  mode="outlined" placeholder="e.g. Billing, Technical" style={styles.input} />

                <Text variant="labelMedium" style={styles.fieldLabel}>Priority</Text>
                <View style={styles.chipRow}>
                  {PRIORITIES.map((p) => (
                    <Chip key={p} selected={form.priority === p}
                      onPress={() => setForm((f) => ({ ...f, priority: p }))}
                      style={form.priority === p
                        ? { backgroundColor: PRIORITY_CONFIG[p].bg }
                        : undefined}
                      textStyle={form.priority === p
                        ? { color: PRIORITY_CONFIG[p].color, fontWeight: '700' }
                        : undefined}
                      compact>
                      {PRIORITY_CONFIG[p].icon} {p}
                    </Chip>
                  ))}
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => { setShowCreate(false); resetForm(); }}>Cancel</Button>
            <Button mode="contained" onPress={handleCreate} loading={creating}
              disabled={!form.subject.trim() || !form.description.trim() || creating}>
              Create
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* ── Ticket Detail Dialog ─────────────────────────────────────────── */}
        {selectedTicket && (
          <Dialog visible={showDetail} onDismiss={() => setShowDetail(false)}
            style={[styles.dialog, { maxHeight: '90%' }]}>
            <Dialog.Title style={{ paddingBottom: 0 }}>
              <Text style={[styles.ticketNum, { color: theme.colors.primary }]}>
                {selectedTicket.ticketNumber}
              </Text>
            </Dialog.Title>
            <Dialog.ScrollArea style={{ maxHeight: 560 }}>
              <ScrollView>
                {/* Subject */}
                <Text variant="titleMedium" style={{ fontWeight: '700', marginBottom: 12 }}>
                  {selectedTicket.subject}
                </Text>

                {/* Status + Priority row */}
                <View style={[styles.chipRow, { marginBottom: 16 }]}>
                  {/* Status menu */}
                  <Menu
                    visible={statusMenuId === selectedTicket.id}
                    onDismiss={() => setStatusMenuId(null)}
                    anchor={
                      <TouchableOpacity onPress={() => setStatusMenuId(selectedTicket.id)}>
                        <Chip compact
                          style={{ backgroundColor: STATUS_CONFIG[selectedTicket.status].bg }}
                          textStyle={{ color: STATUS_CONFIG[selectedTicket.status].color, fontWeight: '700' }}>
                          {STATUS_CONFIG[selectedTicket.status].label} ▾
                        </Chip>
                      </TouchableOpacity>
                    }>
                    {STATUSES.map((s) => (
                      <Menu.Item key={s} title={STATUS_CONFIG[s].label}
                        onPress={() => handleStatusChange(selectedTicket, s)} />
                    ))}
                  </Menu>

                  {/* Priority menu */}
                  <Menu
                    visible={priorityMenuId === selectedTicket.id}
                    onDismiss={() => setPriorityMenuId(null)}
                    anchor={
                      <TouchableOpacity onPress={() => setPriorityMenuId(selectedTicket.id)}>
                        <Chip compact
                          style={{ backgroundColor: PRIORITY_CONFIG[selectedTicket.priority].bg }}
                          textStyle={{ color: PRIORITY_CONFIG[selectedTicket.priority].color, fontWeight: '700' }}>
                          {PRIORITY_CONFIG[selectedTicket.priority].icon} {selectedTicket.priority} ▾
                        </Chip>
                      </TouchableOpacity>
                    }>
                    {PRIORITIES.map((p) => (
                      <Menu.Item key={p} title={`${PRIORITY_CONFIG[p].icon} ${p}`}
                        onPress={() => handlePriorityChange(selectedTicket, p)} />
                    ))}
                  </Menu>

                  {selectedTicket.slaBreached && (
                    <Chip compact style={{ backgroundColor: '#FEF2F2' }}
                      textStyle={{ color: '#dc2626', fontSize: 10 }}>SLA Breached ⚠️</Chip>
                  )}
                </View>

                {/* Info table */}
                <View style={styles.infoTable}>
                  {selectedTicket.submitterName && infoRow('Customer', selectedTicket.submitterName)}
                  {selectedTicket.submitterEmail && infoRow('Email', selectedTicket.submitterEmail)}
                  {selectedTicket.submitterPhone && infoRow('Phone', selectedTicket.submitterPhone)}
                  {selectedTicket.assignedToName && infoRow('Assigned To', selectedTicket.assignedToName)}
                  {selectedTicket.category && infoRow('Category', selectedTicket.category)}
                  {selectedTicket.source && infoRow('Source', selectedTicket.source)}
                  {selectedTicket.createdAtHuman && infoRow('Created', selectedTicket.createdAtHuman)}
                </View>

                {/* Description */}
                <Text variant="labelMedium" style={styles.sectionLabel}>Description</Text>
                <Text variant="bodyMedium" style={styles.descText}>
                  {selectedTicket.description}
                </Text>

                {/* Comments */}
                {(selectedTicket.comments?.length ?? 0) > 0 && (
                  <>
                    <Text variant="labelMedium" style={[styles.sectionLabel, { marginTop: 16 }]}>
                      Comments ({selectedTicket.comments!.length})
                    </Text>
                    {selectedTicket.comments!.map((c) => (
                      <View key={c.id} style={styles.commentBubble}>
                        <View style={styles.commentHeader}>
                          <Avatar.Text size={24}
                            label={c.authorName.split(' ').map((n) => n[0]).join('')}
                            style={{ backgroundColor: theme.colors.primaryContainer }}
                            labelStyle={{ color: theme.colors.primary, fontSize: 9 }} />
                          <Text variant="labelSmall" style={{ fontWeight: '700', marginLeft: 6 }}>
                            {c.authorName}
                          </Text>
                          <Text variant="bodySmall" style={{ color: '#999', marginLeft: 'auto' }}>
                            {new Date(c.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <Text variant="bodySmall" style={styles.commentText}>{c.message}</Text>
                      </View>
                    ))}
                  </>
                )}

                {/* Add comment */}
                <Text variant="labelMedium" style={[styles.sectionLabel, { marginTop: 16 }]}>
                  Add Reply
                </Text>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  placeholder="Type your reply..."
                  style={styles.input}
                />
                <View style={[styles.chipRow, { marginBottom: 8 }]}>
                  <Chip selected={!commentInternal} onPress={() => setCommentInternal(false)} compact>
                    📤 Public
                  </Chip>
                  <Chip selected={commentInternal} onPress={() => setCommentInternal(true)} compact>
                    🔒 Internal
                  </Chip>
                </View>
                <Button mode="contained" onPress={handleAddComment}
                  loading={sendingComment}
                  disabled={!commentText.trim() || sendingComment}
                  style={{ marginBottom: 8 }}>
                  Send Reply
                </Button>

                <Divider style={{ marginVertical: 12 }} />

                {/* Delete */}
                <Button mode="outlined" textColor="#dc2626"
                  icon="delete-outline"
                  onPress={() => handleDelete(selectedTicket)}>
                  Delete Ticket
                </Button>
              </ScrollView>
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button onPress={() => setShowDetail(false)}>Close</Button>
            </Dialog.Actions>
          </Dialog>
        )}
      </Portal>

      <Snackbar visible={!!snackMsg} onDismiss={() => setSnackMsg('')} duration={3000}>
        {snackMsg}
      </Snackbar>
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function infoRow(label: string, value: string) {
  return (
    <View key={label} style={styles.infoRow}>
      <Text variant="labelSmall" style={styles.infoLabel}>{label}</Text>
      <Text variant="bodySmall" style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: { margin: 12, borderRadius: 12, elevation: 1 },
  filterRow: { maxHeight: 48, marginBottom: 4 },
  listContent: { padding: 12, paddingBottom: 100 },

  card: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 10 },
  slaBreached: { borderLeftWidth: 3, borderLeftColor: '#dc2626' },
  cardContent: { padding: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 },
  ticketNum: { fontFamily: 'monospace', fontSize: 12, fontWeight: '700' },
  newBadge: { backgroundColor: '#6366f1', fontSize: 9 },
  slaBadge: { backgroundColor: '#dc2626' },
  statusChip: {},
  subject: { fontWeight: '700', marginBottom: 8, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  priorityChip: {},
  metaText: { color: '#888', fontSize: 11 },

  emptyState: { alignItems: 'center', paddingTop: 80 },

  fab: { position: 'absolute', right: 20, bottom: 24, borderRadius: 28 },

  dialog: { borderRadius: 20, marginHorizontal: 8 },
  input: { marginBottom: 12 },
  fieldLabel: { marginBottom: 8, color: '#555' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },

  infoTable: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 6,
  },
  infoRow: { flexDirection: 'row', gap: 8 },
  infoLabel: { color: '#888', width: 90 },
  infoValue: { flex: 1, color: '#374151', fontWeight: '500' },

  sectionLabel: { color: '#6b7280', fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', fontSize: 11 },
  descText: { color: '#374151', lineHeight: 22, marginBottom: 8 },

  commentBubble: {
    backgroundColor: '#f5f5ff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  commentText: { color: '#374151', lineHeight: 18 },
});
