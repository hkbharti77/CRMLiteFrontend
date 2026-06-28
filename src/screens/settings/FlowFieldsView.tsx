import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, TextInput, Button, Switch, ActivityIndicator, IconButton, SegmentedButtons } from 'react-native-paper';
import { ChevronLeft } from 'lucide-react-native';
import { flowConfigApi, userApi } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { colors, typography, sharedStyles } from '../../theme';

interface FlowFieldConfig {
  key: string;
  enabled: boolean;
  required: boolean;
  order: number;
  label: string;
  fieldType: string;
  options: string[];
}

interface FlowFieldsViewProps {
  onBack: () => void;
  flowType?: string; // Optional: specify if it's LEAD or BOOKING
}

const FlowFieldsView: React.FC<FlowFieldsViewProps> = ({ onBack, flowType: initialFlowType }) => {
  const [fields, setFields] = useState<FlowFieldConfig[]>([]);
  const [greetingMessage, setGreetingMessage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeFlowType, setActiveFlowType] = useState<string>(initialFlowType || 'lead');
  const [availableFlows, setAvailableFlows] = useState<{value: string, label: string}[]>([]);
  
  const { flowType: baseFlowType } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    setLoading(true);
    try {
      // Fetch user profile to determine currently active flow and enabled modules
      const res = await userApi.getProfile();
      const user = res.data;
      
      const flows = [];
      if (baseFlowType === 'LEAD' || user.forceShowLeads) flows.push({ value: 'lead', label: 'Lead Collection' });
      if (baseFlowType === 'APPOINTMENT' || user.forceShowAppointment) flows.push({ value: 'appointment', label: 'Appointment' });
      if (baseFlowType === 'BOOKING' || user.forceShowBooking) flows.push({ value: 'booking', label: 'Booking' });
      
      if (flows.length === 0) {
         flows.push({ value: 'lead', label: 'Lead Collection' });
         flows.push({ value: 'appointment', label: 'Appointment' });
         flows.push({ value: 'booking', label: 'Booking' });
      }
      setAvailableFlows(flows);

      let currentFlowType = activeFlowType;
      if (!initialFlowType) {
        if (user.forceShowAppointment) currentFlowType = 'appointment';
        else if (user.forceShowBooking) currentFlowType = 'booking';
        else if (user.forceShowLeads) currentFlowType = 'lead';
        else if (baseFlowType === 'APPOINTMENT') currentFlowType = 'appointment';
        else if (baseFlowType === 'BOOKING') currentFlowType = 'booking';
        else currentFlowType = 'lead';
        
        setActiveFlowType(currentFlowType);
      }
      await fetchFields(currentFlowType);
    } catch (e) {
      console.error("Failed to initialize flow fields view", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchFields = async (type: string) => {
    try {
      const [res, greetingRes] = await Promise.all([
        flowConfigApi.getFlowFields(type),
        flowConfigApi.getFlowGreeting(type)
      ]);
      const sorted = (res.data || []).sort((a: FlowFieldConfig, b: FlowFieldConfig) => a.order - b.order);
      setFields(sorted);
      setGreetingMessage(greetingRes.data?.greetingMessage || '');
    } catch (error) {
      console.error("Failed to fetch flow fields:", error);
      Alert.alert("Error", "Could not load flow fields configuration.");
    }
  };

  const handleFlowTypeChange = async (newType: string) => {
    setActiveFlowType(newType);
    setLoading(true);
    try {
      await userApi.updateActiveFlowType(newType as any);
      await fetchFields(newType);
    } catch (e) {
      console.error("Failed to update flow type", e);
      Alert.alert("Error", "Could not update the active flow type.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedFields = fields.map((f, index) => ({ ...f, order: index }));
      await flowConfigApi.saveFlowGreeting(greetingMessage, activeFlowType);
      if (updatedFields.length > 0) {
        await flowConfigApi.saveFlowFields(updatedFields, activeFlowType);
      }
      setFields(updatedFields);
      Alert.alert("Success", "Flow fields and greeting saved successfully!");
    } catch (error) {
      console.error("Failed to save flow fields:", error);
      Alert.alert("Error", "Could not save flow fields configuration.");
    } finally {
      setSaving(false);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newFields = [...fields];
    const temp = newFields[index - 1];
    newFields[index - 1] = newFields[index];
    newFields[index] = temp;
    setFields(newFields);
  };

  const moveDown = (index: number) => {
    if (index === fields.length - 1) return;
    const newFields = [...fields];
    const temp = newFields[index + 1];
    newFields[index + 1] = newFields[index];
    newFields[index] = temp;
    setFields(newFields);
  };

  const updateField = (index: number, updates: Partial<FlowFieldConfig>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  if (loading) {
    return (
      <View style={[sharedStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={sharedStyles.container}>
      <View style={sharedStyles.header}>
        <TouchableOpacity style={sharedStyles.backButton} onPress={onBack}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <View style={sharedStyles.headerContent}>
          <Text style={typography.pageTitle}>WhatsApp Form Fields</Text>
        </View>
      </View>

      <ScrollView style={sharedStyles.tabContent} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[sharedStyles.modernCard, { padding: 20 }]}>
          <Text style={[typography.sectionTitle, { marginBottom: 4 }]}>Active WhatsApp Flow</Text>
          <Text style={typography.description}>
            Select the primary flow type your WhatsApp bot will use to interact with customers.
          </Text>
          
          <SegmentedButtons
            value={activeFlowType}
            onValueChange={handleFlowTypeChange}
            buttons={availableFlows}
            style={{ marginTop: 16, marginBottom: 8 }}
          />
        </View>

        <View style={[sharedStyles.modernCard, { padding: 20 }]}>
          <Text style={[typography.sectionTitle, { marginBottom: 4 }]}>Customize Your Chat Flow</Text>
          <Text style={typography.description}>
            Enable, reorder, and rename the questions your bot will ask the customer.
          </Text>

          <View style={{ marginTop: 16 }}>
            <TextInput
              label="Intro/Greeting Message (Optional)"
              value={greetingMessage}
              onChangeText={setGreetingMessage}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={[sharedStyles.input, { height: 80, marginBottom: 8 }]}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
            />
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 16 }}>
              This message will be sent right before the first question of this flow.
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 16 }}>
            <Button
              mode="outlined"
              onPress={() => {
                fetchFields(activeFlowType); // Reset to saved
              }}
              style={[sharedStyles.button, { flex: 1 }]}
              textColor={colors.text}
              disabled={saving}
            >
              Reset
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              style={[sharedStyles.button, { flex: 1 }]}
              buttonColor={colors.primary}
              icon="check"
            >
              Save Changes
            </Button>
          </View>

          {fields.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={[typography.description, { marginBottom: 12, textAlign: 'center' }]}>
                No flow fields loaded.
              </Text>
              <Button
                mode="contained"
                buttonColor={colors.primary}
                onPress={() => fetchFields(activeFlowType)}
                style={{ borderRadius: 8 }}
              >
                Reload Fields
              </Button>
            </View>
          ) : (
            fields.map((field, index) => (
              <View key={field.key} style={[styles.fieldSlot, !field.enabled && styles.fieldDisabled]}>
                <View style={styles.fieldHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text style={styles.fieldKeyBadge}>{field.key}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 8 }}>
                    {field.fieldType}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: field.enabled ? colors.primary : colors.muted, marginRight: 6, fontWeight: 'bold' }}>
                    {field.enabled ? 'ENABLED' : 'DISABLED'}
                  </Text>
                  <Switch
                    value={field.enabled}
                    onValueChange={(val) => updateField(index, { enabled: val })}
                    color={colors.primary}
                  />
                </View>
              </View>

              {field.enabled && (
                <View style={{ marginTop: 12 }}>
                  <TextInput
                    label="Question / Label"
                    value={field.label}
                    onChangeText={(val) => updateField(index, { label: val })}
                    mode="outlined"
                    style={[sharedStyles.input, { height: 44, marginBottom: 12 }]}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                  />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, marginRight: 8 }}>Required:</Text>
                      <Switch
                        value={field.required}
                        onValueChange={(val) => updateField(index, { required: val })}
                        color={colors.accent}
                      />
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                      <IconButton
                        icon="arrow-up"
                        size={20}
                        disabled={index === 0}
                        onPress={() => moveUp(index)}
                      />
                      <IconButton
                        icon="arrow-down"
                        size={20}
                        disabled={index === fields.length - 1}
                        onPress={() => moveDown(index)}
                      />
                    </View>
                  </View>

                  {field.fieldType === 'DROPDOWN' && (
                    <View style={{ marginTop: 16, padding: 12, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 8 }}>
                      <Text style={{ fontSize: 13, marginBottom: 8, fontWeight: 'bold', color: colors.text }}>Dropdown Options:</Text>
                      {(field.options || []).map((opt, optIndex) => (
                        <View key={optIndex} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <TextInput
                            mode="outlined"
                            style={[sharedStyles.input, { flex: 1, height: 36, marginTop: 0, marginBottom: 0 }]}
                            value={opt}
                            onChangeText={(val) => {
                              const newOptions = [...(field.options || [])];
                              newOptions[optIndex] = val;
                              updateField(index, { options: newOptions });
                            }}
                          />
                          <IconButton
                            icon="close"
                            size={20}
                            iconColor={colors.accent}
                            onPress={() => {
                              const newOptions = [...(field.options || [])];
                              newOptions.splice(optIndex, 1);
                              updateField(index, { options: newOptions });
                            }}
                          />
                        </View>
                      ))}
                      <Button
                        mode="text"
                        icon="plus"
                        textColor={colors.primary}
                        onPress={() => {
                          const newOptions = [...(field.options || []), "New Option"];
                          updateField(index, { options: newOptions });
                        }}
                      >
                        Add Option
                      </Button>
                    </View>
                  )}
                </View>
              )}
            </View>
          )))}
          
          {fields.length > 0 && (
             <Button
                mode="contained"
                onPress={handleSave}
                loading={saving}
                disabled={saving}
                style={[sharedStyles.button, { marginTop: 20 }]}
                buttonColor={colors.primary}
                icon="check"
              >
                Save Field Configuration
              </Button>
          )}

        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  fieldSlot: {
    marginBottom: 14,
    padding: 14,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldDisabled: {
    opacity: 0.7,
    backgroundColor: '#f9f9f9',
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldKeyBadge: {
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 11,
    textTransform: 'uppercase'
  }
});

export default FlowFieldsView;
