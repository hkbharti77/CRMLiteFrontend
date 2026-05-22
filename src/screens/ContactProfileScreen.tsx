import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Linking, Modal } from 'react-native';
import { Text, Avatar, Surface, useTheme, Button, IconButton, List, Divider, Card, Chip } from 'react-native-paper';
import { useLeadStore } from '../store/useLeadStore';
import { crmApi, appointmentApi, bookingApi, activityApi } from '../services/api';
import { ActivityIndicator, Portal, Dialog, TextInput, Snackbar, Menu } from 'react-native-paper';
import { useActivityLogStore, getActivityConfig, ActivityLogEntry } from '../store/useActivityLogStore';

export default function ContactProfileScreen({ route, navigation }: any) {
  const { contactId } = route.params;
  const theme = useTheme();
  const [loading, setLoading] = React.useState(true);
  const [contact, setContact] = React.useState<any>(null);
  const [associatedLead, setAssociatedLead] = React.useState<any>(null);
  const [allLeads, setAllLeads] = React.useState<any[]>([]);
  const [reminders, setReminders] = React.useState<any[]>([]);
  const [showAddReminder, setShowAddReminder] = React.useState(false);
  const [newReminderMsg, setNewReminderMsg] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [showNotesDialog, setShowNotesDialog] = React.useState(false);
  const [editedNotes, setEditedNotes] = React.useState('');
  const [showStatusMenu, setShowStatusMenu] = React.useState(false);
  const [showTagsDialog, setShowTagsDialog] = React.useState(false);
  const [editedTags, setEditedTags] = React.useState('');
  const [leadAppointments, setLeadAppointments] = React.useState<any[]>([]);
  const [leadBookings, setLeadBookings] = React.useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = React.useState(false);
  // Enquiry state
  const [showEnquiryDialog, setShowEnquiryDialog] = React.useState(false);
  const [enquiryMsg, setEnquiryMsg] = React.useState('');
  const [editingEnquiry, setEditingEnquiry] = React.useState<any>(null);
  // Deal state
  const [showDealDialog, setShowDealDialog] = React.useState(false);
  const [dealValue, setDealValue] = React.useState('');
  const [dealLabel, setDealLabel] = React.useState('');
  const [dealStatus, setDealStatus] = React.useState('NONE');
  const [showDealStatusMenu, setShowDealStatusMenu] = React.useState(false);
  // 9.3 — Lead comparison view
  const [showCompareModal, setShowCompareModal] = React.useState(false);
  // 9.4 — Bulk status update
  const [showBulkStatusMenu, setShowBulkStatusMenu] = React.useState(false);
  const [bulkUpdating, setBulkUpdating] = React.useState(false);
  // 9.5 — Lead assignment (owner label per lead)
  const [showAssignMenu, setShowAssignMenu] = React.useState<string | null>(null);

  // ── Activity Timeline tab state ───────────────────────────────────────
  const [activeProfileTab, setActiveProfileTab] = React.useState<'overview' | 'timeline'>('overview');
  const { timelineByContact, isLoadingTimeline, setTimeline, setLoadingTimeline } = useActivityLogStore();
  const contactTimeline: ActivityLogEntry[] = timelineByContact[contactId] ?? [];

  useEffect(() => {
    fetchContact();
    fetchTimeline();
  }, [contactId]);

  const fetchTimeline = async () => {
    setLoadingTimeline(true);
    try {
      const res = await activityApi.getContactTimeline(contactId);
      setTimeline(contactId, res.data ?? []);
    } catch (e) {
      // Timeline is non-critical — silently ignore if endpoint not yet running
    } finally {
      setLoadingTimeline(false);
    }
  };

  // ── Appointments & Bookings fetch — now directly by contactId ─────────
  // After V10013 migration: Bookings/Appointments reference Contact directly.
  // No need to iterate leads — one clean fetch per contactId.
  useEffect(() => {
    const fetchContactData = async () => {
      setLoadingAppointments(true);
      try {
        const [apptRes, bookRes] = await Promise.all([
          appointmentApi.getForContact(contactId).catch(() => ({ data: [] })),
          bookingApi.getForContact(contactId).catch(() => ({ data: [] })),
        ]);
        const appts: any[] = apptRes.data ?? [];
        const books: any[] = bookRes.data ?? [];
        appts.sort((a, b) => new Date(b.appointmentDateTime).getTime() - new Date(a.appointmentDateTime).getTime());
        books.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLeadAppointments(appts);
        setLeadBookings(books);
      } catch (e) {
        console.log('Error fetching appointments/bookings for contact');
      } finally {
        setLoadingAppointments(false);
      }
    };
    fetchContactData();
  }, [contactId]);

  const fetchContact = async () => {
    try {
      setLoading(true);
      // 1. Fetch Contact Details
      const contactRes = await crmApi.getContactById(contactId);
      const data = contactRes.data;
      
      const contactData = {
        id: data.id,
        name: data.name || 'WhatsApp User',
        phone: data.waId || 'No phone',
        waId: data.waId,
        status: 'ACTIVE',
        email: 'N/A',
        tags: data.tags || [],
      };
      setContact(contactData);
      setEditedTags((data.tags || []).join(', '));

      // 2. Fetch Associated Leads (multiple per contact now)
      let latestLead: any = null;
      let allLeadsLocal: any[] = [];
      try {
        const leadRes = await crmApi.getLeadsByContactId(contactId);
        const leads = leadRes.data;
        if (leads && leads.length > 0) {
          // Show latest lead by default
          latestLead = leads[leads.length - 1];
          allLeadsLocal = leads;
          setAssociatedLead(latestLead);
          setAllLeads(leads);
        }
      } catch (e) {
        console.log('No leads found for this contact');
      }

      // 3. Fetch Pending Reminders
      try {
        const remindersRes = await crmApi.getPendingReminders();
        // Filter reminders for this contact/lead
        const filtered = remindersRes.data.filter((r: any) => 
          r.leadId === contactId || (latestLead && r.leadId === latestLead.id)
        );
        setReminders(filtered);
      } catch (e) {
        console.log('Error fetching reminders');
      }

      // 4. Bookings & Appointments are fetched by the separate useEffect above
      //    which watches contactId — no lead iteration needed.

    } catch (error) {
      console.error('Error fetching contact profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReminder = async () => {
    if (!newReminderMsg.trim() || !associatedLead) return;
    
    setSaving(true);
    try {
      // Create due date (tomorrow as default for this quick integration)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);

      await crmApi.createReminder({
        lead: { id: associatedLead.id },
        message: newReminderMsg,
        dueDate: dueDate.toISOString(),
      });
      
      setNewReminderMsg('');
      setShowAddReminder(false);
      fetchContact(); // Refresh list
    } catch (error) {
       console.error('Error creating reminder:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteReminder = async (id: string) => {
    try {
      await crmApi.completeReminder(id);
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error completing reminder:', error);
    }
  };

  const handleUpdateNotes = async () => {
    // Notes removed — use enquiries instead
  };

  // Helper: update both associatedLead and the matching entry in allLeads
  const syncLeadUpdate = (updatedLead: any) => {
    setAssociatedLead(updatedLead);
    setAllLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
  };

  const handleAddEnquiry = async () => {
    if (!associatedLead || !enquiryMsg.trim()) return;
    setSaving(true);
    try {
      const res = await crmApi.addEnquiry(associatedLead.id, {
        type: 'MANUAL',
        message: enquiryMsg.trim(),
        source: 'Manual Entry',
        status: 'OPEN',
      });
      syncLeadUpdate(res.data);
      setEnquiryMsg('');
      setShowEnquiryDialog(false);
    } catch (e) {
      console.error('Error adding enquiry:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEnquiryStatus = async (enquiryId: string, status: string) => {
    if (!associatedLead) return;
    try {
      const res = await crmApi.updateEnquiry(associatedLead.id, enquiryId, { status });
      syncLeadUpdate(res.data);
    } catch (e) {
      console.error('Error updating enquiry:', e);
    }
  };

  const handleDeleteEnquiry = async (enquiryId: string) => {
    if (!associatedLead) return;
    try {
      const res = await crmApi.deleteEnquiry(associatedLead.id, enquiryId);
      syncLeadUpdate(res.data);
    } catch (e) {
      console.error('Error deleting enquiry:', e);
    }
  };

  const handleUpdateDeal = async () => {
    if (!associatedLead) return;
    setSaving(true);
    try {
      const res = await crmApi.updateLeadDeal(associatedLead.id, {
        dealValue: dealValue ? parseFloat(dealValue) : undefined,
        dealLabel: dealLabel || undefined,
        paymentStatus: dealStatus,
        currency: 'INR',
      });
      syncLeadUpdate({ ...associatedLead, ...res.data });
      setShowDealDialog(false);
    } catch (e) {
      console.error('Error updating deal:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!associatedLead) return;
    try {
      await crmApi.updateLeadStatus(associatedLead.id, newStatus);
      setAssociatedLead({ ...associatedLead, status: newStatus });
      setShowStatusMenu(false);
    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  const handleUpdateTags = async () => {
    setSaving(true);
    try {
      const tagsArray = editedTags.split(',').map(t => t.trim()).filter(t => t !== '');
      await crmApi.updateContactTags(contactId, tagsArray);
      setContact({ ...contact, tags: tagsArray });
      setShowTagsDialog(false);
    } catch (e) {
      console.error('Error updating tags:', e);
    } finally {
      setSaving(false);
    }
  };

  // ── 9.4 Bulk status update for all leads of this contact ──────────────
  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (!allLeads.length) return;
    setBulkUpdating(true);
    try {
      await Promise.all(
        allLeads
          .filter(l => l.status !== newStatus)
          .map(l => crmApi.updateLeadStatus(l.id, newStatus))
      );
      // Refresh leads
      const leadRes = await crmApi.getLeadsByContactId(contactId);
      const leads = leadRes.data;
      setAllLeads(leads);
      if (leads.length > 0) setAssociatedLead(leads[leads.length - 1]);
      setShowBulkStatusMenu(false);
    } catch (e) {
      console.error('Error bulk updating leads:', e);
    } finally {
      setBulkUpdating(false);
    }
  };

  // ── 9.5 Lead assignment label (visual only — backend owner is set at creation) ──
  const PIPELINE_STAGES = ['NEW', 'INTERESTED', 'FOLLOW_UP', 'BOOKED', 'CLOSED_WON', 'CLOSED_LOST'];
  const handleAssignStage = async (leadId: string, newStatus: string) => {
    try {
      await crmApi.updateLeadStatus(leadId, newStatus);
      const updated = allLeads.map(l => l.id === leadId ? { ...l, status: newStatus } : l);
      setAllLeads(updated);
      if (associatedLead?.id === leadId) setAssociatedLead({ ...associatedLead, status: newStatus });
      setShowAssignMenu(null);
    } catch (e) {
      console.error('Error assigning lead stage:', e);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!contact) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Contact not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={styles.header} elevation={1}>
        <Avatar.Text 
          size={100} 
          label={(contact.name || '??').split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase()} 
          style={{ backgroundColor: theme.colors.primaryContainer }} 
          labelStyle={{ color: theme.colors.primary }}
        />
        <Text variant="headlineSmall" style={styles.name}>{contact.name}</Text>
        
        {associatedLead && (
          <Menu
            visible={showStatusMenu}
            onDismiss={() => setShowStatusMenu(false)}
            anchor={
              <Chip 
                style={styles.statusChip} 
                textStyle={styles.statusText}
                onPress={() => setShowStatusMenu(true)}
              >
                {associatedLead.status}
              </Chip>
            }
          >
            <Menu.Item onPress={() => handleUpdateStatus('NEW')} title="New" />
            <Menu.Item onPress={() => handleUpdateStatus('INTERESTED')} title="Interested" />
            <Menu.Item onPress={() => handleUpdateStatus('FOLLOW_UP')} title="Follow Up" />
            <Menu.Item onPress={() => handleUpdateStatus('CLOSED_WON')} title="Closed Won" />
            <Menu.Item onPress={() => handleUpdateStatus('CLOSED_LOST')} title="Closed Lost" />
          </Menu>
        )}

        {/* Lead selector — if multiple leads exist */}
        {allLeads.length > 1 && (
          <View style={{ flexDirection: 'row', marginTop: 8, gap: 6, flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 16 }}>
            {allLeads.map((lead: any, idx: number) => (
              <View key={lead.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Chip
                  compact
                  selected={associatedLead?.id === lead.id}
                  onPress={() => setAssociatedLead(lead)}
                  style={{ height: 26 }}
                  textStyle={{ fontSize: 10 }}
                >
                  Lead {idx + 1} · {lead.status}
                </Chip>
                {/* 9.5 — Assign/reassign stage per lead */}
                <Menu
                  visible={showAssignMenu === lead.id}
                  onDismiss={() => setShowAssignMenu(null)}
                  anchor={
                    <IconButton
                      icon="pencil-circle-outline"
                      size={14}
                      onPress={() => setShowAssignMenu(lead.id)}
                      style={{ margin: 0, marginLeft: -4 }}
                    />
                  }
                >
                  {PIPELINE_STAGES.map(stage => (
                    <Menu.Item
                      key={stage}
                      title={stage}
                      disabled={lead.status === stage}
                      onPress={() => handleAssignStage(lead.id, stage)}
                    />
                  ))}
                </Menu>
              </View>
            ))}
          </View>
        )}

        {/* Lead summary stats */}
        {allLeads.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, justifyContent: 'center' }}>
            <View style={styles.statBadge}>
              <Text style={styles.statNumber}>{allLeads.length}</Text>
              <Text style={styles.statLabel}>Total Leads</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statNumber}>
                {allLeads.filter((l: any) => !['CLOSED_WON','CLOSED_LOST'].includes(l.status)).length}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={[styles.statNumber, { color: '#2E7D32' }]}>
                {allLeads.filter((l: any) => l.status === 'CLOSED_WON').length}
              </Text>
              <Text style={styles.statLabel}>Won</Text>
            </View>
          </View>
        )}

        {/* 9.3 Compare + 9.4 Bulk actions row */}
        {allLeads.length > 1 && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, justifyContent: 'center' }}>
            {/* 9.3 Compare leads */}
            <Button
              mode="outlined"
              compact
              icon="compare"
              onPress={() => setShowCompareModal(true)}
              style={{ borderRadius: 20 }}
              labelStyle={{ fontSize: 11 }}
            >
              Compare Leads
            </Button>
            {/* 9.4 Bulk update */}
            <Menu
              visible={showBulkStatusMenu}
              onDismiss={() => setShowBulkStatusMenu(false)}
              anchor={
                <Button
                  mode="outlined"
                  compact
                  icon="update"
                  onPress={() => setShowBulkStatusMenu(true)}
                  loading={bulkUpdating}
                  style={{ borderRadius: 20 }}
                  labelStyle={{ fontSize: 11 }}
                >
                  Bulk Update
                </Button>
              }
            >
              <Menu.Item title="Set all → Interested"  onPress={() => handleBulkStatusUpdate('INTERESTED')} />
              <Menu.Item title="Set all → Follow Up"   onPress={() => handleBulkStatusUpdate('FOLLOW_UP')} />
              <Menu.Item title="Set all → Closed Won"  onPress={() => handleBulkStatusUpdate('CLOSED_WON')} />
              <Menu.Item title="Set all → Closed Lost" onPress={() => handleBulkStatusUpdate('CLOSED_LOST')} />
            </Menu>
          </View>
        )}

        <View style={styles.actionRow}>
          <IconButton 
            icon="whatsapp" 
            mode="contained" 
            containerColor="#25D366" 
            iconColor="#fff" 
            onPress={() => Linking.openURL(`whatsapp://send?phone=${contact.phone}`)}
          />
          <IconButton 
            icon="phone" 
            mode="contained" 
            containerColor={theme.colors.primary} 
            iconColor="#fff" 
            onPress={() => Linking.openURL(`tel:${contact.phone}`)}
          />
          <IconButton 
            icon="message-text" 
            mode="contained" 
            containerColor={theme.colors.secondary} 
            iconColor="#fff" 
            onPress={() => navigation.navigate('ChatRoom', { chatId: contact.id, name: contact.name })}
          />
        </View>
      </Surface>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Contact Information</Text>
        <Card style={styles.infoCard} elevation={0}>
          <List.Item
            title="WhatsApp ID"
            description={contact.waId}
            left={props => <List.Icon {...props} icon="whatsapp" />}
          />
          <Divider horizontalInset />
          <View style={{ padding: 16 }}>
             <View style={styles.sectionHeader}>
               <Text variant="labelLarge" style={{ marginBottom: 8 }}>Tags</Text>
               <IconButton icon="pencil" size={16} onPress={() => setShowTagsDialog(true)} />
             </View>
             <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {contact.tags.map((tag: string) => (
                  <Chip key={tag} style={{ marginRight: 4, marginBottom: 4 }}>{tag}</Chip>
                ))}
                {contact.tags.length === 0 && <Text variant="bodySmall" style={{ color: '#999' }}>No tags added</Text>}
             </View>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>📋 Enquiries</Text>
          <Button mode="text" onPress={() => setShowEnquiryDialog(true)} disabled={!associatedLead}>
            {associatedLead ? 'Add' : 'N/A'}
          </Button>
        </View>
        <Card style={styles.infoCard} elevation={0}>
          <Card.Content>
            {(associatedLead?.enquiries?.length ?? 0) === 0 ? (
              <Text variant="bodySmall" style={{ color: '#999' }}>No enquiries yet.</Text>
            ) : (
              associatedLead.enquiries.map((enq: any) => (
                <View key={enq.id} style={styles.enquiryItem}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodySmall" style={{ fontWeight: '600', color: '#333' }}>
                      {enq.message}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
                      <Chip compact style={{ height: 20, backgroundColor:
                        enq.status === 'RESOLVED' ? '#E8F5E9' :
                        enq.status === 'FOLLOW_UP' ? '#FFF3E0' : '#E3F2FD'
                      }} textStyle={{ fontSize: 9, color:
                        enq.status === 'RESOLVED' ? '#2E7D32' :
                        enq.status === 'FOLLOW_UP' ? '#E65100' : '#1565C0'
                      }}>
                        {enq.status}
                      </Chip>
                      <Text variant="labelSmall" style={{ color: '#aaa' }}>
                        {enq.source} · {new Date(enq.createdAt).toLocaleDateString('en-IN')}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row' }}>
                    {enq.status !== 'RESOLVED' && (
                      <IconButton icon="check" size={16} iconColor="#2E7D32"
                        onPress={() => handleUpdateEnquiryStatus(enq.id, 'RESOLVED')} />
                    )}
                    <IconButton icon="delete-outline" size={16} iconColor="#B71C1C"
                      onPress={() => handleDeleteEnquiry(enq.id)} />
                  </View>
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </View>

      {/* ── Deal & Payment Section ───────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>💰 Deal & Payment</Text>
          <Button
            mode="text"
            onPress={() => {
              setDealValue(associatedLead?.dealValue?.toString() || '');
              setDealLabel(associatedLead?.dealLabel || '');
              setDealStatus(associatedLead?.paymentStatus || 'NONE');
              setShowDealDialog(true);
            }}
            disabled={!associatedLead}
          >
            {associatedLead ? 'Edit Deal' : 'N/A'}
          </Button>
        </View>
        <Card style={styles.infoCard} elevation={0}>
          <Card.Content>
            {associatedLead?.dealValue ? (
              <View>
                {/* Deal Label */}
                {associatedLead.dealLabel ? (
                  <Text variant="labelMedium" style={{ color: '#888', marginBottom: 4 }}>
                    {associatedLead.dealLabel}
                  </Text>
                ) : null}
                {/* Amount */}
                <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: '#1a1a1a' }}>
                  ₹{Number(associatedLead.dealValue).toLocaleString('en-IN')}
                </Text>
                {/* Payment Status Chip */}
                <View style={{ marginTop: 8 }}>
                  <Chip
                    compact
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor:
                        associatedLead.paymentStatus === 'PAID'    ? '#E8F5E9' :
                        associatedLead.paymentStatus === 'PARTIAL' ? '#FFF3E0' :
                        associatedLead.paymentStatus === 'PENDING' ? '#FFEBEE' : '#F5F5F5',
                    }}
                    textStyle={{
                      fontWeight: '700',
                      color:
                        associatedLead.paymentStatus === 'PAID'    ? '#2E7D32' :
                        associatedLead.paymentStatus === 'PARTIAL' ? '#E65100' :
                        associatedLead.paymentStatus === 'PENDING' ? '#B71C1C' : '#666',
                    }}
                  >
                    {associatedLead.paymentStatus === 'PAID'    ? '✅ Paid' :
                     associatedLead.paymentStatus === 'PARTIAL' ? '⚠️ Partial' :
                     associatedLead.paymentStatus === 'PENDING' ? '🔴 Pending' : 'No Status'}
                  </Chip>
                </View>
              </View>
            ) : (
              <Text variant="bodyMedium" style={{ color: '#999' }}>
                No deal value set yet. Tap "Edit Deal" to add.
              </Text>
            )}
          </Card.Content>
        </Card>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Reminders</Text>
          <Button 
            mode="text" 
            onPress={() => setShowAddReminder(true)}
            disabled={!associatedLead}
          >
            {associatedLead ? 'New Reminder' : 'N/A'}
          </Button>
        </View>
        {reminders.length > 0 ? (
          reminders.map((reminder: any) => (
            <Surface key={reminder.id} style={styles.reminderItem} elevation={1}>
              <IconButton 
                icon="checkbox-blank-outline" 
                onPress={() => handleCompleteReminder(reminder.id)}
              />
              <View style={{ flex: 1, paddingVertical: 8 }}>
                <Text variant="bodyMedium">{reminder.message}</Text>
                <Text variant="labelSmall" style={{ color: '#999' }}>
                  Due: {new Date(reminder.dueDate).toLocaleDateString()}
                </Text>
              </View>
            </Surface>
          ))
        ) : (
          <Text variant="bodySmall" style={{ color: '#999', textAlign: 'center', marginTop: 8 }}>
            No pending reminders
          </Text>
        )}
      </View>

      {/* ── Appointments Section ─────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Appointments</Text>
          <Button
            mode="text"
            icon="calendar-plus"
            onPress={() => navigation.navigate('Booking')}
            disabled={!associatedLead}
          >
            {associatedLead ? 'Book' : 'N/A'}
          </Button>
        </View>
        {loadingAppointments ? (
          <ActivityIndicator size="small" />
        ) : leadAppointments.length > 0 ? (
          leadAppointments.slice(0, 3).map((appt: any) => (
            <Surface key={appt.id} style={styles.reminderItem} elevation={1}>
              <View style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text variant="bodyMedium" style={{ fontWeight: '700', flex: 1 }}>
                    {appt.title}
                  </Text>
                  <Chip
                    compact
                    style={{
                      backgroundColor:
                        appt.status === 'SCHEDULED' ? '#E3F2FD'
                          : appt.status === 'COMPLETED' ? '#E8F5E9'
                          : '#FFEBEE',
                    }}
                    textStyle={{
                      fontSize: 9,
                      color:
                        appt.status === 'SCHEDULED' ? '#1565C0'
                          : appt.status === 'COMPLETED' ? '#2E7D32'
                          : '#B71C1C',
                    }}
                  >
                    {appt.status}
                  </Chip>
                </View>
                <Text variant="labelSmall" style={{ color: '#888' }}>
                  📅 {new Date(appt.appointmentDateTime).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: true,
                  })}
                </Text>
                {appt.meetingLink ? (
                  <Text
                    variant="labelSmall"
                    style={{ color: '#1565C0', marginTop: 4 }}
                    onPress={() => require('react-native').Linking.openURL(appt.meetingLink)}
                  >
                    🔗 Join Meeting
                  </Text>
                ) : null}
              </View>
            </Surface>
          ))
        ) : (
          <Text variant="bodySmall" style={{ color: '#999', textAlign: 'center', marginTop: 8 }}>
            No appointments yet
          </Text>
        )}
      </View>

      {/* ── Bookings Section ─────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>🎉 Bookings</Text>
          {leadBookings.length > 0 && (
            <Chip compact style={{ backgroundColor: '#E3F2FD' }} textStyle={{ fontSize: 10, color: '#1565C0' }}>
              {leadBookings.length} total
            </Chip>
          )}
        </View>
        {loadingAppointments ? (
          <ActivityIndicator size="small" />
        ) : leadBookings.length > 0 ? (
          <Surface style={{ borderRadius: 10, overflow: 'hidden' }} elevation={1}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Service</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Slot</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center' }]}>Status</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right' }]}>Date</Text>
            </View>
            {/* Table Rows */}
            {leadBookings.map((b: any, idx: number) => (
              <View
                key={b.id}
                style={[
                  styles.tableRow,
                  idx % 2 === 1 && { backgroundColor: '#F8F9FA' },
                  idx === leadBookings.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <Text style={[styles.tableCell, { flex: 2, fontWeight: '600', color: '#1a1a1a' }]} numberOfLines={1}>
                  {b.service}
                </Text>
                <Text style={[styles.tableCell, { flex: 2, color: '#555' }]} numberOfLines={1}>
                  {b.preferredSlot || '—'}
                </Text>
                <View style={{ flex: 1.2, alignItems: 'center' }}>
                  <Chip
                    compact
                    style={{
                      backgroundColor:
                        b.status === 'CONFIRMED' ? '#E3F2FD' :
                        b.status === 'COMPLETED' ? '#E8F5E9' :
                        b.status === 'CANCELLED' ? '#FFEBEE' : '#FFF3E0',
                    }}
                    textStyle={{
                      fontSize: 8,
                      color:
                        b.status === 'CONFIRMED' ? '#1565C0' :
                        b.status === 'COMPLETED' ? '#2E7D32' :
                        b.status === 'CANCELLED' ? '#B71C1C' : '#E65100',
                    }}
                  >
                    {b.status}
                  </Chip>
                </View>
                <Text style={[styles.tableCell, { flex: 1.5, color: '#888', textAlign: 'right', fontSize: 11 }]}>
                  {new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                </Text>
              </View>
            ))}
          </Surface>
        ) : (
          <Text variant="bodySmall" style={{ color: '#999', textAlign: 'center', marginTop: 8 }}>
            No bookings yet
          </Text>
        )}
      </View>

      {/* ── Profile Tab Switcher ──────────────────────────────────────── */}
      <View style={{ flexDirection: 'row', marginHorizontal: 20, marginTop: 8, gap: 8 }}>
        <Button
          mode={activeProfileTab === 'overview' ? 'contained' : 'outlined'}
          compact
          onPress={() => setActiveProfileTab('overview')}
          style={{ flex: 1, borderRadius: 20 }}
          labelStyle={{ fontSize: 12 }}
        >
          📋 Overview
        </Button>
        <Button
          mode={activeProfileTab === 'timeline' ? 'contained' : 'outlined'}
          compact
          onPress={() => {
            setActiveProfileTab('timeline');
            fetchTimeline();
          }}
          style={{ flex: 1, borderRadius: 20 }}
          labelStyle={{ fontSize: 12 }}
        >
          🕐 Timeline
        </Button>
      </View>

      {/* ── Activity Timeline Tab ─────────────────────────────────────── */}
      {activeProfileTab === 'timeline' && (
        <View style={[styles.section, { paddingBottom: 32 }]}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { marginBottom: 12 }]}>
            CRM Activity Timeline
          </Text>
          {isLoadingTimeline ? (
            <ActivityIndicator size="small" />
          ) : contactTimeline.length === 0 ? (
            <Surface style={{ borderRadius: 14, padding: 24, alignItems: 'center' }} elevation={0}>
              <Text style={{ color: '#aaa', textAlign: 'center' }}>
                No activity recorded yet.{`\n`}Activities appear here as Leads, Bookings and Appointments are created.
              </Text>
              <Button
                mode="outlined"
                compact
                icon="refresh"
                onPress={fetchTimeline}
                style={{ marginTop: 12, borderRadius: 20 }}
              >
                Refresh
              </Button>
            </Surface>
          ) : (
            contactTimeline.map((entry, idx) => {
              const cfg = getActivityConfig(entry.activityType);
              return (
                <View key={entry.id} style={styles.timelineItem}>
                  {/* Connector line */}
                  {idx < contactTimeline.length - 1 && (
                    <View style={styles.timelineConnector} />
                  )}
                  {/* Dot */}
                  <View style={[styles.timelineDot, { backgroundColor: cfg.color }]}>
                    <IconButton
                      icon={cfg.icon}
                      size={12}
                      iconColor="#fff"
                      style={{ margin: 0 }}
                    />
                  </View>
                  {/* Content */}
                  <Surface style={[styles.timelineCard, { borderLeftColor: cfg.color }]} elevation={1}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Chip
                        compact
                        style={{ backgroundColor: cfg.bg, height: 22 }}
                        textStyle={{ fontSize: 9, color: cfg.color, fontWeight: '700' }}
                      >
                        {entry.entityType}
                      </Chip>
                      <Chip
                        compact
                        style={{ backgroundColor: '#F5F5F5', height: 22 }}
                        textStyle={{ fontSize: 9, color: '#777' }}
                      >
                        {entry.source}
                      </Chip>
                    </View>
                    <Text variant="bodySmall" style={{ marginTop: 6, color: '#222', fontWeight: '600' }}>
                      {entry.summary}
                    </Text>
                    <Text variant="labelSmall" style={{ color: '#aaa', marginTop: 4 }}>
                      {new Date(entry.createdAt).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', hour12: true,
                      })}
                    </Text>
                  </Surface>
                </View>
              );
            })
          )}
        </View>
      )}

      <Portal>
        {/* ── Add Enquiry Dialog ───────────────────────────────────── */}
        <Dialog visible={showEnquiryDialog} onDismiss={() => setShowEnquiryDialog(false)}>
          <Dialog.Title>📋 Add Enquiry</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Enquiry / Note"
              value={enquiryMsg}
              onChangeText={setEnquiryMsg}
              mode="outlined"
              multiline
              numberOfLines={4}
              placeholder="What did the customer ask or enquire about?"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowEnquiryDialog(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleAddEnquiry} loading={saving}
              disabled={!enquiryMsg.trim() || saving}>
              Add
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* ── Deal Dialog ──────────────────────────────────────────────── */}
        <Dialog visible={showDealDialog} onDismiss={() => setShowDealDialog(false)}>
          <Dialog.Title>💰 Edit Deal Info</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Deal Name (optional)"
              value={dealLabel}
              onChangeText={setDealLabel}
              mode="outlined"
              placeholder="e.g. Website Design Package"
              style={{ marginBottom: 12 }}
            />
            <TextInput
              label="Deal Amount (₹)"
              value={dealValue}
              onChangeText={setDealValue}
              mode="outlined"
              keyboardType="numeric"
              left={<TextInput.Affix text="₹" />}
              style={{ marginBottom: 12 }}
            />
            <Text variant="labelMedium" style={{ marginBottom: 8, color: '#555' }}>
              Payment Status
            </Text>
            <Menu
              visible={showDealStatusMenu}
              onDismiss={() => setShowDealStatusMenu(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setShowDealStatusMenu(true)}
                  icon="chevron-down"
                  contentStyle={{ flexDirection: 'row-reverse' }}
                >
                  {dealStatus === 'PAID' ? '✅ Paid' :
                   dealStatus === 'PARTIAL' ? '⚠️ Partial' :
                   dealStatus === 'PENDING' ? '🔴 Pending' : 'No Status'}
                </Button>
              }
            >
              <Menu.Item onPress={() => { setDealStatus('NONE');    setShowDealStatusMenu(false); }} title="No Status" />
              <Menu.Item onPress={() => { setDealStatus('PENDING'); setShowDealStatusMenu(false); }} title="🔴 Pending" />
              <Menu.Item onPress={() => { setDealStatus('PARTIAL'); setShowDealStatusMenu(false); }} title="⚠️ Partial" />
              <Menu.Item onPress={() => { setDealStatus('PAID');    setShowDealStatusMenu(false); }} title="✅ Paid" />
            </Menu>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDealDialog(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleUpdateDeal} loading={saving}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showAddReminder} onDismiss={() => setShowAddReminder(false)}>
          <Dialog.Title>Set Reminder</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="What needs to be done?"
              value={newReminderMsg}
              onChangeText={setNewReminderMsg}
              mode="outlined"
              style={{ marginBottom: 12 }}
            />
            <Text variant="bodySmall" style={{ color: '#666' }}>
              Reminder will be set for tomorrow.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddReminder(false)}>Cancel</Button>
            <Button 
              onPress={handleCreateReminder} 
              loading={saving} 
              disabled={!newReminderMsg.trim()}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showTagsDialog} onDismiss={() => setShowTagsDialog(false)}>
          <Dialog.Title>Edit Tags</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Tags (comma separated)"
              value={editedTags}
              onChangeText={setEditedTags}
              mode="outlined"
              placeholder="e.g. VIP, HotLead, FollowUp"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowTagsDialog(false)}>Cancel</Button>
            <Button onPress={handleUpdateTags} loading={saving}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        {/* ── 9.3 Compare Leads Modal ──────────────────────────────────── */}
        <Dialog
          visible={showCompareModal}
          onDismiss={() => setShowCompareModal(false)}
          style={{ maxHeight: '85%' }}
        >
          <Dialog.Title>📊 Compare Leads</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 420 }}>
            <ScrollView>
              {allLeads.map((lead: any, idx: number) => {
                const enquiryCount = Array.isArray(lead.enquiries) ? lead.enquiries.length : 0;
                const statusColor =
                  lead.status === 'CLOSED_WON'  ? '#2E7D32' :
                  lead.status === 'CLOSED_LOST' ? '#B71C1C' :
                  lead.status === 'INTERESTED'  ? '#F57F17' :
                  lead.status === 'FOLLOW_UP'   ? '#E65100' :
                  lead.status === 'BOOKED'      ? '#6A1B9A' : '#1565C0';

                return (
                  <View key={lead.id} style={styles.compareCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.compareTitle}>Lead {idx + 1}</Text>
                      <Chip compact style={{ backgroundColor: '#F5F5F5' }} textStyle={{ fontSize: 9, color: '#555' }}>
                        #{(lead.id ?? '').replace(/-/g, '').slice(0, 6).toUpperCase()}
                      </Chip>
                    </View>
                    <View style={styles.compareRow}>
                      <Text style={styles.compareKey}>Status</Text>
                      <Text style={[styles.compareVal, { color: statusColor, fontWeight: '700' }]}>{lead.status}</Text>
                    </View>
                    <View style={styles.compareRow}>
                      <Text style={styles.compareKey}>Enquiries</Text>
                      <Text style={styles.compareVal}>{enquiryCount}</Text>
                    </View>
                    <View style={styles.compareRow}>
                      <Text style={styles.compareKey}>Deal Value</Text>
                      <Text style={styles.compareVal}>
                        {lead.dealValue ? `₹${Number(lead.dealValue).toLocaleString('en-IN')}` : '—'}
                      </Text>
                    </View>
                    <View style={styles.compareRow}>
                      <Text style={styles.compareKey}>Payment</Text>
                      <Text style={styles.compareVal}>{lead.paymentStatus ?? 'NONE'}</Text>
                    </View>
                    <View style={styles.compareRow}>
                      <Text style={styles.compareKey}>Deal Label</Text>
                      <Text style={styles.compareVal}>{lead.dealLabel || '—'}</Text>
                    </View>
                    <View style={styles.compareRow}>
                      <Text style={styles.compareKey}>Last Activity</Text>
                      <Text style={styles.compareVal}>
                        {lead.lastActivity
                          ? new Date(lead.lastActivity).toLocaleDateString('en-IN')
                          : '—'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowCompareModal(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  name: {
    fontWeight: 'bold',
    marginTop: 16,
    color: '#333',
  },
  statusChip: {
    marginTop: 8,
    backgroundColor: '#F0F2F5',
  },
  statusText: {
    color: '#075E54',
    fontWeight: '600',
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 24,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
  },
  noteDate: {
    color: '#999',
    marginTop: 4,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingRight: 12,
    marginBottom: 8,
  },
  enquiryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statBadge: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 64,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  compareCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  compareTitle: {
    fontWeight: '700',
    fontSize: 13,
    color: '#333',
    marginBottom: 6,
  },
  compareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  compareKey: {
    fontSize: 12,
    color: '#888',
    flex: 1,
  },
  compareVal: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1565C0',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#fff',
  },
  tableCell: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },

  // ── Activity Timeline ───────────────────────────────────────────────────
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    position: 'relative',
  },
  timelineConnector: {
    position: 'absolute',
    left: 15,
    top: 34,
    width: 2,
    bottom: -12,
    backgroundColor: '#E0E0E0',
    zIndex: 0,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
    zIndex: 1,
    flexShrink: 0,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
  },
});

