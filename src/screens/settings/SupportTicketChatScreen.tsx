import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { Appbar, ActivityIndicator, Snackbar, Chip } from 'react-native-paper';
import { Send, User, Shield } from 'lucide-react-native';
import { userApi } from '../../services/api';

interface Message {
  id: string;
  senderType: string;
  senderEmail: string;
  message: string;
  createdAt: string;
}

export default function SupportTicketChatScreen({ route, navigation }: any) {
  const { ticketId, ticketTitle, ticketStatus } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await userApi.getPlatformTicketMessages(ticketId);
      setMessages(res.data);
    } catch (e) {
      setSnackbarMsg('Failed to load messages');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    try {
      setSending(true);
      await userApi.sendPlatformTicketMessage(ticketId, inputText.trim());
      setInputText('');
      await fetchMessages();
    } catch (e) {
      setSnackbarMsg('Failed to send message');
      setSnackbarVisible(true);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isTenant = item.senderType === 'TENANT';
    
    return (
      <View style={[styles.messageRow, isTenant ? styles.messageRowRight : styles.messageRowLeft]}>
        {!isTenant && (
          <View style={styles.avatarLeft}>
            <Shield size={16} color="#fff" />
          </View>
        )}
        
        <View style={[styles.messageBubble, isTenant ? styles.messageBubbleRight : styles.messageBubbleLeft]}>
          <Text style={styles.messageEmail}>{item.senderEmail}</Text>
          <Text style={[styles.messageText, isTenant ? styles.messageTextRight : styles.messageTextLeft]}>
            {item.message}
          </Text>
          <Text style={styles.messageTime}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#fff" />
        <Appbar.Content 
          title={ticketTitle} 
          subtitle={ticketStatus} 
          titleStyle={{ color: '#fff', fontSize: 16 }} 
          subtitleStyle={{ color: 'rgba(255,255,255,0.8)' }}
        />
      </Appbar.Header>

      {loading && messages.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#075E54" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
            </View>
          }
        />
      )}

      {ticketStatus !== 'RESOLVED' ? (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.resolvedContainer}>
          <Text style={styles.resolvedText}>This ticket has been resolved.</Text>
        </View>
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMsg}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ece5dd', // WhatsApp-like background
  },
  header: {
    backgroundColor: '#075E54',
  },
  list: {
    padding: 16,
    paddingBottom: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  avatarLeft: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#075E54',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    elevation: 1,
  },
  messageBubbleLeft: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 0,
  },
  messageBubbleRight: {
    backgroundColor: '#e2ffc7',
    borderBottomRightRadius: 0,
  },
  messageEmail: {
    fontSize: 10,
    color: '#075E54',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  messageText: {
    fontSize: 15,
  },
  messageTextLeft: {
    color: '#333',
  },
  messageTextRight: {
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 40,
    maxHeight: 120,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#075E54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#999',
  },
  resolvedContainer: {
    padding: 16,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
  },
  resolvedText: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
});
