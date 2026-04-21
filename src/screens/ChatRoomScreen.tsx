import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, Modal, ScrollView as RNScrollView } from 'react-native';
import { Text, TextInput, IconButton, Avatar, Surface, useTheme, Chip, Divider, Snackbar, Button, Card } from 'react-native-paper';
import { useChatStore, Message } from '../store/useChatStore';
import { crmApi, messageApi } from '../services/api';
import { ScrollView } from 'react-native';
import { useLeadStore, LeadStatus } from '../store/useLeadStore';

export default function ChatRoomScreen({ route }: any) {
  const { chatId, name } = route.params;
  const theme = useTheme();
  const { currentMessages, setMessages, updateChatStatus, setActiveChatId } = useChatStore();
  const { updateLeadStatus: updateStoreStatus } = useLeadStore();
  const [inputText, setInputText] = useState('');
  const [showCRM, setShowCRM] = useState(false);
  const [associatedLead, setAssociatedLead] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingMenu, setSendingMenu] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showError, setShowError] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchHistory();
    fetchLead();
    setActiveChatId(chatId); // Set active chat ID for WebSocket routing

    return () => setActiveChatId(null); // Clear on leave
    // Note: Real-time updates now handled by WebSocket (useWebSocketStore)
    // No polling needed here anymore
  }, [chatId]);

  const fetchLead = async () => {
    try {
      const response = await crmApi.getLeadByContactId(chatId);
      setAssociatedLead(response.data);
    } catch (error) {
       console.log('No lead associated with this chat yet');
    }
  };

  const fetchHistory = async (isBackground = false) => {
    try {
      const response = await messageApi.getHistory(chatId);
      // Map backend Message model to frontend expected format
      const mappedMessages = response.data.map((m: any) => ({
        id: m.id,
        text: m.content,
        sender: m.direction === 'INCOMING' ? 'contact' : 'user',
        timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));

      // Only scroll if we have new messages (to prevent jumping during polling)
      const hasNewMessages = mappedMessages.length > currentMessages.length;
      
      setMessages(mappedMessages);
      
      if (hasNewMessages || !isBackground) {
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: !isBackground }), 200);
      }
    } catch (error) {
      if (!isBackground) console.error('Error fetching history:', error);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;
    
    const text = inputText;
    setSending(true);

    try {
      await messageApi.sendMessage(chatId, text);
      setInputText(''); // Only clear on SUCCESS
      // Refresh history to show the outgoing message
      await fetchHistory();
    } catch (error: any) {
      console.error('Error sending message:', error);
      const msg = error.response?.data?.message || error.message || 'Failed to send message';
      setErrorMsg(msg);
      setShowError(true);
    } finally {
      setSending(false);
    }
  };

  const handleSendMenu = async () => {
    if (sendingMenu || sending) return;
    setSendingMenu(true);
    try {
      await messageApi.sendMenu(chatId);
      await fetchHistory(); // History gets [Sent Interactive Menu] update
    } catch (error: any) {
      console.error('Error sending interactive menu:', error);
      const msg = error.response?.data || error.message || 'Failed to send interactive menu';
      setErrorMsg(msg);
      setShowError(true);
    } finally {
      setSendingMenu(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!associatedLead || updating) return;
    
    setUpdating(true);
    try {
      await crmApi.updateLeadStatus(associatedLead.id, newStatus);
      // Sync everywhere
      updateChatStatus(chatId, newStatus as any);
      updateStoreStatus(associatedLead.id, newStatus as any);
      setAssociatedLead({ ...associatedLead, status: newStatus });
    } catch (error) {
      console.error('Error updating status from chat:', error);
    } finally {
      setUpdating(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageWrapper,
      item.sender === 'user' ? styles.userWrapper : styles.contactWrapper
    ]}>
      <Surface style={[
        styles.messageBubble,
        item.sender === 'user' ? 
          { backgroundColor: theme.colors.primary, borderBottomRightRadius: 2 } : 
          { backgroundColor: '#fff', borderBottomLeftRadius: 2 }
      ]} elevation={1}>
        <Text style={[
          styles.messageText,
          item.sender === 'user' ? { color: '#fff' } : { color: '#000' }
        ]}>
          {item.text}
        </Text>
        <Text style={[
          styles.timestamp,
          item.sender === 'user' ? { color: 'rgba(255,255,255,0.7)' } : { color: '#999' }
        ]}>
          {item.timestamp}
        </Text>
      </Surface>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Quick CRM Status Bar */}
      <Surface style={styles.crmBar} elevation={2}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipContainer}>
          {['NEW', 'INTERESTED', 'FOLLOW_UP', 'BOOKED', 'CLOSED_WON', 'CLOSED_LOST'].map((status) => (
            <Chip 
              key={status} 
              onPress={() => handleStatusUpdate(status)}
              style={styles.chip}
              selected={associatedLead?.status === status}
              selectedColor={theme.colors.primary}
              disabled={updating || !associatedLead}
            >
              {status.replace('_', ' ')}
            </Chip>
          ))}
        </ScrollView>
        <IconButton 
          icon="dots-vertical" 
          onPress={() => { setShowCRM(!showCRM); if (!showCRM) fetchLead(); }} 
          containerColor={theme.colors.surfaceVariant}
        />
      </Surface>

      <FlatList
        ref={flatListRef}
        data={currentMessages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <Surface style={styles.inputContainer} elevation={4}>
          <IconButton 
            icon="card-bulleted-outline" 
            size={24} 
            iconColor={sendingMenu ? '#ccc' : theme.colors.primary} 
            onPress={handleSendMenu}
            disabled={sendingMenu}
          />
          <TextInput
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            style={styles.input}
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
          />
          <IconButton 
            icon="send" 
            size={24} 
            iconColor={inputText.trim() && !sending ? theme.colors.primary : '#ccc'} 
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          />
        </Surface>
      </KeyboardAvoidingView>

      <Snackbar
        visible={showError}
        onDismiss={() => setShowError(false)}
        duration={5000}
        action={{
          label: 'OK',
          onPress: () => setShowError(false),
        }}
        style={{ backgroundColor: '#B71C1C' }}
      >
        {errorMsg}
      </Snackbar>

      {/* ── Lead Info Panel (slide up when dots pressed) ─────────── */}
      <Modal
        visible={showCRM}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCRM(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCRM(false)} />
        <View style={[styles.leadPanel, { backgroundColor: theme.colors.surface }]}>
          {/* Header */}
          <View style={styles.panelHeader}>
            <Text variant="titleMedium" style={{ fontWeight: '700' }}>Lead Info</Text>
            <IconButton icon="close" size={20} onPress={() => setShowCRM(false)} />
          </View>

          {!associatedLead ? (
            <Text style={styles.noLeadText}>No lead found for this contact.</Text>
          ) : (
            <RNScrollView showsVerticalScrollIndicator={false}>

              {/* Status */}
              <Text style={styles.sectionLabel}>Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {['NEW','INTERESTED','FOLLOW_UP','BOOKED','CLOSED_WON','CLOSED_LOST'].map(s => (
                  <Chip
                    key={s}
                    selected={associatedLead.status === s}
                    selectedColor={theme.colors.primary}
                    onPress={() => handleStatusUpdate(s)}
                    style={{ marginRight: 8 }}
                    disabled={updating}
                  >
                    {s.replace('_', ' ')}
                  </Chip>
                ))}
              </ScrollView>

              {/* Deal */}
              {associatedLead.dealValue ? (
                <>
                  <Text style={styles.sectionLabel}>Deal</Text>
                  <Card style={styles.infoCard} elevation={0}>
                    <Card.Content>
                      {associatedLead.dealLabel ? (
                        <Text variant="labelSmall" style={{ color: '#888' }}>{associatedLead.dealLabel}</Text>
                      ) : null}
                      <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>
                        ₹{Number(associatedLead.dealValue).toLocaleString('en-IN')}
                      </Text>
                      <Chip compact style={{ alignSelf: 'flex-start', marginTop: 6,
                        backgroundColor: associatedLead.paymentStatus === 'PAID' ? '#E8F5E9' :
                          associatedLead.paymentStatus === 'PENDING' ? '#FFEBEE' : '#F5F5F5'
                      }} textStyle={{ color:
                        associatedLead.paymentStatus === 'PAID' ? '#2E7D32' :
                        associatedLead.paymentStatus === 'PENDING' ? '#B71C1C' : '#666'
                      }}>
                        {associatedLead.paymentStatus === 'PAID' ? '✅ Paid' :
                         associatedLead.paymentStatus === 'PENDING' ? '🔴 Pending' :
                         associatedLead.paymentStatus === 'PARTIAL' ? '⚠️ Partial' : 'No Status'}
                      </Chip>
                    </Card.Content>
                  </Card>
                </>
              ) : null}

              {/* Enquiries */}
              <Text style={styles.sectionLabel}>
                Enquiries ({associatedLead.enquiries?.length ?? 0})
              </Text>
              {(associatedLead.enquiries?.length ?? 0) === 0 ? (
                <Text style={styles.emptyText}>No enquiries yet.</Text>
              ) : (
                associatedLead.enquiries.map((enq: any) => (
                  <View key={enq.id} style={styles.enquiryRow}>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodySmall" style={{ color: '#333' }}>{enq.message}</Text>
                      <Text variant="labelSmall" style={{ color: '#aaa', marginTop: 2 }}>
                        {enq.source} · {new Date(enq.createdAt).toLocaleDateString('en-IN')}
                      </Text>
                    </View>
                    <Chip compact style={{ height: 20, backgroundColor:
                      enq.status === 'RESOLVED' ? '#E8F5E9' :
                      enq.status === 'FOLLOW_UP' ? '#FFF3E0' : '#E3F2FD'
                    }} textStyle={{ fontSize: 9, color:
                      enq.status === 'RESOLVED' ? '#2E7D32' :
                      enq.status === 'FOLLOW_UP' ? '#E65100' : '#1565C0'
                    }}>
                      {enq.status}
                    </Chip>
                  </View>
                ))
              )}

              <View style={{ height: 24 }} />
            </RNScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  crmBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  chipContainer: {
    paddingRight: 10,
  },
  chip: {
    marginRight: 8,
    height: 32,
  },
  messageList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageWrapper: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },
  contactWrapper: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: 'transparent',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  leadPanel: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
    elevation: 8,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 16,
  },
  enquiryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 8,
  },
  noLeadText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 24,
  },
  emptyText: {
    color: '#bbb',
    fontSize: 13,
    marginBottom: 12,
  },
});
