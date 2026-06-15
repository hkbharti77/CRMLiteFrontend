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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTicketStore, useFilteredTickets, type Ticket, type TicketStatus, type TicketPriority } from '../store/useTicketStore';
import { colors } from '../theme/colors';

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
          style={[styles.dialog, { maxHeight: '90%', backgroundColor: '#FFFFFF', padding: 0 }]}>
          
          <View style={styles.dialogHeader}>
            <View>
              <Text variant="titleLarge" style={styles.dialogTitleText}>
                New Ticket
              </Text>
              <Text style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>Create a new support request</Text>
            </View>
            <IconButton icon="close" size={20} onPress={() => { setShowCreate(false); resetForm(); }} style={styles.closeIcon} />
          </View>

          <Divider style={styles.divider} />

          <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flexShrink: 1 }}>
              <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={styles.dialogScrollContent}>
                
                <Text variant="labelMedium" style={styles.modernSectionLabel}>Ticket Details</Text>
                <TextInput label="Subject *" value={form.subject}
                  onChangeText={(v) => setForm((f) => ({ ...f, subject: v }))}
                  mode="outlined" style={styles.modernInput} 
                  outlineColor="#E2E8F0" activeOutlineColor="#0F766E" />
                <TextInput label="Description *" value={form.description}
                  onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                  mode="outlined" multiline numberOfLines={4} style={styles.modernInput}
                  outlineColor="#E2E8F0" activeOutlineColor="#0F766E" />
                  
                <Text variant="labelMedium" style={[styles.modernSectionLabel, { marginTop: 8 }]}>Customer Information</Text>
                <TextInput label="Customer Name" value={form.submitterName}
                  onChangeText={(v) => setForm((f) => ({ ...f, submitterName: v }))}
                  mode="outlined" style={styles.modernInput}
                  outlineColor="#E2E8F0" activeOutlineColor="#0F766E" />
                <TextInput label="Customer Email" value={form.submitterEmail}
                  onChangeText={(v) => setForm((f) => ({ ...f, submitterEmail: v }))}
                  mode="outlined" keyboardType="email-address" style={styles.modernInput}
                  outlineColor="#E2E8F0" activeOutlineColor="#0F766E" />
                <TextInput label="Customer Phone" value={form.submitterPhone}
                  onChangeText={(v) => setForm((f) => ({ ...f, submitterPhone: v }))}
                  mode="outlined" keyboardType="phone-pad" style={styles.modernInput}
                  outlineColor="#E2E8F0" activeOutlineColor="#0F766E" />
                  
                <Text variant="labelMedium" style={[styles.modernSectionLabel, { marginTop: 8 }]}>Classification</Text>
                <TextInput label="Category" value={form.category}
                  onChangeText={(v) => setForm((f) => ({ ...f, category: v }))}
                  mode="outlined" placeholder="e.g. Billing, Technical" style={styles.modernInput}
                  outlineColor="#E2E8F0" activeOutlineColor="#0F766E" />

                <Text variant="labelMedium" style={styles.fieldLabelModern}>Priority</Text>
                <View style={styles.chipRowCreate}>
                  {PRIORITIES.map((p) => (
                    <TouchableOpacity key={p} onPress={() => setForm((f) => ({ ...f, priority: p }))} activeOpacity={0.7}>
                      <View style={[styles.modernChip, { 
                        backgroundColor: form.priority === p ? PRIORITY_CONFIG[p].bg : '#F8FAFC',
                        borderColor: form.priority === p ? PRIORITY_CONFIG[p].color + '40' : '#E2E8F0',
                        borderWidth: 1 
                      }]}>
                        <Text style={{ 
                          color: form.priority === p ? PRIORITY_CONFIG[p].color : '#64748B', 
                          fontWeight: form.priority === p ? '700' : '500', 
                          fontSize: 12 
                        }}>
                          {PRIORITY_CONFIG[p].icon} {p}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </Dialog.ScrollArea>

          <View style={styles.dialogFooter}>
            <Button onPress={() => { setShowCreate(false); resetForm(); }} textColor="#64748B">Cancel</Button>
            <Button mode="contained" onPress={handleCreate} loading={creating}
              disabled={!form.subject.trim() || !form.description.trim() || creating}
              style={styles.primaryBtn} contentStyle={{ paddingHorizontal: 12 }}>
              Create Ticket
            </Button>
          </View>
        </Dialog>

        {/* ── Ticket Detail Dialog ─────────────────────────────────────────── */}
        {selectedTicket && (
          <Dialog visible={showDetail} onDismiss={() => setShowDetail(false)}
            style={[styles.dialog, { maxHeight: '90%', backgroundColor: '#FFFFFF', padding: 0 }]}>
            
            <View style={styles.dialogHeader}>
              <View>
                <Text style={[styles.ticketNum, { color: theme.colors.primary, fontSize: 13 }]}>
                  {selectedTicket.ticketNumber}
                </Text>
                <Text variant="titleLarge" style={styles.dialogTitleText}>
                  {selectedTicket.subject}
                </Text>
              </View>
              <IconButton icon="close" size={20} onPress={() => setShowDetail(false)} style={styles.closeIcon} />
            </View>

            <Divider style={styles.divider} />

            <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
              <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={styles.dialogScrollContent}>
                
                {/* Status + Priority row */}
                <View style={styles.chipRowDetail}>
                  {/* Status menu */}
                  <Menu
                    visible={statusMenuId === selectedTicket.id}
                    onDismiss={() => setStatusMenuId(null)}
                    anchor={
                      <TouchableOpacity onPress={() => setStatusMenuId(selectedTicket.id)} activeOpacity={0.7}>
                        <View style={[styles.modernChip, { backgroundColor: STATUS_CONFIG[selectedTicket.status].bg, borderColor: STATUS_CONFIG[selectedTicket.status].color + '40', borderWidth: 1 }]}>
                          <Text style={{ color: STATUS_CONFIG[selectedTicket.status].color, fontWeight: '600', fontSize: 12 }}>
                            {STATUS_CONFIG[selectedTicket.status].label} ▾
                          </Text>
                        </View>
                      </TouchableOpacity>
                    }>
                    {STATUSES.map((s) => (
                      <Menu.Item key={s} title={STATUS_CONFIG[s].label} onPress={() => handleStatusChange(selectedTicket, s)} />
                    ))}
                  </Menu>

                  {/* Priority menu */}
                  <Menu
                    visible={priorityMenuId === selectedTicket.id}
                    onDismiss={() => setPriorityMenuId(null)}
                    anchor={
                      <TouchableOpacity onPress={() => setPriorityMenuId(selectedTicket.id)} activeOpacity={0.7}>
                        <View style={[styles.modernChip, { backgroundColor: PRIORITY_CONFIG[selectedTicket.priority].bg, borderColor: PRIORITY_CONFIG[selectedTicket.priority].color + '40', borderWidth: 1 }]}>
                          <Text style={{ color: PRIORITY_CONFIG[selectedTicket.priority].color, fontWeight: '600', fontSize: 12 }}>
                            {PRIORITY_CONFIG[selectedTicket.priority].icon} {selectedTicket.priority} ▾
                          </Text>
                        </View>
                      </TouchableOpacity>
                    }>
                    {PRIORITIES.map((p) => (
                      <Menu.Item key={p} title={`${PRIORITY_CONFIG[p].icon} ${p}`} onPress={() => handlePriorityChange(selectedTicket, p)} />
                    ))}
                  </Menu>

                  {selectedTicket.slaBreached && (
                    <View style={[styles.modernChip, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', borderWidth: 1 }]}>
                      <Text style={{ color: '#DC2626', fontWeight: '600', fontSize: 12 }}>SLA Breached ⚠️</Text>
                    </View>
                  )}
                </View>

                {/* Info Cards Grid */}
                <View style={styles.infoGrid}>
                  {selectedTicket.submitterName && <InfoBlock label="Customer" value={selectedTicket.submitterName} icon="account-outline" />}
                  {selectedTicket.submitterEmail && <InfoBlock label="Email" value={selectedTicket.submitterEmail} icon="email-outline" />}
                  {selectedTicket.submitterPhone && <InfoBlock label="Phone" value={selectedTicket.submitterPhone} icon="phone-outline" />}
                  {selectedTicket.assignedToName && <InfoBlock label="Assigned To" value={selectedTicket.assignedToName} icon="account-tie-outline" />}
                  {selectedTicket.category && <InfoBlock label="Category" value={selectedTicket.category} icon="folder-outline" />}
                  {selectedTicket.source && <InfoBlock label="Source" value={selectedTicket.source} icon="web" />}
                  {selectedTicket.createdAtHuman && <InfoBlock label="Created" value={selectedTicket.createdAtHuman} icon="clock-outline" />}
                </View>

                {/* Description */}
                <View style={styles.sectionContainer}>
                  <Text variant="labelMedium" style={styles.modernSectionLabel}>Description</Text>
                  <View style={styles.descriptionCard}>
                    <Text variant="bodyMedium" style={styles.descText}>
                      {selectedTicket.description}
                    </Text>
                  </View>
                </View>

                {/* Comments */}
                {(selectedTicket.comments?.length ?? 0) > 0 && (
                  <View style={styles.sectionContainer}>
                    <Text variant="labelMedium" style={styles.modernSectionLabel}>
                      Activity & Comments ({selectedTicket.comments!.length})
                    </Text>
                    <View style={styles.timelineContainer}>
                      {selectedTicket.comments!.map((c, idx) => (
                        <View key={c.id} style={styles.timelineItem}>
                          <View style={styles.timelineLine} />
                          <Avatar.Text size={32}
                            label={c.authorName.split(' ').map((n) => n[0]).join('')}
                            style={styles.timelineAvatar}
                            labelStyle={{ color: '#0F766E', fontSize: 12, fontWeight: 'bold' }} />
                          <View style={styles.commentContent}>
                            <View style={styles.commentHeaderModern}>
                              <Text style={styles.commentAuthor}>{c.authorName}</Text>
                              <Text style={styles.commentDate}>{new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                            </View>
                            <Text style={styles.commentMessage}>{c.message}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Add Reply */}
                <View style={styles.sectionContainer}>
                  <Text variant="labelMedium" style={styles.modernSectionLabel}>Add Reply</Text>
                  <View style={styles.replyBox}>
                    <TextInput
                      value={commentText}
                      onChangeText={setCommentText}
                      mode="flat"
                      multiline
                      numberOfLines={4}
                      placeholder="Type your reply here..."
                      style={styles.replyInput}
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                    />
                    <View style={styles.replyFooter}>
                      <View style={styles.replyVisibility}>
                        <TouchableOpacity 
                          style={[styles.visibilityBtn, !commentInternal && styles.visibilityBtnActive]} 
                          onPress={() => setCommentInternal(false)}>
                          <Text style={[styles.visibilityText, !commentInternal && styles.visibilityTextActive]}>Public</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.visibilityBtn, commentInternal && styles.visibilityBtnActiveInternal]} 
                          onPress={() => setCommentInternal(true)}>
                          <Text style={[styles.visibilityText, commentInternal && styles.visibilityTextActiveInternal]}>Internal Note</Text>
                        </TouchableOpacity>
                      </View>
                      <Button mode="contained" onPress={handleAddComment}
                        loading={sendingComment}
                        disabled={!commentText.trim() || sendingComment}
                        style={styles.sendReplyBtn}
                        contentStyle={{ paddingHorizontal: 12 }}>
                        Send Reply
                      </Button>
                    </View>
                  </View>
                </View>

                {/* Delete Area */}
                <View style={styles.dangerZone}>
                  <Button mode="text" textColor="#EF4444"
                    icon="delete-outline"
                    onPress={() => handleDelete(selectedTicket)}>
                    Delete Ticket
                  </Button>
                </View>
              </ScrollView>
            </Dialog.ScrollArea>
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

function InfoBlock({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={styles.infoBlockContainer}>
      <View style={styles.infoBlockIconWrap}>
        <MaterialCommunityIcons name={icon as any} size={16} color="#64748B" />
      </View>
      <View style={styles.infoBlockContent}>
        <Text style={styles.infoBlockLabel}>{label}</Text>
        <Text style={styles.infoBlockValue} numberOfLines={1} ellipsizeMode="tail">{value}</Text>
      </View>
    </View>
  );
}

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
  descText: { color: '#334155', lineHeight: 22, fontSize: 14 },

  commentBubble: {
    backgroundColor: '#f5f5ff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  commentText: { color: '#374151', lineHeight: 18 },

  // --- Modern Ticket Detail Dialog Styles ---
  dialogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingBottom: 16 },
  dialogTitleText: { fontWeight: '700', color: '#0F172A', marginTop: 4 },
  closeIcon: { margin: 0 },
  divider: { backgroundColor: '#E2E8F0' },
  dialogScrollContent: { padding: 20, paddingBottom: 40 },
  chipRowDetail: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  modernChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  infoBlockContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, width: '48%', borderWidth: 1, borderColor: '#F1F5F9' },
  infoBlockIconWrap: { backgroundColor: '#FFFFFF', padding: 6, borderRadius: 8, marginRight: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  infoBlockContent: { flex: 1 },
  infoBlockLabel: { color: '#64748B', fontSize: 11, fontWeight: '600', marginBottom: 2, textTransform: 'uppercase' },
  infoBlockValue: { color: '#0F172A', fontSize: 13, fontWeight: '500' },
  sectionContainer: { marginBottom: 24 },
  modernSectionLabel: { color: '#0F172A', fontWeight: '700', marginBottom: 12, fontSize: 14 },
  descriptionCard: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  timelineContainer: { marginTop: 4 },
  timelineItem: { flexDirection: 'row', marginBottom: 16 },
  timelineLine: { position: 'absolute', left: 15, top: 32, bottom: -16, width: 2, backgroundColor: '#E2E8F0' },
  timelineAvatar: { backgroundColor: '#CCFBF1', marginRight: 12 },
  commentContent: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  commentHeaderModern: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  commentAuthor: { fontWeight: '600', color: '#0F172A', fontSize: 13 },
  commentDate: { color: '#64748B', fontSize: 11 },
  commentMessage: { color: '#334155', lineHeight: 20, fontSize: 13 },
  replyBox: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, overflow: 'hidden' },
  replyInput: { backgroundColor: '#FFFFFF', minHeight: 80, fontSize: 14, paddingHorizontal: 4 },
  replyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#F8FAFC', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  replyVisibility: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 8, padding: 2 },
  visibilityBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  visibilityBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 1 },
  visibilityText: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  visibilityTextActive: { color: '#0F766E' },
  visibilityBtnActiveInternal: { backgroundColor: '#FEF2F2', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 1 },
  visibilityTextActiveInternal: { color: '#DC2626' },
  sendReplyBtn: { borderRadius: 8, backgroundColor: '#0F766E' },
  dangerZone: { marginTop: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16 },
  
  // Create Dialog additions
  modernInput: { marginBottom: 16, backgroundColor: '#FFFFFF', fontSize: 14 },
  fieldLabelModern: { marginBottom: 8, color: '#0F172A', fontWeight: '600', fontSize: 14 },
  chipRowCreate: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  dialogFooter: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#F8FAFC', gap: 12 },
  primaryBtn: { borderRadius: 8, backgroundColor: '#0F766E' }
});
