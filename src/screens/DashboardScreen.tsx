import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Animated, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Text, useTheme, Menu, ActivityIndicator } from 'react-native-paper';
import { ArrowRight, Users, AlertCircle, Calendar, CheckCircle, Inbox, Download, MoreVertical } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '../store/useAuthStore';
import { dashboardApi } from '../services/api';
import { tokens } from '../theme/tokens';
import { spacing } from '../theme';
import { ScreenHeader } from '@components/global/Header/ScreenHeader';
import { EmptyState } from '@components/global/EmptyState/EmptyState';
import { AppCard } from '@components/global/Card/AppCard';
import { AppointmentCard } from '@components/booking/AppointmentCard';

const { width } = Dimensions.get('window');

// ── SKELETON LOADER ─────────────────────────────────────────────────────────
const DashboardSkeleton = () => {
  const theme = useTheme();
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const skeletonColor = theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  return (
    <View style={{ padding: tokens.spacing.lg }}>
      <Animated.View style={{ opacity: anim }}>
        {/* KPI Row 1 */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: tokens.spacing.md }}>
          <View style={{ width: '48%', height: 90, backgroundColor: skeletonColor, borderRadius: tokens.borderRadius.lg }} />
          <View style={{ width: '48%', height: 90, backgroundColor: skeletonColor, borderRadius: tokens.borderRadius.lg }} />
        </View>
        {/* KPI Row 2 */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: tokens.spacing.xl }}>
          <View style={{ width: '48%', height: 90, backgroundColor: skeletonColor, borderRadius: tokens.borderRadius.lg }} />
          <View style={{ width: '48%', height: 90, backgroundColor: skeletonColor, borderRadius: tokens.borderRadius.lg }} />
        </View>
        {/* Chart Skeleton */}
        <View style={{ height: 200, backgroundColor: skeletonColor, borderRadius: tokens.borderRadius.lg, marginBottom: tokens.spacing.xl }} />
        {/* List Skeleton */}
        <View style={{ height: 60, backgroundColor: skeletonColor, borderRadius: tokens.borderRadius.md, marginBottom: tokens.spacing.md }} />
        <View style={{ height: 60, backgroundColor: skeletonColor, borderRadius: tokens.borderRadius.md, marginBottom: tokens.spacing.md }} />
        <View style={{ height: 60, backgroundColor: skeletonColor, borderRadius: tokens.borderRadius.md }} />
      </Animated.View>
    </View>
  );
};

// ── COMPONENTS ─────────────────────────────────────────────────────────────

export const KPICard = ({ title, value, icon, bgOpacity = '10', color = tokens.colors.primary }) => {
  const theme = useTheme();
  return (
    <View style={[
      kpiStyles.container, 
      { 
        backgroundColor: theme.dark ? 'rgba(255,255,255,0.03)' : tokens.colors.surface,
        borderColor: theme.dark ? 'rgba(255,255,255,0.05)' : tokens.colors.borderLight,
        borderWidth: 1,
      }
    ]}>
      <View style={kpiStyles.header}>
        <Text style={[kpiStyles.title, { color: tokens.colors.textSecondary }]}>{title}</Text>
        <View style={[kpiStyles.iconContainer, { backgroundColor: `${color}20` }]}>
          {icon}
        </View>
      </View>
      <View style={kpiStyles.content}>
        <Text style={[kpiStyles.value, { color: theme.colors.onSurface }]}>{value}</Text>
      </View>
    </View>
  );
};

const kpiStyles = StyleSheet.create({
  container: {
    width: '48%',
    padding: tokens.spacing.lg,
    borderRadius: tokens.borderRadius.xl,
    marginBottom: tokens.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  title: {
    fontSize: tokens.typography.labelMedium.fontSize,
    fontWeight: '600',
  },
  iconContainer: {
    padding: 8,
    borderRadius: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
});

export const PipelineStage = ({ stageName, count, color }) => {
  const theme = useTheme();
  return (
    <View style={pipelineStyles.container}>
      <View style={pipelineStyles.header}>
        <View style={pipelineStyles.labelContainer}>
          <View style={[pipelineStyles.dot, { backgroundColor: color }]} />
          <Text style={[pipelineStyles.stageName, { color: theme.colors.onSurface }]}>{stageName}</Text>
        </View>
        <Text style={[pipelineStyles.count, { color: theme.colors.onSurfaceVariant, fontWeight: 'bold' }]}>{count}</Text>
      </View>
    </View>
  );
};

const pipelineStyles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.md,
    padding: tokens.spacing.md,
    borderRadius: tokens.borderRadius.lg,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: tokens.spacing.sm,
  },
  stageName: {
    fontSize: tokens.typography.bodyLarge.fontSize,
    fontWeight: '600',
  },
  count: {
    fontSize: tokens.typography.bodyLarge.fontSize,
  },
});

export const SimulatedRevenueChart = () => {
  const theme = useTheme();
  // Simulated chart data visually
  return (
    <View style={[
      chartStyles.container, 
      { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }
    ]}>
      <Text style={[chartStyles.title, { color: theme.colors.onSurface }]}>Revenue Overview</Text>
      <View style={chartStyles.chartArea}>
        {[40, 70, 45, 90, 60, 100].map((h, i) => (
          <View key={i} style={chartStyles.barContainer}>
            <View style={[chartStyles.bar, { height: `${h}%`, backgroundColor: tokens.colors.primary }]} />
            <Text style={{ fontSize: 10, color: theme.colors.onSurfaceVariant, marginTop: 4 }}>M{i+1}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const chartStyles = StyleSheet.create({
  container: {
    padding: tokens.spacing.lg,
    borderRadius: tokens.borderRadius.xl,
    borderWidth: 1,
    marginVertical: tokens.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: tokens.typography.titleMedium.fontSize,
    fontWeight: 'bold',
    marginBottom: tokens.spacing.lg,
  },
  chartArea: {
    height: 160,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.sm,
  },
  barContainer: {
    alignItems: 'center',
    width: 30,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
  },
});

export const ActivityItem = ({ activity }) => {
  const theme = useTheme();
  return (
    <View style={[activityStyles.container, { borderBottomColor: theme.colors.outlineVariant }]}>
      <View style={[activityStyles.avatar, { backgroundColor: `${tokens.colors.primary}15` }]}>
        <Text style={{ color: tokens.colors.primary, fontWeight: 'bold' }}>
          {activity.title ? activity.title.substring(0,2).toUpperCase() : '??'}
        </Text>
      </View>
      <View style={activityStyles.content}>
        <Text style={[activityStyles.title, { color: theme.colors.onSurface }]} numberOfLines={1}>
          {activity.title}
        </Text>
        <Text style={[activityStyles.description, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
          {activity.description}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[activityStyles.time, { color: tokens.colors.textTertiary }]}>{activity.timestamp}</Text>
        <MoreVertical size={16} color={tokens.colors.textTertiary} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
};

const activityStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: tokens.spacing.md,
  },
  content: {
    flex: 1,
    marginRight: tokens.spacing.sm,
  },
  title: {
    fontSize: tokens.typography.bodyLarge.fontSize,
    fontWeight: '600',
    marginBottom: 2,
  },
  description: {
    fontSize: tokens.typography.bodyMedium.fontSize,
  },
  time: {
    fontSize: tokens.typography.labelSmall.fontSize,
  },
});

// ── MAIN SCREEN ────────────────────────────────────────────────────────────

export default function DashboardScreen({ navigation }: any) {
  const theme = useTheme();
  const { businessName, userToken } = useAuthStore();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [greeting, setGreeting] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    updateGreeting();
    fetchData();
  }, [businessName]);

  const updateGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = 'Good Evening';
    if (hour < 12) timeGreeting = 'Good Morning';
    else if (hour < 18) timeGreeting = 'Good Afternoon';
    
    const namePart = businessName ? `, ${businessName.split(' ')[0]}` : '';
    setGreeting(`${timeGreeting}${namePart}`);
  };

  const fetchData = async () => {
    if (!userToken) return;
    try {
      const res = await dashboardApi.getAggregate();
      setData(res.data);
      
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScreenHeader title={`👋 ${greeting}`} onBack={() => navigation.goBack()} />
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  const handleDownload = async (format: 'csv' | 'pdf') => {
    try {
      setDownloading(true);
      const res = await dashboardApi.exportReport(format);
      
      if (Platform.OS === 'web') {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `dashboard_report.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const fr = new FileReader();
        fr.readAsDataURL(res.data);
        fr.onload = async () => {
          const base64Data = (fr.result as string).split(',')[1];
          const fileUri = `${FileSystem.documentDirectory}dashboard_report.${format}`;
          await FileSystem.writeAsStringAsync(fileUri, base64Data, { encoding: FileSystem.EncodingType.Base64 });
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri);
          }
        };
      }
    } catch (error) {
      console.error(`Failed to download ${format}:`, error);
      alert(`Failed to download ${format.toUpperCase()} report.`);
    } finally {
      setDownloading(false);
    }
  };

  const rightAction = (
    <Menu
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      anchor={
        <TouchableOpacity onPress={() => setMenuVisible(true)} disabled={downloading} style={{ padding: 8 }}>
          {downloading ? (
             <ActivityIndicator size={24} color={theme.colors.primary} />
          ) : (
             <Download size={24} color={theme.colors.onSurface} />
          )}
        </TouchableOpacity>
      }
    >
      <Menu.Item onPress={() => { setMenuVisible(false); handleDownload('pdf'); }} title="Export as PDF" leadingIcon="file-pdf-box" />
      <Menu.Item onPress={() => { setMenuVisible(false); handleDownload('csv'); }} title="Export as CSV" leadingIcon="file-delimited" />
    </Menu>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View style={[{ flex: 1, opacity: fadeAnim }]}>
        <ScreenHeader 
          title={`👋 ${greeting}`}
          onBack={() => navigation.goBack()}
          rightAction={rightAction}
        />
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* KPIs */}
          <View style={styles.section}>
            <View style={styles.kpiRow}>
              <KPICard title="Total Leads" value={data?.totalLeads || 0} icon={<Users size={22} color="#0EA5E9" />} color="#0EA5E9" />
              <KPICard title="Open Tickets" value={data?.openTickets || 0} icon={<AlertCircle size={22} color="#EF4444" />} color="#EF4444" />
            </View>
            <View style={styles.kpiRow}>
              <KPICard title="Today Meetings" value={data?.todayMeetings || 0} icon={<Calendar size={22} color="#A855F7" />} color="#A855F7" />
              <KPICard title="Closed Leads" value={data?.closedLeads || 0} icon={<CheckCircle size={22} color="#10B981" />} color="#10B981" />
            </View>
          </View>

          {/* Premium Chart Simulation */}
          <View style={styles.section}>
            <SimulatedRevenueChart />
          </View>

          {/* Dynamic Pipeline */}
          {data?.pipeline && data.pipeline.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Pipeline Progress</Text>
              <View style={[styles.cardContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline, padding: tokens.spacing.sm }]}>
                {data.pipeline.map((stage: any, idx: number) => (
                   <PipelineStage key={idx} stageName={stage.stageName} count={stage.count} color={stage.color} />
                ))}
              </View>
            </View>
          )}

          {/* Recent Activity */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface, marginBottom: 0 }]}>Recent Activity</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ChatList')}>
                <ArrowRight size={20} color={theme.colors.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            
            {data?.recentActivity?.length > 0 ? (
              <View style={[styles.cardContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
                {data.recentActivity.map((activity: any) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </View>
            ) : (
              <EmptyState title="No recent activity" description="Your timeline is empty." icon={<Inbox size={48} color={theme.colors.onSurfaceVariant} />} />
            )}
          </View>

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
    paddingTop: tokens.spacing.sm,
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
    fontSize: tokens.typography.titleLarge.fontSize,
    fontWeight: '700',
    marginBottom: tokens.spacing.sm,
    letterSpacing: -0.5,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardContainer: {
    borderRadius: tokens.borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
});
