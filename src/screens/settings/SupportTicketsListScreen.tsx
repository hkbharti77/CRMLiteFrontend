import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text } from 'react-native';
import { Button, Appbar, ActivityIndicator, Snackbar, Chip } from 'react-native-paper';
import { Plus, MessageSquare } from 'lucide-react-native';
import { userApi } from '../../services/api';
import { SupportTicketModal } from '../../components/modals/SupportTicketModal';

interface Ticket {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

export default function SupportTicketsListScreen({ navigation }: any) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await userApi.getPlatformTickets();
      setTickets(res.data);
    } catch (e) {
      setSnackbarMsg('Failed to load tickets');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Ticket }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('SupportTicketChat', { ticketId: item.id, ticketTitle: item.title, ticketStatus: item.status })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Chip
          style={[
            styles.chip,
            item.status === 'RESOLVED' ? { backgroundColor: '#e8f5e9' } : 
            item.status === 'IN_PROGRESS' ? { backgroundColor: '#fff3e0' } : 
            { backgroundColor: '#ffebee' }
          ]}
          textStyle={[
            styles.chipText,
            item.status === 'RESOLVED' ? { color: '#2e7d32' } : 
            item.status === 'IN_PROGRESS' ? { color: '#ef6c00' } : 
            { color: '#c62828' }
          ]}
        >
          {item.status}
        </Chip>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        <MessageSquare size={16} color="#666" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#fff" />
        <Appbar.Content title="Support Tickets" titleStyle={{ color: '#fff' }} />
      </Appbar.Header>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#075E54" />
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No support tickets found.</Text>
            </View>
          }
        />
      )}

      <View style={styles.fabContainer}>
        <Button
          mode="contained"
          icon={() => <Plus size={20} color="#fff" />}
          onPress={() => setModalVisible(true)}
          style={styles.fab}
        >
          New Ticket
        </Button>
      </View>

      <SupportTicketModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          fetchTickets();
        }}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMsg}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#075E54',
  },
  list: {
    padding: 16,
    paddingBottom: 80,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
    color: '#333',
  },
  chip: {
    height: 24,
  },
  chipText: {
    fontSize: 10,
    marginTop: -2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#888',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  fab: {
    backgroundColor: '#075E54',
    paddingVertical: 4,
  },
});
