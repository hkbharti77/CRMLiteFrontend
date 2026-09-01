import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  useTheme,
  Portal,
  Dialog,
  Button,
  TextInput,
  Chip,
  Card,
  ActivityIndicator,
  Snackbar,
  Divider,
  SegmentedButtons,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { campaignApi, whatsappTemplateApi } from '../services/api';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';

export interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  category: string;
  status: string;
  bodyText: string;
}

export interface Campaign {
  id: string;
  name: string;
  templateSnapshot?: {
    name: string;
    bodyText: string;
  };
  status: 'DRAFT' | 'PREVIEW' | 'VALIDATING' | 'SCHEDULED' | 'QUEUED' | 'RUNNING' | 'PAUSED' | 'FAILED' | 'CANCELLED' | 'COMPLETED';
  targetType: 'ALL_CONTACTS' | 'TAG_BASED' | 'LEAD_STATUS_BASED' | 'CSV_EXCEL_UPLOAD' | 'CUSTOM_SEGMENT';
  targetFilterJson?: string;
  variableMappingJson?: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface CampaignAnalytics {
  totalTargetRecipients: number;
  totalValidRecipients: number;
  totalSkippedRecipients: number;
  totalQueued: number;
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
  totalRetried: number;
}

export interface AuditLog {
  id: string;
  action: string;
  detailsJson?: string;
  createdAt: string;
  actorUser?: {
    email: string;
  };
}

const AVAILABLE_LEAD_STATUSES = [
  'NEW',
  'IN_PROGRESS',
  'CONTACTED',
  'SCHEDULED',
  'QUALIFIED',
  'CLOSED',
  'WON',
  'LOST',
  'DISQUALIFIED',
];

const PRESET_TAGS = ['VIP', 'Hot Lead', 'HNI', 'Webinar', 'New Lead', 'Customer', 'Priority'];

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  DRAFT:      { color: '#6b7280', bg: '#F9FAFB', icon: '📝' },
  PREVIEW:    { color: '#8b5cf6', bg: '#F5F3FF', icon: '👁️' },
  VALIDATING: { color: '#d97706', bg: '#FEF3C7', icon: '🔍' },
  SCHEDULED:  { color: '#2563eb', bg: '#EFF6FF', icon: '⏰' },
  QUEUED:     { color: '#0284c7', bg: '#E0F2FE', icon: '📥' },
  RUNNING:    { color: '#059669', bg: '#ECFDF5', icon: '⚡' },
  PAUSED:     { color: '#d97706', bg: '#FFFBEB', icon: '⏸️' },
  FAILED:     { color: '#dc2626', bg: '#FEF2F2', icon: '❌' },
  CANCELLED:  { color: '#9ca3af', bg: '#F3F4F6', icon: '🚫' },
  COMPLETED:  { color: '#16a34a', bg: '#F0FDF4', icon: '✅' },
};

export default function WhatsAppCampaignScreen() {
  const theme = useTheme();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');

  // Form State
  const [campaignName, setCampaignName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [targetType, setTargetType] = useState<'ALL_CONTACTS' | 'TAG_BASED' | 'LEAD_STATUS_BASED' | 'CSV_EXCEL_UPLOAD'>('ALL_CONTACTS');
  const [selectedLeadStatuses, setSelectedLeadStatuses] = useState<string[]>(['NEW', 'IN_PROGRESS']);
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>(['VIP']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [csvRecipients, setCsvRecipients] = useState<Array<{ phone: string; name?: string; email?: string }>>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvUploadResult, setCsvUploadResult] = useState<any | null>(null);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [filterConfig, setFilterConfig] = useState<{ filterColumns: string[]; filterRules: any[] } | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Array<{ column: string; operator: string; value: string }>>([]);
  const [filterMatchLogic, setFilterMatchLogic] = useState<'AND' | 'OR'>('AND');
  const [varMapping1, setVarMapping1] = useState('contact.name');
  const [varMapping2, setVarMapping2] = useState('lead.dealValue');
  const [testPhoneNumber, setTestPhoneNumber] = useState('');

  // Modals & Snackbar
  const [dryRunDialogVisible, setDryRunDialogVisible] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [analyticsModalVisible, setAnalyticsModalVisible] = useState(false);
  const [currentAnalytics, setCurrentAnalytics] = useState<CampaignAnalytics | null>(null);
  const [currentAuditLogs, setCurrentAuditLogs] = useState<AuditLog[]>([]);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const [resCampaigns, resTemplates] = await Promise.all([
        campaignApi.getCampaigns(0, 50),
        whatsappTemplateApi.getTemplates(false),
      ]);
      setCampaigns(resCampaigns.data.content || resCampaigns.data || []);
      setTemplates(resTemplates.data || []);
    } catch (err: any) {
      setSnackbarMessage('Failed to load campaigns or templates.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
    // Load per-tenant broadcast upload filter config
    campaignApi.getFilterConfig()
      .then((res) => {
        if (res.data) setFilterConfig(res.data);
      })
      .catch(() => {});
  }, [fetchCampaigns]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCampaigns();
  };

  const getUniqueValuesForColumn = useCallback(
    (colName: string) => {
      if (!csvUploadResult?.validRows || !colName) return [];
      const set = new Set<string>();
      for (const row of csvUploadResult.validRows) {
        const val = (row[colName] || '').toString().trim();
        if (val) set.add(val);
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    },
    [csvUploadResult]
  );

  const toggleLeadStatus = (status: string) => {
    if (selectedLeadStatuses.includes(status)) {
      setSelectedLeadStatuses(selectedLeadStatuses.filter((s) => s !== status));
    } else {
      setSelectedLeadStatuses([...selectedLeadStatuses, status]);
    }
  };

  const toggleTagName = (tagName: string) => {
    if (selectedTagNames.includes(tagName)) {
      setSelectedTagNames(selectedTagNames.filter((t) => t !== tagName));
    } else {
      setSelectedTagNames([...selectedTagNames, tagName]);
    }
  };

  const addCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (trimmed && !selectedTagNames.includes(trimmed)) {
      setSelectedTagNames([...selectedTagNames, trimmed]);
      setCustomTagInput('');
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', '*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setCsvFileName(file.name);
        setUploadingCsv(true);

        const formData = new FormData();
        if (Platform.OS === 'web') {
          const response = await fetch(file.uri);
          const blob = await response.blob();
          formData.append('file', blob, file.name);
        } else {
          formData.append('file', {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'application/octet-stream',
          } as any);
        }

        try {
          const res = await campaignApi.uploadCsv(formData);
          const resultData = res.data;
          setCsvUploadResult(resultData);
          setCsvRecipients(resultData.validRows || []);
          setSnackbarMessage(`Loaded ${resultData.validPhoneCount} valid numbers from ${file.name}! (${resultData.detectedColumns?.length || 0} columns detected)`);
        } catch (apiErr: any) {
          // Fallback to client-side parsing
          let parsedRows: any[] = [];
          if (Platform.OS === 'web') {
            const response = await fetch(file.uri);
            const arrayBuffer = await response.arrayBuffer();
            const wb = XLSX.read(arrayBuffer, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            parsedRows = XLSX.utils.sheet_to_json(ws);
          } else {
            const b64 = await FileSystem.readAsStringAsync(file.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            const wb = XLSX.read(b64, { type: 'base64' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            parsedRows = XLSX.utils.sheet_to_json(ws);
          }

          const validRecipients: Array<{ phone: string; name?: string; email?: string }> = [];
          for (const row of parsedRows) {
            const phoneKey = Object.keys(row).find((k) =>
              /phone|mobile|whatsapp|waid|number/i.test(k)
            );
            const nameKey = Object.keys(row).find((k) => /name|full/i.test(k));
            const emailKey = Object.keys(row).find((k) => /email|mail/i.test(k));

            const rawPhone = phoneKey ? String(row[phoneKey]).trim() : '';
            if (rawPhone) {
              validRecipients.push({
                phone: rawPhone,
                name: nameKey ? String(row[nameKey]).trim() : undefined,
                email: emailKey ? String(row[emailKey]).trim() : undefined,
              });
            }
          }

          if (validRecipients.length === 0) {
            setSnackbarMessage('No valid phone numbers found. Ensure column header contains "Phone" or "Mobile".');
            return;
          }

          setCsvRecipients(validRecipients);
          setCsvUploadResult(null);
          setSnackbarMessage(`Successfully loaded ${validRecipients.length} recipients from ${file.name}!`);
        } finally {
          setUploadingCsv(false);
        }
      }
    } catch (err: any) {
      setUploadingCsv(false);
      setSnackbarMessage('Failed to parse CSV/Excel file: ' + err.message);
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignName.trim() || !selectedTemplateId) {
      setSnackbarMessage('Please provide a campaign name and select a WhatsApp template.');
      return;
    }

    let targetFilterJson: string | undefined = undefined;
    if (targetType === 'TAG_BASED') {
      if (selectedTagNames.length === 0) {
        setSnackbarMessage('Please select or add at least one Tag for tag-based targeting.');
        return;
      }
      targetFilterJson = JSON.stringify({ tagNames: selectedTagNames });
    } else if (targetType === 'LEAD_STATUS_BASED') {
      if (selectedLeadStatuses.length === 0) {
        setSnackbarMessage('Please select at least one Lead Status for status-based targeting.');
        return;
      }
      targetFilterJson = JSON.stringify({ leadStatuses: selectedLeadStatuses });
    } else if (targetType === 'CSV_EXCEL_UPLOAD') {
      if (csvRecipients.length === 0 && (!csvUploadResult || csvUploadResult.validPhoneCount === 0)) {
        setSnackbarMessage('Please select a CSV or Excel file containing recipient phone numbers.');
        return;
      }
      targetFilterJson = JSON.stringify({
        csvRecipients: csvUploadResult ? csvUploadResult.validRows : csvRecipients,
        phoneColumn: csvUploadResult ? csvUploadResult.phoneColumnName : 'phone',
        appliedFilters: appliedFilters.filter((f) => f.column && f.value.trim()),
        filterMatchLogic,
      });
    }

    try {
      const varMap = JSON.stringify({ "1": varMapping1, "2": varMapping2 });
      await campaignApi.createCampaign({
        name: campaignName,
        templateId: selectedTemplateId,
        targetType,
        targetFilterJson,
        variableMappingJson: varMap,
      });

      setSnackbarMessage('WhatsApp Campaign created as DRAFT!');
      setCampaignName('');
      setSelectedTemplateId('');
      setCsvRecipients([]);
      setCsvFileName('');
      setActiveTab('LIST');
      fetchCampaigns();
    } catch (err: any) {
      setSnackbarMessage(err?.response?.data?.message || 'Failed to create campaign.');
    }
  };

  const handleExecuteDryRun = async () => {
    if (!selectedCampaignId || !testPhoneNumber.trim()) {
      setSnackbarMessage('Please enter a valid mobile number with country code (e.g. +919876543210).');
      return;
    }

    try {
      await campaignApi.executeDryRun(selectedCampaignId, testPhoneNumber.trim());
      setDryRunDialogVisible(false);
      setTestPhoneNumber('');
      setSnackbarMessage('Dry run test message sent successfully!');
    } catch (err: any) {
      setSnackbarMessage(err?.response?.data?.message || 'Failed to send dry run message.');
    }
  };

  const handleScheduleOrBroadcast = async (campaignId: string) => {
    try {
      await campaignApi.scheduleCampaign(campaignId);
      setSnackbarMessage('Campaign broadcast started successfully!');
      fetchCampaigns();
    } catch (err: any) {
      setSnackbarMessage(err?.response?.data?.message || 'Failed to start campaign.');
    }
  };

  const handlePause = async (campaignId: string) => {
    try {
      await campaignApi.pauseCampaign(campaignId);
      setSnackbarMessage('Campaign paused.');
      fetchCampaigns();
    } catch (err: any) {
      setSnackbarMessage('Failed to pause campaign.');
    }
  };

  const handleResume = async (campaignId: string) => {
    try {
      await campaignApi.resumeCampaign(campaignId);
      setSnackbarMessage('Campaign resumed.');
      fetchCampaigns();
    } catch (err: any) {
      setSnackbarMessage('Failed to resume campaign.');
    }
  };

  const handleCancel = async (campaignId: string) => {
    try {
      await campaignApi.cancelCampaign(campaignId);
      setSnackbarMessage('Campaign cancelled.');
      fetchCampaigns();
    } catch (err: any) {
      setSnackbarMessage('Failed to cancel campaign.');
    }
  };

  const handleViewAnalytics = async (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    try {
      const [resAnalytics, resAudit] = await Promise.all([
        campaignApi.getAnalytics(campaignId),
        campaignApi.getAuditLogs(campaignId),
      ]);
      setCurrentAnalytics(resAnalytics.data);
      setCurrentAuditLogs(resAudit.data || []);
      setAnalyticsModalVisible(true);
    } catch (err: any) {
      setSnackbarMessage('Failed to fetch campaign analytics.');
    }
  };

  const totalCampaigns = campaigns.length;
  const runningCampaigns = campaigns.filter(c => c.status === 'RUNNING').length;
  const completedCampaigns = campaigns.filter(c => c.status === 'COMPLETED').length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.headerBanner}>
        <Text style={styles.headerTitle}>📢 WhatsApp Broadcast Engine</Text>
        <Text style={styles.headerSubtitle}>
          Target contacts with Meta-approved templates, dry-run testing & automated rate limiting.
        </Text>

        {/* Dashboard Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalCampaigns}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#059669' }]}>{runningCampaigns}</Text>
            <Text style={styles.statLabel}>Running</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#16a34a' }]}>{completedCampaigns}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Navigation Tabs */}
        <View style={{ marginTop: 12 }}>
          <SegmentedButtons
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as 'LIST' | 'CREATE')}
            buttons={[
              { value: 'LIST', label: 'All Campaigns' },
              { value: 'CREATE', label: '+ Create Broadcast' },
            ]}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'LIST' && (
          <View>
            {loading ? (
              <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.colors.primary} />
            ) : campaigns.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content style={{ alignItems: 'center', padding: 24 }}>
                  <Ionicons name="megaphone-outline" size={48} color="#9ca3af" />
                  <Text style={styles.emptyTitle}>No Campaigns Found</Text>
                  <Text style={styles.emptySub}>Create your first WhatsApp broadcast campaign to reach your leads.</Text>
                  <Button mode="contained" onPress={() => setActiveTab('CREATE')} style={{ marginTop: 16 }}>
                    Create Broadcast
                  </Button>
                </Card.Content>
              </Card>
            ) : (
              campaigns.map((campaign) => {
                const conf = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.DRAFT;
                return (
                  <Card key={campaign.id} style={styles.campaignCard}>
                    <Card.Content>
                      <View style={styles.cardHeader}>
                        <Text style={styles.campaignName}>{campaign.name}</Text>
                        <Chip
                          style={{ backgroundColor: conf.bg }}
                          textStyle={{ color: conf.color, fontWeight: '700' }}
                        >
                          {conf.icon} {campaign.status}
                        </Chip>
                      </View>

                      {campaign.templateSnapshot && (
                        <View style={styles.templateBox}>
                          <Text style={styles.templateLabel}>Template: {campaign.templateSnapshot.name}</Text>
                          <Text style={styles.templateText} numberOfLines={2}>
                            {campaign.templateSnapshot.bodyText}
                          </Text>
                        </View>
                      )}

                      <View style={styles.metaRow}>
                        <Chip icon="people-outline" compact style={{ marginRight: 8 }}>
                          Target: {campaign.targetType}
                        </Chip>
                        <Text style={styles.dateText}>
                          Created: {new Date(campaign.createdAt).toLocaleDateString()}
                        </Text>
                      </View>

                      <Divider style={{ marginVertical: 12 }} />

                      {/* Action Buttons */}
                      <View style={styles.actionsRow}>
                        {campaign.status === 'DRAFT' && (
                          <>
                            <Button
                              mode="outlined"
                              compact
                              onPress={() => {
                                setSelectedCampaignId(campaign.id);
                                setDryRunDialogVisible(true);
                              }}
                              style={styles.actionBtn}
                            >
                              🧪 Dry Run
                            </Button>
                            <Button
                              mode="contained"
                              compact
                              onPress={() => handleScheduleOrBroadcast(campaign.id)}
                              style={styles.actionBtn}
                            >
                              🚀 Broadcast Now
                            </Button>
                          </>
                        )}

                        {campaign.status === 'RUNNING' && (
                          <Button
                            mode="outlined"
                            compact
                            onPress={() => handlePause(campaign.id)}
                            style={styles.actionBtn}
                          >
                            ⏸️ Pause
                          </Button>
                        )}

                        {campaign.status === 'PAUSED' && (
                          <Button
                            mode="contained"
                            compact
                            onPress={() => handleResume(campaign.id)}
                            style={styles.actionBtn}
                          >
                            ▶️ Resume
                          </Button>
                        )}

                        {(campaign.status === 'RUNNING' || campaign.status === 'PAUSED' || campaign.status === 'SCHEDULED') && (
                          <Button
                            mode="text"
                            compact
                            textColor="#dc2626"
                            onPress={() => handleCancel(campaign.id)}
                            style={styles.actionBtn}
                          >
                            Cancel
                          </Button>
                        )}

                        <Button
                          mode="outlined"
                          compact
                          onPress={() => handleViewAnalytics(campaign.id)}
                          style={styles.actionBtn}
                        >
                          📊 Analytics
                        </Button>
                      </View>
                    </Card.Content>
                  </Card>
                );
              })
            )}
          </View>
        )}

        {activeTab === 'CREATE' && (
          <Card style={styles.createCard}>
            <Card.Content>
              <Text style={styles.formTitle}>New WhatsApp Broadcast</Text>

              <TextInput
                label="Campaign Name"
                value={campaignName}
                onChangeText={setCampaignName}
                mode="outlined"
                style={styles.input}
                placeholder="e.g. Diwali Promo Offer"
              />

              <Text style={styles.sectionLabel}>Select Approved Meta Template</Text>
              {templates.length === 0 ? (
                <Text style={{ color: '#dc2626', marginBottom: 12 }}>
                  No Meta WhatsApp templates found. Please create & sync templates first.
                </Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {templates.map((tpl) => (
                    <TouchableOpacity
                      key={tpl.id}
                      onPress={() => setSelectedTemplateId(tpl.id)}
                      style={[
                        styles.templateChipCard,
                        selectedTemplateId === tpl.id && styles.templateChipCardSelected,
                      ]}
                    >
                      <Text style={styles.templateChipName}>{tpl.name}</Text>
                      <Text style={styles.templateChipBody} numberOfLines={2}>
                        {tpl.bodyText}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <Text style={styles.sectionLabel}>Target Audience Segment</Text>
              <SegmentedButtons
                value={targetType}
                onValueChange={(val) => setTargetType(val as any)}
                buttons={[
                  { value: 'ALL_CONTACTS', label: 'All' },
                  { value: 'TAG_BASED', label: 'By Tags' },
                  { value: 'LEAD_STATUS_BASED', label: 'By Status' },
                  { value: 'CSV_EXCEL_UPLOAD', label: '📁 CSV File' },
                ]}
                style={{ marginBottom: 16 }}
              />

              {/* Sub-selector when TAG_BASED is selected */}
              {targetType === 'TAG_BASED' && (
                <View style={styles.subFilterContainer}>
                  <Text style={styles.subFilterTitle}>🏷️ Filter Contacts by Tags</Text>
                  <Text style={styles.subFilterDesc}>Select or type tags to filter target audience:</Text>

                  <View style={styles.chipsWrap}>
                    {PRESET_TAGS.map((tag) => {
                      const isSelected = selectedTagNames.includes(tag);
                      return (
                        <Chip
                          key={tag}
                          selected={isSelected}
                          onPress={() => toggleTagName(tag)}
                          style={[styles.chipItem, isSelected && styles.chipItemSelected]}
                          textStyle={isSelected ? { color: '#FFFFFF', fontWeight: '700' } : { color: '#334155' }}
                        >
                          {isSelected ? '✓ ' : ''}{tag}
                        </Chip>
                      );
                    })}
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                    <TextInput
                      label="Add Custom Tag"
                      value={customTagInput}
                      onChangeText={setCustomTagInput}
                      mode="outlined"
                      dense
                      style={{ flex: 1, marginRight: 8 }}
                      placeholder="e.g. VIP-2026"
                    />
                    <Button mode="outlined" onPress={addCustomTag}>
                      + Add
                    </Button>
                  </View>

                  {selectedTagNames.length > 0 && (
                    <Text style={styles.selectedCountText}>
                      Selected Tags ({selectedTagNames.length}): {selectedTagNames.join(', ')}
                    </Text>
                  )}
                </View>
              )}

              {/* Sub-selector when LEAD_STATUS_BASED is selected */}
              {targetType === 'LEAD_STATUS_BASED' && (
                <View style={styles.subFilterContainer}>
                  <Text style={styles.subFilterTitle}>📊 Filter Contacts by Lead Status</Text>
                  <Text style={styles.subFilterDesc}>Target leads currently in any of these statuses:</Text>

                  <View style={styles.chipsWrap}>
                    {AVAILABLE_LEAD_STATUSES.map((status) => {
                      const isSelected = selectedLeadStatuses.includes(status);
                      return (
                        <Chip
                          key={status}
                          selected={isSelected}
                          onPress={() => toggleLeadStatus(status)}
                          style={[styles.chipItem, isSelected && styles.chipItemSelected]}
                          textStyle={isSelected ? { color: '#FFFFFF', fontWeight: '700' } : { color: '#334155' }}
                        >
                          {isSelected ? '✓ ' : ''}{status}
                        </Chip>
                      );
                    })}
                  </View>

                  {selectedLeadStatuses.length > 0 && (
                    <Text style={styles.selectedCountText}>
                      Selected Lead Statuses ({selectedLeadStatuses.length}): {selectedLeadStatuses.join(', ')}
                    </Text>
                  )}
                </View>
              )}

              {/* Sub-selector when CSV_EXCEL_UPLOAD is selected */}
              {targetType === 'CSV_EXCEL_UPLOAD' && (
                <View style={styles.subFilterContainer}>
                  <Text style={styles.subFilterTitle}>📁 Upload Recipients from CSV or Excel</Text>
                  <Text style={styles.subFilterDesc}>
                    Supports 20 to 100+ columns. Auto-detects phone columns & validates E.164 phone numbers.
                  </Text>

                  <Button
                    mode="contained"
                    icon="file-upload-outline"
                    onPress={handlePickDocument}
                    loading={uploadingCsv}
                    disabled={uploadingCsv}
                    style={{ marginVertical: 8 }}
                  >
                    {uploadingCsv ? 'Parsing File...' : csvFileName ? 'Change CSV / Excel File' : 'Select CSV / Excel File'}
                  </Button>

                  {/* Backend Validation Summary Stats */}
                  {csvUploadResult && (
                    <View style={styles.statsGridRow}>
                      <View style={[styles.statItemBox, { backgroundColor: '#EFF6FF' }]}>
                        <Text style={[styles.statValueText, { color: '#2563EB' }]}>
                          {csvUploadResult.detectedColumns?.length || 0}
                        </Text>
                        <Text style={styles.statLabelText}>COLUMNS</Text>
                      </View>
                      <View style={[styles.statItemBox, { backgroundColor: '#ECFDF5' }]}>
                        <Text style={[styles.statValueText, { color: '#059669' }]}>
                          {csvUploadResult.validPhoneCount || 0}
                        </Text>
                        <Text style={styles.statLabelText}>VALID</Text>
                      </View>
                      <View style={[styles.statItemBox, { backgroundColor: '#FEF2F2' }]}>
                        <Text style={[styles.statValueText, { color: '#DC2626' }]}>
                          {csvUploadResult.invalidPhoneCount || 0}
                        </Text>
                        <Text style={styles.statLabelText}>INVALID</Text>
                      </View>
                      <View style={[styles.statItemBox, { backgroundColor: '#FFFBEB' }]}>
                        <Text style={[styles.statValueText, { color: '#D97706' }]}>
                          {csvUploadResult.duplicatePhoneCount || 0}
                        </Text>
                        <Text style={styles.statLabelText}>DUPLICATES</Text>
                      </View>
                    </View>
                  )}

                  {csvUploadResult && csvUploadResult.phoneColumnName && (
                    <Text style={{ fontSize: 11, color: '#059669', fontWeight: '700', marginTop: 6 }}>
                      📱 Phone column auto-detected: "{csvUploadResult.phoneColumnName}"
                    </Text>
                  )}

                  {/* Filter Builder for Column Filtering */}
                  {csvUploadResult && (
                    <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#CBD5E1' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#1E293B' }}>
                          🎯 Segment Filters ({appliedFilters.length})
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                          <Button
                            mode={filterMatchLogic === 'AND' ? 'contained' : 'outlined'}
                            compact
                            onPress={() => setFilterMatchLogic('AND')}
                          >
                            AND (All)
                          </Button>
                          <Button
                            mode={filterMatchLogic === 'OR' ? 'contained' : 'outlined'}
                            compact
                            onPress={() => setFilterMatchLogic('OR')}
                          >
                            OR (Any)
                          </Button>
                          <Button
                            mode="outlined"
                            compact
                            onPress={() => {
                              const cols = filterConfig?.filterColumns?.length
                                ? filterConfig.filterColumns
                                : csvUploadResult.detectedColumns || [];
                              const defaultCol = cols[0] || '';
                              setAppliedFilters((prev) => [...prev, { column: defaultCol, operator: 'EQUALS', value: '' }]);
                            }}
                          >
                            + Add
                          </Button>
                        </View>
                      </View>

                      {appliedFilters.map((filter, index) => {
                        const availableCols = filterConfig?.filterColumns?.length
                          ? filterConfig.filterColumns
                          : csvUploadResult.detectedColumns || [];
                        const uniqueVals = getUniqueValuesForColumn(filter.column);

                        return (
                          <View key={index} style={{ marginBottom: 12, backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                            <View style={styles.filterRuleRow}>
                              <TextInput
                                label="Column Name"
                                value={filter.column}
                                onChangeText={(val) => {
                                  const newFilters = [...appliedFilters];
                                  newFilters[index].column = val;
                                  newFilters[index].value = '';
                                  setAppliedFilters(newFilters);
                                }}
                                mode="outlined"
                                dense
                                style={{ flex: 1.2, marginRight: 4 }}
                              />
                              <TextInput
                                label="Operator"
                                value={filter.operator}
                                onChangeText={(val) => {
                                  const newFilters = [...appliedFilters];
                                  newFilters[index].operator = val;
                                  setAppliedFilters(newFilters);
                                }}
                                mode="outlined"
                                dense
                                style={{ flex: 1, marginRight: 4 }}
                                placeholder="EQUALS"
                              />
                              <TextInput
                                label="Value"
                                value={filter.value}
                                onChangeText={(val) => {
                                  const newFilters = [...appliedFilters];
                                  newFilters[index].value = val;
                                  setAppliedFilters(newFilters);
                                }}
                                mode="outlined"
                                dense
                                style={{ flex: 1.5, marginRight: 4 }}
                                placeholder={uniqueVals.length > 0 ? `Pick or type...` : `Filter value...`}
                              />
                              <TouchableOpacity
                                onPress={() => {
                                  setAppliedFilters(appliedFilters.filter((_, i) => i !== index));
                                }}
                                style={{ padding: 6 }}
                              >
                                <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 16 }}>✕</Text>
                              </TouchableOpacity>
                            </View>

                            {/* Auto-extracted Values Quick Chips */}
                            {filter.column && uniqueVals.length > 0 && (
                              <View style={{ marginTop: 6 }}>
                                <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '600', marginBottom: 4 }}>
                                  💡 Auto-detected in data ({uniqueVals.length} values):
                                </Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                  {uniqueVals.map((val) => (
                                    <Chip
                                      key={val}
                                      compact
                                      selected={filter.value === val}
                                      onPress={() => {
                                        const newFilters = [...appliedFilters];
                                        newFilters[index].value = val;
                                        setAppliedFilters(newFilters);
                                      }}
                                      style={{ marginRight: 4 }}
                                    >
                                      {val}
                                    </Chip>
                                  ))}
                                </ScrollView>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {csvRecipients.length > 0 && (
                    <View style={styles.csvSummaryBox}>
                      <Text style={styles.csvSummaryTitle}>
                        ✅ {csvUploadResult ? csvUploadResult.validPhoneCount : csvRecipients.length} Recipients Loaded ({csvFileName})
                      </Text>
                      <Text style={styles.csvSampleText}>
                        Sample: {csvRecipients.slice(0, 3).map((r: any) => `${r.name || r[csvUploadResult?.phoneColumnName || 'phone'] || 'Recipient'} (${r.phone || r[csvUploadResult?.phoneColumnName || 'phone'] || ''})`).join(', ')}
                        {csvRecipients.length > 3 ? '...' : ''}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <Text style={styles.sectionLabel}>HubSpot Personalization Mappings</Text>
              <TextInput
                label="Placeholder {{1}} Token"
                value={varMapping1}
                onChangeText={setVarMapping1}
                mode="outlined"
                style={styles.input}
                placeholder="contact.name"
              />
              <TextInput
                label="Placeholder {{2}} Token"
                value={varMapping2}
                onChangeText={setVarMapping2}
                mode="outlined"
                style={styles.input}
                placeholder="lead.dealValue"
              />

              <Button
                mode="contained"
                onPress={handleCreateCampaign}
                style={{ marginTop: 16, paddingVertical: 6 }}
              >
                Create Campaign Draft
              </Button>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Dry Run Dialog */}
      <Portal>
        <Dialog visible={dryRunDialogVisible} onDismiss={() => setDryRunDialogVisible(false)}>
          <Dialog.Title>🧪 Send Dry Run Test</Dialog.Title>
          <Dialog.Content>
            <Text style={{ marginBottom: 12 }}>
              Send a rendered live preview of this broadcast to your mobile number before launching to all contacts.
            </Text>
            <TextInput
              label="Test WhatsApp Phone Number"
              value={testPhoneNumber}
              onChangeText={setTestPhoneNumber}
              mode="outlined"
              placeholder="+919876543210"
              keyboardType="phone-pad"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDryRunDialogVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleExecuteDryRun}>
              Send Test
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Analytics Modal */}
        <Dialog visible={analyticsModalVisible} onDismiss={() => setAnalyticsModalVisible(false)}>
          <Dialog.Title>📊 Live Broadcast Metrics & Audit</Dialog.Title>
          <Dialog.Content>
            {currentAnalytics ? (
              <View>
                <Text style={styles.metricRow}>Targeted: {currentAnalytics.totalTargetRecipients}</Text>
                <Text style={styles.metricRow}>Valid: {currentAnalytics.totalValidRecipients} | Skipped: {currentAnalytics.totalSkippedRecipients}</Text>
                <Text style={styles.metricRow}>Sent: {currentAnalytics.totalSent} | Delivered: {currentAnalytics.totalDelivered}</Text>
                <Text style={styles.metricRow}>Read: {currentAnalytics.totalRead} | Failed: {currentAnalytics.totalFailed}</Text>

                <Divider style={{ marginVertical: 12 }} />
                <Text style={{ fontWeight: '700', marginBottom: 8 }}>Audit History Timeline:</Text>
                {currentAuditLogs.map((log) => (
                  <Text key={log.id} style={styles.auditItem}>
                    • [{new Date(log.createdAt).toLocaleTimeString()}] {log.action} {log.actorUser ? `by ${log.actorUser.email}` : ''}
                  </Text>
                ))}
              </View>
            ) : (
              <ActivityIndicator size="small" />
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAnalyticsModalVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={!!snackbarMessage}
        onDismiss={() => setSnackbarMessage('')}
        duration={4000}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#F8FAFC',
  },
  headerBanner: {
    width: '100%',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  scrollContent: {
    padding: 16,
    width: '100%',
  },
  emptyCard: {
    width: '100%',
    borderRadius: 12,
    marginTop: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    color: '#334155',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  campaignCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  campaignName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  templateBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  templateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  templateText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    marginRight: 4,
  },
  createCard: {
    borderRadius: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    color: '#0F172A',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    marginBottom: 12,
  },
  templateChipCard: {
    width: 200,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  templateChipCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  templateChipName: {
    fontWeight: '700',
    fontSize: 13,
    color: '#1E293B',
  },
  templateChipBody: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  subFilterContainer: {
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  subFilterTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  subFilterDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipItem: {
    backgroundColor: '#FFFFFF',
  },
  chipItemSelected: {
    backgroundColor: '#2563EB',
  },
  selectedCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 8,
  },
  csvSummaryBox: {
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
    marginTop: 8,
  },
  csvSummaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  csvSampleText: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 2,
  },
  metricRow: {
    fontSize: 14,
    marginBottom: 4,
    color: '#334155',
  },
  auditItem: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  statsGridRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 8,
  },
  statItemBox: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValueText: {
    fontSize: 14,
    fontWeight: '800',
  },
  statLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  filterRuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
});
