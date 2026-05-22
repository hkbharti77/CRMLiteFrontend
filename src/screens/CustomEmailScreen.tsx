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
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { customEmailApi } from '../services/api';

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
          style={styles.dialog}>
          <Dialog.Title>📧 Compose Email</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 560 }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <ScrollView>
                <TextInput label="Subject *" value={form.subject}
                  onChangeText={(v) => setForm((f) => ({ ...f, subject: v }))}
                  mode="outlined" style={styles.input} />

                <TextInput label="Body *" value={form.body}
                  onChangeText={(v) => setForm((f) => ({ ...f, body: v }))}
                  mode="outlined" multiline numberOfLines={6}
                  placeholder="Write your message here..."
                  style={styles.input} />

                <TextInput label="CTA Button Label (optional)" value={form.ctaLabel}
                  onChangeText={(v) => setForm((f) => ({ ...f, ctaLabel: v }))}
                  mode="outlined" placeholder="e.g. Claim Offer" style={styles.input} />

                <TextInput label="CTA Button URL (optional)" value={form.ctaUrl}
                  onChangeText={(v) => setForm((f) => ({ ...f, ctaUrl: v }))}
                  mode="outlined" keyboardType="url"
                  placeholder="https://yoursite.com/offer" style={styles.input} />

                <Divider style={{ marginVertical: 8 }} />

                <Text variant="labelMedium" style={styles.fieldLabel}>Send To</Text>
                <SegmentedButtons
                  value={form.recipientMode}
                  onValueChange={(v) => setForm((f) => ({ ...f, recipientMode: v as RecipientMode }))}
                  buttons={[
                    { value: 'ALL',    label: '👥 All' },
                    { value: 'TAGGED', label: '🏷️ Tagged' },
                    { value: 'MANUAL', label: '✉️ Manual' },
                  ]}
                  style={{ marginBottom: 12 }}
                />

                {form.recipientMode === 'TAGGED' && (
                  <TextInput label="Tags (comma-separated)" value={form.tagsFilter}
                    onChangeText={(v) => setForm((f) => ({ ...f, tagsFilter: v }))}
                    mode="outlined" placeholder="e.g. vip,premium,returning"
                    style={styles.input} />
                )}

                {form.recipientMode === 'MANUAL' && (
                  <TextInput label="Email Addresses (comma-separated)" value={form.manualRecipients}
                    onChangeText={(v) => setForm((f) => ({ ...f, manualRecipients: v }))}
                    mode="outlined" multiline numberOfLines={3}
                    placeholder="alice@example.com, bob@example.com"
                    keyboardType="email-address" style={styles.input} />
                )}

                {/* Preview note */}
                <View style={styles.previewNote}>
                  <Ionicons name="information-circle-outline" size={16} color="#6366f1" />
                  <Text variant="bodySmall" style={{ color: '#6366f1', marginLeft: 6, flex: 1 }}>
                    Emails are sent using your branded ChatCRM Lite template with header and footer.
                  </Text>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </Dialog.ScrollArea>
          <Dialog.Actions style={{ flexWrap: 'wrap', gap: 4 }}>
            <Button onPress={() => { setShowCompose(false); resetForm(); }}>Cancel</Button>
            <Button onPress={handleSaveDraft}
              disabled={!form.subject.trim() || !form.body.trim()}>
              Save Draft
            </Button>
            <Button mode="contained" onPress={handleSend} loading={sending}
              disabled={!form.subject.trim() || !form.body.trim() || sending}>
              Send Now
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* ── Campaign Detail Dialog ───────────────────────────────────────── */}
        {selectedCampaign && (
          <Dialog visible={showDetail} onDismiss={() => setShowDetail(false)}
            style={styles.dialog}>
            <Dialog.Title>{STATUS_CONFIG[selectedCampaign.status].icon} Campaign Detail</Dialog.Title>
            <Dialog.ScrollArea style={{ maxHeight: 480 }}>
              <ScrollView>
                <Text variant="titleMedium" style={{ fontWeight: '700', marginBottom: 12 }}>
                  {selectedCampaign.subject}
                </Text>

                {/* Stats */}
                {selectedCampaign.status === 'SENT' && (
                  <View style={styles.campaignStats}>
                    <View style={styles.statBox}>
                      <Text style={[styles.statBoxNum, { color: '#16a34a' }]}>
                        {selectedCampaign.totalSent}
                      </Text>
                      <Text style={styles.statBoxLabel}>Delivered</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statBoxNum, { color: '#dc2626' }]}>
                        {selectedCampaign.totalFailed}
                      </Text>
                      <Text style={styles.statBoxLabel}>Failed</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statBoxNum, { color: '#6366f1' }]}>
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
                <Text variant="labelMedium" style={styles.sectionLabel}>Message Body</Text>
                <View style={styles.bodyPreviewBox}>
                  <Text variant="bodySmall" style={{ color: '#374151', lineHeight: 20 }}>
                    {selectedCampaign.body.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '')}
                  </Text>
                </View>

                {/* CTA */}
                {selectedCampaign.ctaLabel && (
                  <>
                    <Text variant="labelMedium" style={[styles.sectionLabel, { marginTop: 12 }]}>
                      CTA Button
                    </Text>
                    <Text variant="bodySmall" style={{ color: '#6366f1' }}>
                      [{selectedCampaign.ctaLabel}] → {selectedCampaign.ctaUrl}
                    </Text>
                  </>
                )}
              </ScrollView>
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button onPress={() => setShowDetail(false)}>Close</Button>
              <Button mode="contained" onPress={() => handleResend(selectedCampaign)}
                loading={resending} disabled={resending}
                icon="email-sync-outline">
                Resend
              </Button>
            </Dialog.Actions>
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
    backgroundColor: '#f5f5ff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
});
