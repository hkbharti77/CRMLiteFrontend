import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Text, Surface, useTheme, Avatar, IconButton, FAB, List, Card, Divider } from 'react-native-paper';
import { useAuthStore } from '../store/useAuthStore';
import { useLeadStore } from '../store/useLeadStore';
import { crmApi, messageApi, appointmentApi } from '../services/api';

export default function DashboardScreen({ navigation }: any) {
  const theme = useTheme();
  const { businessName, userToken } = useAuthStore();
  const { leads, setLeads, isLoading: leadsLoading } = useLeadStore();
  const [recentActivity, setRecentActivity] = React.useState<any[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [remindersCount, setRemindersCount] = React.useState(0);
  const [todayAppointments, setTodayAppointments] = React.useState<any[]>([]);
  const [revenueReport, setRevenueReport] = React.useState<any>(null);

  const fetchData = async () => {
    if (!userToken) return;
    try {
      // Fetch leads for stats
      const leadsRes = await crmApi.getLeads();
      const mappedLeads = leadsRes.data.map((item: any) => ({
        id: item.id,
        contactId: item.contact?.id,
        name: item.contact?.name || item.contact?.waId || 'Unknown Lead',
        lastMessage: item.notes || 'New lead created',
        time: item.lastActivity ? new Date(item.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---',
        status: item.status,
        notes: item.notes
      }));
      setLeads(mappedLeads);

      // Fetch chats for recent activity
      const chatsRes = await messageApi.getChats();
      setRecentActivity(chatsRes.data.slice(0, 5));

      // Fetch reminders count
      const remindersRes = await crmApi.getPendingReminders();
      setRemindersCount(remindersRes.data.length);

      // Fetch today's appointments
      try {
        const todayRes = await appointmentApi.getToday();
        setTodayAppointments(todayRes.data);
      } catch (e) {
        console.log('Error fetching today appointments');
      }

      // Fetch revenue report
      try {
        const revenueRes = await crmApi.getRevenueReport();
        setRevenueReport(revenueRes.data);
      } catch (e) {
        console.log('Error fetching revenue report');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const stats = [
    { 
      label: 'Leads Total', 
      value: leads.length.toString(), 
      icon: 'account-plus', 
      color: '#2196F3' 
    },
    { 
      label: 'Pending', 
      value: remindersCount.toString(), 
      icon: 'clock-outline', 
      color: '#FF9800' 
    },
    { 
      label: 'Today Meets', 
      value: todayAppointments.length.toString(), 
      icon: 'calendar-check', 
      color: '#9C27B0' 
    },
    { 
      label: 'Closed', 
      value: leads.filter(l => l.status === 'CLOSED_WON' || l.status === 'CLOSED_LOST').length.toString(), 
      icon: 'check-circle-outline', 
      color: '#4CAF50' 
    },
  ];

  const displayActivity = recentActivity;

  return (
    <View style={styles.container}>
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        <View 
          style={[styles.header, { backgroundColor: theme.colors.primary }]}
        >
          <View style={styles.headerTop}>
            <View>
              <Text variant="titleMedium" style={styles.welcomeText}>Welcome back,</Text>
              <Text variant="headlineSmall" style={styles.businessName}>{businessName || 'My Business'}</Text>
            </View>
            <Avatar.Icon size={48} icon="store" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} color="#fff" />
          </View>
        </View>

        <View style={styles.statsRow}>
          {stats.map((stat, index) => (
            <Surface key={index} style={styles.statCard} elevation={1}>
              <IconButton icon={stat.icon} iconColor={stat.color} size={20} style={styles.statIcon} />
              <Text variant="headlineSmall" style={styles.statValue}>{stat.value}</Text>
              <Text variant="labelSmall" style={styles.statLabel}>{stat.label}</Text>
            </Surface>
          ))}
        </View>

        {/* ── Revenue Summary ──────────────────────────────────────────── */}
        {revenueReport && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { marginBottom: 10 }]}>
              💰 Revenue Summary
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Surface style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderLeftWidth: 4, borderLeftColor: '#2196F3' }} elevation={1}>
                <Text variant="labelSmall" style={{ color: '#888' }}>Pipeline</Text>
                <Text variant="titleSmall" style={{ fontWeight: 'bold', color: '#1565C0', marginTop: 4 }}>
                  ₹{Number(revenueReport.totalPipelineValue || 0).toLocaleString('en-IN')}
                </Text>
              </Surface>
              <Surface style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderLeftWidth: 4, borderLeftColor: '#4CAF50' }} elevation={1}>
                <Text variant="labelSmall" style={{ color: '#888' }}>Received</Text>
                <Text variant="titleSmall" style={{ fontWeight: 'bold', color: '#2E7D32', marginTop: 4 }}>
                  ₹{Number(revenueReport.receivedRevenue || 0).toLocaleString('en-IN')}
                </Text>
              </Surface>
              <Surface style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderLeftWidth: 4, borderLeftColor: '#FF9800' }} elevation={1}>
                <Text variant="labelSmall" style={{ color: '#888' }}>Pending</Text>
                <Text variant="titleSmall" style={{ fontWeight: 'bold', color: '#E65100', marginTop: 4 }}>
                  ₹{Number(revenueReport.pendingRevenue || 0).toLocaleString('en-IN')}
                </Text>
              </Surface>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Recent Activity</Text>
            <IconButton icon="arrow-right" onPress={() => navigation.navigate('Inbox')} />
          </View>

          {leadsLoading && !refreshing ? (
            <ActivityIndicator style={{ marginTop: 20 }} />
          ) : (
            <Card style={styles.activityCard} elevation={0}>
              {displayActivity.length > 0 ? (
                displayActivity.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <List.Item
                      title={activity.name || 'Unknown'}
                      description={activity.lastMessage || 'No messages'}
                      left={props => (
                        <Avatar.Text 
                          size={40} 
                          label={(activity.name || '??').substring(0, 2).toUpperCase()} 
                          style={{ backgroundColor: theme.colors.primaryContainer }} 
                        />
                      )}
                      right={props => <Text style={styles.timeText}>{(activity.time || '').split('T')[0] || ''}</Text>}
                      onPress={() => navigation.navigate('ChatRoom', { chatId: activity.id, name: activity.name || 'Unknown' })}
                    />
                    {index < displayActivity.length - 1 && <Divider horizontalInset />}
                  </React.Fragment>
                ))
              ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text variant="bodyMedium">No recent activity</Text>
                </View>
              )}
            </Card>
          )}
        </View>
        
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Pipeline Status</Text>
          <Surface style={styles.chartPlaceholder} elevation={1}>
            <Text variant="bodyMedium" style={{ color: '#666' }}>
              {leads.length > 0 ? `Tracking ${leads.length} leads in pipeline` : 'Start adding leads to see visualization'}
            </Text>
          </Surface>
        </View>

        {/* ── Today's Appointments Widget ─────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>📅 Today's Appointments</Text>
            <IconButton icon="arrow-right" onPress={() => navigation.navigate('Booking')} />
          </View>
          <Card style={{ backgroundColor: '#fff', borderRadius: 16 }} elevation={0}>
            {todayAppointments.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text variant="bodyMedium" style={{ color: '#999' }}>No meetings today 🎉</Text>
              </View>
            ) : (
              todayAppointments.slice(0, 3).map((appt: any, idx: number) => (
                <React.Fragment key={appt.id}>
                  <List.Item
                    title={appt.title || 'Meeting'}
                    description={`${appt.contactName || 'Client'} · ${appt.appointmentDateTime ? new Date(appt.appointmentDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '---'}`}
                    left={() => (
                      <Avatar.Icon
                        size={40}
                        icon="calendar-clock"
                        style={{ backgroundColor: '#EDE7F6', marginLeft: 8 }}
                        color="#7B1FA2"
                      />
                    )}
                    onPress={() => navigation.navigate('Booking')}
                  />
                  {idx < todayAppointments.slice(0, 3).length - 1 && <Divider horizontalInset />}
                </React.Fragment>
              ))
            )}
          </Card>
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        label="Add Lead"
        style={[styles.fab, { backgroundColor: theme.colors.secondary }]}
        onPress={() => console.log('Add Lead')}
        color="#fff"
      />
    </View>
  );
}

// Subcomponents mocks for layout
const LinearGradient = ({ children, style }: any) => (
  <View style={[style, { padding: 24 }]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingBottom: 60,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.7)',
  },
  businessName: {
    color: '#fff',
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: -40,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 6,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  statIcon: {
    margin: 0,
    backgroundColor: '#F0F2F5',
  },
  statValue: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    color: '#666',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
  },
  chartPlaceholder: {
    height: 150,
    backgroundColor: '#fff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 16,
    borderRadius: 28,
  },
});

