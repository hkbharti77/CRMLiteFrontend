import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text, ScrollView, TouchableOpacity } from 'react-native';
import { FAB, useTheme, Badge } from 'react-native-paper';
import { Search, Filter, MoreVertical, MessageSquare } from 'lucide-react-native';
import { useChatStore } from '../store/useChatStore';
import { messageApi } from '../services/api';
import { tokens } from '@theme/tokens';

import { AppSearchBar } from '@components/global/SearchBar/AppSearchBar';
import { ChatListItem } from '@components/chat/ChatListItem';
import { EmptyState } from '@components/global/EmptyState/EmptyState';

const FILTERS = ['All', 'Unread', 'Assigned', 'Resolved', 'Today'];

export default function ChatListScreen({ navigation }: any) {
  const theme = useTheme();
  const { chats, setChats } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [showSearch, setShowSearch] = useState(false);

  const fetchChats = async () => {
    try {
      const response = await messageApi.getChats();
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  useEffect(() => {
    fetchChats();

    const interval = setInterval(() => {
      fetchChats();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchChats();
    setRefreshing(false);
  }, []);

  const filteredChats = useMemo(() => {
    let filtered = chats;
    if (searchQuery) {
      filtered = filtered.filter(c => (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (activeFilter === 'Unread') {
      filtered = filtered.filter(c => c.unread > 0);
    }
    // Implement other filters as needed
    return filtered;
  }, [chats, searchQuery, activeFilter]);

  const totalUnread = useMemo(() => chats.reduce((acc, curr) => acc + (curr.unread || 0), 0), [chats]);

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.backgroundDark }]}>
      {/* Premium Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: tokens.colors.border }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>Inbox</Text>
            {totalUnread > 0 && (
              <Badge style={[styles.headerBadge, { backgroundColor: theme.colors.primary }]}>
                {totalUnread}
              </Badge>
            )}
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setShowSearch(!showSearch)} style={styles.iconButton}>
              <Search size={22} color={tokens.colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Filter size={22} color={tokens.colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <MoreVertical size={22} color={tokens.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Search Bar (Collapsible) */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <AppSearchBar
              placeholder="Search conversations..."
              onChangeText={setSearchQuery}
              value={searchQuery}
            />
          </View>
        )}

        {/* Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterScroll}
          contentContainerStyle={styles.filterScrollContent}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                { 
                  backgroundColor: activeFilter === filter ? theme.colors.primary : tokens.colors.background,
                  borderColor: activeFilter === filter ? theme.colors.primary : tokens.colors.border
                }
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text 
                style={[
                  styles.filterText, 
                  { color: activeFilter === filter ? '#FFFFFF' : tokens.colors.textSecondary }
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Conversation List */}
      <FlatList
        data={filteredChats}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ChatListItem
            chat={{
              id: item.id,
              contactName: item.name || 'Unknown',
              lastMessage: item.lastMessage || '',
              timestamp: item.time || '',
              unreadCount: item.unread,
              // channel mock for showcase
              channel: Math.random() > 0.5 ? 'whatsapp' : 'web',
            }}
            onPress={() => navigation.navigate('ChatRoom', { chatId: item.id, name: item.name || 'Unknown' })}
          />
        )}
        ListEmptyComponent={
          <EmptyState 
            title="No conversations yet" 
            description="New customer messages will appear here." 
            icon={<MessageSquare size={32} color={theme.colors.primary} />}
            actionLabel="Start Conversation"
            onAction={() => console.log('Start Conversation')}
          />
        }
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
      />
      
      {/* Extended FAB */}
      <FAB
        icon="message-plus"
        label="New Conversation"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => console.log('New chat')}
        color="#FFFFFF"
        customSize={56}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: tokens.spacing.xl, // Assume safe area padding
    borderBottomWidth: 1,
    ...tokens.shadows.sm,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: tokens.typography.headlineLarge.fontSize,
    fontWeight: tokens.typography.headlineLarge.fontWeight as any,
    letterSpacing: -0.5,
  },
  headerBadge: {
    marginLeft: tokens.spacing.sm,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: tokens.spacing.sm,
    marginLeft: tokens.spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md,
  },
  filterScroll: {
    maxHeight: 50,
  },
  filterScrollContent: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.xs + 2,
    borderRadius: tokens.borderRadius.full,
    borderWidth: 1,
    marginRight: tokens.spacing.sm,
  },
  filterText: {
    fontSize: tokens.typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  listContent: {
    paddingTop: tokens.spacing.md,
    paddingBottom: 100,
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    margin: tokens.spacing.lg,
    right: 0,
    bottom: tokens.spacing.xxl, // Elevated above bottom nav
    borderRadius: tokens.borderRadius.full,
    ...tokens.shadows.lg,
  },
});
