import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, IconButton, List, useTheme, ActivityIndicator, Portal, Dialog, SegmentedButtons } from 'react-native-paper';
import { ChevronLeft, Mail, Plus, Trash2, Edit2 } from 'lucide-react-native';
import { emailTemplateApi } from '../../services/api';
import { colors, typography, sharedStyles } from '../../theme';
import { AppInput } from '../../components/global/Input/AppInput';
import { AppButton } from '../../components/global/Button/AppButton';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  interestCategory: string | null;
}

interface EmailTemplatesViewProps {
  onBack: () => void;
}

const EmailTemplatesView: React.FC<EmailTemplatesViewProps> = ({ onBack }) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [interestCategory, setInterestCategory] = useState<string>('HIGH');
  const [saving, setSaving] = useState(false);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await emailTemplateApi.getAll();
      setTemplates(res.data || []);
    } catch (e: any) {
      console.error('Failed to fetch templates:', e);
      Alert.alert('Error', 'Could not load email templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenDialog = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setName(template.name);
      setSubject(template.subject);
      setContent(template.content);
      setInterestCategory(template.interestCategory || 'NONE');
    } else {
      setEditingTemplate(null);
      setName('');
      setSubject('');
      setContent('');
      setInterestCategory('HIGH');
    }
    setDialogVisible(true);
  };

  const handleCloseDialog = () => {
    setDialogVisible(false);
  };

  const handleSave = async () => {
    if (!name || !subject || !content) {
      Alert.alert('Validation Error', 'Name, Subject, and Content are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        subject,
        content,
        interestCategory: interestCategory === 'NONE' ? null : interestCategory
      };

      if (editingTemplate) {
        await emailTemplateApi.update(editingTemplate.id, payload);
      } else {
        await emailTemplateApi.create(payload);
      }
      
      handleCloseDialog();
      fetchTemplates();
    } catch (e: any) {
      console.error('Failed to save template:', e);
      Alert.alert('Error', 'Could not save the template.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this template?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await emailTemplateApi.delete(id);
            fetchTemplates();
          } catch (e) {
            console.error('Failed to delete:', e);
            Alert.alert('Error', 'Could not delete template.');
            setLoading(false);
          }
        }
      }
    ]);
  };

  return (
    <View style={sharedStyles.container}>
      {/* Header */}
      <View style={sharedStyles.header}>
        <TouchableOpacity style={sharedStyles.backButton} onPress={onBack}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <View style={sharedStyles.headerContent}>
          <Text style={typography.pageTitle}>Email Templates</Text>
          <Text style={[typography.description, { marginTop: 4 }]}>
            Manage automated follow-up emails based on Lead Score and Interest.
          </Text>
        </View>
        <IconButton
          icon={() => <Plus color={colors.primary} size={24} />}
          onPress={() => handleOpenDialog()}
          mode="contained-tonal"
          containerColor={colors.primary + '20'}
        />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={sharedStyles.tabContent}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {templates.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Mail size={48} color={colors.border} />
              <Text style={{ marginTop: 16, color: colors.textSecondary }}>No email templates found.</Text>
            </View>
          ) : (
            templates.map((tpl) => (
              <View key={tpl.id} style={[sharedStyles.modernCard, styles.card]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.cardTitle, { color: colors.text }]}>{tpl.name}</Text>
                    <Text style={{ color: colors.textSecondary, marginTop: 4, fontSize: 13 }}>
                      Target: {tpl.interestCategory ? tpl.interestCategory : 'Fallback (Any)'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row' }}>
                    <IconButton
                      icon={() => <Edit2 color={colors.primary} size={18} />}
                      onPress={() => handleOpenDialog(tpl)}
                      size={20}
                    />
                    <IconButton
                      icon={() => <Trash2 color={colors.error} size={18} />}
                      onPress={() => handleDelete(tpl.id)}
                      size={20}
                    />
                  </View>
                </View>
                <View style={styles.cardBody}>
                  <Text style={{ fontWeight: 'bold', color: colors.text }}>Subj: {tpl.subject}</Text>
                  <Text style={{ color: colors.textSecondary, marginTop: 4 }} numberOfLines={3}>
                    {tpl.content}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Edit/Create Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={handleCloseDialog} style={{ backgroundColor: colors.card, borderRadius: 12 }}>
          <Dialog.Title style={{ color: colors.text }}>
            {editingTemplate ? 'Edit Template' : 'New Template'}
          </Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 4 }}>
               <AppInput
                label="Template Name"
                value={name}
                onChangeText={setName}
              />
              <AppInput
                label="Email Subject"
                value={subject}
                onChangeText={setSubject}
              />
              <Text style={{ marginTop: 8, marginBottom: 8, color: colors.textSecondary, fontSize: 13 }}>
                Target Interest Level:
              </Text>
              <SegmentedButtons
                value={interestCategory}
                onValueChange={setInterestCategory}
                buttons={[
                  { value: 'HIGH', label: 'High' },
                  { value: 'MEDIUM', label: 'Medium' },
                  { value: 'LOW', label: 'Low' },
                  { value: 'NONE', label: 'Any' },
                ]}
                style={{ marginBottom: 16 }}
              />
              <AppInput
                label="Email Body"
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={6}
              />
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: -8 }}>
                Tip: You can use {"{leadName}"}, {"{businessName}"} as placeholders.
              </Text>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <AppButton variant="text" onPress={handleCloseDialog} style={{ marginRight: 8 }}>
              Cancel
            </AppButton>
            <AppButton variant="primary" onPress={handleSave} loading={saving} disabled={saving}>
              {editingTemplate ? 'Update' : 'Create'}
            </AppButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardBody: {
    padding: 16,
  },
});

export default EmailTemplatesView;
