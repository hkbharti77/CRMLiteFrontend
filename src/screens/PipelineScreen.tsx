import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Dimensions } from 'react-native';
import { Text, useTheme, Card, Avatar, Chip, IconButton, Menu, SegmentedButtons } from 'react-native-paper';
import { useLeadStore, Lead, LeadStatus } from '../store/useLeadStore';
import { crmApi } from '../services/api';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width * 0.8;

const STAGES: { filterIds: LeadStatus[]; label: string; color: string }[] = [
  { filterIds: ['NEW'],                       label: 'New',       color: '#2196F3' },
  { filterIds: ['INTERESTED'],                label: 'Interested',color: '#FFC107' },
  { filterIds: ['FOLLOW_UP'],                 label: 'Follow Up', color: '#FF9800' },
  { filterIds: ['BOOKED'],                    label: '📅 Booked', color: '#9C27B0' },
  { filterIds: ['CLOSED_WON', 'CLOSED_LOST'], label: 'Closed',    color: '#4CAF50' },
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
        onPress={() => navigation.navigate('ContactProfile', { contactId: lead.contactId })}
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
            </View>

            <Menu
              visible={visibleMenu === lead.id}
              onDismiss={() => setVisibleMenu(null)}
              anchor={<IconButton icon="dots-vertical" size={20} onPress={() => setVisibleMenu(lead.id)} />}
            >
              <Menu.Item onPress={() => handleStatusMove(lead.id, 'NEW')}         title="Move to New"         disabled={lead.status === 'NEW'} />
              <Menu.Item onPress={() => handleStatusMove(lead.id, 'INTERESTED')}  title="Move to Interested"  disabled={lead.status === 'INTERESTED'} />
              <Menu.Item onPress={() => handleStatusMove(lead.id, 'FOLLOW_UP')}   title="Move to Follow Up"   disabled={lead.status === 'FOLLOW_UP'} />
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
        <View style={styles.columnHeader}>
          <View style={[styles.statusIndicator, { backgroundColor: stage.color }]} />
          <Text variant="titleMedium" style={styles.stageLabel}>{stage.label}</Text>
          <Chip compact style={styles.countChip}>
            {viewMode === 'contact'
              ? new Set(stageLeads.map(l => l.contactId)).size
              : stageLeads.length}
          </Chip>
        </View>
        {content}
      </View>
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
});
