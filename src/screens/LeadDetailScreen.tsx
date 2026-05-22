import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text, useTheme, Card, Chip, Avatar, Divider,
  ActivityIndicator, IconButton, Button, Portal,
  Dialog, TextInput, Menu, Surface,
} from 'react-native-paper';
import { crmApi } from '../services/api';

const shortId = (id: string) => id?.replace(/-/g, '').slice(0, 6).toUpperCase() ?? '------';

const STATUSES = ['INTERESTED', 'FOLLOW_UP', 'BOOKED', 'CLOSED_WON', 'CLOSED_LOST'];

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  INTERESTED:  { bg: '#FFF8E1', text: '#F57F17', label: '🟡 Interested'  },
  FOLLOW_UP:   { bg: '#FFF3E0', text: '#E65100', label: '🟠 Follow Up'   },
  BOOKED:      { bg: '#F3E5F5', text: '#6A1B9A', label: '🟣 Booked'      },
  CLOSED_WON:  { bg: '#E8F5E9', text: '#2E7D32', label: '🟢 Closed Won'  },
  CLOSED_LOST: { bg: '#FFEBEE', text: '#B71C1C', label: '🔴 Closed Lost' },
};

export default function LeadDetailScreen({ route, navigation }: any) {
  const { leadId, leadName } = route.params;
  const theme = useTheme();

  const [lead, setLead] = useState<any>(null);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Status menu
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Add enquiry dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────
  const fetchEnquiries = async () => {
    try {
      const res = await crmApi.getEnquiries(leadId);
      setEnquiries(res.data ?? []);
    } catch (e) {
      console.error('Error fetching enquiries:', e);
    }
  };

  const fetchLeadDetails = async () => {
    try {
      setLoading(true);
      const res = await crmApi.getLeads();
      const found = res.data.find((l: any) => l.id === leadId);
      setLead(found ?? null);
      await fetchEnquiries();
    } catch (e) {
      console.error('Error fetching lead details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeadDetails(); }, [leadId]);

  // ── Change lead status ────────────────────────────────────────────────
  const handleStatusChange = async (newStatus: string) => {
    setShowStatusMenu(false);
    setUpdatingStatus(true);
    try {
      await crmApi.updateLeadStatus(leadId, newStatus);
      setLead((prev: any) => ({ ...prev, status: newStatus }));
    } catch (e) {
      console.error('Error updating status:', e);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ── Enquiry actions ───────────────────────────────────────────────────
  const handleAddEnquiry = async () => {
    if (!newMessage.trim()) return;
    setSaving(true);
    try {
      await crmApi.addEnquiry(leadId, {
        type: 'MANUAL',
        message: newMessage.trim(),
        source: 'Manual Entry',
        status: 'OPEN',
      });
      setNewMessage('');
      setShowAddDialog(false);
      await fetchEnquiries();
    } catch (e) {
      console.error('Error adding enquiry:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async (enquiryId: string) => {
    try {
      await crmApi.updateEnquiry(leadId, enquiryId, { status: 'RESOLVED' });
      await fetchEnquiries();
    } catch (e) {
      console.error('Error resolving enquiry:', e);
    }
  };

  const handleDelete = async (enquiryId: string) => {
    try {
      await crmApi.deleteEnquiry(leadId, enquiryId);
      await fetchEnquiries();
    } catch (e) {
      console.error('Error deleting enquiry:', e);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const statusCfg = STATUS_CONFIG[lead?.status] ?? { bg: '#F5F5F5', text: '#555', label: lead?.status ?? '—' };

  return (
    <ScrollView style={[styles.container, { backgroundColor: '#f4f4f8' }]}>

      {/* ── Header Card ─────────────────────────────────────────────── */}
      <Surface style={styles.headerCard} elevation={2}>
        {/* Top row: avatar + name + lead ID */}
        <View style={styles.headerTop}>
          <Avatar.Text
            size={52}
            label={(leadName ?? 'L').split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            style={{ backgroundColor: theme.colors.primaryContainer }}
            labelStyle={{ color: theme.colors.primary, fontSize: 18 }}
          />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text variant="titleLarge" style={{ fontWeight: 'bold', color: '#1a1a1a' }}>
              {leadName ?? 'Lead'}
            </Text>
            <Text style={styles.leadIdText}>Lead #{shortId(leadId)}</Text>
            {lead?.dealLabel ? (
              <Text variant="bodySmall" style={{ color: '#666', marginTop: 3 }}>
                💼 {lead.dealLabel}
              </Text>
            ) : null}
          </View>
        </View>

        <Divider style={{ marginVertical: 12 }} />

        {/* Status row with change button */}
        <View style={styles.statusRow}>
          <View>
            <Text variant="labelSmall" style={{ color: '#aaa', marginBottom: 4 }}>PIPELINE STATUS</Text>
            <Chip
              style={[styles.statusChip, { backgroundColor: statusCfg.bg }]}
              textStyle={{ color: statusCfg.text, fontWeight: '700', fontSize: 12 }}
            >
              {statusCfg.label}
            </Chip>
          </View>

          {/* Change Status Menu */}
          <Menu
            visible={showStatusMenu}
            onDismiss={() => setShowStatusMenu(false)}
            anchor={
              <Button
                mode="outlined"
                compact
                icon="swap-horizontal"
                loading={updatingStatus}
                onPress={() => setShowStatusMenu(true)}
                style={styles.changeStatusBtn}
                labelStyle={{ fontSize: 12 }}
              >
                Change
              </Button>
            }
          >
            {STATUSES.filter(s => s !== lead?.status).map(s => {
              const cfg = STATUS_CONFIG[s];
              return (
                <Menu.Item
                  key={s}
                  title={cfg.label}
                  titleStyle={{ color: cfg.text, fontWeight: '600' }}
                  onPress={() => handleStatusChange(s)}
                />
              );
            })}
          </Menu>
        </View>

        {/* Freshness */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
          {lead?.isNew && (
            <Chip compact style={{ backgroundColor: '#E8F5E9', height: 20 }}
              textStyle={{ fontSize: 9, color: '#1B5E20', fontWeight: 'bold' }}>
              🟢 NEW
            </Chip>
          )}
          {lead?.createdAtHuman ? (
            <Text variant="labelSmall" style={{ color: lead?.isNew ? '#4CAF50' : '#aaa' }}>
              {lead.isNew ? '' : 'Created '}{ lead.createdAtHuman}
            </Text>
          ) : null}
        </View>
      </Surface>

      {/* ── Deal Info ────────────────────────────────────────────────── */}
      {lead?.dealValue ? (
        <Card style={styles.sectionCard} elevation={1}>
          <Card.Content>
            <Text style={styles.sectionLabel}>💰 DEAL</Text>
            <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: '#1a1a1a', marginTop: 4 }}>
              ₹{Number(lead.dealValue).toLocaleString('en-IN')}
            </Text>
            <Chip
              compact
              style={{
                alignSelf: 'flex-start', marginTop: 8,
                backgroundColor:
                  lead.paymentStatus === 'PAID'    ? '#E8F5E9' :
                  lead.paymentStatus === 'PARTIAL' ? '#FFF3E0' :
                  lead.paymentStatus === 'PENDING' ? '#FFEBEE' : '#F5F5F5',
              }}
              textStyle={{
                fontWeight: '700',
                color:
                  lead.paymentStatus === 'PAID'    ? '#2E7D32' :
                  lead.paymentStatus === 'PARTIAL' ? '#E65100' :
                  lead.paymentStatus === 'PENDING' ? '#B71C1C' : '#666',
              }}
            >
              {lead.paymentStatus === 'PAID'    ? '✅ Paid' :
               lead.paymentStatus === 'PARTIAL' ? '⚠️ Partial' :
               lead.paymentStatus === 'PENDING' ? '🔴 Pending' : 'No Payment Status'}
            </Chip>
          </Card.Content>
        </Card>
      ) : null}

      {/* ── Enquiries ────────────────────────────────────────────────── */}
      <Card style={styles.sectionCard} elevation={1}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>📋 ENQUIRIES ({enquiries.length})</Text>
            <Button
              mode="contained-tonal"
              compact
              icon="plus"
              onPress={() => setShowAddDialog(true)}
              labelStyle={{ fontSize: 11 }}
              style={{ borderRadius: 20 }}
            >
              Add Note
            </Button>
          </View>

          {enquiries.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={{ color: '#aaa', fontSize: 13 }}>No enquiries yet.</Text>
              <Text style={{ color: '#ccc', fontSize: 11, marginTop: 4 }}>Tap "Add Note" to add a manual note.</Text>
            </View>
          ) : (
            enquiries.map((enq, idx) => (
              <View key={enq.id}>
                {idx > 0 && <Divider style={{ marginVertical: 12 }} />}
                <View style={styles.enquiryRow}>
                  <View style={{ flex: 1 }}>
                    {/* Badges */}
                    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                      <Chip compact style={styles.typeBadge} textStyle={{ fontSize: 9, color: '#1565C0' }}>
                        {enq.type}
                      </Chip>
                      <Chip
                        compact
                        style={[styles.enquiryStatusBadge, {
                          backgroundColor:
                            enq.status === 'RESOLVED'  ? '#E8F5E9' :
                            enq.status === 'FOLLOW_UP' ? '#FFF3E0' : '#E3F2FD',
                        }]}
                        textStyle={{
                          fontSize: 9,
                          color:
                            enq.status === 'RESOLVED'  ? '#2E7D32' :
                            enq.status === 'FOLLOW_UP' ? '#E65100' : '#1565C0',
                        }}
                      >
                        {enq.status}
                      </Chip>
                    </View>

                    {/* Message */}
                    <Text style={{ color: '#222', fontSize: 13, lineHeight: 20 }}>
                      {enq.message}
                    </Text>

                    {/* Meta */}
                    <Text style={{ color: '#bbb', fontSize: 11, marginTop: 6 }}>
                      {enq.source} · {new Date(enq.createdAt).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', hour12: true,
                      })}
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={{ flexDirection: 'column', alignItems: 'center', marginLeft: 4 }}>
                    {enq.status !== 'RESOLVED' && (
                      <IconButton icon="check-circle-outline" size={20} iconColor="#2E7D32"
                        onPress={() => handleResolve(enq.id)} />
                    )}
                    <IconButton icon="delete-outline" size={20} iconColor="#B71C1C"
                      onPress={() => handleDelete(enq.id)} />
                  </View>
                </View>
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      {/* ── View Contact button ──────────────────────────────────────── */}
      {lead?.contact?.id && (
        <Button
          mode="outlined"
          icon="account"
          style={styles.contactBtn}
          onPress={() => navigation.navigate('ContactProfile', { contactId: lead.contact.id })}
        >
          View Full Contact Profile
        </Button>
      )}

      {/* ── Add Enquiry Dialog ───────────────────────────────────────── */}
      <Portal>
        <Dialog visible={showAddDialog} onDismiss={() => setShowAddDialog(false)}>
          <Dialog.Title>Add Enquiry Note</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Note / Message"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              numberOfLines={4}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddDialog(false)}>Cancel</Button>
            <Button
              onPress={handleAddEnquiry}
              loading={saving}
              disabled={!newMessage.trim() || saving}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1 },
  headerCard:         { margin: 12, borderRadius: 16, padding: 16, backgroundColor: '#fff' },
  headerTop:          { flexDirection: 'row', alignItems: 'center' },
  leadIdText:         { color: '#9C27B0', fontFamily: 'monospace', fontSize: 11, marginTop: 3 },
  statusRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusChip:         { alignSelf: 'flex-start' },
  changeStatusBtn:    { borderRadius: 20, borderColor: '#ddd' },
  sectionCard:        { marginHorizontal: 12, marginBottom: 12, borderRadius: 16 },
  sectionLabel:       { fontSize: 11, fontWeight: '700', color: '#aaa', letterSpacing: 0.8, marginBottom: 8 },
  sectionHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  emptyBox:           { alignItems: 'center', paddingVertical: 20 },
  enquiryRow:         { flexDirection: 'row', alignItems: 'flex-start' },
  typeBadge:          { backgroundColor: '#E3F2FD', height: 20 },
  enquiryStatusBadge: { height: 20 },
  contactBtn:         { margin: 12, marginBottom: 32, borderRadius: 12 },
});
