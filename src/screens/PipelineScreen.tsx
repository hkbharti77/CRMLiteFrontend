import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { Text, useTheme, SegmentedButtons } from 'react-native-paper';
import { useLeadStore, Lead, LeadStatus } from '../store/useLeadStore';
import { crmApi } from '../services/api';
import { tokens } from '../theme/tokens';
import { AppChip as Chip } from '@components/global/Badge/AppChip';
import { LeadCard } from '@components/leads/LeadCard';
import { Phone, Mail, Building } from 'lucide-react-native';
import { AppCard } from '@components/global/Card/AppCard';
import { AppAvatar } from '@components/global/Avatar/AppAvatar';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width * 0.8;

const ALL_STATUSES: LeadStatus[] = ['INTERESTED', 'FOLLOW_UP', 'BOOKED', 'CLOSED_WON', 'CLOSED_LOST'];

const STAGES: { filterIds: LeadStatus[]; label: string; color: string }[] = [
  { filterIds: ALL_STATUSES,                  label: '?? All Leads', color: '#333333' },
  { filterIds: ['INTERESTED'],                label: 'Interested',   color: '#FFC107' },
  { filterIds: ['FOLLOW_UP'],                 label: 'Follow Up',    color: '#FF9800' },
  { filterIds: ['BOOKED'],                    label: '?? Booked',    color: '#9C27B0' },
  { filterIds: ['CLOSED_WON', 'CLOSED_LOST'], label: 'Closed',       color: '#4CAF50' },
];

export interface ContactCardProps {
  contact: {
    id: string;
    name: string;
    avatar?: string;
    company?: string;
    role?: string;
    phone?: string;
    email?: string;
  };
  onPress?: () => void;
  style?: any;
}

export const ContactCard: React.FC<ContactCardProps> = ({ contact, onPress, style }) => {
  const theme = useTheme();

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <AppCard style={[contactStyles.container, style]} elevation="sm">
        <View style={contactStyles.headerRow}>
          <AppAvatar name={contact.name} imageUrl={contact.avatar} size="large" />
          <View style={contactStyles.headerInfo}>
            <Text style={[contactStyles.name, { color: theme.colors.onSurface }]} numberOfLines={1}>
              {contact.name}
            </Text>
            {contact.role && (
              <Text style={[contactStyles.role, { color: tokens.colors.textSecondary }]} numberOfLines={1}>
                {contact.role}
              </Text>
            )}
          </View>
        </View>

        <View style={contactStyles.detailsContainer}>
          {contact.company && (
            <View style={contactStyles.detailRow}>
              <Building size={16} color={tokens.colors.textTertiary} style={contactStyles.icon} />
              <Text style={[contactStyles.detailText, { color: tokens.colors.textSecondary }]} numberOfLines={1}>
                {contact.company}
              </Text>
            </View>
          )}
          {contact.email && (
            <View style={contactStyles.detailRow}>
              <Mail size={16} color={tokens.colors.textTertiary} style={contactStyles.icon} />
              <Text style={[contactStyles.detailText, { color: tokens.colors.textSecondary }]} numberOfLines={1}>
                {contact.email}
              </Text>
            </View>
          )}
          {contact.phone && (
            <View style={contactStyles.detailRow}>
              <Phone size={16} color={tokens.colors.textTertiary} style={contactStyles.icon} />
              <Text style={[contactStyles.detailText, { color: tokens.colors.textSecondary }]} numberOfLines={1}>
                {contact.phone}
              </Text>
            </View>
          )}
        </View>
      </AppCard>
    </TouchableOpacity>
  );
};

const contactStyles = StyleSheet.create({
  container: {
    padding: tokens.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  headerInfo: {
    marginLeft: tokens.spacing.md,
    flex: 1,
  },
  name: {
    fontSize: tokens.typography.titleLarge.fontSize,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  role: {
    fontSize: tokens.typography.bodyMedium.fontSize,
  },
  detailsContainer: {
    marginTop: tokens.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  icon: {
    marginRight: tokens.spacing.sm,
  },
  detailText: {
    fontSize: tokens.typography.bodyMedium.fontSize,
    flex: 1,
  },
});

export default function PipelineScreen({ navigation }: any) {
  const theme = useTheme();
  const { leads, setLeads } = useLeadStore();
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

  const renderLeadCard = (lead: Lead) => {
    return (
      <LeadCard
        key={lead.id}
        lead={{
          id: lead.id,
          name: lead.name,
          status: lead.status,
          value: lead.dealValue,
          lastContact: lead.time,
        }}
        onPress={() => navigation.navigate('LeadDetail', { leadId: lead.id, leadName: lead.name })}
        style={styles.leadCard}
      />
    );
  };

  const renderColumn = (stage: typeof STAGES[0]) => {
    const stageLeads = leads.filter(l => stage.filterIds.includes(l.status));

    return (
      <View style={styles.columnContainer} key={stage.label}>
        <View style={styles.columnHeader}>
          <View style={[styles.statusIndicator, { backgroundColor: stage.color }]} />
          <Text style={[styles.stageLabel, { color: tokens.colors.textPrimary }]}>{stage.label}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{stageLeads.length}</Text>
          </View>
        </View>
        <FlatList
          data={stageLeads}
          keyExtractor={item => item.id}
          renderItem={({ item }) => renderLeadCard(item)}
          contentContainerStyle={styles.columnList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  const renderContactListView = () => {
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: tokens.colors.textSecondary }}>No contacts found</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={contacts}
        keyExtractor={item => item.contactId}
        contentContainerStyle={{ padding: tokens.spacing.md }}
        renderItem={({ item }) => (
          <ContactCard
            contact={{
              id: item.contactId,
              name: item.name,
              role: item.leads.some(l => !['CLOSED_WON', 'CLOSED_LOST'].includes(l.status)) ? 'Active' : 'Inactive',
            }}
            onPress={() => navigation.navigate('ContactProfile', { contactId: item.contactId })}
            style={styles.contactCard}
          />
        )}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.toggleRow}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={v => setViewMode(v as 'lead' | 'contact')}
          buttons={[
            { value: 'lead',    label: 'By Lead',    icon: 'card-account-details' },
            { value: 'contact', label: 'By Contact', icon: 'account-group' },
          ]}
        />
      </View>

      <View style={styles.summaryBar}>
        <View style={[styles.summaryItem, { borderRightWidth: 1, borderRightColor: tokens.colors.borderLight }]}>
          <Text style={styles.summaryCount}>{leads.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        {STAGES.filter(s => s.label !== '?? All Leads').map(stage => {
          const count = leads.filter(l => stage.filterIds.includes(l.status)).length;
          return (
            <View key={stage.label} style={styles.summaryItem}>
              <Text style={styles.summaryCount}>{count}</Text>
              <Text style={styles.summaryLabel} numberOfLines={1}>{stage.label.replace('?? ', '')}</Text>
            </View>
          );
        })}
      </View>

      {viewMode === 'contact' ? (
        renderContactListView()
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={COLUMN_WIDTH + 20}
          decelerationRate="fast"
          contentContainerStyle={styles.scrollContent}
        >
          {STAGES.map(renderColumn)}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toggleRow: { paddingHorizontal: tokens.spacing.md, paddingTop: tokens.spacing.md, paddingBottom: tokens.spacing.sm },
  scrollContent: { paddingHorizontal: tokens.spacing.sm, paddingVertical: tokens.spacing.sm },
  columnContainer: { 
    width: COLUMN_WIDTH, 
    marginHorizontal: tokens.spacing.sm, 
    backgroundColor: tokens.colors.surface, 
    borderRadius: tokens.borderRadius.lg, 
    padding: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.borderLight,
  },
  columnHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: tokens.spacing.lg },
  statusIndicator: { width: 12, height: 12, borderRadius: 6, marginRight: tokens.spacing.sm },
  stageLabel: { fontWeight: 'bold', flex: 1, fontSize: tokens.typography.titleMedium.fontSize },
  countBadge: { backgroundColor: tokens.colors.backgroundDark, paddingHorizontal: tokens.spacing.sm, paddingVertical: 4, borderRadius: tokens.borderRadius.full },
  countText: { fontSize: tokens.typography.labelMedium.fontSize, fontWeight: 'bold', color: tokens.colors.textSecondary },
  columnList: { paddingBottom: tokens.spacing.xl },
  leadCard: { marginBottom: tokens.spacing.md },
  contactCard: { marginBottom: tokens.spacing.md },
  summaryBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: tokens.spacing.md, backgroundColor: tokens.colors.surface, borderBottomWidth: 1, borderBottomColor: tokens.colors.borderLight },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryCount: { fontSize: tokens.typography.titleMedium.fontSize, fontWeight: 'bold' },
  summaryLabel: { fontSize: tokens.typography.labelSmall.fontSize, color: tokens.colors.textSecondary, marginTop: tokens.spacing.xs },
});
