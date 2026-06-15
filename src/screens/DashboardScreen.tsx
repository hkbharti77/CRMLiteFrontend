import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Animated, TouchableOpacity, SafeAreaView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { ArrowRight, Users, AlertCircle, Calendar, CheckCircle, Inbox, BarChart2, Circle } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useLeadStore } from '../store/useLeadStore';
import { useTicketStore } from '../store/useTicketStore';
import { crmApi, messageApi, appointmentApi, bookingApi } from '../services/api';
import { tokens } from '../theme/tokens';
import { spacing } from '../theme';
import { ScreenHeader } from '@components/global/Header/ScreenHeader';
import { EmptyState } from '@components/global/EmptyState/EmptyState';
import { AppCard } from '@components/global/Card/AppCard';
import { AppointmentCard } from '@components/booking/AppointmentCard';

export interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, icon, trend }) => {
  return (
    <AppCard style={kpiStyles.container} elevation="sm">
      <View style={kpiStyles.header}>
        <Text style={[kpiStyles.title, { color: tokens.colors.textSecondary }]}>{title}</Text>
        <View style={kpiStyles.iconContainer}>{icon}</View>
      </View>
      <View style={kpiStyles.content}>
        <Text style={[kpiStyles.value, { color: tokens.colors.textPrimary }]}>{value}</Text>
        {trend && (
          <Text style={[kpiStyles.trend, { color: trend.isPositive ? tokens.colors.success : tokens.colors.error }]}>
            {trend.isPositive ? '+' : '-'}{trend.value}%
          </Text>
        )}
      </View>
    </AppCard>
  );
};

const kpiStyles = StyleSheet.create({
  container: {
    width: '48%',
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  title: {
    fontSize: tokens.typography.labelSmall.fontSize,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  iconContainer: {
    padding: 4,
    borderRadius: tokens.borderRadius.sm,
    backgroundColor: tokens.colors.backgroundDark,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: tokens.typography.headlineMedium.fontSize,
    fontWeight: tokens.typography.headlineMedium.fontWeight as any,
  },
  trend: {
    fontSize: tokens.typography.labelSmall.fontSize,
    fontWeight: 'bold',
  },
});

export interface PipelineStageProps {
  stageName: string;
  count: number;
  value: number;
  color: string;
}

export const PipelineStage: React.FC<PipelineStageProps> = ({ stageName, count, value, color }) => {
  return (
    <View style={pipelineStyles.container}>
      <View style={pipelineStyles.header}>
        <View style={pipelineStyles.labelContainer}>
          <View style={[pipelineStyles.dot, { backgroundColor: color }]} />
          <Text style={[pipelineStyles.stageName, { color: tokens.colors.textPrimary }]}>{stageName}</Text>
        </View>
        <Text style={[pipelineStyles.count, { color: tokens.colors.textSecondary }]}>{count} Leads</Text>
      </View>
      <View style={[pipelineStyles.track, { backgroundColor: tokens.colors.backgroundDark }]}>
        <View style={[pipelineStyles.fill, { backgroundColor: color, width: '50%' }]} />
      </View>
    </View>
  );
};

const pipelineStyles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: tokens.spacing.sm,
  },
  stageName: {
    fontSize: tokens.typography.bodyMedium.fontSize,
    fontWeight: '500',
  },
  count: {
    fontSize: tokens.typography.labelSmall.fontSize,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});

export interface RevenueChartProps {
  title?: string;
  data?: any[];
  style?: any;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ title = 'Revenue', style }) => {
  return (
    <AppCard style={[revenueStyles.container, style]} elevation="sm">
      <Text style={[revenueStyles.title, { color: tokens.colors.textPrimary }]}>{title}</Text>
      <View style={[revenueStyles.placeholder, { backgroundColor: tokens.colors.backgroundDark }]}>
        <BarChart2 size={48} color={tokens.colors.border} />
        <Text style={[revenueStyles.placeholderText, { color: tokens.colors.textTertiary }]}>
          Chart Data Visualization
        </Text>
      </View>
    </AppCard>
  );
};

const revenueStyles = StyleSheet.create({
  container: {
    padding: tokens.spacing.md,
    marginVertical: tokens.spacing.sm,
  },
  title: {
    fontSize: tokens.typography.titleMedium.fontSize,
    fontWeight: tokens.typography.titleMedium.fontWeight as any,
    marginBottom: tokens.spacing.md,
  },
  placeholder: {
    height: 200,
    borderRadius: tokens.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: tokens.colors.border,
  },
  placeholderText: {
    marginTop: tokens.spacing.md,
    fontSize: tokens.typography.bodyMedium.fontSize,
  },
});

export interface ActivityItemProps {
  activity: {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type?: 'call' | 'email' | 'meeting' | 'note' | 'system';
  };
  style?: any;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity, style }) => {
  const theme = useTheme();

  return (
    <View style={[activityStyles.container, style]}>
      <View style={activityStyles.iconContainer}>
        <Circle size={10} color={theme.colors.primary} fill={theme.colors.primary} />
      </View>
      <View style={activityStyles.content}>
        <Text style={[activityStyles.title, { color: theme.colors.onSurface }]} numberOfLines={1}>
          {activity.title}
        </Text>
        <Text style={[activityStyles.description, { color: tokens.colors.textSecondary }]} numberOfLines={2}>
          {activity.description}
        </Text>
      </View>
      <Text style={[activityStyles.time, { color: tokens.colors.textTertiary }]}>{activity.timestamp}</Text>
    </View>
  );
};

const activityStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.borderLight,
  },
  iconContainer: {
    marginTop: 6,
    marginRight: tokens.spacing.sm,
  },
  content: {
    flex: 1,
    marginRight: tokens.spacing.sm,
  },
  title: {
    fontSize: tokens.typography.bodyMedium.fontSize,
    fontWeight: '600',
    marginBottom: 2,
  },
  description: {
    fontSize: tokens.typography.bodySmall.fontSize,
    lineHeight: 18,
  },
  time: {
    fontSize: tokens.typography.labelSmall.fontSize,
  },
});

export default function DashboardScreen({ navigation }: any) {
  const theme = useTheme();
  const { businessName, userToken, flowType, forceShowBooking, forceShowAppointment, forceShowLeads } = useAuthStore();
  const { leads, setLeads, isLoading: leadsLoading } = useLeadStore();
  const { stats: ticketStats, fetchTickets } = useTicketStore();

  const isLeadNiche = flowType === 'LEAD';
  const isAppointmentNiche = flowType === 'APPOINTMENT';
  const isBookingNiche = flowType === 'BOOKING';

  const shouldShowLeads = forceShowLeads !== null ? forceShowLeads : isLeadNiche;
  const shouldShowAppointments = forceShowAppointment !== null ? forceShowAppointment : isAppointmentNiche;
  const shouldShowBooking = forceShowBooking !== null ? forceShowBooking : isBookingNiche;
  const shouldShowMeetings = shouldShowAppointments || shouldShowBooking;

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [revenueReport, setRevenueReport] = useState<any>(null);
  const [greeting, setGreeting] = useState('Good Morning');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchData();
    triggerEntryAnimation();
    updateGreeting();
  }, []);

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  };

  const triggerEntryAnimation = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

  const fetchData = async () => {
    if (!userToken) return;
    try {
      const leadsRes = await crmApi.getLeads();
      const mappedLeads = leadsRes.data.map((item: any) => ({
        id: item.id,
        contactId: item.contact?.id,
        name: item.contact?.name || item.contact?.waId || 'Unknown Lead',
        lastMessage: item.notes || 'New lead created',
        time: item.lastActivity
          ? new Date(item.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '---',
        status: item.status,
        notes: item.notes,
      }));
      setLeads(mappedLeads);

      const chatsRes = await messageApi.getChats();
      const activities = (chatsRes.data || []).slice(0, 6).map((chat: any) => ({
        id: chat.id,
        title: chat.name || 'Unknown',
        description: chat.lastMessage || 'New conversation',
        timestamp: new Date(chat.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'message',
      }));
      setRecentActivity(activities);

      try {
        if (shouldShowAppointments) {
          const todayRes = await appointmentApi.getToday();
          setTodayAppointments(todayRes.data || []);
        } else if (shouldShowBooking) {
          const bookingsRes = await bookingApi.getByStatus('CONFIRMED');
          setTodayAppointments(bookingsRes.data || []);
        }
      } catch (e) {
        console.warn('Appointments/Bookings not available', e);
      }

      try {
        const revenueRes = await crmApi.getRevenueReport();
        setRevenueReport(revenueRes.data);
      } catch (e) {
        console.warn('Revenue report not available', e);
      }

      try {
        await fetchTickets();
      } catch (e) {
        console.warn('Tickets not available', e);
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const stats = {
    leads: leads.length,
    openTickets: ticketStats?.openTickets || 0,
    todayMeetings: todayAppointments.length,
    closedLeads: leads.filter((l) => l.status === 'CLOSED_WON' || l.status === 'CLOSED_LOST').length,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View style={[{ flex: 1, opacity: fadeAnim }]}>
        <ScreenHeader 
          title={`👋 ${greeting}, ${(businessName || 'there').split(' ')[0]}`}
          onBack={() => navigation.goBack()}
        />
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <View style={styles.kpiRow}>
              <KPICard title="Total Leads" value={stats.leads} icon={<Users size={20} color="#0EA5E9" />} trend={{value: 12, isPositive: true}} />
              <KPICard title="Open Tickets" value={stats.openTickets} icon={<AlertCircle size={20} color="#EF4444" />} trend={{value: 2, isPositive: false}} />
            </View>
            <View style={styles.kpiRow}>
              <KPICard title="Today Meetings" value={stats.todayMeetings} icon={<Calendar size={20} color="#A855F7" />} />
              <KPICard title="Closed Leads" value={stats.closedLeads} icon={<CheckCircle size={20} color="#10B981" />} />
            </View>
          </View>

          {revenueReport && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Revenue Overview</Text>
              <RevenueChart data={revenueReport} />
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Pipeline Progress</Text>
            <View style={styles.pipelineContainer}>
               <PipelineStage stageName="New" count={leads.filter(l => l.status === 'NEW' as any).length} value={0} color="#94A3B8" />
               <PipelineStage stageName="Qualified" count={leads.filter(l => l.status === 'QUALIFIED' as any).length} value={0} color="#0EA5E9" />
               <PipelineStage stageName="Negotiation" count={leads.filter(l => l.status === 'NEGOTIATION' as any).length} value={0} color="#F59E0B" />
               <PipelineStage stageName="Won" count={leads.filter(l => l.status === 'CLOSED_WON').length} value={0} color="#10B981" />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Recent Activity</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ChatList')}>
                <ArrowRight size={18} color={theme.colors.primary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            {leadsLoading && !refreshing ? (
              <ActivityIndicator style={{ marginVertical: tokens.spacing.lg }} size="large" />
            ) : recentActivity.length > 0 ? (
              <View style={[styles.cardContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
                {recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </View>
            ) : (
              <EmptyState title="No recent activity" description="You have no recent activity." icon={<Inbox size={48} color={theme.colors.onSurfaceVariant} />} />
            )}
          </View>

          {shouldShowMeetings && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                  {shouldShowAppointments ? "Today's Appointments" : "Recent Bookings"}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate(shouldShowAppointments ? 'Appointments' : 'Booking')}>
                  <ArrowRight size={18} color={theme.colors.primary} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              
              {todayAppointments.length > 0 ? (
                <View style={styles.appointmentsContainer}>
                  {todayAppointments.slice(0, 3).map((appt) => {
                    const isBooking = !appt.appointmentDateTime;
                    return (
                      <AppointmentCard
                        key={appt.id}
                        appointment={{
                          id: appt.id,
                          title: isBooking ? appt.service : (appt.title || 'Meeting'),
                          date: isBooking 
                            ? (appt.createdAt ? new Date(appt.createdAt).toLocaleDateString() : 'Today') 
                            : (appt.appointmentDateTime ? new Date(appt.appointmentDateTime).toLocaleDateString() : 'Today'),
                          time: isBooking
                            ? (appt.preferredSlot || '---')
                            : (appt.appointmentDateTime ? new Date(appt.appointmentDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'),
                          locationType: 'video',
                          contactName: appt.contactName || 'Client',
                          status: appt.status?.toLowerCase() || 'scheduled'
                        }}
                        onPress={() => navigation.navigate(shouldShowAppointments ? 'Appointments' : 'Booking')}
                      />
                    );
                  })}
                </View>
              ) : (
                <EmptyState 
                  title={shouldShowAppointments ? "No meetings today" : "No recent bookings"} 
                  description="You're all caught up!" 
                  icon={<Calendar size={48} color={theme.colors.onSurfaceVariant} />} 
                />
              )}
            </View>
          )}

          <View style={{ height: spacing.xxxl }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: tokens.spacing.xl,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: tokens.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  section: {
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  sectionTitle: {
    fontSize: tokens.typography.titleMedium.fontSize,
    fontWeight: 'bold',
    marginBottom: tokens.spacing.sm,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pipelineContainer: {
    marginTop: tokens.spacing.sm,
  },
  cardContainer: {
    borderRadius: tokens.borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  appointmentsContainer: {
    gap: tokens.spacing.md,
  },
});
