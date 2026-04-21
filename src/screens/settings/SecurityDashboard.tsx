import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Card, Title, Text, Button, Divider, List, Switch, TextInput, ActivityIndicator, ProgressBar, Portal, Dialog } from 'react-native-paper';
import { userApi } from '../../services/api';

interface SecurityDashboardProps {
  onBack: () => void;
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'history'>('overview');
  
  // Settings States
  const [sessions, setSessions] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [ipAddress, setIpAddress] = useState('');
  const [showKillSwitchDialog, setShowKillSwitchDialog] = useState(false);
  const [showIPDialog, setShowIPDialog] = useState(false);

  const handleUpdateIPs = async () => {
    if (!ipAddress) return;
    const newIps = [...(data?.ipWhitelist || []), ipAddress];
    setIsUpdating(true);
    try {
      await userApi.updateSecuritySettings({ ipWhitelist: newIps });
      setData({ ...data, ipWhitelist: newIps });
      setIpAddress('');
    } catch (e) {
      Alert.alert("Error", "Failed to update whitelist");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveIP = async (ip: string) => {
    const newIps = (data?.ipWhitelist || []).filter((i: string) => i !== ip);
    setIsUpdating(true);
    try {
       await userApi.updateSecuritySettings({ ipWhitelist: newIps });
       setData({ ...data, ipWhitelist: newIps });
    } catch (e) {
       Alert.alert("Error", "Failed to remove IP");
    } finally {
       setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchSessions();
    fetchLogs();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await userApi.getSecurityDashboard();
      setData(res.data);
    } catch (e) {
      Alert.alert("Error", "Failed to load security data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await userApi.getSessions();
      setSessions(res.data);
    } catch (e) {}
  };

  const fetchLogs = async () => {
    try {
      const res = await userApi.getSecurityLogs();
      setLogs(res.data);
    } catch (e) {}
  };

  const handleToggleBiometrics = async (val: boolean) => {
    setIsUpdating(true);
    try {
      await userApi.updateSecuritySettings({ biometricsEnabled: val });
      setData({ ...data, biometricsEnabled: val });
    } catch (e) {
      Alert.alert("Error", "Failed to update settings");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleLoginAlerts = async (val: boolean) => {
    setIsUpdating(true);
    try {
      await userApi.updateSecuritySettings({ loginAlertsEnabled: val });
      setData({ ...data, loginAlertsEnabled: val });
    } catch (e) {
      Alert.alert("Error", "Failed to update alerts setting");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUndeleteLeads = async () => {
    try {
      const res = await userApi.recoverLeads();
      Alert.alert("Success", res.data);
      fetchDashboard();
    } catch (e) {
      Alert.alert("Error", "Failed to recover leads");
    }
  };

  const handleExportData = async () => {
    try {
      const res = await userApi.exportData();
      // In a real mobile app, you would use FileSystem to save this.
      // For now, we'll alert the user and they can see it in logs or a preview.
      Alert.alert("Data Exported", "Your business data has been aggregated securely. Ready for download.");
      console.log("Exported Data:", res.data);
    } catch (e) {
      Alert.alert("Error", "Export failed");
    }
  };

  const handleRevokeSession = async (id: string) => {
    try {
      await userApi.revokeSession(id);
      setSessions(sessions.filter(s => s.id !== id));
    } catch (e) {
      Alert.alert("Error", "Failed to revoke session");
    }
  };

  const handleKillSwitch = async () => {
    try {
      await userApi.killSwitch();
      Alert.alert("Account Locked", "Your account has been locked and all sessions revoked. You will be logged out.");
    } catch (e) {
      Alert.alert("Error", "Action failed");
    } finally {
      setShowKillSwitchDialog(false);
    }
  };

  const renderSessions = () => (
    <ScrollView style={styles.tabContent}>
      {sessions.map((s) => (
        <Card key={s.id} style={styles.sessionCard}>
          <List.Item
            title={s.deviceName || 'Unknown Device'}
            description={`IP: ${s.ipAddress}\nLast active: ${s.lastActiveAt}`}
            left={props => <List.Icon {...props} icon="cellphone-link" />}
            right={props => (
              <Button mode="text" textColor="#B00020" onPress={() => handleRevokeSession(s.id)}>Revoke</Button>
            )}
          />
        </Card>
      ))}
      <Button mode="outlined" style={{marginTop: 20}} onPress={fetchSessions}>Refresh Sessions</Button>
    </ScrollView>
  );

  const renderHistory = () => (
    <ScrollView style={styles.tabContent}>
      {logs.map((log) => (
        <List.Item
          key={log.id}
          title={log.action.replace(/_/g, ' ')}
          description={`${new Date(log.timestamp).toLocaleString()}\n${log.details}`}
          left={props => <List.Icon {...props} icon={log.status === 'SUCCESS' ? 'check-circle' : 'alert-circle'} color={log.status === 'SUCCESS' ? '#2E7D32' : '#D32F2F'} />}
          style={styles.logItem}
        />
      ))}
    </ScrollView>
  );

  const renderOverview = () => (
    <ScrollView style={styles.tabContent}>
      {/* 🛡️ HEALTH SCORE */}
      <Card style={styles.scoreCard}>
        <Card.Content>
          <View style={styles.scoreHeader}>
            <Title style={styles.scoreTitle}>Security Health Score</Title>
            <Text style={[styles.scoreValue, { color: getScoreColor(data?.healthScore) }]}>{data?.healthScore}%</Text>
          </View>
          <ProgressBar progress={(data?.healthScore || 0) / 100} color={getScoreColor(data?.healthScore)} style={styles.progressBar} />
          <Text style={styles.scoreDesc}>
            {data?.healthScore > 80 ? "Your account is highly secure." : "Improve your security by enabling more features."}
          </Text>
        </Card.Content>
      </Card>

      {/* ⚙️ QUICK CONTROLS */}
      <List.Section title="Security Controls">
        <Card style={styles.controlCard}>
          <List.Item
            title="Biometric Authentication"
            description="Use FaceID/Fingerprint to unlock app"
            left={props => <List.Icon {...props} icon="fingerprint" />}
            right={() => <Switch value={data?.biometricsEnabled} onValueChange={handleToggleBiometrics} disabled={isUpdating} />}
          />
          <Divider />
          <List.Item
            title="Login Alerts"
            description="Notification on new device login"
            left={props => <List.Icon {...props} icon="bell-ring" />}
            right={() => <Switch value={data?.loginAlertsEnabled} onValueChange={handleToggleLoginAlerts} disabled={isUpdating} />}
          />
        </Card>
      </List.Section>

      <List.Section title="Account Actions">
        <Button mode="outlined" icon="ip-network" onPress={() => setShowIPDialog(true)} style={styles.actionButton}>
          Manage IP Whitelist
        </Button>
        <Button mode="contained" icon="alert-octagon" onPress={() => setShowKillSwitchDialog(true)} buttonColor="#B00020" style={styles.actionButton}>
          Emergency Kill Switch
        </Button>
      </List.Section>

      <List.Section title="Account Privacy & Data">
         <Card style={styles.controlCard}>
           <List.Item
             title="Data Recovery"
             description="Undelete recently lost leads"
             left={props => <List.Icon {...props} icon="database-refresh" />}
             right={props => <Button mode="text" onPress={handleUndeleteLeads}>Undelete</Button>}
           />
           <Divider />
           <List.Item
             title="Download All Data"
             description="Export business data to JSON"
             left={props => <List.Icon {...props} icon="download" />}
             onPress={handleExportData}
           />
         </Card>
      </List.Section>
    </ScrollView>
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#2E7D32';
    if (score >= 50) return '#FBC02D';
    return '#D32F2F';
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#075E54" /></View>;

  return (
    <View style={styles.container}>
      <Button icon="arrow-left" mode="text" onPress={onBack} style={styles.backButton}>Back to Settings</Button>
      
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Enterprise Security</Title>
        <Text style={styles.headerSubtitle}>Pro-tier protection for your business CRM</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'overview' && styles.activeTab]} onPress={() => setActiveTab('overview')}>
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'sessions' && styles.activeTab]} onPress={() => setActiveTab('sessions')}>
          <Text style={[styles.tabText, activeTab === 'sessions' && styles.activeTabText]}>Sessions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'history' && styles.activeTab]} onPress={() => setActiveTab('history')}>
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Audit Log</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'sessions' && renderSessions()}
      {activeTab === 'history' && renderHistory()}

      {/* Dialogs */}
      <Portal>

        <Dialog visible={showKillSwitchDialog} onDismiss={() => setShowKillSwitchDialog(false)}>
          <Dialog.Icon icon="alert-octagon" color="#B00020" />
          <Dialog.Title style={{textAlign: 'center'}}>Kill Switch</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">This will immediately lock your account and revoke ALL active sessions. You will need to contact support to regain access.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowKillSwitchDialog(false)}>Cancel</Button>
            <Button onPress={handleKillSwitch} textColor="#B00020">Lock Account</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showIPDialog} onDismiss={() => setShowIPDialog(false)}>
          <Dialog.Title>IP Whitelist Manager</Dialog.Title>
          <Dialog.Content>
            <Text style={{marginBottom: 10}}>Restrict access to your CRM to only verified IP addresses.</Text>
            <TextInput 
              label="Add New IP" 
              value={ipAddress} 
              onChangeText={setIpAddress} 
              mode="outlined" 
              placeholder="e.g. 192.168.1.1" 
              right={<TextInput.Icon icon="plus" onPress={handleUpdateIPs} />}
            />
            <ScrollView style={{maxHeight: 200, marginTop: 15}}>
              {(data?.ipWhitelist || []).map((ip: string) => (
                <List.Item
                  key={ip}
                  title={ip}
                  right={props => <TouchableOpacity onPress={() => handleRemoveIP(ip)}><List.Icon {...props} icon="delete-outline" color="#B00020" /></TouchableOpacity>}
                />
              ))}
              {(!data?.ipWhitelist || data?.ipWhitelist.length === 0) && (
                <Text style={{textAlign: 'center', color: '#888', fontStyle: 'italic'}}>No IPs whitelisted. Open access enabled.</Text>
              )}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowIPDialog(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backButton: { alignSelf: 'flex-start', marginBottom: 5 },
  header: { paddingHorizontal: 16, marginBottom: 20 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#075E54' },
  headerSubtitle: { color: '#666' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, marginHorizontal: 16, marginBottom: 16, elevation: 2 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#075E54' },
  tabText: { color: '#888', fontWeight: '500' },
  activeTabText: { color: '#075E54', fontWeight: 'bold' },
  tabContent: { paddingHorizontal: 16 },
  scoreCard: { marginBottom: 16, borderRadius: 12, elevation: 3, backgroundColor: '#fff' },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  scoreTitle: { fontSize: 18 },
  scoreValue: { fontSize: 24, fontWeight: 'bold' },
  progressBar: { height: 10, borderRadius: 5, marginBottom: 10 },
  scoreDesc: { fontSize: 13, color: '#666' },
  controlCard: { borderRadius: 12, elevation: 2, backgroundColor: '#fff' },
  actionButton: { marginTop: 12, borderRadius: 8 },
  sessionCard: {
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
    backgroundColor: '#fff',
  },
  logItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 5,
  },
});

export default SecurityDashboard;
