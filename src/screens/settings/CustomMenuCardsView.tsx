import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, Title, ActivityIndicator, Portal, Dialog, IconButton, Menu, Provider } from 'react-native-paper';
import { ChevronLeft, Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react-native';
import { menuBuilderApi } from '../../services/api';
import { colors, typography, sharedStyles } from '../../theme';

interface MenuCard {
  section: string;
  title: string;
  subtitle: string;
  icon: string;
  actionType: string;
  actionPayload: string;
  displayOrder: number;
}

interface CustomMenuCardsViewProps {
  onBack: () => void;
}

const ACTION_TYPES = [
  { label: 'Catalog (Products/Services)', value: 'CATALOG' },
  { label: 'Flow (Appt/Booking/Quote)', value: 'FLOW' },
  { label: 'External Link', value: 'LINK' },
  { label: 'Support Ticket', value: 'SUPPORT' },
  { label: 'About Us Text', value: 'ABOUT' },
];

const ICONS = ['briefcase', 'home', 'calendar', 'info', 'shopping-cart', 'tag', 'user', 'doc', 'settings'];

const CustomMenuCardsView: React.FC<CustomMenuCardsViewProps> = ({ onBack }) => {
  const [cards, setCards] = useState<MenuCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState<{ index: number; visible: boolean } | null>(null);
  const [showIconMenu, setShowIconMenu] = useState<{ index: number; visible: boolean } | null>(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const res = await menuBuilderApi.getMenuCards();
      setCards(res.data || []);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to load custom menu cards.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (cards.length === 0) {
      Alert.alert('Error', 'Add at least one card or use "Reset to Defaults".');
      return;
    }
    
    // Validation
    const invalid = cards.some(c => !c.title.trim() || !c.actionType);
    if (invalid) {
      Alert.alert('Error', 'All cards must have a Title and an Action Type.');
      return;
    }

    try {
      setSaving(true);
      // Ensure display order is set
      const orderedCards = cards.map((c, i) => ({ ...c, displayOrder: i }));
      await menuBuilderApi.saveMenuCards(orderedCards);
      Alert.alert('Success', 'Custom menu cards saved!');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save cards.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    Alert.alert(
      'Reset to Defaults?',
      'This will delete all custom cards and revert to the standard default cards for your business type. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await menuBuilderApi.resetMenuCards();
              setCards([]);
              Alert.alert('Reset', 'Using default niche menu cards now.');
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Failed to reset.');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const addCard = () => {
    if (cards.length >= 10) {
      Alert.alert('Limit Reached', 'You can only have up to 10 custom cards.');
      return;
    }
    setCards([...cards, {
      section: 'SERVICES',
      title: 'New Service',
      subtitle: '',
      icon: 'briefcase',
      actionType: 'CATALOG',
      actionPayload: '',
      displayOrder: cards.length
    }]);
  };

  const updateCard = (index: number, field: keyof MenuCard, value: string) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], [field]: value };
    setCards(newCards);
  };

  const removeCard = (index: number) => {
    const newCards = cards.filter((_, i) => i !== index);
    setCards(newCards);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newCards = [...cards];
    const temp = newCards[index];
    newCards[index] = newCards[index - 1];
    newCards[index - 1] = temp;
    setCards(newCards);
  };

  const moveDown = (index: number) => {
    if (index === cards.length - 1) return;
    const newCards = [...cards];
    const temp = newCards[index];
    newCards[index] = newCards[index + 1];
    newCards[index + 1] = temp;
    setCards(newCards);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Provider>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.textDark} />
            <Text style={styles.backText}>Back to Settings</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Title style={styles.title}>Menu Builder</Title>
          <Text style={styles.subtitle}>
            Customize the buttons shown in the chat widget sidebar. If you leave this empty, the widget will automatically show default buttons based on your business type.
          </Text>

          {cards.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ textAlign: 'center', marginBottom: 16 }}>You are currently using default menu cards.</Text>
            </View>
          ) : (
            cards.map((card, index) => (
              <Card key={index.toString()} style={styles.card}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardNumber}>Button {index + 1}</Text>
                    <View style={styles.cardActions}>
                      <IconButton icon="arrow-up" size={20} onPress={() => moveUp(index)} disabled={index === 0} />
                      <IconButton icon="arrow-down" size={20} onPress={() => moveDown(index)} disabled={index === cards.length - 1} />
                      <IconButton icon="delete" iconColor="red" size={20} onPress={() => removeCard(index)} />
                    </View>
                  </View>
                  
                  <TextInput
                    label="Title (e.g. View Products)"
                    value={card.title}
                    onChangeText={text => updateCard(index, 'title', text)}
                    mode="outlined"
                    style={styles.input}
                    maxLength={80}
                  />
                  
                  <TextInput
                    label="Subtitle (optional)"
                    value={card.subtitle}
                    onChangeText={text => updateCard(index, 'subtitle', text)}
                    mode="outlined"
                    style={styles.input}
                    maxLength={120}
                  />

                  {/* Action Type Dropdown */}
                  <View style={styles.dropdownContainer}>
                    <Text style={styles.label}>Action Type:</Text>
                    <Menu
                      visible={showActionMenu?.index === index && showActionMenu?.visible}
                      onDismiss={() => setShowActionMenu(null)}
                      anchor={
                        <Button mode="outlined" onPress={() => setShowActionMenu({ index, visible: true })}>
                          {ACTION_TYPES.find(a => a.value === card.actionType)?.label || card.actionType}
                        </Button>
                      }
                    >
                      {ACTION_TYPES.map(action => (
                        <Menu.Item 
                          key={action.value} 
                          onPress={() => {
                            updateCard(index, 'actionType', action.value);
                            setShowActionMenu(null);
                            // Auto-set common payload for flow if they select it
                            if (action.value === 'FLOW' && !card.actionPayload) {
                              updateCard(index, 'actionPayload', 'appointment');
                            }
                          }} 
                          title={action.label} 
                        />
                      ))}
                    </Menu>
                  </View>

                  {/* Icon Dropdown */}
                  <View style={styles.dropdownContainer}>
                    <Text style={styles.label}>Icon:</Text>
                    <Menu
                      visible={showIconMenu?.index === index && showIconMenu?.visible}
                      onDismiss={() => setShowIconMenu(null)}
                      anchor={
                        <Button mode="outlined" icon={card.icon} onPress={() => setShowIconMenu({ index, visible: true })}>
                          {card.icon}
                        </Button>
                      }
                    >
                      {ICONS.map(i => (
                        <Menu.Item 
                          key={i} 
                          onPress={() => {
                            updateCard(index, 'icon', i);
                            setShowIconMenu(null);
                          }} 
                          title={i}
                        />
                      ))}
                    </Menu>
                  </View>

                  {/* Payload field varies based on action type */}
                  {card.actionType === 'LINK' && (
                    <TextInput
                      label="URL (https://...)"
                      value={card.actionPayload}
                      onChangeText={text => updateCard(index, 'actionPayload', text)}
                      mode="outlined"
                      style={styles.input}
                    />
                  )}
                  {card.actionType === 'FLOW' && (
                    <TextInput
                      label="Flow Name (appointment, booking, or lead)"
                      value={card.actionPayload}
                      onChangeText={text => updateCard(index, 'actionPayload', text)}
                      mode="outlined"
                      style={styles.input}
                    />
                  )}

                </Card.Content>
              </Card>
            ))
          )}

          <Button 
            mode="outlined" 
            icon={() => <Plus size={20} color={colors.primary} />} 
            onPress={addCard}
            style={styles.addButton}
          >
            Add Custom Button
          </Button>

          <View style={styles.saveContainer}>
            <Button 
              mode="contained" 
              onPress={handleSave} 
              loading={saving}
              disabled={saving}
              style={[styles.saveButton, { flex: 1 }]}
            >
              Save Menu
            </Button>
            {cards.length > 0 && (
              <Button 
                mode="text" 
                textColor="red"
                onPress={handleReset} 
                disabled={saving}
                style={{ marginTop: 8 }}
              >
                Reset to Defaults
              </Button>
            )}
          </View>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#fff',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.textDark,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 24,
  },
  emptyState: {
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardNumber: {
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.primary,
  },
  cardActions: {
    flexDirection: 'row',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    width: 90,
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '500',
  },
  addButton: {
    marginVertical: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
  },
  saveContainer: {
    marginTop: 16,
  },
  saveButton: {
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
});

export default CustomMenuCardsView;
