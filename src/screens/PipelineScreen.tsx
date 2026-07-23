import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import {
  Text,
  useTheme,
  SegmentedButtons,
  Portal,
  Dialog,
  Button,
  TextInput,
} from 'react-native-paper';
import { useLeadStore, Lead, LeadStatus } from '../store/useLeadStore';
import { crmApi, API_BASE_URL } from '../services/api';
import { tokens } from '../theme/tokens';
import { LeadCard } from '@components/leads/LeadCard';
import { BulkUploadModal } from '@components/leads';
import { Phone, Mail, Building, ChevronRight, Upload, Download } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppCard } from '@components/global/Card/AppCard';
import { AppAvatar } from '@components/global/Avatar/AppAvatar';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width * 0.8;

const ALL_STATUSES: LeadStatus[] = ['NEW', 'INTERESTED', 'FOLLOW_UP', 'BOOKED', 'CLOSED_WON', 'CLOSED_LOST'];

const STAGES: { filterIds: LeadStatus[]; label: string; color: string }[] = [
  { filterIds: ALL_STATUSES, label: '?? All Leads', color: '#333333' },
  { filterIds: ['NEW'], label: 'New', color: '#2196F3' },
  { filterIds: ['INTERESTED'], label: 'Interested', color: '#FFC107' },
  { filterIds: ['FOLLOW_UP'], label: 'Follow Up', color: '#FF9800' },
  { filterIds: ['BOOKED'], label: '?? Booked', color: '#9C27B0' },
  { filterIds: ['CLOSED_WON', 'CLOSED_LOST'], label: 'Closed', color: '#4CAF50' },
];

// ── Status colour map ──────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  NEW: '#2196F3',
  INTERESTED: '#FFC107',
  FOLLOW_UP: '#FF9800',
  BOOKED: '#9C27B0',
  CLOSED_WON: '#4CAF50',
  CLOSED_LOST: '#F44336',
};

const STATUS_LABEL: Record<string, string> = {
  NEW: 'New',
  INTERESTED: 'Interested',
  FOLLOW_UP: 'Follow Up',
  BOOKED: 'Booked',
  CLOSED_WON: 'Won ✓',
  CLOSED_LOST: 'Lost ✗',
};

// ── Mini pipeline bar ──────────────────────────────────────────────────────
const PIPELINE_ORDER: LeadStatus[] = ['NEW', 'INTERESTED', 'FOLLOW_UP', 'BOOKED', 'CLOSED_WON', 'CLOSED_LOST'];

interface MinPipelineBarProps {
  leads: Lead[];
}

const MinPipelineBar: React.FC<MinPipelineBarProps> = ({ leads }) => {
  return (
    <View style={pipelineBarStyles.row}>
      {PIPELINE_ORDER.map((status) => {
        const count = leads.filter(l => l.status === status).length;
        const color = STATUS_COLOR[status];
        return (
          <View key={status} style={pipelineBarStyles.stage}>
            <View
              style={[
                pipelineBarStyles.dot,
                { backgroundColor: count > 0 ? color : color + '30' },
              ]}
            />
            {count > 0 && (
              <Text style={[pipelineBarStyles.count, { color }]}>{count}</Text>
            )}
            <Text
              style={[
                pipelineBarStyles.label,
                { color: count > 0 ? color : '#bbb' },
              ]}
              numberOfLines={1}
            >
              {STATUS_LABEL[status]}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const pipelineBarStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.xs,
  },
  stage: {
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 3,
  },
  count: {
    fontSize: 11,
    fontWeight: 'bold',
    lineHeight: 14,
  },
  label: {
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12,
  },
});

// ── Contact Lead Summary Card ──────────────────────────────────────────────
interface ContactLeadSummaryCardProps {
  contactId: string;
  name: string;
  phone?: string;
  email?: string;
  leads: Lead[];
  onPress: () => void;
  onLeadPress: (lead: Lead) => void;
}

const ContactLeadSummaryCard: React.FC<ContactLeadSummaryCardProps> = ({
  contactId,
  name,
  phone,
  email,
  leads,
  onPress,
  onLeadPress,
}) => {
  const theme = useTheme();

  const activeLeads = leads.filter(l => !['CLOSED_WON', 'CLOSED_LOST'].includes(l.status));
  const wonLeads = leads.filter(l => l.status === 'CLOSED_WON');
  const totalDeal = leads.reduce((sum, l) => sum + (l.dealValue ?? 0), 0);
  const latestLead = leads[leads.length - 1];
  const bestScore = leads.reduce((max, l) => Math.max(max, l.score ?? 0), 0);

  const scoreEmoji = bestScore >= 80 ? '🔥' : bestScore >= 50 ? '⭐' : bestScore > 0 ? '❄️' : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <AppCard style={[cStyles.card]} elevation="sm">

        {/* ── Header ── */}
        <View style={cStyles.header}>
          <AppAvatar name={name} size="large" />
          <View style={cStyles.headerInfo}>
            <Text style={[cStyles.name, { color: theme.colors.onSurface }]} numberOfLines={1}>
              {name}
            </Text>
            <View style={cStyles.metaRow}>
              {leads.length > 0 && (
                <View style={[cStyles.badge, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Text style={[cStyles.badgeText, { color: theme.colors.primary }]}>
                    {leads.length} Lead{leads.length > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
              {activeLeads.length > 0 && (
                <View style={[cStyles.badge, { backgroundColor: '#E8F5E9' }]}>
                  <Text style={[cStyles.badgeText, { color: '#388E3C' }]}>
                    {activeLeads.length} Active
                  </Text>
                </View>
              )}
              {wonLeads.length > 0 && (
                <View style={[cStyles.badge, { backgroundColor: '#E8F5E9' }]}>
                  <Text style={[cStyles.badgeText, { color: '#2E7D32' }]}>
                    {wonLeads.length} Won ✓
                  </Text>
                </View>
              )}
            </View>
          </View>
          <ChevronRight size={18} color={tokens.colors.textTertiary} />
        </View>

        {/* ── Stats row ── */}
        {(totalDeal > 0 || bestScore > 0) && (
          <View style={cStyles.statsRow}>
            {totalDeal > 0 && (
              <View style={cStyles.statItem}>
                <Text style={[cStyles.statValue, { color: theme.colors.primary }]}>
                  ₹{totalDeal >= 100000
                    ? `${(totalDeal / 100000).toFixed(1)}L`
                    : totalDeal.toLocaleString('en-IN')}
                </Text>
                <Text style={cStyles.statLabel}>Deal Value</Text>
              </View>
            )}
            {scoreEmoji && bestScore > 0 && (
              <View style={cStyles.statItem}>
                <Text style={[cStyles.statValue, { color: STATUS_COLOR.FOLLOW_UP }]}>
                  {scoreEmoji} {bestScore}
                </Text>
                <Text style={cStyles.statLabel}>Best Score</Text>
              </View>
            )}
            {latestLead?.ownerName && (
              <View style={cStyles.statItem}>
                <Text style={[cStyles.statValue, { color: tokens.colors.textSecondary, fontSize: 13 }]} numberOfLines={1}>
                  {latestLead.ownerName}
                </Text>
                <Text style={cStyles.statLabel}>Owner</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Mini Pipeline bar ── */}
        <MinPipelineBar leads={leads} />

        {/* ── Individual lead chips (if multiple leads) ── */}
        {leads.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: tokens.spacing.sm }}
            contentContainerStyle={{ paddingRight: tokens.spacing.sm }}
          >
            {leads.map((lead, idx) => {
              const color = STATUS_COLOR[lead.status] ?? '#888';
              return (
                <TouchableOpacity
                  key={lead.id}
                  onPress={() => onLeadPress(lead)}
                  style={[cStyles.leadChip, { borderColor: color + '60', backgroundColor: color + '12' }]}
                >
                  <View style={[cStyles.chipDot, { backgroundColor: color }]} />
                  <Text style={[cStyles.chipText, { color }]} numberOfLines={1}>
                    {lead.leadNumber ? `#${lead.leadNumber}` : `Lead ${idx + 1}`}
                    {'  '}{STATUS_LABEL[lead.status]}
                  </Text>
                  {lead.dealValue ? (
                    <Text style={[cStyles.chipValue, { color: tokens.colors.textSecondary }]}>
                      {' '}· ₹{Number(lead.dealValue).toLocaleString('en-IN')}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* ── Quick action bar ── */}
        {(phone || email) && (
          <View style={cStyles.actionBar}>
            {phone && (
              <TouchableOpacity
                style={cStyles.actionBtn}
                onPress={() => Linking.openURL(`tel:${phone}`)}
              >
                <Phone size={14} color={theme.colors.primary} />
                <Text style={[cStyles.actionText, { color: theme.colors.primary }]}>Call</Text>
              </TouchableOpacity>
            )}
            {email && email !== 'N/A' && (
              <TouchableOpacity
                style={cStyles.actionBtn}
                onPress={() => Linking.openURL(`mailto:${email}`)}
              >
                <Mail size={14} color={theme.colors.primary} />
                <Text style={[cStyles.actionText, { color: theme.colors.primary }]}>Email</Text>
              </TouchableOpacity>
            )}
            {latestLead?.source && (
              <View style={[cStyles.sourceBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text style={[cStyles.sourceText, { color: tokens.colors.textSecondary }]}>
                  via {latestLead.source === 'web-widget' ? '🌐 Web' : '💬 WhatsApp'}
                </Text>
              </View>
            )}
          </View>
        )}
      </AppCard>
    </TouchableOpacity>
  );
};

const cStyles = StyleSheet.create({
  card: {
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: tokens.spacing.md,
    marginRight: tokens.spacing.sm,
  },
  name: {
    fontSize: tokens.typography.titleMedium.fontSize,
    fontWeight: 'bold',
    marginBottom: tokens.spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: tokens.borderRadius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: tokens.spacing.md,
    paddingTop: tokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.borderLight,
    gap: tokens.spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: tokens.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  leadChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: tokens.borderRadius.full,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 5,
    marginRight: tokens.spacing.sm,
  },
  chipDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipValue: {
    fontSize: 11,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: tokens.spacing.md,
    paddingTop: tokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.borderLight,
    gap: tokens.spacing.lg,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sourceBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: tokens.borderRadius.full,
  },
  sourceText: {
    fontSize: 11,
  },
});

// ── Old ContactCard (kept for backward compatibility if needed) ────────────
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

// ── Main PipelineScreen ────────────────────────────────────────────────────
export default function PipelineScreen({ navigation }: any) {
  const theme = useTheme();
  const { leads, setLeads } = useLeadStore();
  const [viewMode, setViewMode] = React.useState<'lead' | 'contact'>('lead');
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [showLeadDialog, setShowLeadDialog] = React.useState(false);
  const [showBulkModal, setShowBulkModal] = React.useState(false);
  const [showExportModal, setShowExportModal] = React.useState(false);
  const [exportFormat, setExportFormat] = React.useState<'csv' | 'excel'>('csv');
  const [exportStartDate, setExportStartDate] = React.useState('');
  const [exportEndDate, setExportEndDate] = React.useState('');
  const [exporting, setExporting] = React.useState(false);

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    setExportStartDate(formatDate(firstDay));
    setExportEndDate(formatDate(today));
  }, []);

  const handleExportLeads = async () => {
    try {
      setExporting(true);
      const format = exportFormat;
      const start = exportStartDate.trim();
      const end = exportEndDate.trim();

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (start && !dateRegex.test(start)) {
        alert('Start Date must be in YYYY-MM-DD format');
        setExporting(false);
        return;
      }
      if (end && !dateRegex.test(end)) {
        alert('End Date must be in YYYY-MM-DD format');
        setExporting(false);
        return;
      }

      if (Platform.OS === 'web') {
        const response = await crmApi.exportLeads(format, start, end);
        const fileExt = format === 'excel' ? 'xlsx' : 'csv';
        const contentType = format === 'excel' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv';
          
        const blob = new Blob([response.data], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14);
        link.setAttribute('download', `leads_export_${timestamp}.${fileExt}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const token = await AsyncStorage.getItem('userToken');
        const tenantId = (await AsyncStorage.getItem('tenantId')) || (await AsyncStorage.getItem('userId'));
        
        const fileExt = format === 'excel' ? 'xlsx' : 'csv';
        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14);
        const filename = `leads_export_${timestamp}.${fileExt}`;
        const localUri = `${FileSystem.documentDirectory}${filename}`;
        
        const downloadUrl = `${API_BASE_URL}/leads/export?format=${format}` + 
                            (start ? `&startDate=${start}` : '') + 
                            (end ? `&endDate=${end}` : '');
        
        const { uri } = await FileSystem.downloadAsync(
          downloadUrl,
          localUri,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Tenant-ID': tenantId || '',
            },
          }
        );
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          alert(`File saved to: ${uri}`);
        }
      }
      setShowExportModal(false);
    } catch (error) {
      console.error('Failed to export leads:', error);
      alert('Failed to export leads. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const response = await crmApi.getLeads();
      const mappedLeads: Lead[] = response.data.content.map((item: any) => ({
        id: item.id,
        leadNumber: item.leadNumber,
        contactId: item.contact?.id,
        name: item.contact?.name || 'Unknown',
        email: item.contact?.email,
        phone: item.contact?.phone,
        source: (item.enquiries && item.enquiries.length > 0)
          ? item.enquiries[item.enquiries.length - 1].source
          : (item.contact?.source || 'whatsapp'),
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
        ownerName: item.ownerName,
        score: item.score,
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
          name: lead.leadNumber ? `${lead.leadNumber} - ${lead.name}` : lead.name,
          status: lead.status,
          value: lead.dealValue,
          lastContact: lead.time,
          ownerName: lead.ownerName,
          source: lead.source,
          email: lead.email,
          phone: lead.phone,
          score: lead.score,
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

  // ── "By Contact" view — now uses ContactLeadSummaryCard ──────────────────
  const renderContactListView = () => {
    // Group leads by contactId
    const contactMap: Record<string, {
      contactId: string;
      name: string;
      phone?: string;
      email?: string;
      leads: Lead[];
    }> = {};

    leads.forEach(l => {
      if (!contactMap[l.contactId]) {
        contactMap[l.contactId] = {
          contactId: l.contactId,
          name: l.name,
          phone: l.phone,
          email: l.email,
          leads: [],
        };
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
          <ContactLeadSummaryCard
            contactId={item.contactId}
            name={item.name}
            phone={item.phone}
            email={item.email}
            leads={item.leads}
            onPress={() => navigation.navigate('ContactProfile', { contactId: item.contactId })}
            onLeadPress={(lead: Lead) =>
              navigation.navigate('LeadDetail', { leadId: lead.id, leadName: lead.name })
            }
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
            { value: 'lead', label: 'By Lead', icon: 'card-account-details' },
            { value: 'contact', label: 'By Contact', icon: 'account-group' },
          ]}
          style={{ flex: 1 }}
        />
        <Button
          mode="outlined"
          compact
          icon={() => <Upload size={14} color={theme.colors.primary} />}
          onPress={() => setShowBulkModal(true)}
          style={styles.uploadBtn}
          labelStyle={styles.uploadBtnLabel}
        >
          Upload
        </Button>
        <Button
          mode="outlined"
          compact
          icon={() => <Download size={14} color={theme.colors.primary} />}
          onPress={() => setShowExportModal(true)}
          style={[styles.uploadBtn, { marginLeft: 8 }]}
          labelStyle={styles.uploadBtnLabel}
        >
          Download
        </Button>
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
          style={{ flex: 1 }}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={COLUMN_WIDTH + 20}
          decelerationRate="fast"
          contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}
        >
          {STAGES.map(renderColumn)}
        </ScrollView>
      )}

      <Portal>
        <BulkUploadModal
          visible={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          onSuccess={() => { setShowBulkModal(false); fetchLeads(); }}
        />
        <Dialog visible={showExportModal} onDismiss={() => setShowExportModal(false)} style={{ borderRadius: 12 }}>
          <Dialog.Title>Download Leads Data</Dialog.Title>
          <Dialog.Content>
            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 13, color: tokens.colors.textSecondary, marginBottom: 8 }}>
                Filter leads by creation date and select the export format.
              </Text>
              
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TextInput
                  label="Start Date (YYYY-MM-DD)"
                  value={exportStartDate}
                  onChangeText={setExportStartDate}
                  mode="outlined"
                  style={{ flex: 1 }}
                  placeholder="YYYY-MM-DD"
                />
                <TextInput
                  label="End Date (YYYY-MM-DD)"
                  value={exportEndDate}
                  onChangeText={setExportEndDate}
                  mode="outlined"
                  style={{ flex: 1 }}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <Text style={{ fontSize: 14, fontWeight: '600', marginTop: 8, color: tokens.colors.textPrimary }}>Export Format</Text>
              <SegmentedButtons
                value={exportFormat}
                onValueChange={v => setExportFormat(v as 'csv' | 'excel')}
                buttons={[
                  { value: 'csv', label: 'CSV File' },
                  { value: 'excel', label: 'Excel (XLSX)' },
                ]}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowExportModal(false)} disabled={exporting}>Cancel</Button>
            <Button mode="contained" onPress={handleExportLeads} loading={exporting} disabled={exporting}>
              Download
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={showLeadDialog} onDismiss={() => { setShowLeadDialog(false); setSelectedLead(null); }} style={{ borderRadius: 12 }}>
          <Dialog.Title>{selectedLead?.name} - Details</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 400, paddingVertical: 10 }}>
            <ScrollView>
              {selectedLead?.enquiries && selectedLead.enquiries.length > 0 ? (
                selectedLead.enquiries.map((enq: any, idx: number) => (
                  <View key={idx} style={{ marginBottom: 16, backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 8 }}>
                    <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: 'bold' }}>{enq.type}</Text>
                    <Text style={{ color: theme.colors.onSurface, marginTop: 4 }}>{enq.message}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ fontStyle: 'italic', color: tokens.colors.textSecondary }}>No enquiries available.</Text>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => { setShowLeadDialog(false); setSelectedLead(null); }}>Close</Button>
            <Button mode="contained" onPress={() => {
              const lead = selectedLead;
              setShowLeadDialog(false);
              setSelectedLead(null);
              if (lead) navigation.navigate('LeadDetail', { leadId: lead.id, leadName: lead.name });
            }}>Full Profile</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, paddingHorizontal: tokens.spacing.md, paddingTop: tokens.spacing.md, paddingBottom: tokens.spacing.sm },
  uploadBtn: { borderRadius: tokens.borderRadius.md, borderColor: tokens.colors.borderLight },
  uploadBtnLabel: { fontSize: 12 },
  scrollContent: { paddingHorizontal: tokens.spacing.sm, paddingVertical: tokens.spacing.sm },
  columnContainer: {
    width: COLUMN_WIDTH,
    height: '100%',
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
  summaryBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: tokens.spacing.md, backgroundColor: tokens.colors.surface, borderBottomWidth: 1, borderBottomColor: tokens.colors.borderLight },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryCount: { fontSize: tokens.typography.titleMedium.fontSize, fontWeight: 'bold' },
  summaryLabel: { fontSize: tokens.typography.labelSmall.fontSize, color: tokens.colors.textSecondary, marginTop: tokens.spacing.xs },
});
