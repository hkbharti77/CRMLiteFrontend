import React, { useEffect, useState, useMemo } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { useTheme } from 'react-native-paper';
import { MessageSquare } from 'lucide-react-native';
import { webChatApi } from '../../services/api';
import { ChatListItem } from './ChatListItem';
import { EmptyState } from '../global/EmptyState/EmptyState';

export function WebChatList({ navigation, searchQuery, activeFilter }: any) {
  const theme = useTheme();
  const [sessions, setSessions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSessions = async () => {
    try {
      const response = await webChatApi.getSessions();
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching web chat sessions:', error);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(() => {
      fetchSessions();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchSessions();
    setRefreshing(false);
  }, []);

  const filteredSessions = useMemo(() => {
    let filtered = sessions;
    if (searchQuery) {
      filtered = filtered.filter(s => (s.sessionId || '').toLowerCase().includes(searchQuery.toLowerCase()));
    }
    // Web chats don't have unread flag right now in backend, just show all.
    return filtered;
  }, [sessions, searchQuery, activeFilter]);

  return (
    <FlatList
      data={filteredSessions}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <ChatListItem
          chat={{
            id: item.id,
            contactName: item.sessionId.startsWith('anonymous') ? 'Anonymous Web User' : item.sessionId,
            lastMessage: 'Web chat session',
            timestamp: item.updatedAt || item.createdAt || '',
            unreadCount: 0,
            channel: 'web',
          }}
          onPress={() => navigation.navigate('ChatRoom', { chatId: item.id, name: item.sessionId, isWebChat: true })}
        />
      )}
      ListEmptyComponent={
        <EmptyState 
          title="No web conversations yet" 
          description="New web widget messages will appear here." 
          icon={<MessageSquare size={32} color={theme.colors.primary} />}
          actionLabel="Refresh"
          onAction={onRefresh}
        />
      }
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 100, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
    />
  );
}
