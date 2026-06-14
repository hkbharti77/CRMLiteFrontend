import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, Modal, ScrollView as RNScrollView, Text } from 'react-native';
import { IconButton, Surface, useTheme, Chip, Snackbar, Card } from 'react-native-paper';
import { ArrowLeft, Phone, Video, FileText, MoreVertical } from 'lucide-react-native';
import { useChatStore, Message } from '../store/useChatStore';
import { crmApi, messageApi } from '../services/api';
import { useLeadStore } from '../store/useLeadStore';
import { tokens } from '../theme/tokens';

import { AppAvatar } from '@components/global/Avatar/AppAvatar';
import { ChatBubble } from '@components/chat/ChatBubble';
import { MessageInput } from '@components/chat/MessageInput';
import { TypingIndicator } from '@components/chat/TypingIndicator';

const PIPELINE_STAGES = ['NEW', 'INTERESTED', 'FOLLOW_UP', 'BOOKED', 'CLOSED_WON'];

export default function ChatRoomScreen({ route, navigation }: any) {
  const { chatId, name } = route.params;
  const theme = useTheme();
  const { currentMessages, setMessages, updateChatStatus, setActiveChatId } = useChatStore();
  const { updateLeadStatus: updateStoreStatus } = useLeadStore();
  const [showCRM, setShowCRM] = useState(false);
  const [associatedLead, setAssociatedLead] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showError, setShowError] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchHistory();
    fetchLead();
    setActiveChatId(chatId);
    return () => setActiveChatId(null);
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
      const mappedMessages = response.data.map((m: any, index: number) => ({
        id: m.id,
        text: m.content,
        sender: m.direction === 'INCOMING' ? 'contact' : 'user',
        timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        // Add mocked statuses and bot flags for demonstration
        status: m.direction !== 'INCOMING' ? (index % 3 === 0 ? 'read' : 'delivered') : undefined,
        type: index === 1 && m.direction === 'INCOMING' ? 'bot_card' : 'text',
        botOptions: index === 1 ? ['Start Project', 'About Us', 'Human Support'] : undefined,
      }));

      // Inject a mocked date separator at the top for layout demonstration
      if (mappedMessages.length > 0 && mappedMessages[0].type !== 'date') {
        mappedMessages.unshift({
          id: 'date-today',
          type: 'date',
          text: 'Today',
        });
      }

      const hasNewMessages = mappedMessages.length > currentMessages.length;
      
      setMessages(mappedMessages);
      
      if (hasNewMessages || !isBackground) {
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: !isBackground }), 200);
      }
    } catch (error) {
      if (!isBackground) console.error('Error fetching history:', error);
    }
  };

  const handleSend = async (text: string) => {
    if (sending) return;
    setSending(true);
    try {
      await messageApi.sendMessage(chatId, text);
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

  const handleStatusUpdate = async (newStatus: string) => {
    if (!associatedLead || updating) return;
    
    setUpdating(true);
    try {
      await crmApi.updateLeadStatus(associatedLead.id, newStatus);
      updateChatStatus(chatId, newStatus as any);
      updateStoreStatus(associatedLead.id, newStatus as any);
      setAssociatedLead({ ...associatedLead, status: newStatus });
    } catch (error) {
      console.error('Error updating status from chat:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.backgroundDark }]}>
      
      {/* LAYER 1: Header */}
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: tokens.colors.border }]} elevation={0}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <ArrowLeft size={24} color={tokens.colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerAvatar}>
              <AppAvatar name={name} size="small" />
              <View style={styles.onlineStatusBadge} />
            </View>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerName, { color: tokens.colors.textPrimary }]} numberOfLines={1}>{name}</Text>
              <Text style={[styles.headerStatus, { color: tokens.colors.success }]}>● Online</Text>
            </View>
          </View>

          <View style={styles.headerCenter}>
             <View style={[styles.leadTag, { backgroundColor: '#FEF3C7' }]}>
               <Text style={[styles.leadTagText, { color: '#B45309' }]}>HOT LEAD</Text>
             </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIcon}>
              <Phone size={20} color={tokens.colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <Video size={20} color={tokens.colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <FileText size={20} color={tokens.colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon} onPress={() => setShowCRM(true)}>
              <MoreVertical size={20} color={tokens.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Pipeline Stepper */}
        {associatedLead && (
          <View style={styles.stepperContainer}>
            <RNScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stepperScroll}>
              {PIPELINE_STAGES.map((status, index) => {
                const isActive = associatedLead?.status === status;
                const isPast = PIPELINE_STAGES.indexOf(associatedLead?.status) > index;
                return (
                  <View key={status} style={styles.stepWrapper}>
                    <TouchableOpacity 
                      onPress={() => handleStatusUpdate(status)}
                      style={[
                        styles.stepChip,
                        isActive && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                        isPast && { backgroundColor: '#F0FDFA', borderColor: theme.colors.primary },
                      ]}
                      disabled={updating}
                    >
                      <Text style={[
                        styles.stepText,
                        isActive && { color: '#FFF' },
                        isPast && { color: theme.colors.primary },
                      ]}>
                        {status.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                    {index < PIPELINE_STAGES.length - 1 && (
                      <View style={[styles.stepLine, isPast && { backgroundColor: theme.colors.primary }]} />
                    )}
                  </View>
                );
              })}
            </RNScrollView>
          </View>
        )}
      </Surface>

      {/* LAYER 2: Timeline */}
      <FlatList
        ref={flatListRef}
        data={currentMessages}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={({ item }) => {
          if (item.type === 'date') {
            return (
              <View style={styles.dateSeparator}>
                <View style={styles.dateLine} />
                <Text style={styles.dateText}>{item.text}</Text>
                <View style={styles.dateLine} />
              </View>
            );
          }
          return (
            <ChatBubble
              message={{
                id: item.id,
                text: item.text,
                timestamp: item.timestamp,
                isSender: item.sender === 'user',
                status: item.status as any,
                type: item.type as any,
                botOptions: item.botOptions,
              }}
            />
          );
        }}
        ListFooterComponent={
          sending ? <TypingIndicator /> : null
        }
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {/* LAYER 3: Composer */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <MessageInput 
          onSend={handleSend} 
          placeholder="Type a message..." 
        />
      </KeyboardAvoidingView>

      <Snackbar
        visible={showError}
        onDismiss={() => setShowError(false)}
        duration={5000}
        action={{ label: 'OK', onPress: () => setShowError(false) }}
        style={{ backgroundColor: '#B71C1C' }}
      >
        {errorMsg}
      </Snackbar>

      {/* Customer Sidebar / Details Modal */}
      <Modal
        visible={showCRM}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCRM(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCRM(false)} />
        <View style={[styles.leadPanel, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.panelHeader}>
            <Text style={{ fontSize: 18, fontWeight: '700' }}>Customer Details</Text>
            <IconButton icon="close" size={20} onPress={() => setShowCRM(false)} />
          </View>

          {!associatedLead ? (
            <Text style={styles.noLeadText}>No lead found for this contact.</Text>
          ) : (
            <RNScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalProfileRow}>
                 <AppAvatar name={name} size="large" />
                 <View style={{ marginLeft: 16 }}>
                   <Text style={{ fontSize: 18, fontWeight: '700' }}>{name}</Text>
                   <Text style={{ color: tokens.colors.textSecondary }}>+91 98765 43210</Text>
                   <Text style={{ color: tokens.colors.textSecondary }}>Source: WhatsApp</Text>
                 </View>
              </View>

              <Text style={styles.sectionLabel}>Status</Text>
              <RNScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {PIPELINE_STAGES.map(s => (
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
              </RNScrollView>

              {associatedLead.dealValue ? (
                <>
                  <Text style={styles.sectionLabel}>Deal</Text>
                  <Card style={styles.infoCard} elevation={0}>
                    <Card.Content>
                      {associatedLead.dealLabel ? (
                        <Text style={{ color: '#888', fontSize: 12 }}>{associatedLead.dealLabel}</Text>
                      ) : null}
                      <Text style={{ fontWeight: 'bold', fontSize: 24, marginTop: 4 }}>
                        ₹{Number(associatedLead.dealValue).toLocaleString('en-IN')}
                      </Text>
                    </Card.Content>
                  </Card>
                </>
              ) : null}

              <Text style={styles.sectionLabel}>
                Enquiries ({associatedLead.enquiries?.length ?? 0})
              </Text>
              {(associatedLead.enquiries?.length ?? 0) === 0 ? (
                <Text style={styles.emptyText}>No enquiries yet.</Text>
              ) : (
                associatedLead.enquiries.map((enq: any) => (
                  <View key={enq.id} style={styles.enquiryRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#333', fontSize: 13 }}>{enq.message}</Text>
                      <Text style={{ color: '#aaa', fontSize: 11, marginTop: 2 }}>
                        {enq.source} · {new Date(enq.createdAt).toLocaleDateString('en-IN')}
                      </Text>
                    </View>
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
  header: {
    paddingTop: tokens.spacing.xl, // Safe area equivalent
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: tokens.spacing.sm,
  },
  headerAvatar: {
    position: 'relative',
    marginRight: tokens.spacing.sm,
  },
  onlineStatusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: tokens.colors.success,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  headerTitleContainer: {
    justifyContent: 'center',
  },
  headerName: {
    fontSize: tokens.typography.titleMedium.fontSize,
    fontWeight: '600',
  },
  headerStatus: {
    fontSize: tokens.typography.labelSmall.fontSize,
    fontWeight: '500',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    display: 'flex', // Can be hidden on very small screens if needed
  },
  leadTag: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.borderRadius.sm,
  },
  leadTagText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  headerIcon: {
    padding: tokens.spacing.sm,
    marginLeft: tokens.spacing.xs,
  },
  stepperContainer: {
    paddingVertical: tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.borderLight,
    backgroundColor: '#FAFAFA',
  },
  stepperScroll: {
    paddingHorizontal: tokens.spacing.lg,
    alignItems: 'center',
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepChip: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 4,
    borderRadius: tokens.borderRadius.full,
  },
  stepText: {
    fontSize: 10,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  stepLine: {
    width: 24,
    height: 2,
    backgroundColor: tokens.colors.border,
    marginHorizontal: tokens.spacing.xs,
  },
  messageList: {
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.lg,
    paddingBottom: 24,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: tokens.spacing.xl,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: tokens.colors.borderLight,
  },
  dateText: {
    marginHorizontal: tokens.spacing.md,
    color: tokens.colors.textTertiary,
    fontSize: tokens.typography.labelMedium.fontSize,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  leadPanel: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
    elevation: 8,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
