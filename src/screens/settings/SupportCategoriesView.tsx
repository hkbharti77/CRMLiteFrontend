import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Card, 
  Title, 
  Text, 
  TextInput, 
  Button, 
  List, 
  IconButton, 
  ActivityIndicator, 
  Switch,
  Chip,
  Divider
} from 'react-native-paper';
import { supportFormConfigApi } from '../../services/api';

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
    formDescription: 'Need help? Submit your request and we\'ll get back to you soon.',
    successMessage: '✅ Thank you for contacting support! We\'ve received your request and will get back to you shortly.',
    phoneRequired: false,
    categoryRequired: false,
    categories: ['General', 'Technical', 'Billing', 'Account Issue', 'Feature Request'],
    primaryColor: '#667eea',
    logoUrl: '',
    rateLimitEnabled: true,
    duplicateDetectionEnabled: true,
    defaultPriority: 'MEDIUM',
    enabled: true,
  });
  const [categoryTemplates, setCategoryTemplates] = useState<Record<string, string[]>>({});
  const [newCategoryText, setNewCategoryText] = useState('');
  const [activeAccordion, setActiveAccordion] = useState<string | number | undefined>('basic');

  useEffect(() => {
    fetchConfig();
    fetchCategoryTemplates();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await supportFormConfigApi.getConfig();
      if (response.data) {
        setConfig(response.data);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error fetching support config:', error);
        Alert.alert('Error', 'Failed to load configuration');
      }
    } finally {
      setFetching(false);
    }
  };

  const fetchCategoryTemplates = async () => {
    try {
      const response = await supportFormConfigApi.getCategoryTemplates();
      if (response.data) {
        setCategoryTemplates(response.data);
      }
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
      await supportFormConfigApi.updateConfig(config);
      Alert.alert('Success', 'Support configuration saved successfully!');
    } catch (error: any) {
      console.error('Error saving config:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    Alert.alert(
      'Reset Configuration',
      'Are you sure you want to reset to default configuration? This will overwrite all current settings.',
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
              console.error('Error resetting config:', error);
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

    setConfig(prev => ({
      ...prev,
      categories: [...prev.categories, newCategoryText.trim()]
    }));
    setNewCategoryText('');
  };

  const removeCategory = (index: number) => {
    setConfig(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index)
    }));
  };

  const updateCategory = (index: number, newValue: string) => {
    setConfig(prev => ({
      ...prev,
      categories: prev.categories.map((cat, i) => i === index ? newValue : cat)
    }));
  };

  const applyTemplate = (templateName: string) => {
    const template = categoryTemplates[templateName];
    if (template) {
      setConfig(prev => ({
        ...prev,
        categories: [...template]
      }));
      Alert.alert('Template Applied', `Applied ${templateName} categories`);
    }
  };

  if (fetching) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={onBack} />
          <Title>Support Categories Configuration</Title>
        </View>
        <Text style={styles.subtitle}>
          Customize support categories for WhatsApp conversational support flow and web forms.
        </Text>
      </Card>

      <List.AccordionGroup
        expandedId={activeAccordion}
        onAccordionPress={(id) => setActiveAccordion(id)}
      >
        {/* Basic Configuration */}
        <Card style={styles.menuCard}>
          <List.Accordion
            title="Basic Configuration"
            id="basic"
            left={(props) => <List.Icon {...props} icon="cog-outline" />}
          >
            <View style={styles.cardContent}>
              <TextInput
                label="Form Title"
                value={config.formTitle}
                onChangeText={(text) => setConfig(prev => ({ ...prev, formTitle: text }))}
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Form Description"
                value={config.formDescription}
                onChangeText={(text) => setConfig(prev => ({ ...prev, formDescription: text }))}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />

              <TextInput
                label="Success Message"
                value={config.successMessage}
                onChangeText={(text) => setConfig(prev => ({ ...prev, successMessage: text }))}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Require Phone Number</Text>
                <Switch
                  value={config.phoneRequired}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, phoneRequired: value }))}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Require Category Selection</Text>
                <Switch
                  value={config.categoryRequired}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, categoryRequired: value }))}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Enable Support Form</Text>
                <Switch
                  value={config.enabled}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, enabled: value }))}
                />
              </View>
            </View>
          </List.Accordion>
        </Card>

        {/* Categories Management */}
        <Card style={styles.menuCard}>
          <List.Accordion
            title="Support Categories"
            id="categories"
            left={(props) => <List.Icon {...props} icon="tag-multiple-outline" />}
          >
            <View style={styles.cardContent}>
              <Text style={styles.sectionTitle}>Quick Templates</Text>
              <Text style={styles.sectionSubtitle}>
                Apply category templates relevant to your business type:
              </Text>
              
              {Object.keys(categoryTemplates).length > 0 ? (
                <View style={styles.templatesContainer}>
                  {Object.keys(categoryTemplates).map((templateName) => (
                    <Chip
                      key={templateName}
                      mode="outlined"
                      onPress={() => applyTemplate(templateName)}
                      style={styles.templateChip}
                      icon={templateName === "General Business" ? "briefcase-outline" : "star-outline"}
                    >
                      {templateName}
                    </Chip>
                  ))}
                </View>
              ) : (
                <View style={styles.noTemplatesContainer}>
                  <Text style={styles.noTemplatesText}>
                    No specific templates available for your business type. You can create custom categories below.
                  </Text>
                </View>
              )}

              <Divider style={styles.divider} />

              <Text style={styles.sectionTitle}>Current Categories</Text>
              <Text style={styles.sectionSubtitle}>
                These categories will appear in both WhatsApp and web support forms:
              </Text>

              {config.categories.map((category, index) => (
                <View key={index} style={styles.categoryRow}>
                  <TextInput
                    value={category}
                    onChangeText={(text) => updateCategory(index, text)}
                    mode="outlined"
                    style={styles.categoryInput}
                    placeholder="Category name"
                  />
                  <IconButton
                    icon="delete"
                    iconColor="#dc3545"
                    onPress={() => removeCategory(index)}
                  />
                </View>
              ))}

              <View style={styles.addCategoryRow}>
                <TextInput
                  label="New Category"
                  value={newCategoryText}
                  onChangeText={setNewCategoryText}
                  mode="outlined"
                  style={styles.categoryInput}
                  placeholder="Enter category name"
                  onSubmitEditing={addCategory}
                />
                <Button
                  mode="contained"
                  onPress={addCategory}
                  style={styles.addButton}
                  disabled={!newCategoryText.trim() || config.categories.length >= 10}
                >
                  Add
                </Button>
              </View>

              <Text style={styles.helperText}>
                Maximum 10 categories allowed. Categories will appear in the order shown above.
              </Text>
            </View>
          </List.Accordion>
        </Card>

        {/* Advanced Settings */}
        <Card style={styles.menuCard}>
          <List.Accordion
            title="Advanced Settings"
            id="advanced"
            left={(props) => <List.Icon {...props} icon="tune" />}
          >
            <View style={styles.cardContent}>
              <TextInput
                label="Primary Color (Hex)"
                value={config.primaryColor}
                onChangeText={(text) => setConfig(prev => ({ ...prev, primaryColor: text }))}
                mode="outlined"
                style={styles.input}
                placeholder="#667eea"
              />

              <TextInput
                label="Logo URL (Optional)"
                value={config.logoUrl}
                onChangeText={(text) => setConfig(prev => ({ ...prev, logoUrl: text }))}
                mode="outlined"
                style={styles.input}
                placeholder="https://example.com/logo.png"
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Enable Rate Limiting</Text>
                <Switch
                  value={config.rateLimitEnabled}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, rateLimitEnabled: value }))}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Enable Duplicate Detection</Text>
                <Switch
                  value={config.duplicateDetectionEnabled}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, duplicateDetectionEnabled: value }))}
                />
              </View>

              <Text style={styles.inputLabel}>Default Priority</Text>
              <View style={styles.priorityContainer}>
                {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((priority) => (
                  <Chip
                    key={priority}
                    mode={config.defaultPriority === priority ? 'flat' : 'outlined'}
                    selected={config.defaultPriority === priority}
                    onPress={() => setConfig(prev => ({ ...prev, defaultPriority: priority }))}
                    style={styles.priorityChip}
                  >
                    {priority}
                  </Chip>
                ))}
              </View>
            </View>
          </List.Accordion>
        </Card>
      </List.AccordionGroup>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          style={styles.saveButton}
          contentStyle={styles.saveButtonContent}
        >
          Save Configuration
        </Button>
        
        <Button
          mode="outlined"
          onPress={handleReset}
          disabled={loading}
          style={styles.resetButton}
        >
          Reset to Defaults
        </Button>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 48,
    marginTop: -8,
  },
  menuCard: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
    backgroundColor: '#fff',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  templatesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  templateChip: {
    margin: 4,
  },
  noTemplatesContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6c757d',
  },
  noTemplatesText: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  divider: {
    marginVertical: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryInput: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  addCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButton: {
    marginLeft: 8,
    backgroundColor: '#28a745',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  priorityChip: {
    margin: 4,
  },
  buttonContainer: {
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    marginBottom: 12,
  },
  saveButtonContent: {
    paddingVertical: 8,
  },
  resetButton: {
    borderColor: '#dc3545',
    borderRadius: 8,
  },
});

export default SupportCategoriesView;