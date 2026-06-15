import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator, List, Divider, Icon } from 'react-native-paper';
import { ChevronLeft } from 'lucide-react-native';
import { monitoringApi } from '../../services/api';
import { colors, typography, sharedStyles } from '../../theme';

interface SystemHealthViewProps {
  onBack: () => void;
}

const SystemHealthView: React.FC<SystemHealthViewProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [healthStatus, setHealthStatus] = useState<string>('UNKNOWN');
  const [dbStatus, setDbStatus] = useState<string>('UNKNOWN');
  const [redisStatus, setRedisStatus] = useState<string>('UNKNOWN');
  const [diskSpace, setDiskSpace] = useState<string>('UNKNOWN');
  const [systemUptime, setSystemUptime] = useState<number>(0);
  const [workflowFailures, setWorkflowFailures] = useState<number>(0);

  const fetchHealthData = async () => {
    try {
      const healthRes = await monitoringApi.getHealth();
      processHealthData(healthRes.data);
    } catch (error: any) {
      console.error('Error fetching system health:', error);
      if (error.response && error.response.data) {
        processHealthData(error.response.data);
      } else {
        setHealthStatus('DOWN');
      }
    }

    try {
      const uptimeRes = await monitoringApi.getMetricDetails('process.uptime');
      if (uptimeRes?.data?.measurements?.[0]?.value) {
        setSystemUptime(uptimeRes.data.measurements[0].value);
      }
    } catch (e) {}

    try {
      const failuresRes = await monitoringApi.getMetricDetails('workflow.failures');
      if (failuresRes?.data?.measurements?.[0]?.value) {
        setWorkflowFailures(failuresRes.data.measurements[0].value);
      }
    } catch (e) {}
  };

  const processHealthData = (data: any) => {
    setHealthStatus(data.status || 'UNKNOWN');
    const components = data.components || {};
    setDbStatus(components.db?.status || 'UNKNOWN');
    setRedisStatus(components.redis?.status || 'UNKNOWN');
    if (components.diskSpace?.details?.free) {
      const freeGB = (components.diskSpace.details.free / (1024 * 1024 * 1024)).toFixed(2);
      setDiskSpace(`${freeGB} GB Free`);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHealthData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchHealthData().then(() => setLoading(false));
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  const getStatusColor = (status: string) => {
    if (status === 'UP') return colors.success;
    if (status === 'DOWN') return colors.error;
    return colors.muted;
  };

  const StatusBadge = ({ status }: { status: string }) => (
    <View style={[styles.badge, { backgroundColor: getStatusColor(status) }]}>
      <Text style={styles.badgeText}>{status}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[sharedStyles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={sharedStyles.container}>
      {/* Header */}
      <View style={sharedStyles.header}>
        <TouchableOpacity style={sharedStyles.backButton} onPress={onBack}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <View style={sharedStyles.headerContent}>
          <Text style={typography.pageTitle}>System Health</Text>
          <Text style={[typography.description, { marginTop: 4 }]}>
            Real-time backend telemetry & diagnostics
          </Text>
        </View>
      </View>

      <ScrollView
        style={sharedStyles.tabContent}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Overall Status Card */}
        <View style={[sharedStyles.modernCard, { padding: 20 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={typography.cardTitle}>API Gateway</Text>
              <Text style={[typography.description, { color: getStatusColor(healthStatus), fontWeight: '700', marginTop: 4 }]}>
                {healthStatus}
              </Text>
            </View>
            <List.Icon
              icon={healthStatus === 'UP' ? 'check-circle' : 'alert-circle'}
              color={getStatusColor(healthStatus)}
              style={{ margin: 0 }}
            />
          </View>
          <Divider style={[sharedStyles.divider, { marginVertical: 16 }]} />
          <Text style={typography.metaText}>
            Uptime: {systemUptime ? formatUptime(systemUptime) : 'N/A'}
          </Text>
        </View>

        {/* Section label */}
        <Text style={styles.sectionLabel}>INFRASTRUCTURE</Text>

        {/* Infrastructure Card */}
        <View style={[sharedStyles.modernCard, { paddingVertical: 8 }]}>
          <List.Item
            title="PostgreSQL Database"
            description="Primary storage & partitioned logs"
            titleStyle={typography.cardTitle}
            descriptionStyle={typography.metaText}
            left={props => <List.Icon {...props} icon="database" color={colors.primary} />}
            right={() => <StatusBadge status={dbStatus} />}
          />
          <Divider style={sharedStyles.divider} />
          <List.Item
            title="Redis Distributed Cache"
            description="WebSocket PubSub & Rate Limiting"
            titleStyle={typography.cardTitle}
            descriptionStyle={typography.metaText}
            left={props => <List.Icon {...props} icon="memory" color={colors.primary} />}
            right={() => <StatusBadge status={redisStatus} />}
          />
          <Divider style={sharedStyles.divider} />
          <List.Item
            title="Storage Capacity"
            description={diskSpace}
            titleStyle={typography.cardTitle}
            descriptionStyle={typography.metaText}
            left={props => <List.Icon {...props} icon="harddisk" color={colors.primary} />}
          />
        </View>

        {/* Section label */}
        <Text style={styles.sectionLabel}>WORKFLOW ENGINE</Text>

        {/* Workflow Card */}
        <View style={[sharedStyles.modernCard, { paddingVertical: 8 }]}>
          <List.Item
            title="Workflow Failures"
            description="Dead Letter Queue / Routing Errors"
            titleStyle={typography.cardTitle}
            descriptionStyle={typography.metaText}
            left={props => (
              <List.Icon
                {...props}
                icon="alert-octagon"
                color={workflowFailures > 0 ? colors.error : colors.muted}
              />
            )}
            right={() => (
              <Text style={[typography.cardTitle, { alignSelf: 'center', marginRight: 8, fontSize: 20, color: workflowFailures > 0 ? colors.error : colors.text }]}>
                {workflowFailures}
              </Text>
            )}
          />
          <Divider style={sharedStyles.divider} />
          <List.Item
            title="Distributed Tracing"
            description="OpenTelemetry span propagation active"
            titleStyle={typography.cardTitle}
            descriptionStyle={typography.metaText}
            left={props => <List.Icon {...props} icon="ray-start-arrow" color={colors.primary} />}
            right={() => (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>ENABLED</Text>
              </View>
            )}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  centered: { justifyContent: 'center', alignItems: 'center' },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 8,
    marginLeft: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
});

export default SystemHealthView;
