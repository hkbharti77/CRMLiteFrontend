import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
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
  ActivityIndicator,
  Snackbar,
  Divider,
  SegmentedButtons,
  IconButton,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { customEmailApi, userApi } from '../services/api';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';
import * as Sharing from 'expo-sharing';

// ── Types ────────────────────────────────────────────────────────────────────

type RecipientMode = 'ALL' | 'TAGGED' | 'MANUAL';
type EmailStatus = 'DRAFT' | 'SENT' | 'FAILED';

interface Campaign {
  id: string;
  subject: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  recipientMode: RecipientMode;
  tagsFilter?: string;
  status: EmailStatus;
  sentAt?: string;
  totalSent: number;
  totalFailed: number;
  createdAt: string;
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<EmailStatus, { color: string; bg: string; icon: string }> = {
  DRAFT:  { color: '#6b7280', bg: '#F9FAFB', icon: '📝' },
  SENT:   { color: '#16a34a', bg: '#F0FDF4', icon: '✅' },
  FAILED: { color: '#dc2626', bg: '#FEF2F2', icon: '❌' },
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function CustomEmailScreen() {
  const theme = useTheme();

  // ── State ────────────────────────────────────────────────────────────────
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');

  // Compose dialog
  const [showCompose, setShowCompose] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    body: '',
    ctaLabel: '',
    ctaUrl: '',
    recipientMode: 'ALL' as RecipientMode,
    tagsFilter: '',
    manualRecipients: '',
  });

  const [planType, setPlanType] = useState<string>('FREE');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [generatingAi, setGeneratingAi] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await userApi.getProfile();
        setPlanType(res.data.planType || 'FREE');
      } catch (e) {
        console.error('Error fetching profile in CustomEmailScreen:', e);
      }
    };
    fetchProfile();
  }, []);

  const handleGenerateAiContent = async () => {
    if (planType === 'FREE') return;
    if (!aiPrompt.trim()) {
      setSnackMsg('⚠️ Please enter an instruction prompt.');
      return;
    }
    try {
      setGeneratingAi(true);
      const response = await customEmailApi.generateAi(aiPrompt.trim());
      if (response.data && response.data.subject && response.data.body) {
        setForm(f => ({
          ...f,
          subject: response.data.subject,
          body: response.data.body,
          ctaLabel: response.data.ctaLabel || '',
          ctaUrl: response.data.ctaUrl || ''
        }));
        setAiPrompt('');
        setSnackMsg('✨ AI email content generated successfully!');
      } else {
        setSnackMsg('❌ Failed to generate content in the correct format.');
      }
    } catch (e: any) {
      console.error(e);
      const errMsg = e?.response?.data?.message || 'Failed to generate email content.';
      setSnackMsg('❌ ' + errMsg);
    } finally {
      setGeneratingAi(false);
    }
  };

  const downloadTemplate = () => {
    try {
      const templateData = [
        ['Name', 'Email', 'Phone', 'Company'],
        ['John Doe', 'john@example.com', '9876543210', 'Example Corp'],
        ['Jane Smith', 'jane@example.com', '9555123456', 'ACME Inc']
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Recipient Template');
      
      if (Platform.OS === 'web') {
        XLSX.writeFile(wb, 'crmlite_recipient_template.xlsx');
      } else {
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const uri = FileSystem.cacheDirectory + 'crmlite_recipient_template.xlsx';
        FileSystem.writeAsStringAsync(uri, wbout, {
          encoding: FileSystem.EncodingType.Base64,
        }).then(() => {
          Sharing.shareAsync(uri);
        });
      }
      setSnackMsg('📥 Template download started!');
    } catch (err) {
      console.error('Failed to download template:', err);
      setSnackMsg('❌ Failed to download template.');
    }
  };

  const handleUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel'
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      let bstr = '';

      if (Platform.OS === 'web') {
        const file = asset.file;
        if (!file) return;
        bstr = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const data = e.target?.result;
            resolve(data as string);
          };
          reader.onerror = (err) => reject(err);
          reader.readAsBinaryString(file);
        });
      } else {
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const workbook = XLSX.read(base64, { type: 'base64' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });
        processRows(rows);
        return;
      }

      const workbook = XLSX.read(bstr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });
      processRows(rows);

    } catch (err: any) {
      console.error('File parsing failed:', err);
      setSnackMsg('❌ Failed to parse the selected file.');
    }
  };

  const processRows = (rows: any[][]) => {
    if (!rows || rows.length === 0) {
      setSnackMsg('⚠️ The selected file is empty.');
      return;
    }

    const headers = rows[0].map(h => String(h || '').toLowerCase().trim());
    
    let emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'));
    let nameIdx = headers.findIndex(h => h.includes('name') || h.includes('user') || h.includes('customer'));
    let phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('contact'));

    if (emailIdx === -1) {
      const emailRegex = /\S+@\S+\.\S+/;
      for (let r = 0; r < Math.min(rows.length, 5); r++) {
        const row = rows[r];
        if (row) {
          const idx = row.findIndex(val => emailRegex.test(String(val || '')));
          if (idx !== -1) {
            emailIdx = idx;
            break;
          }
        }
      }
    }

    if (nameIdx === -1 && emailIdx !== -1) {
      nameIdx = rows[0].findIndex((_, i) => i !== emailIdx && i !== phoneIdx);
    }

    if (emailIdx === -1) {
      setSnackMsg('❌ Could not identify an Email column in the file.');
      return;
    }

    const recipients: string[] = [];
    const startRow = 1;
    let skippedCount = 0;

    for (let i = startRow; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const email = String(row[emailIdx] || '').trim();
      const name = nameIdx !== -1 ? String(row[nameIdx] || '').trim() : '';
      const phone = phoneIdx !== -1 ? String(row[phoneIdx] || '').trim() : '';

      let isValid = true;

      // 1. Email format check
      if (!email || !email.includes('@') || !email.includes('.')) {
        isValid = false;
      }

      // 2. Phone check (if phone number is specified, verify it is digit-like)
      if (isValid && phone) {
        const cleanPhone = phone.replace(/[^0-9+]/g, '');
        if (cleanPhone.length > 0 && cleanPhone.length < 7) {
          isValid = false; // Too short to be a valid phone number
        }
      }

      if (isValid) {
        if (name) {
          recipients.push(`${name} <${email}>`);
        } else {
          recipients.push(email);
        }
      } else {
        skippedCount++;
      }
    }

    if (recipients.length === 0) {
      setSnackMsg(skippedCount > 0 
        ? `⚠️ No valid recipients found. Skipped ${skippedCount} rows due to invalid data.`
        : '⚠️ No valid email addresses found in the file.'
      );
      return;
    }

    setForm(f => {
      const existing = f.manualRecipients.trim();
      const delimiter = existing ? ', ' : '';
      return {
        ...f,
        manualRecipients: existing + delimiter + recipients.join(', ')
      };
    });

    if (skippedCount > 0) {
      setSnackMsg(`📊 Imported ${recipients.length} recipients. Skipped ${skippedCount} rows due to validation.`);
    } else {
      setSnackMsg(`📊 Successfully imported ${recipients.length} recipients!`);
    }
  };

  // Detail dialog
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [resending, setResending] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchHistory = useCallback(async () => {
    try {
      const res = await customEmailApi.getHistory(0, 50);
      setCampaigns(res.data.content ?? res.data);
    } catch (e) {
      console.error('Email history fetch error:', e);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchHistory().finally(() => setLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  }, []);

  // ── Send ─────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!form.subject.trim() || !form.body.trim()) return;
    setSending(true);
    try {
      const res = await customEmailApi.send({
        subject: form.subject.trim(),
        body: form.body.trim(),
        ctaLabel: form.ctaLabel.trim() || undefined,
        ctaUrl: form.ctaUrl.trim() || undefined,
        recipientMode: form.recipientMode,
        tagsFilter: form.tagsFilter.trim() || undefined,
        manualRecipients: form.manualRecipients.trim() || undefined,
      });
      setCampaigns((prev) => [res.data, ...prev]);
      setSnackMsg('📧 Email campaign queued — sending in background');
      setShowCompose(false);
      resetForm();
    } catch (e: any) {
      setSnackMsg('❌ Failed to send: ' + (e?.response?.data?.message ?? 'Unknown error'));
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!form.subject.trim() || !form.body.trim()) return;
    try {
      const res = await customEmailApi.saveDraft({
        subject: form.subject.trim(),
        body: form.body.trim(),
        ctaLabel: form.ctaLabel.trim() || undefined,
        ctaUrl: form.ctaUrl.trim() || undefined,
        recipientMode: form.recipientMode,
        tagsFilter: form.tagsFilter.trim() || undefined,
        manualRecipients: form.manualRecipients.trim() || undefined,
      });
      setCampaigns((prev) => [res.data, ...prev]);
      setSnackMsg('💾 Draft saved');
      setShowCompose(false);
      resetForm();
    } catch (e) {
      setSnackMsg('❌ Failed to save draft');
    }
  };

  const handleResend = async (campaign: Campaign) => {
    setResending(true);
    try {
      const res = await customEmailApi.resend(campaign.id);
      setCampaigns((prev) => [res.data, ...prev.filter((c) => c.id !== campaign.id)]);
      setSnackMsg('📧 Resend queued');
      setShowDetail(false);
    } catch (e) {
      setSnackMsg('❌ Resend failed');
    } finally {
      setResending(false);
    }
  };

  const resetForm = () =>
    setForm({ subject: '', body: '', ctaLabel: '', ctaUrl: '',
              recipientMode: 'ALL', tagsFilter: '', manualRecipients: '' });

  // ── Stats ─────────────────────────────────────────────────────────────────

  const totalSent = campaigns.reduce((s, c) => s + c.totalSent, 0);
  const sentCount = campaigns.filter((c) => c.status === 'SENT').length;

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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text variant="headlineSmall" style={[styles.statNum, { color: theme.colors.primary }]}>
              {campaigns.length}
            </Text>
            <Text variant="labelSmall" style={styles.statLabel}>Campaigns</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.colors.outlineVariant }]} />
          <View style={styles.statItem}>
            <Text variant="headlineSmall" style={[styles.statNum, { color: '#16a34a' }]}>
              {sentCount}
            </Text>
            <Text variant="labelSmall" style={styles.statLabel}>Sent</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.colors.outlineVariant }]} />
          <View style={styles.statItem}>
            <Text variant="headlineSmall" style={[styles.statNum, { color: '#6366f1' }]}>
              {totalSent}
            </Text>
            <Text variant="labelSmall" style={styles.statLabel}>Emails Out</Text>
          </View>
        </View>

        {/* Campaign list */}
        {campaigns.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48 }}>📧</Text>
            <Text variant="titleMedium" style={{ color: '#888', marginTop: 12 }}>
              No campaigns yet
            </Text>
            <Text variant="bodySmall" style={{ color: '#aaa', marginTop: 4, textAlign: 'center' }}>
              Compose your first email to send to your contacts
            </Text>
          </View>
        ) : (
          campaigns.map((c) => {
            const sc = STATUS_CONFIG[c.status];
            return (
              <Card key={c.id} style={styles.card} elevation={1}
                onPress={() => { setSelectedCampaign(c); setShowDetail(true); }}>
                <Card.Content style={styles.cardContent}>
                  <View style={styles.cardRow}>
                    <Text style={{ fontSize: 18 }}>{sc.icon}</Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text variant="titleSmall" style={styles.subject} numberOfLines={1}>
                        {c.subject}
                      </Text>
                      <Text variant="bodySmall" style={styles.bodyPreview} numberOfLines={1}>
                        {c.body.replace(/<[^>]*>/g, '').substring(0, 80)}
                      </Text>
                    </View>
                    <Chip compact style={{ backgroundColor: sc.bg }}
                      textStyle={{ color: sc.color, fontSize: 10, fontWeight: '700' }}>
                      {c.status}
                    </Chip>
                  </View>

                  <View style={styles.metaRow}>
                    <Chip compact style={styles.modeChip}
                      textStyle={{ fontSize: 10, color: '#6366f1' }}>
                      {c.recipientMode === 'ALL' ? '👥 All Contacts' :
                       c.recipientMode === 'TAGGED' ? `🏷️ ${c.tagsFilter}` : '✉️ Manual'}
                    </Chip>
                    {c.status === 'SENT' && (
                      <Text variant="bodySmall" style={styles.metaText}>
                        ✅ {c.totalSent} sent
                        {c.totalFailed > 0 ? `  ❌ ${c.totalFailed} failed` : ''}
                      </Text>
                    )}
                    <Text variant="bodySmall" style={[styles.metaText, { marginLeft: 'auto' }]}>
                      {new Date(c.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* FAB */}
      <FAB
        icon="email-plus-outline"
        label="Compose"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => setShowCompose(true)}
      />

      <Portal>
        {/* ── Compose Dialog ───────────────────────────────────────────────── */}
        <Dialog visible={showCompose} onDismiss={() => { setShowCompose(false); resetForm(); }}
          style={[styles.dialog, { maxHeight: '90%', backgroundColor: '#FFFFFF', padding: 0 }]}>
          
          <View style={styles.dialogHeader}>
            <View>
              <Text variant="titleLarge" style={styles.dialogTitleText}>
                Compose Email
              </Text>
              <Text style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>Send a new email campaign</Text>
            </View>
            <IconButton icon="close" size={20} onPress={() => { setShowCompose(false); resetForm(); }} style={styles.closeIcon} />
          </View>

          <Divider style={styles.divider} />

          <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flexShrink: 1 }}>
              <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={styles.dialogScrollContent}>
                
                <Text variant="labelMedium" style={styles.modernSectionLabel}>Email Content</Text>
                
                {/* AI Email Generation Section */}
                <View style={styles.aiContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                    <Ionicons name="sparkles" size={18} color="#0F766E" />
                    <Text variant="labelMedium" style={{ fontWeight: '700', color: '#0F766E', fontSize: 13 }}>AI Email Writer</Text>
                    {planType === 'FREE' && (
                      <Chip compact style={{ backgroundColor: '#FEE2E2', height: 20 }} textStyle={{ color: '#EF4444', fontSize: 10, fontWeight: '700', lineHeight: 12 }}>
                        PRO Feature
                      </Chip>
                    )}
                  </View>
                  
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <TextInput
                      placeholder="e.g. Write a summer sale promo email"
                      value={aiPrompt}
                      onChangeText={setAiPrompt}
                      mode="outlined"
                      dense
                      style={{ flex: 1, backgroundColor: '#FAFAFA', fontSize: 13 }}
                      outlineColor="#E2E8F0"
                      activeOutlineColor="#0F766E"
                      disabled={planType === 'FREE' || generatingAi}
                    />
                    <Button
                      mode="contained"
                      onPress={handleGenerateAiContent}
                      loading={generatingAi}
                      disabled={planType === 'FREE' || generatingAi}
                      style={{ backgroundColor: planType === 'FREE' ? '#E2E8F0' : '#0F766E', borderRadius: 6 }}
                      labelStyle={{ color: planType === 'FREE' ? '#94A3B8' : '#FFFFFF', fontSize: 12 }}
                      compact
                    >
                      Write
                    </Button>
                  </View>
                  {planType === 'FREE' && (
                    <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 6, fontWeight: '500' }}>
                      🔒 AI Content Generation is only available for PRO and Enterprise users. Please upgrade in settings.
                    </Text>
                  )}
                </View>

                <TextInput label="Subject *" value={form.subject}
                  onChangeText={(v) => setForm((f) => ({ ...f, subject: v }))}
                  mode="outlined" style={styles.modernInput}
                  outlineColor="#E2E8F0" activeOutlineColor="#0F766E" />

                <TextInput label="Body *" value={form.body}
                  onChangeText={(v) => setForm((f) => ({ ...f, body: v }))}
                  mode="outlined" multiline numberOfLines={6}
                  placeholder="Write your message here..."
                  style={styles.modernInput}
                  outlineColor="#E2E8F0" activeOutlineColor="#0F766E" />

                <Text variant="labelMedium" style={[styles.modernSectionLabel, { marginTop: 8 }]}>Call to Action</Text>
                <TextInput label="CTA Button Label (optional)" value={form.ctaLabel}
                  onChangeText={(v) => setForm((f) => ({ ...f, ctaLabel: v }))}
                  mode="outlined" placeholder="e.g. Claim Offer" style={styles.modernInput}
                  outlineColor="#E2E8F0" activeOutlineColor="#0F766E" />

                <TextInput label="CTA Button URL (optional)" value={form.ctaUrl}
                  onChangeText={(v) => setForm((f) => ({ ...f, ctaUrl: v }))}
                  mode="outlined" keyboardType="url"
                  placeholder="https://yoursite.com/offer" style={styles.modernInput}
                  outlineColor="#E2E8F0" activeOutlineColor="#0F766E" />

                {((!!form.ctaLabel.trim() && !form.ctaUrl.trim()) || (!form.ctaLabel.trim() && !!form.ctaUrl.trim())) && (
                  <Text style={{ color: '#EF4444', fontSize: 11, marginTop: -8, marginBottom: 12, fontWeight: '500' }}>
                    ⚠️ Both CTA Label and CTA URL must be provided to attach a Call to Action button.
                  </Text>
                )}

                <Text variant="labelMedium" style={[styles.modernSectionLabel, { marginTop: 8 }]}>Recipients</Text>
                <SegmentedButtons
                  value={form.recipientMode}
                  onValueChange={(v) => setForm((f) => ({ ...f, recipientMode: v as RecipientMode }))}
                  buttons={[
                    { value: 'ALL',    label: '👥 All' },
                    { value: 'TAGGED', label: '🏷️ Tagged' },
                    { value: 'MANUAL', label: '✉️ Manual' },
                  ]}
                  style={{ marginBottom: 16 }}
                  theme={{ colors: { secondaryContainer: '#CCFBF1', onSecondaryContainer: '#0F766E', outline: '#E2E8F0' } }}
                />

                {form.recipientMode === 'TAGGED' && (
                  <TextInput label="Tags (comma-separated)" value={form.tagsFilter}
                    onChangeText={(v) => setForm((f) => ({ ...f, tagsFilter: v }))}
                    mode="outlined" placeholder="e.g. vip,premium,returning"
                    style={styles.modernInput}
                    outlineColor="#E2E8F0" activeOutlineColor="#0F766E" />
                )}

                {form.recipientMode === 'MANUAL' && (
                  <View style={{ marginBottom: 16 }}>
                    <TextInput label="Email Addresses (comma-separated)" value={form.manualRecipients}
                      onChangeText={(v) => setForm((f) => ({ ...f, manualRecipients: v }))}
                      mode="outlined" multiline numberOfLines={3}
                      placeholder="alice@example.com, bob@example.com or John Doe <john@example.com>"
                      keyboardType="email-address" style={[styles.modernInput, { marginBottom: 4 }]}
                      outlineColor="#E2E8F0" activeOutlineColor="#0F766E" />
                    
                    <Text variant="bodySmall" style={{ color: '#64748B', marginBottom: 8, fontSize: 11, lineHeight: 15 }}>
                      💡 Format: <Text style={{ fontWeight: 'bold' }}>Name &lt;email&gt;</Text> or simple <Text style={{ fontWeight: 'bold' }}>email</Text>. Placeholders like [User Name] or [Customer Name] in subject/body will be automatically replaced with their name.
                    </Text>
                    
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, alignItems: 'center' }}>
                      <Button 
                        mode="outlined" 
                        onPress={handleUploadFile}
                        icon="upload"
                        textColor="#0F766E"
                        style={{ borderColor: '#0F766E', borderRadius: 6 }}
                        labelStyle={{ fontSize: 12 }}
                        compact
                      >
                        Upload CSV / Excel
                      </Button>
                      
                      <Button 
                        mode="text" 
                        onPress={downloadTemplate}
                        icon="download"
                        textColor="#64748B"
                        labelStyle={{ fontSize: 12 }}
                        compact
                      >
                        Download Template
                      </Button>
                    </View>
                  </View>
                )}

                {/* Preview note */}
                <View style={styles.previewNote}>
                  <Ionicons name="information-circle-outline" size={16} color="#0F766E" />
                  <Text variant="bodySmall" style={{ color: '#0F766E', marginLeft: 6, flex: 1, fontWeight: '500' }}>
                    Emails are sent using your branded template with header and footer.
                  </Text>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </Dialog.ScrollArea>

          <View style={styles.dialogFooter}>
            <View style={{ flexDirection: 'row' }}>
              <Button onPress={() => { setShowCompose(false); resetForm(); }} textColor="#64748B">Cancel</Button>
              <Button onPress={handleSaveDraft}
                disabled={
                  !form.subject.trim() || 
                  !form.body.trim() || 
                  (!!form.ctaLabel.trim() !== !!form.ctaUrl.trim())
                }
                textColor="#0F766E" style={{ marginLeft: 8 }}>
                Save Draft
              </Button>
            </View>
            <Button mode="contained" onPress={handleSend} loading={sending}
              disabled={
                !form.subject.trim() || 
                !form.body.trim() || 
                sending || 
                (!!form.ctaLabel.trim() !== !!form.ctaUrl.trim())
              }
              style={styles.primaryBtn} contentStyle={{ paddingHorizontal: 12 }}>
              Send Now
            </Button>
          </View>
        </Dialog>

        {/* ── Campaign Detail Dialog ───────────────────────────────────────── */}
        {selectedCampaign && (
          <Dialog visible={showDetail} onDismiss={() => setShowDetail(false)}
            style={[styles.dialog, { maxHeight: '90%', backgroundColor: '#FFFFFF', padding: 0 }]}>
            
            <View style={styles.dialogHeader}>
              <View>
                <Text style={{ fontSize: 24, marginBottom: 4 }}>{STATUS_CONFIG[selectedCampaign.status].icon}</Text>
                <Text variant="titleLarge" style={styles.dialogTitleText}>
                  {selectedCampaign.subject}
                </Text>
              </View>
              <IconButton icon="close" size={20} onPress={() => setShowDetail(false)} style={styles.closeIcon} />
            </View>

            <Divider style={styles.divider} />

            <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
              <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={styles.dialogScrollContent}>

                {/* Stats */}
                {selectedCampaign.status === 'SENT' && (
                  <View style={styles.campaignStats}>
                    <View style={styles.statBox}>
                      <Text style={[styles.statBoxNum, { color: '#0F766E' }]}>
                        {selectedCampaign.totalSent}
                      </Text>
                      <Text style={styles.statBoxLabel}>Delivered</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statBoxNum, { color: '#EF4444' }]}>
                        {selectedCampaign.totalFailed}
                      </Text>
                      <Text style={styles.statBoxLabel}>Failed</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statBoxNum, { color: '#0F172A' }]}>
                        {selectedCampaign.totalSent + selectedCampaign.totalFailed}
                      </Text>
                      <Text style={styles.statBoxLabel}>Total</Text>
                    </View>
                  </View>
                )}

                {/* Info */}
                <View style={styles.infoTable}>
                  {infoRow('Status', `${STATUS_CONFIG[selectedCampaign.status].icon} ${selectedCampaign.status}`)}
                  {infoRow('Recipients', selectedCampaign.recipientMode === 'ALL' ? 'All Contacts' :
                    selectedCampaign.recipientMode === 'TAGGED' ? `Tagged: ${selectedCampaign.tagsFilter}` : 'Manual List')}
                  {selectedCampaign.sentAt && infoRow('Sent At',
                    new Date(selectedCampaign.sentAt).toLocaleString('en-IN'))}
                  {infoRow('Created', new Date(selectedCampaign.createdAt).toLocaleString('en-IN'))}
                </View>

                {/* Body preview */}
                <Text variant="labelMedium" style={styles.modernSectionLabel}>Message Body</Text>
                <View style={styles.bodyPreviewBox}>
                  <Text variant="bodyMedium" style={{ color: '#334155', lineHeight: 22 }}>
                    {selectedCampaign.body.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '')}
                  </Text>
                </View>

                {/* CTA */}
                {selectedCampaign.ctaLabel && (
                  <View style={{ marginTop: 24 }}>
                    <Text variant="labelMedium" style={styles.modernSectionLabel}>Call to Action</Text>
                    <View style={styles.ctaPreviewBox}>
                      <Text style={styles.ctaPreviewLabel}>{selectedCampaign.ctaLabel}</Text>
                      <Text style={styles.ctaPreviewUrl}>{selectedCampaign.ctaUrl}</Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            </Dialog.ScrollArea>

            <View style={[styles.dialogFooter, { justifyContent: 'flex-end' }]}>
              <Button onPress={() => setShowDetail(false)} textColor="#64748B">Close</Button>
              <Button mode="contained" onPress={() => handleResend(selectedCampaign)}
                loading={resending} disabled={resending}
                icon="email-sync-outline" style={[styles.primaryBtn, { marginLeft: 12 }]}>
                Resend
              </Button>
            </View>
          </Dialog>
        )}
      </Portal>

      <Snackbar visible={!!snackMsg} onDismiss={() => setSnackMsg('')} duration={4000}>
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
  scrollContent: { padding: 16, paddingBottom: 100 },
  aiContainer: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },

  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontWeight: 'bold', fontSize: 28 },
  statLabel: { color: '#888', marginTop: 2 },
  statDivider: { width: 1, marginHorizontal: 12 },

  card: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 10 },
  cardContent: { padding: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  subject: { fontWeight: '700', fontSize: 14 },
  bodyPreview: { color: '#888', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  modeChip: { backgroundColor: '#EEF2FF' },
  metaText: { color: '#888', fontSize: 11 },

  emptyState: { alignItems: 'center', paddingTop: 80 },

  fab: { position: 'absolute', right: 20, bottom: 24, borderRadius: 28 },

  dialog: { borderRadius: 20, marginHorizontal: 8 },
  input: { marginBottom: 12 },
  fieldLabel: { marginBottom: 8, color: '#555' },

  previewNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },

  campaignStats: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statBoxNum: { fontSize: 24, fontWeight: '700' },
  statBoxLabel: { color: '#888', fontSize: 11, marginTop: 2 },

  infoTable: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 6,
  },
  infoRow: { flexDirection: 'row', gap: 8 },
  infoLabel: { color: '#888', width: 80 },
  infoValue: { flex: 1, color: '#374151', fontWeight: '500' },

  sectionLabel: { color: '#6b7280', fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', fontSize: 11 },
  bodyPreviewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ctaPreviewBox: {
    backgroundColor: '#CCFBF1',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0F766E',
  },
  ctaPreviewLabel: { color: '#0F766E', fontWeight: '700', fontSize: 13, marginBottom: 2 },
  ctaPreviewUrl: { color: '#0F766E', fontSize: 12 },

  // --- Modern Dialog Styles ---
  dialogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingBottom: 16 },
  dialogTitleText: { fontWeight: '700', color: '#0F172A', marginTop: 4 },
  closeIcon: { margin: 0 },
  divider: { backgroundColor: '#E2E8F0' },
  dialogScrollContent: { padding: 20, paddingBottom: 40 },
  modernSectionLabel: { color: '#0F172A', fontWeight: '700', marginBottom: 12, fontSize: 14 },
  modernInput: { marginBottom: 16, backgroundColor: '#FFFFFF', fontSize: 14 },
  dialogFooter: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  primaryBtn: { borderRadius: 8, backgroundColor: '#0F766E' }
});
