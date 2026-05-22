import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Dimensions } from 'react-native';
import { Text, useTheme, Card, Avatar, Chip, IconButton, Menu, SegmentedButtons, Divider } from 'react-native-paper';
import { useLeadStore, Lead, LeadStatus } from '../store/useLeadStore';
import { crmApi } from '../services/api';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width * 0.8;

const ALL_STATUSES: LeadStatus[] = ['INTERESTED', 'FOLLOW_UP', 'BOOKED', 'CLOSED_WON', 'CLOSED_LOST'];

const STAGES: { filterIds: LeadStatus[]; label: string; color: string }[] = [
  { filterIds: ALL_STATUSES,                  label: '📋 All Leads', color: '#333333' },
  { filterIds: ['INTERESTED'],                label: 'Interested',   color: '#FFC107' },
  { filterIds: ['FOLLOW_UP'],                 label: 'Follow Up',    color: '#FF9800' },
  { filterIds: ['BOOKED'],                    label: '📅 Booked',    color: '#9C27B0' },
  { filterIds: ['CLOSED_WON', 'CLOSED_LOST'], label: 'Closed',       color: '#4CAF50' },
];

// Returns a short display ID like "a1b2c3"
const shortId = (id: string) => id?.replace(/-/g, '').slice(0, 6).toUpperCase() ?? '------';

export default function PipelineScreen({ navigation }: any) {
  const theme = useTheme();
  const { leads, setLeads, updateLeadStatus: updateStoreStatus } = useLeadStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [visibleMenu, setVisibleMenu] = React.useState<string | null>(null);
  // 'lead' = one card per lead (default), 'contact' = grouped by contact
  const [viewMode, setViewMode] = React.useState<'lead' | 'contact'>('lead');

  const fetchLeads = async () => {
    try {
      const response = await crmApi.getLeads();
      const mappedLeads: Lead[] = response.data.map((item: any) => ({
        id: item.id,
        contactId: item.contact?.id,
        name: item.contact?.name || 'Unknown',
        lastMessage: item.dealLabel ||
          (item.enquiries?.length > 0
            ? item.enquiries[item.enquiries.length - 1].message
            : 'New lead via WhatsApp'),
        time: item.lastActivity
          ? new Date(item.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Just now',
        status: item.status as LeadStatus,
        enquiries: item.enquiries || [],
        dealLabel: item.dealLabel,
        dealValue: item.dealValue,
        paymentStatus: item.paymentStatus,
        currency: item.currency,
        isNew: item.isNew ?? false,
        createdAtHuman: item.createdAtHuman ?? '',
      }));
      setLeads(mappedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchLeads();
    setRefreshing(false);
  }, []);

  const handleStatusMove = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await crmApi.updateLeadStatus(leadId, newStatus);
      updateStoreStatus(leadId, newStatus);
      setVisibleMenu(null);
    } catch (error) {
      console.error('Error moving lead:', error);
    }
  };

  // ── Lead card (one per lead, shows lead ID) ──────────────────────────
  const renderLeadCard = (lead: Lead) => {
    const enquiryCount = lead.enquiries?.length ?? 0;
    const subtitle = lead.dealLabel
      ? `💼 ${lead.dealLabel}`
      : enquiryCount > 0
        ? `💬 ${lead.enquiries![enquiryCount - 1].message}`
        : 'No enquiries yet';

    // Count how many leads this contact has in the pipeline
    const siblingCount = leads.filter(l => l.contactId === lead.contactId).length;

    return (
      <Card
        key={lead.id}
        style={[styles.leadCard, lead.status === 'CLOSED_LOST' ? { opacity: 0.7 } : {}]}
        elevation={1}
        onPress={() => navigation.navigate('LeadDetail', { leadId: lead.id, leadName: lead.name })}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Avatar.Text
              size={36}
              label={lead.name.split(' ').map(n => n[0]).join('')}
              style={{ backgroundColor: theme.colors.primaryContainer }}
              labelStyle={{ color: theme.colors.primary, fontSize: 14 }}
            />
            <View style={styles.headerInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text variant="titleSmall" style={styles.leadName}>{lead.name}</Text>
                {/* Multiple leads badge */}
                {siblingCount > 1 && (
                  <Chip compact style={styles.multiLeadBadge} textStyle={{ fontSize: 9, color: '#7B1FA2' }}>
                    {siblingCount} leads
                  </Chip>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {/* Lead ID */}
                <Text variant="labelSmall" style={styles.leadIdText}>#{shortId(lead.id)}</Text>
                <Text variant="labelSmall" style={styles.timeText}> · {lead.time}</Text>
                {lead.status === 'CLOSED_WON' && (
                  <Chip compact style={[styles.statusBadge, { backgroundColor: '#E8F5E9' }]} textStyle={{ color: '#4CAF50', fontSize: 10 }}>WON</Chip>
                )}
                {lead.status === 'CLOSED_LOST' && (
                  <Chip compact style={[styles.statusBadge, { backgroundColor: '#FFEBEE' }]} textStyle={{ color: '#F44336', fontSize: 10 }}>LOST</Chip>
                )}
              </View>
              {/* Freshness row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                {lead.isNew && (
                  <Chip compact style={styles.freshBadge} textStyle={{ fontSize: 9, color: '#1B5E20', fontWeight: 'bold' }}>
                    🟢 NEW
                  </Chip>
                )}
                {lead.createdAtHuman ? (
                  <Text variant="labelSmall" style={styles.createdAtText}>{lead.createdAtHuman}</Text>
                ) : null}
              </View>
            </View>

            <Menu
              visible={visibleMenu === lead.id}
              onDismiss={() => setVisibleMenu(null)}
              anchor={<IconButton icon="dots-vertical" size={20} onPress={() => setVisibleMenu(lead.id)} />}
            >
              <Menu.Item onPress={() => handleStatusMove(lead.id, 'INTERESTED')}  title="Move to Interested"  disabled={lead.status === 'INTERESTED'} />
              <Menu.Item onPress={() => handleStatusMove(lead.id, 'FOLLOW_UP')}   title="Move to Follow Up"   disabled={lead.status === 'FOLLOW_UP'} />
              <Menu.Item onPress={() => handleStatusMove(lead.id, 'BOOKED')}      title="Move to Booked"      disabled={lead.status === 'BOOKED'} />
              <Menu.Item onPress={() => handleStatusMove(lead.id, 'CLOSED_WON')}  title="Move to Closed Won"  disabled={lead.status === 'CLOSED_WON'} />
              <Menu.Item onPress={() => handleStatusMove(lead.id, 'CLOSED_LOST')} title="Move to Closed Lost" disabled={lead.status === 'CLOSED_LOST'} />
            </Menu>
          </View>

          <Text variant="bodySmall" numberOfLines={1} style={styles.lastMessage}>{subtitle}</Text>

          <View style={styles.cardFooter}>
            {enquiryCount > 0 && (
              <Chip compact style={styles.enquiryChip} textStyle={{ fontSize: 10, color: '#1565C0' }}>
                {enquiryCount} enquir{enquiryCount === 1 ? 'y' : 'ies'}
              </Chip>
            )}
            {lead.dealValue ? (
              <Chip compact style={[styles.enquiryChip, { backgroundColor: '#E8F5E9' }]} textStyle={{ fontSize: 10, color: '#2E7D32' }}>
                ₹{Number(lead.dealValue).toLocaleString('en-IN')}
              </Chip>
            ) : null}
          </View>
        </Card.Content>
      </Card>
    );
  };

  // ── Contact-grouped card (one card per contact, shows all lead statuses) ──
  const renderContactGroupCard = (contactId: string, contactLeads: Lead[]) => {
    const rep = contactLeads[0];
    return (
      <Card
        key={contactId}
        style={styles.leadCard}
        elevation={1}
        onPress={() => navigation.navigate('ContactProfile', { contactId })}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Avatar.Text
              size={36}
              label={rep.name.split(' ').map(n => n[0]).join('')}
              style={{ backgroundColor: theme.colors.primaryContainer }}
              labelStyle={{ color: theme.colors.primary, fontSize: 14 }}
            />
            <View style={styles.headerInfo}>
              <Text variant="titleSmall" style={styles.leadName}>{rep.name}</Text>
              <Text variant="labelSmall" style={styles.timeText}>{contactLeads.length} lead{contactLeads.length > 1 ? 's' : ''}</Text>
            </View>
          </View>
          {/* Show each lead as a small status chip */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {contactLeads.map((l, i) => (
              <Chip
                key={l.id}
                compact
                style={{ height: 22, backgroundColor: '#F3E5F5' }}
                textStyle={{ fontSize: 9, color: '#6A1B9A' }}
              >
                #{shortId(l.id)} · {l.status}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderColumn = (stage: typeof STAGES[0]) => {
    const stageLeads = leads.filter(l => stage.filterIds.includes(l.status));

    let content: React.ReactNode;

    if (viewMode === 'contact') {
      // Group by contactId
      const grouped: Record<string, Lead[]> = {};
      stageLeads.forEach(l => {
        if (!grouped[l.contactId]) grouped[l.contactId] = [];
        grouped[l.contactId].push(l);
      });
      const groups = Object.entries(grouped);
      content = (
        <FlatList
          data={groups}
          keyExtractor={([cid]) => cid}
          renderItem={({ item: [cid, cls] }) => renderContactGroupCard(cid, cls)}
          contentContainerStyle={styles.columnList}
          showsVerticalScrollIndicator={false}
        />
      );
    } else {
      content = (
        <FlatList
          data={stageLeads}
          keyExtractor={item => item.id}
          renderItem={({ item }) => renderLeadCard(item)}
          contentContainerStyle={styles.columnList}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    return (
      <View style={styles.columnContainer} key={stage.label}>
        <View style={[
          styles.columnHeader,
          stage.label === '📋 All Leads' ? styles.allLeadsHeader : {}
        ]}>
          <View style={[styles.statusIndicator, { backgroundColor: stage.color }]} />
          <Text variant="titleMedium" style={[
            styles.stageLabel,
            stage.label === '📋 All Leads' ? { color: '#333', fontWeight: 'bold' } : {}
          ]}>{stage.label}</Text>
          <Chip compact style={[
            styles.countChip,
            stage.label === '📋 All Leads' ? { backgroundColor: '#333', } : {}
          ]} textStyle={stage.label === '📋 All Leads' ? { color: '#fff', fontWeight: 'bold' } : {}}>
            {viewMode === 'contact'
              ? new Set(stageLeads.map(l => l.contactId)).size
              : stageLeads.length}
          </Chip>
        </View>
        {content}
      </View>
    );
  };

  // ── Contact list view — flat list of unique contacts ────────────────
  const renderContactListView = () => {
    // Build unique contacts from leads
    const contactMap: Record<string, { contactId: string; name: string; leads: Lead[] }> = {};
    leads.forEach(l => {
      if (!contactMap[l.contactId]) {
        contactMap[l.contactId] = { contactId: l.contactId, name: l.name, leads: [] };
      }
      contactMap[l.contactId].leads.push(l);
    });
    const contacts = Object.values(contactMap);

    if (contacts.length === 0) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
          <Text style={{ color: '#aaa' }}>No contacts found</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={contacts}
        keyExtractor={item => item.contactId}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => {
          const activeLeads = item.leads.filter(l => !['CLOSED_WON', 'CLOSED_LOST'].includes(l.status));
          const wonLeads    = item.leads.filter(l => l.status === 'CLOSED_WON');
          const hasNew      = item.leads.some(l => l.isNew);
          const latestLead  = item.leads[item.leads.length - 1];

          return (
            <Card
              style={styles.contactCard}
              elevation={1}
              onPress={() => navigation.navigate('ContactProfile', { contactId: item.contactId })}
            >
              <Card.Content>
                {/* Row 1: Avatar + Name + NEW badge */}
                <View style={styles.contactRow}>
                  <Avatar.Text
                    size={44}
                    label={item.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    style={{ backgroundColor: theme.colors.primaryContainer }}
                    labelStyle={{ color: theme.colors.primary, fontSize: 16 }}
                  />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text variant="titleSmall" style={{ fontWeight: '700' }}>{item.name}</Text>
                      {hasNew && (
                        <Chip compact style={{ backgroundColor: '#E8F5E9', height: 18 }}
                          textStyle={{ fontSize: 9, color: '#1B5E20', fontWeight: 'bold' }}>
                          🟢 NEW
                        </Chip>
                      )}
                    </View>
                    {/* Latest deal label */}
                    {latestLead?.dealLabel ? (
                      <Text variant="bodySmall" style={{ color: '#666', marginTop: 2 }}>
                        💼 {latestLead.dealLabel}
                      </Text>
                    ) : null}
                    {/* Created time */}
                    {latestLead?.createdAtHuman ? (
                      <Text variant="labelSmall" style={{ color: '#aaa', marginTop: 1 }}>
                        {latestLead.createdAtHuman}
                      </Text>
                    ) : null}
                  </View>
                  <IconButton
                    icon="chevron-right"
                    size={20}
                    iconColor="#ccc"
                    style={{ margin: 0 }}
                  />
                </View>

                <Divider style={{ marginVertical: 10 }} />

                {/* Row 2: Stats */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={styles.contactStat}>
                    <Text style={styles.contactStatNum}>{item.leads.length}</Text>
                    <Text style={styles.contactStatLabel}>Leads</Text>
                  </View>
                  <View style={styles.contactStat}>
                    <Text style={[styles.contactStatNum, { color: '#FF9800' }]}>{activeLeads.length}</Text>
                    <Text style={styles.contactStatLabel}>Active</Text>
                  </View>
                  <View style={styles.contactStat}>
                    <Text style={[styles.contactStatNum, { color: '#2E7D32' }]}>{wonLeads.length}</Text>
                    <Text style={styles.contactStatLabel}>Won</Text>
                  </View>
                  {latestLead?.dealValue ? (
                    <View style={[styles.contactStat, { flex: 2 }]}>
                      <Text style={[styles.contactStatNum, { color: '#1565C0', fontSize: 13 }]}>
                        ₹{Number(latestLead.dealValue).toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.contactStatLabel}>Deal Value</Text>
                    </View>
                  ) : null}
                </View>

                {/* Row 3: Lead status chips */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                  {item.leads.map(l => (
                    <Chip
                      key={l.id}
                      compact
                      style={{ height: 22, backgroundColor: '#F3E5F5' }}
                      textStyle={{ fontSize: 9, color: '#6A1B9A' }}
                      onPress={() => navigation.navigate('LeadDetail', { leadId: l.id, leadName: l.name })}
                    >
                      #{shortId(l.id)} · {l.status}
                    </Chip>
                  ))}
                </View>
              </Card.Content>
            </Card>
          );
        }}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* View mode toggle */}
      <View style={styles.toggleRow}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={v => setViewMode(v as 'lead' | 'contact')}
          buttons={[
            { value: 'lead',    label: 'By Lead',    icon: 'card-account-details' },
            { value: 'contact', label: 'By Contact', icon: 'account-group' },
          ]}
          style={styles.segmented}
        />
      </View>

      {/* Total summary bar — Total first, then each stage */}
      <View style={styles.summaryBar}>
        <View style={[styles.summaryItem, { borderRightWidth: 1, borderRightColor: '#eee', paddingRight: 10 }]}>
          <View style={[styles.summaryDot, { backgroundColor: '#333' }]} />
          <Text style={[styles.summaryCount, { color: '#333' }]}>{leads.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        {STAGES.filter(s => s.label !== '📋 All Leads').map(stage => {
          const count = leads.filter(l => stage.filterIds.includes(l.status)).length;
          return (
            <View key={stage.label} style={styles.summaryItem}>
              <View style={[styles.summaryDot, { backgroundColor: stage.color }]} />
              <Text style={styles.summaryCount}>{count}</Text>
              <Text style={styles.summaryLabel} numberOfLines={1}>{stage.label.replace('📅 ', '')}</Text>
            </View>
          );
        })}
      </View>

      {/* ── By Contact: flat vertical list ── */}
      {viewMode === 'contact' ? (
        renderContactListView()
      ) : (
        <>
          <ScrollView
            horizontal
            pagingEnabled={false}
            showsHorizontalScrollIndicator={false}
            snapToInterval={COLUMN_WIDTH + 20}
            decelerationRate="fast"
            contentContainerStyle={styles.scrollContent}
          >
            {STAGES.map(renderColumn)}
          </ScrollView>
          <Text style={styles.swipeHint}>← Swipe to see all stages →</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  toggleRow:       { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  segmented:       { height: 36 },
  scrollContent:   { paddingHorizontal: 10, paddingVertical: 12 },
  columnContainer: { width: COLUMN_WIDTH, marginHorizontal: 10, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 20, padding: 12 },
  columnHeader:    { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  allLeadsHeader:  { backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  statusIndicator: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  stageLabel:      { fontWeight: 'bold', flex: 1 },
  countChip:       { backgroundColor: 'rgba(255,255,255,0.8)', height: 24 },
  columnList:      { paddingBottom: 20 },
  leadCard:        { backgroundColor: '#fff', marginBottom: 12, borderRadius: 12 },
  cardContent:     { padding: 12 },
  cardHeader:      { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  headerInfo:      { flex: 1, marginLeft: 12 },
  leadName:        { fontWeight: '600' },
  leadIdText:      { color: '#9C27B0', fontFamily: 'monospace', fontSize: 10 },
  timeText:        { color: '#999' },
  lastMessage:     { color: '#666', fontStyle: 'italic' },
  cardFooter:      { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  enquiryChip:     { backgroundColor: '#E3F2FD', height: 22 },
  statusBadge:     { marginLeft: 6, height: 20 },
  multiLeadBadge:  { backgroundColor: '#F3E5F5', height: 18 },
  freshBadge:      { backgroundColor: '#E8F5E9', height: 18 },
  createdAtText:   { color: '#4CAF50', fontSize: 10 },
  summaryBar:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  summaryItem:     { flex: 1, alignItems: 'center' },
  summaryDot:      { width: 8, height: 8, borderRadius: 4, marginBottom: 2 },
  summaryCount:    { fontSize: 16, fontWeight: 'bold', color: '#333' },
  summaryLabel:    { fontSize: 9, color: '#999', textAlign: 'center' },
  swipeHint:       { textAlign: 'center', color: '#bbb', fontSize: 11, paddingBottom: 6 },
  contactCard:     { backgroundColor: '#fff', marginBottom: 10, borderRadius: 14 },
  contactRow:      { flexDirection: 'row', alignItems: 'center' },
  contactStat:     { flex: 1, alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 8, paddingVertical: 6 },
  contactStatNum:  { fontSize: 16, fontWeight: 'bold', color: '#333' },
  contactStatLabel:{ fontSize: 9, color: '#999', marginTop: 1 },
});
