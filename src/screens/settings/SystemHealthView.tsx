import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Title, Text, Card, ActivityIndicator, List, Divider, ProgressBar, useTheme, Button } from 'react-native-paper';
import { monitoringApi } from '../../services/api';

interface SystemHealthViewProps {
  onBack: () => void;
}

const SystemHealthView: React.FC<SystemHealthViewProps> = ({ onBack }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [healthStatus, setHealthStatus] = useState<string>('UNKNOWN');
  
  // Metrics state
  const [dbStatus, setDbStatus] = useState<string>('UNKNOWN');
  const [redisStatus, setRedisStatus] = useState<string>('UNKNOWN');
  const [diskSpace, setDiskSpace] = useState<string>('UNKNOWN');
  
  const [systemUptime, setSystemUptime] = useState<number>(0);
  const [workflowFailures, setWorkflowFailures] = useState<number>(0);

  const fetchHealthData = async () => {
    try {
      // 1. Fetch overall health (/actuator/health)
      const healthRes = await monitoringApi.getHealth();
      setHealthStatus(healthRes.data.status || 'UNKNOWN');
      
      const components = healthRes.data.components || {};
      setDbStatus(components.db?.status || 'UNKNOWN');
      setRedisStatus(components.redis?.status || 'UNKNOWN');
      
      if (components.diskSpace?.details?.free) {
        const freeGB = (components.diskSpace.details.free / (1024 * 1024 * 1024)).toFixed(2);
        setDiskSpace(`${freeGB} GB Free`);
      }

      // 2. Fetch specific metrics (/actuator/metrics/{name})
      const uptimeRes = await monitoringApi.getMetricDetails('process.uptime').catch(() => null);
      if (uptimeRes?.data?.measurements?.[0]?.value) {
        setSystemUptime(uptimeRes.data.measurements[0].value);
      }

      const failuresRes = await monitoringApi.getMetricDetails('workflow.failures').catch(() => null);
      if (failuresRes?.data?.measurements?.[0]?.value) {
        setWorkflowFailures(failuresRes.data.measurements[0].value);
      }
      
    } catch (error) {
      console.error('Error fetching system health:', error);
      setHealthStatus('DOWN');
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
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    return `${d}d ${h}h ${m}m`;
  };

  const getStatusColor = (status: string) => {
    if (status === 'UP') return theme.colors.primary; // Greenish
    if (status === 'DOWN') return theme.colors.error;
    return 'gray';
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Button icon="arrow-left" mode="text" onPress={onBack} style={styles.backButton}>
        Back to Settings
      </Button>

      <View style={styles.header}>
        <Title style={styles.headerTitle}>System Health</Title>
        <Text style={styles.headerSubtitle}>Real-time backend telemetry & diagnostics</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Core Status */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.statusRow}>
              <View>
                <Title>API Gateway</Title>
                <Text style={{ color: getStatusColor(healthStatus), fontWeight: 'bold' }}>
                  {healthStatus}
                </Text>
              </View>
              <List.Icon icon={healthStatus === 'UP' ? "check-circle" : "alert-circle"} color={getStatusColor(healthStatus)} />
            </View>
            <Divider style={styles.divider} />
            <Text variant="bodySmall" style={styles.uptimeText}>
              Uptime: {systemUptime ? formatUptime(systemUptime) : 'N/A'}
            </Text>
          </Card.Content>
        </Card>

        {/* Infrastructure Dependencies */}
        <List.Section title="Infrastructure" titleStyle={styles.sectionTitle}>
          <Card style={styles.card}>
            <List.Item
              title="PostgreSQL Database"
              description="Primary storage & partitioned logs"
              left={props => <List.Icon {...props} icon="database" />}
              right={() => (
                <View style={styles.badgeContainer}>
                   <Text style={[styles.badge, { backgroundColor: getStatusColor(dbStatus), color: '#fff' }]}>{dbStatus}</Text>
                </View>
              )}
            />
            <Divider />
            <List.Item
              title="Redis Distributed Cache"
              description="WebSocket PubSub & Rate Limiting"
              left={props => <List.Icon {...props} icon="memory" />}
              right={() => (
                <View style={styles.badgeContainer}>
                   <Text style={[styles.badge, { backgroundColor: getStatusColor(redisStatus), color: '#fff' }]}>{redisStatus}</Text>
                </View>
              )}
            />
            <Divider />
            <List.Item
              title="Storage Capacity"
              description={diskSpace}
              left={props => <List.Icon {...props} icon="harddisk" />}
            />
          </Card>
        </List.Section>

        {/* Workflow & Observability */}
        <List.Section title="Distributed Workflow Engine" titleStyle={styles.sectionTitle}>
          <Card style={styles.card}>
            <List.Item
              title="Workflow Failures"
              description="Dead Letter Queue / Routing Errors"
              left={props => <List.Icon {...props} icon="alert-octagon" color={workflowFailures > 0 ? theme.colors.error : 'gray'} />}
              right={() => <Text style={styles.metricValue}>{workflowFailures}</Text>}
            />
            <Divider />
            <List.Item
              title="Distributed Tracing"
              description="OpenTelemetry span propagation active"
              left={props => <List.Icon {...props} icon="ray-start-arrow" color={theme.colors.primary} />}
              right={() => <Text style={[styles.badge, { backgroundColor: theme.colors.primary, color: '#fff' }]}>ENABLED</Text>}
            />
          </Card>
        </List.Section>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backButton: { alignSelf: 'flex-start', marginLeft: 8, marginTop: 8 },
  header: { paddingHorizontal: 16, marginBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#075E54' },
  headerSubtitle: { color: '#666' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  card: { marginBottom: 16, elevation: 2, backgroundColor: '#fff' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { marginVertical: 10 },
  uptimeText: { color: '#888' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#444' },
  badgeContainer: { justifyContent: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, fontSize: 12, overflow: 'hidden', textAlign: 'center' },
  metricValue: { fontSize: 18, fontWeight: 'bold', alignSelf: 'center', marginRight: 10 },
});

export default SystemHealthView;
