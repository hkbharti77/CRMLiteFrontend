import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { Text, Surface, TextInput, Button, Chip, IconButton, Card, useTheme, SegmentedButtons } from 'react-native-paper';
import { Plus, RefreshCw, Trash2, CheckCircle2, Clock, AlertTriangle, MessageSquare, Phone, ExternalLink, Sparkles, Layers, Eye, ChevronLeft, Globe, Search } from 'lucide-react-native';
import { templateApi } from '../../services/api';
import { tokens } from '../../theme/tokens';

const META_LANGUAGES = [
  { name: 'Afrikaans', code: 'af' },
  { name: 'Albanian', code: 'sq' },
  { name: 'Arabic', code: 'ar' },
  { name: 'Arabic (EGY)', code: 'ar_EG' },
  { name: 'Arabic (UAE)', code: 'ar_AE' },
  { name: 'Arabic (LBN)', code: 'ar_LB' },
  { name: 'Arabic (MAR)', code: 'ar_MA' },
  { name: 'Arabic (QAT)', code: 'ar_QA' },
  { name: 'Azerbaijani', code: 'az' },
  { name: 'Belarusian', code: 'be_BY' },
  { name: 'Bengali', code: 'bn' },
  { name: 'Bengali (IND)', code: 'bn_IN' },
  { name: 'Bulgarian', code: 'bg' },
  { name: 'Catalan', code: 'ca' },
  { name: 'Chinese (CHN)', code: 'zh_CN' },
  { name: 'Chinese (HKG)', code: 'zh_HK' },
  { name: 'Chinese (TAI)', code: 'zh_TW' },
  { name: 'Croatian', code: 'hr' },
  { name: 'Czech', code: 'cs' },
  { name: 'Danish', code: 'da' },
  { name: 'Dari', code: 'prs_AF' },
  { name: 'Dutch', code: 'nl' },
  { name: 'Dutch (BEL)', code: 'nl_BE' },
  { name: 'English', code: 'en' },
  { name: 'English (UK)', code: 'en_GB' },
  { name: 'English (US)', code: 'en_US' },
  { name: 'English (UAE)', code: 'en_AE' },
  { name: 'English (AUS)', code: 'en_AU' },
  { name: 'English (CAN)', code: 'en_CA' },
  { name: 'English (GHA)', code: 'en_GH' },
  { name: 'English (IRL)', code: 'en_IE' },
  { name: 'English (IND)', code: 'en_IN' },
  { name: 'English (JAM)', code: 'en_JM' },
  { name: 'English (MYS)', code: 'en_MY' },
  { name: 'English (NZL)', code: 'en_NZ' },
  { name: 'English (QAT)', code: 'en_QA' },
  { name: 'English (SGP)', code: 'en_SG' },
  { name: 'English (UGA)', code: 'en_UG' },
  { name: 'English (ZAF)', code: 'en_ZA' },
  { name: 'Estonian', code: 'et' },
  { name: 'Filipino', code: 'fil' },
  { name: 'Finnish', code: 'fi' },
  { name: 'French', code: 'fr' },
  { name: 'French (BEL)', code: 'fr_BE' },
  { name: 'French (CAN)', code: 'fr_CA' },
  { name: 'French (CHE)', code: 'fr_CH' },
  { name: 'French (CIV)', code: 'fr_CI' },
  { name: 'French (MAR)', code: 'fr_MA' },
  { name: 'Georgian', code: 'ka' },
  { name: 'German', code: 'de' },
  { name: 'German (AUT)', code: 'de_AT' },
  { name: 'German (CHE)', code: 'de_CH' },
  { name: 'Greek', code: 'el' },
  { name: 'Gujarati', code: 'gu' },
  { name: 'Hausa', code: 'ha' },
  { name: 'Hebrew', code: 'he' },
  { name: 'Hindi', code: 'hi' },
  { name: 'Hungarian', code: 'hu' },
  { name: 'Indonesian', code: 'id' },
  { name: 'Irish', code: 'ga' },
  { name: 'Italian', code: 'it' },
  { name: 'Japanese', code: 'ja' },
  { name: 'Kannada', code: 'kn' },
  { name: 'Kazakh', code: 'kk' },
  { name: 'Kinyarwanda', code: 'rw_RW' },
  { name: 'Korean', code: 'ko' },
  { name: 'Kyrgyz (Kyrgyzstan)', code: 'ky_KG' },
  { name: 'Lao', code: 'lo' },
  { name: 'Latvian', code: 'lv' },
  { name: 'Lithuanian', code: 'lt' },
  { name: 'Macedonian', code: 'mk' },
  { name: 'Malay', code: 'ms' },
  { name: 'Malayalam', code: 'ml' },
  { name: 'Marathi', code: 'mr' },
  { name: 'Norwegian', code: 'nb' },
  { name: 'Pashto', code: 'ps_AF' },
  { name: 'Persian', code: 'fa' },
  { name: 'Polish', code: 'pl' },
  { name: 'Portuguese (BR)', code: 'pt_BR' },
  { name: 'Portuguese (POR)', code: 'pt_PT' },
  { name: 'Punjabi', code: 'pa' },
  { name: 'Romanian', code: 'ro' },
  { name: 'Russian', code: 'ru' },
  { name: 'Serbian', code: 'sr' },
  { name: 'Sinhala', code: 'si_LK' },
  { name: 'Slovak', code: 'sk' },
  { name: 'Slovenian', code: 'sl' },
  { name: 'Spanish', code: 'es' },
  { name: 'Spanish (ARG)', code: 'es_AR' },
  { name: 'Spanish (CHL)', code: 'es_CL' },
  { name: 'Spanish (COL)', code: 'es_CO' },
  { name: 'Spanish (CRI)', code: 'es_CR' },
  { name: 'Spanish (DOM)', code: 'es_DO' },
  { name: 'Spanish (ECU)', code: 'es_EC' },
  { name: 'Spanish (HND)', code: 'es_HN' },
  { name: 'Spanish (MEX)', code: 'es_MX' },
  { name: 'Spanish (PAN)', code: 'es_PA' },
  { name: 'Spanish (PER)', code: 'es_PE' },
  { name: 'Spanish (SPA)', code: 'es_ES' },
  { name: 'Spanish (URY)', code: 'es_UY' },
  { name: 'Swahili', code: 'sw' },
  { name: 'Swedish', code: 'sv' },
  { name: 'Tamil', code: 'ta' },
  { name: 'Telugu', code: 'te' },
  { name: 'Thai', code: 'th' },
  { name: 'Turkish', code: 'tr' },
  { name: 'Ukrainian', code: 'uk' },
  { name: 'Urdu', code: 'ur' },
  { name: 'Uzbek', code: 'uz' },
  { name: 'Vietnamese', code: 'vi' },
  { name: 'Zulu', code: 'zu' },
];

interface TemplateManagerViewProps {
  onBack?: () => void;
}

export const TemplateManagerView: React.FC<TemplateManagerViewProps> = ({ onBack }) => {
  const theme = useTheme();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [langSearchQuery, setLangSearchQuery] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en_US');
  const [category, setCategory] = useState('MARKETING');
  const [headerType, setHeaderType] = useState('NONE');
  const [headerContent, setHeaderContent] = useState('');
  const [bodyText, setBodyText] = useState('Hello {{1}}, welcome to {{2}}! How can we assist you today?');
  const [sampleVars, setSampleVars] = useState<Record<string, string>>({ '1': 'John', '2': 'Acme Store' });
  const [footerText, setFooterText] = useState('Reply STOP to unsubscribe');
  const [buttons, setButtons] = useState<Array<{ type: string; text: string; url?: string; phoneNumber?: string }>>([
    { type: 'QUICK_REPLY', text: 'Interested' },
    { type: 'QUICK_REPLY', text: 'Book Demo' },
  ]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async (forceSync = false) => {
    if (forceSync) setSyncing(true);
    else setLoading(true);
    try {
      const response = await templateApi.getTemplates(forceSync);
      setTemplates(response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch templates:', error);
      Alert.alert('Error', error.response?.data?.message || 'Could not fetch templates from Meta API.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  const handleInsertVariable = () => {
    const matches = bodyText.match(/\{\{(\d+)\}\}/g) || [];
    const nextVarIndex = matches.length + 1;
    setBodyText(prev => prev + ` {{${nextVarIndex}}}`);
  };

  const handleAddButton = (type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER') => {
    if (buttons.length >= 3) {
      Alert.alert('Limit Reached', 'WhatsApp allows maximum 3 quick reply or CTA buttons per template.');
      return;
    }
    setButtons([...buttons, { type, text: 'Button Text' }]);
  };

  const handleRemoveButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const handleUpdateButton = (index: number, key: string, val: string) => {
    const updated = [...buttons];
    (updated[index] as any)[key] = val;
    setButtons(updated);
  };

  const handleSubmitTemplate = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a unique template name.');
      return;
    }
    if (!bodyText.trim()) {
      Alert.alert('Validation Error', 'Template body text cannot be empty.');
      return;
    }

    setSubmitting(true);
    try {
      await templateApi.createTemplate({
        name: name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        language,
        category,
        headerType,
        headerContent: headerType === 'TEXT' ? headerContent : undefined,
        bodyText,
        footerText: footerText.trim() ? footerText : undefined,
        buttons: buttons.length > 0 ? buttons : undefined,
      });
      Alert.alert('Success 🎉', `Template "${name}" submitted to Meta for review!`);
      setShowBuilderModal(false);
      resetForm();
      fetchTemplates(true);
    } catch (error: any) {
      console.error('Template submission failed:', error);
      Alert.alert('Submission Failed', error.response?.data?.message || error.message || 'Meta API rejected the template payload.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (templateName: string) => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete template "${templateName}" from Meta WABA?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSyncing(true);
            try {
              await templateApi.deleteTemplate(templateName);
              Alert.alert('Deleted 🎉', `Template "${templateName}" deleted successfully.`);
              fetchTemplates(true);
            } catch (error: any) {
              setSyncing(false);
              const errorMsg = error.response?.data?.message || error.message || 'Meta refused to delete this template.';
              Alert.alert('Delete Failed ❌', errorMsg);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setName('');
    setHeaderType('NONE');
    setHeaderContent('');
    setBodyText('Hello {{1}}, welcome to {{2}}!');
    setFooterText('Reply STOP to unsubscribe');
    setButtons([]);
  };

  const filteredTemplates = templates.filter(t => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
    return true;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      
      {/* Top Header Card */}
      <Surface style={styles.headerCard} elevation={2}>
        <View style={styles.headerTop}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {onBack && (
              <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <ChevronLeft size={22} color="#0F766E" />
              </TouchableOpacity>
            )}
            <View style={[styles.iconContainer, onBack && { marginLeft: 12 }]}>
              <Sparkles size={24} color="#10B981" />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.titleText}>WhatsApp Template Management</Text>
              <Text style={styles.subtitleText}>Create, preview, and sync HSM message templates directly with Meta WABA</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            <Button
              mode="outlined"
              onPress={() => fetchTemplates(true)}
              loading={syncing}
              disabled={syncing}
              icon={({ size, color }) => <RefreshCw size={16} color={color} />}
              style={{ marginRight: 10, borderColor: '#10B981' }}
              textColor="#10B981"
            >
              Sync Meta Templates
            </Button>
            <Button
              mode="contained"
              onPress={() => setShowBuilderModal(true)}
              icon={({ size, color }) => <Plus size={16} color={color} />}
              style={{ backgroundColor: '#10B981' }}
            >
              New Template Builder
            </Button>
          </View>
        </View>

        {/* Filters Row */}
        <View style={styles.filtersRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={styles.filterLabel}>Status:</Text>
            {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map(st => (
              <Chip
                key={st}
                selected={statusFilter === st}
                onPress={() => setStatusFilter(st)}
                style={[styles.chipFilter, statusFilter === st && { backgroundColor: '#10B981' }]}
                textStyle={{ color: statusFilter === st ? '#FFF' : '#374151', fontSize: 12 }}
              >
                {st}
              </Chip>
            ))}
            <View style={{ width: 16 }} />
            <Text style={styles.filterLabel}>Category:</Text>
            {['ALL', 'MARKETING', 'UTILITY', 'AUTHENTICATION'].map(cat => (
              <Chip
                key={cat}
                selected={categoryFilter === cat}
                onPress={() => setCategoryFilter(cat)}
                style={[styles.chipFilter, categoryFilter === cat && { backgroundColor: '#3B82F6' }]}
                textStyle={{ color: categoryFilter === cat ? '#FFF' : '#374151', fontSize: 12 }}
              >
                {cat}
              </Chip>
            ))}
          </ScrollView>
        </View>
      </Surface>

      {/* Directory Grid */}
      {loading ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={{ marginTop: 12, color: tokens.colors.textSecondary }}>Syncing templates from Meta Graph API...</Text>
        </View>
      ) : filteredTemplates.length === 0 ? (
        <Surface style={styles.emptyCard} elevation={1}>
          <Layers size={48} color="#9CA3AF" />
          <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 12, color: '#374151' }}>No Templates Found</Text>
          <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 4, maxWidth: 360 }}>
            Click "Sync Meta Templates" to fetch your existing HSM templates from Meta, or click "New Template Builder" to create one.
          </Text>
        </Surface>
      ) : (
        <View style={styles.templatesGrid}>
          {filteredTemplates.map((item) => {
            const isApproved = item.status === 'APPROVED';
            const isPending = item.status === 'PENDING';
            const statusBg = isApproved ? '#ECFDF5' : isPending ? '#FEF3C7' : '#FEF2F2';
            const statusColor = isApproved ? '#10B981' : isPending ? '#D97706' : '#EF4444';
            const StatusIcon = isApproved ? CheckCircle2 : isPending ? Clock : AlertTriangle;

            return (
              <Card key={item.id || item.name} style={styles.templateCard}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.templateNameText}>{item.name}</Text>
                      <Text style={styles.templateSubText}>{item.category} • {item.language || 'en_US'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                      <StatusIcon size={12} color={statusColor} style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: statusColor }}>{item.status}</Text>
                    </View>
                  </View>

                  <View style={styles.templatePreviewBox}>
                    {item.headerType && item.headerType !== 'NONE' && (
                      <Text style={styles.previewHeader}>{item.headerType}: {item.headerContent || '[Media]'}</Text>
                    )}
                    <Text style={styles.previewBody} numberOfLines={4}>{item.bodyText}</Text>
                    {item.footerText && (
                      <Text style={styles.previewFooter}>{item.footerText}</Text>
                    )}
                  </View>

                  {item.buttons && item.buttons.length > 0 && (
                    <View style={styles.buttonsList}>
                      {item.buttons.map((btn: any, idx: number) => (
                        <View key={idx} style={styles.buttonChip}>
                          <Text style={styles.buttonChipText}>{btn.text}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {item.status === 'REJECTED' && (
                    <View style={styles.rejectionNoticeBox}>
                      <AlertTriangle size={14} color="#DC2626" style={{ marginTop: 2, marginRight: 6 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rejectionTitle}>Why Meta Rejected This Template:</Text>
                        <Text style={styles.rejectionText}>
                          {item.rejectedReason
                            ? item.rejectedReason
                            : item.category === 'UTILITY'
                            ? 'Category Mismatch: Utility templates cannot contain marketing opt-out text ("Reply STOP"), promotional quick-reply buttons ("Interested"), or vague names like "test". Re-create this template selecting "MARKETING" category!'
                            : 'Meta rejected this template for policy or formatting violations.'}
                        </Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => handleDeleteTemplate(item.name)} style={styles.deleteBtn}>
                      <Trash2 size={14} color="#EF4444" />
                      <Text style={{ fontSize: 12, color: '#EF4444', marginLeft: 4, fontWeight: '600' }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </Card.Content>
              </Card>
            );
          })}
        </View>
      )}

      {/* Visual Template Builder Modal */}
      <Modal visible={showBuilderModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Surface style={styles.builderModalContainer} elevation={5}>
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Sparkles size={20} color="#10B981" />
                <Text style={styles.modalTitle}>WhatsApp Message Template Builder</Text>
              </View>
              <IconButton icon="close" size={20} onPress={() => setShowBuilderModal(false)} />
            </View>

            <ScrollView contentContainerStyle={styles.builderBody}>
              {/* Form Side */}
              <View style={styles.formContainer}>
                
                <Text style={styles.sectionLabel}>1. Basic Details</Text>
                
                {/* Language Picker Selector */}
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.fieldSubLabel}>Template Language</Text>
                  <TouchableOpacity
                    onPress={() => setShowLangModal(true)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFF'
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Globe size={18} color="#10B981" style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                        {META_LANGUAGES.find(l => l.code === language)?.name || language} ({language})
                      </Text>
                    </View>
                    <Chip style={{ backgroundColor: '#ECFDF5' }} textStyle={{ color: '#059669', fontSize: 11, fontWeight: '700' }}>
                      Select Language 🔍
                    </Chip>
                  </TouchableOpacity>
                </View>

                <TextInput
                  label="Template Name (e.g. promo_discount_v1)"
                  value={name}
                  onChangeText={(val) => setName(val.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                  mode="outlined"
                  outlineColor="#E5E7EB"
                  activeOutlineColor="#10B981"
                  style={styles.inputSpacing}
                />

                <View style={styles.rowTwo}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.fieldSubLabel}>Category</Text>
                    <SegmentedButtons
                      value={category}
                      onValueChange={setCategory}
                      buttons={[
                        { value: 'MARKETING', label: 'Marketing' },
                        { value: 'UTILITY', label: 'Utility' },
                      ]}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.fieldSubLabel}>Header Format</Text>
                    <SegmentedButtons
                      value={headerType}
                      onValueChange={setHeaderType}
                      buttons={[
                        { value: 'NONE', label: 'None' },
                        { value: 'TEXT', label: 'Text' },
                        { value: 'IMAGE', label: 'Image' },
                      ]}
                    />
                  </View>
                </View>

                {headerType === 'TEXT' && (
                  <TextInput
                    label="Header Text"
                    value={headerContent}
                    onChangeText={setHeaderContent}
                    mode="outlined"
                    outlineColor="#E5E7EB"
                    activeOutlineColor="#10B981"
                    style={styles.inputSpacing}
                  />
                )}

                <Text style={styles.sectionLabel}>2. Message Body & Variables</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Use variables like {`{{1}}`}, {`{{2}}`} for customer personalization</Text>
                  <TouchableOpacity onPress={handleInsertVariable} style={styles.addVarBtn}>
                    <Plus size={12} color="#10B981" />
                    <Text style={{ fontSize: 12, color: '#10B981', fontWeight: '700', marginLeft: 2 }}>Insert Variable</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  label="Body Text"
                  value={bodyText}
                  onChangeText={setBodyText}
                  multiline
                  numberOfLines={4}
                  mode="outlined"
                  outlineColor="#E5E7EB"
                  activeOutlineColor="#10B981"
                  style={styles.inputSpacing}
                />

                {/* Detected Variables Sample Values Section */}
                {Array.from(new Set((bodyText.match(/\{\{(\d+)\}\}/g) || []).map(v => v.replace(/[^\d]/g, '')))).length > 0 && (
                  <View style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#065F46', marginBottom: 6 }}>
                      ✅ Detected Variables ({Array.from(new Set((bodyText.match(/\{\{(\d+)\}\}/g) || []).map(v => v.replace(/[^\d]/g, '')))).length}):
                    </Text>
                    <Text style={{ fontSize: 11, color: '#047857', marginBottom: 8 }}>
                      Meta Graph API requires example values for variables during submission so Meta reviewers can verify your format.
                    </Text>
                    {Array.from(new Set((bodyText.match(/\{\{(\d+)\}\}/g) || []).map(v => v.replace(/[^\d]/g, '')))).map((idx) => (
                      <TextInput
                        key={idx}
                        label={`Sample Value for {{${idx}}}`}
                        value={sampleVars[idx] || (idx === '1' ? 'John' : idx === '2' ? 'Acme Store' : `Sample ${idx}`)}
                        onChangeText={(val) => setSampleVars(prev => ({ ...prev, [idx]: val }))}
                        mode="outlined"
                        dense
                        style={{ marginBottom: 6, backgroundColor: '#FFF' }}
                      />
                    ))}
                  </View>
                )}

                <TextInput
                  label="Footer Text (Optional)"
                  value={footerText}
                  onChangeText={setFooterText}
                  mode="outlined"
                  outlineColor="#E5E7EB"
                  activeOutlineColor="#10B981"
                  style={styles.inputSpacing}
                />

                <Text style={styles.sectionLabel}>3. Quick Action Buttons (Optional)</Text>
                <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                  <Button mode="outlined" onPress={() => handleAddButton('QUICK_REPLY')} style={{ marginRight: 8, borderColor: '#10B981' }} textColor="#10B981">
                    + Quick Reply
                  </Button>
                  <Button mode="outlined" onPress={() => handleAddButton('URL')} style={{ marginRight: 8, borderColor: '#3B82F6' }} textColor="#3B82F6">
                    + Website Link
                  </Button>
                  <Button mode="outlined" onPress={() => handleAddButton('PHONE_NUMBER')} style={{ borderColor: '#8B5CF6' }} textColor="#8B5CF6">
                    + Call Button
                  </Button>
                </View>

                {buttons.map((btn, index) => (
                  <View key={index} style={styles.buttonConfigRow}>
                    <Text style={{ width: 80, fontSize: 12, fontWeight: '700', color: '#374151' }}>{btn.type}</Text>
                    <TextInput
                      placeholder="Button Text"
                      value={btn.text}
                      onChangeText={(val) => handleUpdateButton(index, 'text', val)}
                      mode="outlined"
                      dense
                      style={{ flex: 1, marginRight: 8 }}
                    />
                    {btn.type === 'URL' && (
                      <TextInput
                        placeholder="https://example.com"
                        value={btn.url || ''}
                        onChangeText={(val) => handleUpdateButton(index, 'url', val)}
                        mode="outlined"
                        dense
                        style={{ flex: 1, marginRight: 8 }}
                      />
                    )}
                    {btn.type === 'PHONE_NUMBER' && (
                      <TextInput
                        placeholder="+1234567890"
                        value={btn.phoneNumber || ''}
                        onChangeText={(val) => handleUpdateButton(index, 'phoneNumber', val)}
                        mode="outlined"
                        dense
                        style={{ flex: 1, marginRight: 8 }}
                      />
                    )}
                    <IconButton icon="delete" size={18} iconColor="#EF4444" onPress={() => handleRemoveButton(index)} />
                  </View>
                ))}
              </View>

              {/* Real-time Preview Side */}
              <View style={styles.previewContainer}>
                <View style={styles.phoneMockup}>
                  <View style={styles.phoneHeader}>
                    <View style={styles.phoneDot} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFF' }}>WhatsApp Business Preview</Text>
                  </View>
                  <View style={styles.phoneBody}>
                    <View style={styles.whatsappBubble}>
                      {headerType === 'TEXT' && headerContent ? (
                        <Text style={styles.whatsappHeader}>{headerContent}</Text>
                      ) : headerType === 'IMAGE' ? (
                        <View style={styles.whatsappMediaPlaceholder}>
                          <Eye size={20} color="#9CA3AF" />
                          <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>Header Image</Text>
                        </View>
                      ) : null}

                      <Text style={styles.whatsappText}>
                        {(() => {
                          let t = bodyText || 'Your template body text will render here...';
                          Object.keys(sampleVars).forEach(idx => {
                            if (sampleVars[idx]) {
                              t = t.replaceAll(`{{${idx}}}`, sampleVars[idx]);
                            }
                          });
                          return t;
                        })()}
                      </Text>

                      {footerText ? (
                        <Text style={styles.whatsappFooter}>{footerText}</Text>
                      ) : null}
                    </View>

                    {buttons.map((btn, i) => (
                      <View key={i} style={styles.whatsappBtnPreview}>
                        {btn.type === 'URL' ? <ExternalLink size={12} color="#0284C7" style={{ marginRight: 4 }} /> : btn.type === 'PHONE_NUMBER' ? <Phone size={12} color="#0284C7" style={{ marginRight: 4 }} /> : null}
                        <Text style={{ fontSize: 13, color: '#0284C7', fontWeight: '600' }}>{btn.text || 'Button Text'}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <Button mode="text" onPress={() => setShowBuilderModal(false)} style={{ marginRight: 12 }}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmitTemplate}
                loading={submitting}
                disabled={submitting}
                style={{ backgroundColor: '#10B981' }}
              >
                Submit to Meta for Review
              </Button>
            </View>
          </Surface>
        </View>
      </Modal>

      {/* Searchable Meta Languages Picker Modal */}
      <Modal visible={showLangModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <Surface style={[styles.builderModalContainer, { maxWidth: 520, maxHeight: 620 }]} elevation={5}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Globe size={20} color="#10B981" />
                <Text style={styles.modalTitle}>Select WhatsApp Language ({META_LANGUAGES.length})</Text>
              </View>
              <IconButton icon="close" size={20} onPress={() => setShowLangModal(false)} />
            </View>

            <View style={{ padding: 16, backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
              <TextInput
                placeholder="Search by language name or code (e.g. Hindi, hi, English, es_ES)..."
                value={langSearchQuery}
                onChangeText={setLangSearchQuery}
                mode="outlined"
                left={<TextInput.Icon icon="magnify" />}
                outlineColor="#E5E7EB"
                activeOutlineColor="#10B981"
                dense
              />
            </View>

            <ScrollView style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
              {META_LANGUAGES.filter(l => 
                l.name.toLowerCase().includes(langSearchQuery.toLowerCase()) || 
                l.code.toLowerCase().includes(langSearchQuery.toLowerCase())
              ).map((item) => {
                const isSelected = language === item.code;
                return (
                  <TouchableOpacity
                    key={item.code}
                    onPress={() => {
                      setLanguage(item.code);
                      setShowLangModal(false);
                      setLangSearchQuery('');
                    }}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderRadius: 8,
                      marginBottom: 6,
                      backgroundColor: isSelected ? '#ECFDF5' : '#FFF',
                      borderWidth: 1,
                      borderColor: isSelected ? '#10B981' : '#E5E7EB'
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: isSelected ? '700' : '500', color: isSelected ? '#065F46' : '#1F2937' }}>
                      {item.name}
                    </Text>
                    <View style={{ backgroundColor: isSelected ? '#10B981' : '#F3F4F6', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 }}>
                      <Text style={{ fontSize: 12, color: isSelected ? '#FFF' : '#374151', fontWeight: '700', fontFamily: 'monospace' }}>
                        {item.code}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Surface>
        </View>
      </Modal>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F9FAFB' },
  headerCard: { padding: 20, borderRadius: 16, backgroundColor: '#FFF', marginBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' },
  backButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#E5E7EB' },
  iconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  titleText: { fontSize: 20, fontWeight: '700', color: '#111827' },
  subtitleText: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  filtersRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  filterLabel: { fontSize: 13, fontWeight: '600', color: '#4B5563', marginRight: 8, alignSelf: 'center' },
  chipFilter: { marginRight: 8, height: 32 },
  emptyCard: { padding: 40, borderRadius: 16, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  templatesGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
  templateCard: { width: '48%', margin: '1%', borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  templateNameText: { fontSize: 15, fontWeight: '700', color: '#111827', fontFamily: 'monospace' },
  templateSubText: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  templatePreviewBox: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, marginTop: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  previewHeader: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 4 },
  previewBody: { fontSize: 13, color: '#1F2937', lineHeight: 18 },
  previewFooter: { fontSize: 11, color: '#9CA3AF', marginTop: 6 },
  buttonsList: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  buttonChip: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, marginRight: 6, marginBottom: 4 },
  buttonChipText: { fontSize: 11, color: '#2563EB', fontWeight: '600' },
  rejectionNoticeBox: { flexDirection: 'row', backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', borderWidth: 1, padding: 10, borderRadius: 8, marginTop: 10 },
  rejectionTitle: { fontSize: 12, fontWeight: '700', color: '#991B1B' },
  rejectionText: { fontSize: 11, color: '#B91C1C', marginTop: 2, lineHeight: 15 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  builderModalContainer: { width: '92%', maxWidth: 1000, maxHeight: '90%', borderRadius: 16, backgroundColor: '#FFF', overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginLeft: 8 },
  builderBody: { flexDirection: 'row', padding: 20 },
  formContainer: { flex: 1.4, marginRight: 20 },
  previewContainer: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#374151', marginTop: 14, marginBottom: 8 },
  fieldSubLabel: { fontSize: 12, fontWeight: '600', color: '#4B5563', marginBottom: 4 },
  inputSpacing: { marginBottom: 12 },
  rowTwo: { flexDirection: 'row', marginBottom: 12 },
  addVarBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#ECFDF5' },
  buttonConfigRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, backgroundColor: '#F9FAFB', padding: 8, borderRadius: 8 },
  phoneMockup: { width: 300, borderRadius: 24, backgroundColor: '#075E54', padding: 6, boxShadow: '0px 10px 25px rgba(0,0,0,0.15)' },
  phoneHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  phoneDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#25D366', marginRight: 8 },
  phoneBody: { backgroundColor: '#E5DDD5', borderRadius: 18, padding: 12, minHeight: 380 },
  whatsappBubble: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 12, marginBottom: 8, boxShadow: '0px 1px 2px rgba(0,0,0,0.1)' },
  whatsappHeader: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 6 },
  whatsappMediaPlaceholder: { height: 100, backgroundColor: '#F3F4F6', borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  whatsappText: { fontSize: 13, color: '#111827', lineHeight: 18 },
  whatsappFooter: { fontSize: 11, color: '#6B7280', marginTop: 8 },
  whatsappBtnPreview: { backgroundColor: '#FFF', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginBottom: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
});
