import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, TextInput, Button, Switch, Menu, Divider } from 'react-native-paper';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react-native';
import { colors, typography, sharedStyles } from '../../theme';

interface ButtonDef {
  id: string;
  title: string;
}

interface MenuDef {
  enabled: boolean;
  bodyText: string;
  buttons: ButtonDef[];
}

interface FlowCTAButtonsViewProps {
  flowCancelMenuJson: string;
  flowCompletionMenuJson: string;
  aiResponseMenuJson: string;
  customSubMenusJson: string;
  customMessagesJson: string;
  guardrailMessageAbuse: string;
  guardrailMessageGibberish: string;
  setFlowCancelMenuJson: (val: string) => void;
  setFlowCompletionMenuJson: (val: string) => void;
  setAiResponseMenuJson: (val: string) => void;
  setGuardrailMessageAbuse: (val: string) => void;
  setGuardrailMessageGibberish: (val: string) => void;
  onSave: (cancelJson: string, completionJson: string, aiResponseJson: string, guardrailMsgAbuse: string, guardrailMsgGibberish: string) => Promise<void>;
  onBack: () => void;
  loading: boolean;
}

const FlowCTAButtonsView: React.FC<FlowCTAButtonsViewProps> = ({
  flowCancelMenuJson,
  flowCompletionMenuJson,
  aiResponseMenuJson,
  customSubMenusJson,
  customMessagesJson,
  guardrailMessageAbuse,
  guardrailMessageGibberish,
  onSave,
  onBack,
  setGuardrailMessageAbuse,
  setGuardrailMessageGibberish,
  loading
}) => {
  const [aiConfig, setAiConfig] = useState<MenuDef>({
    enabled: false,
    bodyText: '',
    buttons: []
  });

  const [cancelConfig, setCancelConfig] = useState<MenuDef>({
    enabled: false,
    bodyText: '🛑 Your form has been terminated.',
    buttons: []
  });

  const [completionConfig, setCompletionConfig] = useState<MenuDef>({
    enabled: false,
    bodyText: '✅ Thank you for contacting support! We\'ve received your request and will get back to you shortly.',
    buttons: []
  });

  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  // Parse custom menu names for the dropdown
  let customNames = ['Custom Menu 1', 'Custom Menu 2', 'Custom Menu 3', 'Custom Menu 4'];
  try {
     if (customSubMenusJson) {
       const parsed = JSON.parse(customSubMenusJson);
       parsed.forEach((m: any, idx: number) => {
          if (m.triggerLabel && idx < 4) customNames[idx] = m.triggerLabel;
       });
     }
  } catch(e) {}

  let customMsgNames = ['Quick Response 1', 'Quick Response 2', 'Quick Response 3', 'Quick Response 4', 'Quick Response 5', 'Quick Response 6'];
  try {
      if (customMessagesJson) {
        const parsed = JSON.parse(customMessagesJson);
        parsed.forEach((m: any, idx: number) => {
           if (m.name && idx < 6) customMsgNames[idx] = m.name;
        });
      }
  } catch(e) {}

  useEffect(() => {
    try {
      if (flowCancelMenuJson) {
        const parsed = JSON.parse(flowCancelMenuJson);
        const btns = parsed.sections?.[0]?.rows || [];
        setCancelConfig({
          enabled: true,
          bodyText: parsed.bodyText || '🛑 Your form has been terminated.',
          buttons: btns.map((b: any) => ({ id: b.id, title: b.title }))
        });
      }
    } catch (e) {}

    try {
      if (flowCompletionMenuJson) {
        const parsed = JSON.parse(flowCompletionMenuJson);
        const btns = parsed.sections?.[0]?.rows || [];
        setCompletionConfig({
          enabled: true,
          bodyText: parsed.bodyText || '',
          buttons: btns.map((b: any) => ({ id: b.id, title: b.title }))
        });
      }
    } catch (e) {}
    try {
      if (aiResponseMenuJson) {
        const parsed = JSON.parse(aiResponseMenuJson);
        const btns = parsed.sections?.[0]?.rows || [];
        setAiConfig({
          enabled: true,
          bodyText: parsed.bodyText || '',
          buttons: btns.map((b: any) => ({ id: b.id, title: b.title }))
        });
      }
    } catch (e) {}

  }, [flowCancelMenuJson, flowCompletionMenuJson, aiResponseMenuJson]);

  const compileJson = (config: MenuDef) => {
    if (!config.enabled || config.buttons.length === 0) return '';
    return JSON.stringify({
      type: 'button',
      bodyText: config.bodyText.trim() || 'Please select an option:',
      sections: [
        {
          rows: config.buttons.map((b, idx) => ({
            id: b.id || `custom_cta_${idx}`,
            title: b.title.substring(0, 20).trim()
          }))
        }
      ]
    });
  };

  const handleSave = async () => {
    if (cancelConfig.enabled && cancelConfig.buttons.length === 0) {
      Alert.alert('Validation Error', 'Cancel Menu must have at least 1 button if enabled.');
      return;
    }
    if (completionConfig.enabled && completionConfig.buttons.length === 0) {
      Alert.alert('Validation Error', 'Completion Menu must have at least 1 button if enabled.');
      return;
    }

    if (aiConfig.enabled && aiConfig.buttons.length === 0) {
      Alert.alert('Validation Error', 'AI Response Menu must have at least 1 button if enabled.');
      return;
    }

    const cancelJson = compileJson(cancelConfig);
    const completionJson = compileJson(completionConfig);
    const aiResponseJson = compileJson(aiConfig);

    await onSave(cancelJson, completionJson, aiResponseJson, guardrailMessageAbuse, guardrailMessageGibberish);
  };

  const getActionLabel = (id: string) => {
    if (!id || id.startsWith('custom_cta_') || id.startsWith('cta_')) return 'Link Action';
    if (id === 'view_services') return 'Catalog Linked';
    if (id === 'trigger_flow_lead') return 'Lead Form Linked';
    if (id === 'trigger_flow_appointment') return 'Appointment Form Linked';
    if (id === 'trigger_flow_booking') return 'Booking Form Linked';
    if (id.startsWith('custom_list_')) return 'Sub Menu Linked';
    if (id.startsWith('custom_msg_')) return 'Message Linked';
    return 'Action Linked';
  };

  const renderConfigSection = (
    title: string,
    desc: string,
    configType: 'cancel' | 'completion' | 'ai',
    config: MenuDef,
    setConfig: (val: MenuDef) => void,
    defaultText: string
  ) => {
    return (
      <View style={[sharedStyles.modernCard, { padding: 20, marginBottom: 20 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={typography.sectionTitle}>{title}</Text>
          <Switch
            value={config.enabled}
            onValueChange={(val) => setConfig({ ...config, enabled: val })}
            color={colors.primary}
          />
        </View>
        <Text style={[typography.description, { marginBottom: 16 }]}>{desc}</Text>

        {config.enabled ? (
          <View>
            {configType !== 'ai' && (
              <TextInput
                label="Message Text"
                value={config.bodyText}
                onChangeText={(text) => setConfig({ ...config, bodyText: text })}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={[sharedStyles.input, { marginBottom: 16 }]}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />
            )}

            <Text style={[typography.label, { marginBottom: 8 }]}>Buttons (Max 3)</Text>
            {config.buttons.map((btn, index) => {
              const menuKey = `${configType}_${index}`;
              const isLinked = btn.id && !btn.id.startsWith('custom_cta_') && !btn.id.startsWith('cta_');

              return (
                <View key={index} style={styles.buttonRow}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      value={btn.title}
                      onChangeText={(text) => {
                        const newBtns = [...config.buttons];
                        newBtns[index].title = text;
                        setConfig({ ...config, buttons: newBtns });
                      }}
                      mode="outlined"
                      placeholder={`Button ${index + 1}`}
                      style={[sharedStyles.input, { height: 44, marginBottom: 4 }]}
                      outlineColor={colors.border}
                      activeOutlineColor={colors.primary}
                      maxLength={20}
                    />
                    <Menu
                      visible={menuVisible === menuKey}
                      onDismiss={() => setMenuVisible(null)}
                      anchor={
                        <Button
                          mode={isLinked ? "contained" : "outlined"}
                          compact
                          onPress={() => setMenuVisible(menuKey)}
                          icon={isLinked ? "link-variant" : "link-plus"}
                          style={{ borderColor: colors.border }}
                          labelStyle={{ fontSize: 10 }}
                          buttonColor={isLinked ? colors.accent : undefined}
                          textColor={isLinked ? undefined : colors.text}
                        >
                          {getActionLabel(btn.id)}
                        </Button>
                      }
                    >
                      <Menu.Item 
                        onPress={() => {
                          const newBtns = [...config.buttons];
                          newBtns[index].id = 'view_services';
                          setConfig({ ...config, buttons: newBtns });
                          setMenuVisible(null);
                        }} 
                        title="Products & Services Catalog" 
                        leadingIcon="store-check"
                      />
                      <Divider />
                      <Menu.Item onPress={() => { const newBtns = [...config.buttons]; newBtns[index].id = 'trigger_flow_lead'; setConfig({ ...config, buttons: newBtns }); setMenuVisible(null); }} title="Lead Form" leadingIcon="clipboard-text" />
                      <Menu.Item onPress={() => { const newBtns = [...config.buttons]; newBtns[index].id = 'trigger_flow_appointment'; setConfig({ ...config, buttons: newBtns }); setMenuVisible(null); }} title="Appointment Form" leadingIcon="calendar-clock" />
                      <Menu.Item onPress={() => { const newBtns = [...config.buttons]; newBtns[index].id = 'trigger_flow_booking'; setConfig({ ...config, buttons: newBtns }); setMenuVisible(null); }} title="Booking Form" leadingIcon="calendar-check" />
                      <Divider />
                      {[1, 2, 3, 4].map(num => (
                        <Menu.Item 
                          key={`list_${num}`}
                          onPress={() => {
                            const newBtns = [...config.buttons];
                            newBtns[index].id = `custom_list_${num}`;
                            setConfig({ ...config, buttons: newBtns });
                            setMenuVisible(null);
                          }} 
                          title={customNames[num-1]} 
                          leadingIcon="view-list"
                        />
                      ))}
                      <Divider />
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <Menu.Item 
                          key={`msg_${num}`}
                          onPress={() => {
                            const newBtns = [...config.buttons];
                            newBtns[index].id = `custom_msg_${num}`;
                            setConfig({ ...config, buttons: newBtns });
                            setMenuVisible(null);
                          }} 
                          title={customMsgNames[num-1]} 
                          leadingIcon="message-text"
                        />
                      ))}
                      <Divider />
                      <Menu.Item 
                        onPress={() => {
                          const newBtns = [...config.buttons];
                          newBtns[index].id = `cta_${Date.now()}`;
                          setConfig({ ...config, buttons: newBtns });
                          setMenuVisible(null);
                        }} 
                        title="None / Clear Link" 
                        leadingIcon="close-circle"
                      />
                    </Menu>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => {
                      const newBtns = config.buttons.filter((_, i) => i !== index);
                      setConfig({ ...config, buttons: newBtns });
                    }}
                  >
                    <Trash2 color={colors.error} size={20} />
                  </TouchableOpacity>
                </View>
              );
            })}

            {config.buttons.length < 3 && (
              <Button
                mode="text"
                icon={() => <Plus size={18} color={colors.primary} />}
                onPress={() => {
                  setConfig({
                    ...config,
                    buttons: [...config.buttons, { id: `cta_${Date.now()}`, title: '' }]
                  });
                }}
                textColor={colors.primary}
                style={{ alignSelf: 'flex-start', marginTop: 8 }}
              >
                Add Button
              </Button>
            )}
          </View>
        ) : (
          <View style={{ padding: 12, backgroundColor: colors.background, borderRadius: 8 }}>
            <Text style={{ color: colors.muted, fontStyle: 'italic' }}>
              Disabled. The system will send the default plain-text message: "{defaultText}"
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={sharedStyles.container}>
      <View style={sharedStyles.header}>
        <TouchableOpacity style={sharedStyles.backButton} onPress={onBack}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <View style={sharedStyles.headerContent}>
          <Text style={typography.pageTitle}>Flow CTA Buttons</Text>
        </View>
      </View>

      <ScrollView style={sharedStyles.tabContent} contentContainerStyle={{ paddingBottom: 100 }}>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>AI Fallback / Guardrail Messages</Text>
          <Text style={styles.sectionDesc}>These messages are sent inside the Main Menu when the AI blocks abusive or gibberish text.</Text>
          <TextInput
            mode="outlined"
            label="Abuse Fallback Message"
            value={guardrailMessageAbuse}
            onChangeText={setGuardrailMessageAbuse}
            multiline
            numberOfLines={2}
            style={styles.textInput}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            placeholder="E.g., We do not tolerate abusive language."
          />
          <TextInput
            mode="outlined"
            label="Gibberish Fallback Message"
            value={guardrailMessageGibberish}
            onChangeText={setGuardrailMessageGibberish}
            multiline
            numberOfLines={2}
            style={[styles.textInput, { marginTop: 10 }]}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            placeholder="E.g., We couldn't process your request. Please select an option."
          />
        </View>

        {renderConfigSection(
          'Cancel Flow Buttons',
          'Buttons shown when a user types "cancel" to stop an active form.',
          'cancel',
          cancelConfig,
          setCancelConfig,
          '🛑 Your form has been terminated.'
        )}

        {renderConfigSection(
          'Complete Flow Buttons',
          'Buttons shown when a user successfully submits a form.',
          'completion',
          completionConfig,
          setCompletionConfig,
          '✅ Thank you for contacting support! We\'ve received your request and will get back to you shortly.'
        )}

        {renderConfigSection(
          'AI Response Buttons',
          'Buttons attached to every AI conversation message. If disabled, AI will reply with plain text.',
          'ai',
          aiConfig,
          setAiConfig,
          ''
        )}

        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          buttonColor={colors.primary}
          style={sharedStyles.button}
        >
          Save Configuration
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 8
  },
  deleteBtn: {
    marginTop: 6,
    padding: 10,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default FlowCTAButtonsView;
