import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, ActivityIndicator, Portal, Dialog, TextInput } from 'react-native-paper';
import { crmApi } from '../services/api';
import { tokens } from '../theme/tokens';
import { StatusBadge } from '@components/global/Badge/StatusBadge';
import { AppButton } from '@components/global/Button/AppButton';
import { AppCard } from '@components/global/Card/AppCard';
import { AppDivider } from '@components/global/Divider/AppDivider';
import { AppAvatar } from '@components/global/Avatar/AppAvatar';
import { Edit2, Share } from 'lucide-react-native';

const shortId = (id: string) => id?.replace(/-/g, '').slice(0, 6).toUpperCase() ?? '------';

export interface LeadDetailHeaderProps {
  name: string;
  company?: string;
  avatarUrl?: string | null;
  onEdit?: () => void;
  onShare?: () => void;
  style?: any;
}

export const LeadDetailHeader: React.FC<LeadDetailHeaderProps> = ({
  name,
  company,
  avatarUrl,
  onEdit,
  onShare,
  style,
}) => {
  const theme = useTheme();

  return (
    <View style={[headerStyles.container, { backgroundColor: theme.colors.surface }, style]}>
      <View style={headerStyles.profileSection}>
        <AppAvatar name={name} imageUrl={avatarUrl} size="large" />
        <View style={headerStyles.infoSection}>
          <Text style={[headerStyles.name, { color: theme.colors.onSurface }]}>{name}</Text>
          {company && <Text style={[headerStyles.company, { color: tokens.colors.textSecondary }]}>{company}</Text>}
        </View>
      </View>
      
      <View style={headerStyles.actionsSection}>
        {onShare && (
          <AppButton variant="secondary" size="small" onPress={onShare} style={headerStyles.actionButton}>
            <Share size={16} color={theme.colors.secondary} style={headerStyles.icon} />
            Share
          </AppButton>
        )}
        {onEdit && (
          <AppButton variant="primary" size="small" onPress={onEdit} style={headerStyles.actionButton}>
            <Edit2 size={16} color={theme.colors.onPrimary} style={headerStyles.icon} />
            Edit
          </AppButton>
        )}
      </View>
    </View>
  );
};

const headerStyles = StyleSheet.create({
  container: {
    padding: tokens.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.borderLight,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  infoSection: {
    marginLeft: tokens.spacing.lg,
    flex: 1,
  },
  name: {
    fontSize: tokens.typography.headlineSmall.fontSize,
    fontWeight: tokens.typography.headlineSmall.fontWeight as any,
    marginBottom: tokens.spacing.xs,
  },
  company: {
    fontSize: tokens.typography.bodyLarge.fontSize,
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  actionButton: {
    marginRight: tokens.spacing.md,
  },
  icon: {
    marginRight: tokens.spacing.xs,
  },
});

export interface LeadMetricsProps {
  metrics: {
    label: string;
    value: string | number;
  }[];
  style?: any;
}

export const LeadMetrics: React.FC<LeadMetricsProps> = ({ metrics, style }) => {
  return (
    <AppCard style={[metricsStyles.container, style]} elevation="sm">
      <View style={metricsStyles.grid}>
        {metrics.map((metric, index) => (
          <View key={index} style={metricsStyles.metricItem}>
            <Text style={[metricsStyles.value, { color: tokens.colors.primary }]}>{metric.value}</Text>
            <Text style={[metricsStyles.label, { color: tokens.colors.textSecondary }]}>{metric.label}</Text>
          </View>
        ))}
      </View>
    </AppCard>
  );
};

const metricsStyles = StyleSheet.create({
  container: {
    padding: tokens.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.backgroundDark,
    borderRadius: tokens.borderRadius.md,
    marginBottom: tokens.spacing.sm,
  },
  value: {
    fontSize: tokens.typography.titleLarge.fontSize,
    fontWeight: tokens.typography.titleLarge.fontWeight as any,
    marginBottom: 4,
  },
  label: {
    fontSize: tokens.typography.labelSmall.fontSize,
    textTransform: 'uppercase',
  },
});

export default function LeadDetailScreen({ route, navigation }: any) {
  const { leadId, leadName } = route.params;
  const theme = useTheme();

  const [lead, setLead] = useState<any>(null);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [saving, setSaving] = useState(false);

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
      const found = res.data.content.find((l: any) => l.id === leadId);
      setLead(found ?? null);
      await fetchEnquiries();
    } catch (e) {
      console.error('Error fetching lead details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeadDetails(); }, [leadId]);

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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const metrics = [];
  if (lead?.dealValue) {
    metrics.push({ label: 'Deal Value', value: `₹` + Number(lead.dealValue).toLocaleString('en-IN') });
  }
  if (enquiries.length > 0) {
    metrics.push({ label: 'Total Enquiries', value: enquiries.length });
  }

  // Extract extra lead details from the latest enquiry that has them
  let extractedDetails: any = null;
  if (enquiries.length > 0) {
    for (let i = enquiries.length - 1; i >= 0; i--) {
      const enq = enquiries[i];
      if (enq.name || enq.email || enq.phone || enq.requirement) {
        extractedDetails = enq;
        break;
      }
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <LeadDetailHeader 
          name={lead?.contact?.name || extractedDetails?.name || leadName || 'Lead'} 
          company={extractedDetails?.company || (lead?.leadNumber ? `Lead #${lead.leadNumber}` : `Lead #${shortId(leadId)}`)}
          onShare={() => {}}
        />



        <View style={styles.statusSection}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.textPrimary }]}>Status</Text>
          <StatusBadge status={lead?.status || 'NEW'} size="medium" />
        </View>

        {metrics.length > 0 && (
          <View style={styles.metricsSection}>
             <LeadMetrics metrics={metrics} />
          </View>
        )}

        <View style={styles.enquiriesSection}>
          <View style={styles.enquiriesHeader}>
            <Text style={[styles.sectionTitle, { color: tokens.colors.textPrimary }]}>Enquiries</Text>
            <AppButton variant="secondary" size="small" onPress={() => setShowAddDialog(true)}>
              Add Note
            </AppButton>
          </View>
          
          {enquiries.length === 0 ? (
            <Text style={[styles.emptyText, { color: tokens.colors.textSecondary }]}>No enquiries yet.</Text>
          ) : (
            enquiries.map((enq, idx) => (
              <AppCard key={enq.id} style={styles.enquiryCard} elevation="sm">
                <Text style={[styles.enqMessage, { color: tokens.colors.textPrimary }]}>{enq.message}</Text>
                
                {(enq.name || enq.email || enq.phone || enq.requirement || enq.company || enq.city || enq.budget || enq.age || enq.gender || enq.address || enq.pincode || enq.preferredDate || (enq.additionalDetails && Object.keys(enq.additionalDetails).length > 0)) && (
                  <View style={{ marginTop: 12, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8, gap: 4 }}>
                    {enq.name && <Text style={{ fontSize: 14, color: tokens.colors.textSecondary }}>👤 <Text style={{fontWeight: 'bold'}}>Name:</Text> {enq.name}</Text>}
                    {enq.email && <Text style={{ fontSize: 14, color: tokens.colors.textSecondary }}>📧 <Text style={{fontWeight: 'bold'}}>Email:</Text> {enq.email}</Text>}
                    {enq.phone && <Text style={{ fontSize: 14, color: tokens.colors.textSecondary }}>📱 <Text style={{fontWeight: 'bold'}}>Phone:</Text> {enq.phone}</Text>}
                    {enq.company && <Text style={{ fontSize: 14, color: tokens.colors.textSecondary }}>🏢 <Text style={{fontWeight: 'bold'}}>Company:</Text> {enq.company}</Text>}
                    {enq.budget && <Text style={{ fontSize: 14, color: tokens.colors.textSecondary }}>💰 <Text style={{fontWeight: 'bold'}}>Budget:</Text> {enq.budget}</Text>}
                    {enq.city && <Text style={{ fontSize: 14, color: tokens.colors.textSecondary }}>📍 <Text style={{fontWeight: 'bold'}}>City:</Text> {enq.city}</Text>}
                    {enq.age && <Text style={{ fontSize: 14, color: tokens.colors.textSecondary }}>🎂 <Text style={{fontWeight: 'bold'}}>Age:</Text> {enq.age}</Text>}
                    {enq.gender && <Text style={{ fontSize: 14, color: tokens.colors.textSecondary }}>👤 <Text style={{fontWeight: 'bold'}}>Gender:</Text> {enq.gender}</Text>}
                    {enq.address && <Text style={{ fontSize: 14, color: tokens.colors.textSecondary }}>📍 <Text style={{fontWeight: 'bold'}}>Address:</Text> {enq.address}</Text>}
                    {enq.pincode && <Text style={{ fontSize: 14, color: tokens.colors.textSecondary }}>📮 <Text style={{fontWeight: 'bold'}}>Pincode:</Text> {enq.pincode}</Text>}
                    {enq.preferredDate && <Text style={{ fontSize: 14, color: tokens.colors.textSecondary }}>📅 <Text style={{fontWeight: 'bold'}}>Preferred Date:</Text> {enq.preferredDate}</Text>}
                    {(() => {
                      if (!enq.requirement && !enq.additionalDetails) return null;
                      
                      let mainReq = '';
                      let extraDetailsList: {k: string, v: string}[] = [];
                      
                      if (enq.additionalDetails && Object.keys(enq.additionalDetails).length > 0) {
                        mainReq = (enq.requirement || '').split('Additional Details:\n')[0].trim();
                        extraDetailsList = Object.entries(enq.additionalDetails).map(([k, v]) => ({ k, v }));
                      } else if (enq.requirement) {
                        const parts = enq.requirement.split('Additional Details:\n');
                        mainReq = parts[0].trim();
                        const extraStr = parts.length > 1 ? parts[1].trim() : '';
                        if (extraStr) {
                          extraStr.split('\n').forEach(line => {
                            const colonIdx = line.indexOf(':');
                            if (colonIdx !== -1) {
                              extraDetailsList.push({
                                k: line.substring(0, colonIdx).trim(),
                                v: line.substring(colonIdx + 1).trim()
                              });
                            }
                          });
                        }
                      }
                      
                      return (
                        <View style={{ marginTop: 4 }}>
                          {mainReq ? (
                            <Text style={{ fontSize: 14, color: tokens.colors.textSecondary, marginBottom: extraDetailsList.length > 0 ? 8 : 0 }}>
                              📝 <Text style={{fontWeight: 'bold'}}>Requirement:</Text> {mainReq}
                            </Text>
                          ) : null}
                          
                          {extraDetailsList.length > 0 ? (
                            <View style={{ marginTop: 4 }}>
                              <Text style={{ fontSize: 13, fontWeight: 'bold', color: tokens.colors.textSecondary, marginBottom: 8 }}>
                                📋 Additional Details:
                              </Text>
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                {extraDetailsList.map((detail, i: number) => {
                                  const formattedKey = detail.k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                  return (
                                    <View key={i} style={{ backgroundColor: theme.colors.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.primary + '30' }}>
                                      <Text style={{ fontSize: 12, color: theme.colors.primary }}>
                                        <Text style={{ fontWeight: 'bold' }}>{formattedKey}: </Text>
                                        {detail.v}
                                      </Text>
                                    </View>
                                  );
                                })}
                              </View>
                            </View>
                          ) : null}
                        </View>
                      );
                    })()}
                  </View>
                )}

                <AppDivider style={styles.divider} />
                <View style={styles.enqMeta}>
                  <Text style={[styles.enqType, { color: theme.colors.primary }]}>{enq.type}</Text>
                  <Text style={[styles.enqDate, { color: tokens.colors.textTertiary }]}>
                    {new Date(enq.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </AppCard>
            ))
          )}
        </View>

        {lead?.contact?.id && (
          <AppButton 
            onPress={() => navigation.navigate('ContactProfile', { contactId: lead.contact.id })}
            style={styles.contactBtn}
            variant="outlined"
          >
            View Full Contact Profile
          </AppButton>
        )}
      </View>

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
            <AppButton variant="text" onPress={() => setShowAddDialog(false)}>Cancel</AppButton>
            <AppButton onPress={handleAddEnquiry} disabled={!newMessage.trim() || saving}>
              {saving ? 'Saving...' : 'Save'}
            </AppButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  content: {
    paddingBottom: tokens.spacing.xl,
  },
  statusSection: {
    padding: tokens.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: tokens.typography.titleMedium.fontSize,
    fontWeight: 'bold',
  },
  metricsSection: {
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
  },
  enquiriesSection: {
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
  },
  enquiriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  emptyText: {
    fontStyle: 'italic',
    marginTop: tokens.spacing.sm,
  },
  enquiryCard: {
    marginBottom: tokens.spacing.md,
    padding: tokens.spacing.md,
  },
  enqMessage: {
    fontSize: tokens.typography.bodyMedium.fontSize,
    marginBottom: tokens.spacing.sm,
  },
  divider: {
    marginVertical: tokens.spacing.sm,
  },
  enqMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  enqType: {
    fontSize: tokens.typography.labelSmall.fontSize,
    fontWeight: 'bold',
  },
  enqDate: {
    fontSize: tokens.typography.labelSmall.fontSize,
  },
  contactBtn: {
    marginHorizontal: tokens.spacing.lg,
    marginTop: tokens.spacing.md,
  },
});
