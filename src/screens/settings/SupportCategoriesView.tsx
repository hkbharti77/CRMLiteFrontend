import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  List,
  IconButton,
  ActivityIndicator,
  Switch,
  Chip,
  Divider,
  Icon,
} from 'react-native-paper';
import { ChevronLeft } from 'lucide-react-native';
import { supportFormConfigApi } from '../../services/api';
import { colors, typography, sharedStyles } from '../../theme';

interface SupportFormConfig {
  id?: string;
  formTitle: string;
  formDescription: string;
  successMessage: string;
  phoneRequired: boolean;
  categoryRequired: boolean;
  categories: string[];
  primaryColor: string;
  logoUrl: string;
  rateLimitEnabled: boolean;
  duplicateDetectionEnabled: boolean;
  defaultPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  enabled: boolean;
}

interface SupportCategoriesViewProps {
  onBack: () => void;
}

const SupportCategoriesView: React.FC<SupportCategoriesViewProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [config, setConfig] = useState<SupportFormConfig>({
    formTitle: 'Get Support',
    formDescription: "Need help? Submit your request and we'll get back to you soon.",
    successMessage:
      "✅ Thank you for contacting support! We've received your request and will get back to you shortly.",
    phoneRequired: false,
    categoryRequired: false,
    categories: ['General', 'Technical', 'Billing', 'Account Issue', 'Feature Request'],
    primaryColor: '#0F766E',
    logoUrl: '',
    rateLimitEnabled: true,
    duplicateDetectionEnabled: true,
    defaultPriority: 'MEDIUM',
    enabled: true,
  });
  const [categoryTemplates, setCategoryTemplates] = useState<Record<string, string[]>>({});
  const [newCategoryText, setNewCategoryText] = useState('');
  const [whatsappGreeting, setWhatsappGreeting] = useState('');
  const [activeAccordion, setActiveAccordion] = useState<string | number | undefined>('basic');

  useEffect(() => {
    fetchConfig();
    fetchCategoryTemplates();
  }, []);

  const fetchConfig = async () => {
    try {
      const [res, greetingRes] = await Promise.all([
        supportFormConfigApi.getConfig().catch(() => ({ data: null })),
        import('../../services/api').then(m => m.flowConfigApi.getFlowGreeting('support')).catch(() => ({ data: { greetingMessage: '' } }))
      ]);
      if (res.data) setConfig(res.data);
      if (greetingRes.data?.greetingMessage) setWhatsappGreeting(greetingRes.data.greetingMessage);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        Alert.alert('Error', 'Failed to load configuration');
      }
    } finally {
      setFetching(false);
    }
  };

  const fetchCategoryTemplates = async () => {
    try {
      const response = await supportFormConfigApi.getCategoryTemplates();
      if (response.data) setCategoryTemplates(response.data);
    } catch (error) {
      console.error('Error fetching category templates:', error);
    }
  };

  const handleSave = async () => {
    if (config.categories.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one support category');
      return;
    }
    setLoading(true);
    try {
      const { flowConfigApi } = await import('../../services/api');
      await Promise.all([
        supportFormConfigApi.updateConfig(config),
        flowConfigApi.saveFlowGreeting(whatsappGreeting, 'support')
      ]);
      Alert.alert('Success', 'Support configuration saved successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    Alert.alert(
      'Reset Configuration',
      'Are you sure you want to reset to default configuration?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await supportFormConfigApi.resetConfig();
              if (response.data) {
                setConfig(response.data);
                Alert.alert('Success', 'Configuration reset to defaults');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to reset configuration');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const addCategory = () => {
    if (!newCategoryText.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }
    if (config.categories.includes(newCategoryText.trim())) {
      Alert.alert('Error', 'This category already exists');
      return;
    }
    if (config.categories.length >= 10) {
      Alert.alert('Error', 'Maximum 10 categories allowed');
      return;
    }
    setConfig((prev) => ({
      ...prev,
      categories: [...prev.categories, newCategoryText.trim()],
    }));
    setNewCategoryText('');
  };

  const removeCategory = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index),
    }));
  };

  const updateCategory = (index: number, newValue: string) => {
    setConfig((prev) => ({
      ...prev,
      categories: prev.categories.map((cat, i) => (i === index ? newValue : cat)),
    }));
  };

  const applyTemplate = (templateName: string) => {
    const template = categoryTemplates[templateName];
    if (template) {
      setConfig((prev) => ({ ...prev, categories: [...template] }));
      Alert.alert('Template Applied', `Applied ${templateName} categories`);
    }
  };

  if (fetching) {
    return (
      <View style={[sharedStyles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const SwitchRow = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <View style={styles.switchRow}>
      <Text style={[typography.cardTitle, { flex: 1 }]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} color={colors.primary} />
    </View>
  );

  return (
    <View style={sharedStyles.container}>
      {/* Header */}
      <View style={sharedStyles.header}>
        <TouchableOpacity style={sharedStyles.backButton} onPress={onBack}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <View style={sharedStyles.headerContent}>
          <Text style={typography.pageTitle}>Support Categories</Text>
          <Text style={[typography.description, { marginTop: 4 }]}>
            Customize support categories for WhatsApp and web support forms.
          </Text>
        </View>
      </View>

      <ScrollView
        style={sharedStyles.tabContent}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <List.AccordionGroup
          expandedId={activeAccordion}
          onAccordionPress={(id) => setActiveAccordion(id)}
        >
          {/* Basic Configuration */}
          <View style={[sharedStyles.modernCard, { marginBottom: 8 }]}>
            <List.Accordion
              title="Basic Configuration"
              id="basic"
              left={(props) => <List.Icon {...props} icon="cog-outline" color={colors.primary} />}
              titleStyle={[typography.cardTitle, { color: colors.text }]}
              style={{ backgroundColor: colors.card }}
            >
              <View style={styles.cardContent}>
                <TextInput
                  label="Form Title"
                  value={config.formTitle}
                  onChangeText={(text) => setConfig((prev) => ({ ...prev, formTitle: text }))}
                  mode="outlined"
                  style={sharedStyles.input}
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                />
                <TextInput
                  label="Form Description"
                  value={config.formDescription}
                  onChangeText={(text) => setConfig((prev) => ({ ...prev, formDescription: text }))}
                  mode="outlined"
                  style={sharedStyles.input}
                  multiline
                  numberOfLines={2}
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                />
                <TextInput
                  label="WhatsApp Intro/Greeting Message (Optional)"
                  value={whatsappGreeting}
                  onChangeText={setWhatsappGreeting}
                  mode="outlined"
                  style={sharedStyles.input}
                  multiline
                  numberOfLines={3}
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                />
                <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 12, marginTop: -8 }}>
                  This message will be sent to the user right before the first question of the WhatsApp support flow.
                </Text>
                <TextInput
                  label="Success Message"
                  value={config.successMessage}
                  onChangeText={(text) => setConfig((prev) => ({ ...prev, successMessage: text }))}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={sharedStyles.input}
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                />
                <SwitchRow
                  label="Require Phone Number"
                  value={config.phoneRequired}
                  onChange={(v) => setConfig((prev) => ({ ...prev, phoneRequired: v }))}
                />
                <SwitchRow
                  label="Require Category Selection"
                  value={config.categoryRequired}
                  onChange={(v) => setConfig((prev) => ({ ...prev, categoryRequired: v }))}
                />
                <SwitchRow
                  label="Enable Support Form"
                  value={config.enabled}
                  onChange={(v) => setConfig((prev) => ({ ...prev, enabled: v }))}
                />
              </View>
            </List.Accordion>
          </View>

          {/* Categories */}
          <View style={[sharedStyles.modernCard, { marginBottom: 8 }]}>
            <List.Accordion
              title="Support Categories"
              id="categories"
              left={(props) => (
                <List.Icon {...props} icon="tag-multiple-outline" color={colors.primary} />
              )}
              titleStyle={[typography.cardTitle, { color: colors.text }]}
              style={{ backgroundColor: colors.card }}
            >
              <View style={styles.cardContent}>
                <Text style={[typography.cardTitle, { marginBottom: 8 }]}>Quick Templates</Text>
                <Text style={[typography.description, { marginBottom: 12 }]}>
                  Apply category templates relevant to your business type:
                </Text>

                {Object.keys(categoryTemplates).length > 0 ? (
                  <View style={styles.chipsRow}>
                    {Object.keys(categoryTemplates).map((templateName) => (
                      <Chip
                        key={templateName}
                        mode="outlined"
                        onPress={() => applyTemplate(templateName)}
                        style={styles.chip}
                        textStyle={{ color: colors.primary, fontSize: 12 }}
                        icon="briefcase-outline"
                      >
                        {templateName}
                      </Chip>
                    ))}
                  </View>
                ) : (
                  <View style={styles.noTemplates}>
                    <Text style={typography.description}>
                      No specific templates available. Create custom categories below.
                    </Text>
                  </View>
                )}

                <Divider style={[sharedStyles.divider, { marginVertical: 16 }]} />

                <Text style={[typography.cardTitle, { marginBottom: 4 }]}>Current Categories</Text>
                <Text style={[typography.description, { marginBottom: 12 }]}>
                  These categories appear in WhatsApp and web support forms:
                </Text>

                {config.categories.map((category, index) => (
                  <View key={index} style={styles.categoryRow}>
                    <TextInput
                      value={category}
                      onChangeText={(text) => updateCategory(index, text)}
                      mode="outlined"
                      style={[sharedStyles.input, { flex: 1, marginRight: 4, marginBottom: 0 }]}
                      outlineColor={colors.border}
                      activeOutlineColor={colors.primary}
                    />
                    <IconButton
                      icon="delete-outline"
                      iconColor={colors.error}
                      onPress={() => removeCategory(index)}
                    />
                  </View>
                ))}

                <View style={[styles.categoryRow, { marginTop: 8 }]}>
                  <TextInput
                    label="New Category"
                    value={newCategoryText}
                    onChangeText={setNewCategoryText}
                    mode="outlined"
                    style={[sharedStyles.input, { flex: 1, marginRight: 8, marginBottom: 0 }]}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    onSubmitEditing={addCategory}
                  />
                  <Button
                    mode="contained"
                    onPress={addCategory}
                    buttonColor={colors.primary}
                    disabled={!newCategoryText.trim() || config.categories.length >= 10}
                    style={{ borderRadius: 8 }}
                  >
                    Add
                  </Button>
                </View>
                <Text style={[typography.metaText, { marginTop: 8 }]}>
                  Maximum 10 categories allowed.
                </Text>
              </View>
            </List.Accordion>
          </View>

          {/* Advanced Settings */}
          <View style={[sharedStyles.modernCard, { marginBottom: 8 }]}>
            <List.Accordion
              title="Advanced Settings"
              id="advanced"
              left={(props) => <List.Icon {...props} icon="tune" color={colors.primary} />}
              titleStyle={[typography.cardTitle, { color: colors.text }]}
              style={{ backgroundColor: colors.card }}
            >
              <View style={styles.cardContent}>
                <TextInput
                  label="Primary Color (Hex)"
                  value={config.primaryColor}
                  onChangeText={(text) => setConfig((prev) => ({ ...prev, primaryColor: text }))}
                  mode="outlined"
                  style={sharedStyles.input}
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                  placeholder="#0F766E"
                />
                <TextInput
                  label="Logo URL (Optional)"
                  value={config.logoUrl}
                  onChangeText={(text) => setConfig((prev) => ({ ...prev, logoUrl: text }))}
                  mode="outlined"
                  style={sharedStyles.input}
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                  placeholder="https://example.com/logo.png"
                />
                <SwitchRow
                  label="Enable Rate Limiting"
                  value={config.rateLimitEnabled}
                  onChange={(v) => setConfig((prev) => ({ ...prev, rateLimitEnabled: v }))}
                />
                <SwitchRow
                  label="Enable Duplicate Detection"
                  value={config.duplicateDetectionEnabled}
                  onChange={(v) => setConfig((prev) => ({ ...prev, duplicateDetectionEnabled: v }))}
                />

                <Text style={[typography.cardTitle, { marginBottom: 12 }]}>Default Priority</Text>
                <View style={styles.chipsRow}>
                  {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((priority) => (
                    <Chip
                      key={priority}
                      mode={config.defaultPriority === priority ? 'flat' : 'outlined'}
                      selected={config.defaultPriority === priority}
                      onPress={() => setConfig((prev) => ({ ...prev, defaultPriority: priority }))}
                      style={[
                        styles.chip,
                        config.defaultPriority === priority && { backgroundColor: colors.primary },
                      ]}
                      textStyle={{
                        color: config.defaultPriority === priority ? '#fff' : colors.text,
                        fontSize: 12,
                      }}
                    >
                      {priority}
                    </Chip>
                  ))}
                </View>
              </View>
            </List.Accordion>
          </View>
        </List.AccordionGroup>
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.footer}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button
            mode="outlined"
            onPress={handleReset}
            disabled={loading}
            style={[sharedStyles.button, { flex: 1, borderColor: colors.error }]}
            textColor={colors.error}
          >
            Reset
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            buttonColor={colors.primary}
            icon="check"
            style={[sharedStyles.button, { flex: 2 }]}
            contentStyle={{ paddingVertical: 4 }}
          >
            Save Configuration
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centered: { justifyContent: 'center', alignItems: 'center' },
  cardContent: {
    padding: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  chip: {
    borderColor: colors.border,
  },
  noTemplates: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
});

export default SupportCategoriesView;
