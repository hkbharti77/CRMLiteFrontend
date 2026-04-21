import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { List, Avatar, Text, FAB, Searchbar, Badge, useTheme, Divider } from 'react-native-paper';
import { useChatStore } from '../store/useChatStore';
import { messageApi } from '../services/api';
import { crmApi } from '../services/api';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'NEW': return '#2196F3';
    case 'INTERESTED': return '#FFC107';
    case 'FOLLOW_UP': return '#FF9800';
    case 'CLOSED': return '#4CAF50';
    default: return '#9E9E9E';
  }
};

export default function ChatListScreen({ navigation }: any) {
  const theme = useTheme();
  const { chats, isLoading, setChats } = useChatStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [refreshing, setRefreshing] = React.useState(false);

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

    // ── Polling for New Chats/Messages in List ─────────────────────
    const interval = setInterval(() => {
      fetchChats();
    }, 10000); // 10 seconds poll for the list

    return () => clearInterval(interval);
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchChats();
    setRefreshing(false);
  }, []);

  const renderItem = ({ item }: any) => (
    <List.Item
      title={item.name}
      titleStyle={styles.chatName}
      description={item.lastMessage}
      descriptionStyle={styles.lastMessage}
      left={props => (
        <View style={styles.avatarContainer}>
          <Avatar.Text 
            size={52} 
            label={(item.name || '??').substring(0, 2).toUpperCase()} 
            style={{ backgroundColor: theme.colors.primaryContainer }} 
            labelStyle={{ color: theme.colors.primary }}
          />
          {item.unread > 0 && <Badge style={styles.badge}>{item.unread}</Badge>}
        </View>
      )}
      right={props => (
        <View style={styles.rightContainer}>
          <Text style={[styles.time, { color: theme.colors.primary }]}>{item.time}</Text>
          <View style={[styles.statusTag, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      )}
      onPress={() => navigation.navigate('ChatRoom', { chatId: item.id, name: item.name || 'Unknown' })}
      style={styles.listItem}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Search contacts..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        elevation={0}
      />
      <FlatList
        data={chats.filter(c => (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()))}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <Divider horizontalInset />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
      <FAB
        icon="message-plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => console.log('New chat')}
        color="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  listContent: {
    paddingBottom: 80,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flexGrow: 1,
  },
  listItem: {
    paddingVertical: 12,
  },
  chatName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  avatarContainer: {
    marginLeft: 16,
    marginRight: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#25D366',
    borderWidth: 2,
    borderColor: '#fff',
  },
  rightContainer: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginRight: 16,
    paddingVertical: 4,
  },
  time: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
});
