import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated, Easing } from 'react-native';
import { Card, Title, Text, Button, Divider, Switch, TextInput, ActivityIndicator, Portal, Dialog, IconButton, Icon } from 'react-native-paper';
import { ChevronLeft } from 'lucide-react-native';
import { userApi } from '../../services/api';

import { colors, typography, sharedStyles } from '../../theme';

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

  const getScoreStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: colors.success };
    if (score >= 50) return { label: 'Good', color: colors.warning };
    return { label: 'Poor', color: colors.error };
  };

  const getBadgeStatus = (score: number) => {
    if (score >= 80) return { label: 'Protected', color: colors.success, bg: '#DCFCE7' };
    if (score >= 50) return { label: 'Moderate Risk', color: colors.warning, bg: '#FEF3C7' };
    return { label: 'Needs Attention', color: colors.error, bg: '#FEE2E2' };
  };

  const healthScore = data?.healthScore || 0;
  const status = getScoreStatus(healthScore);
  const badge = getBadgeStatus(healthScore);

  const renderOverview = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Security Health Card */}
      <View style={styles.modernCard}>
        <View style={styles.healthCardHeader}>
          <View>
            <Text style={typography.sectionTitle}>Security Score</Text>
            <Text style={[typography.description, { marginTop: 4 }]}>
              {healthScore > 80 ? "Your account is highly secure." : "Enable security features to improve account protection."}
            </Text>
          </View>
        </View>
        
        <View style={styles.healthScoreContainer}>
          <View style={styles.progressRingWrapper}>
            {/* Simple circular representation */}
            <View style={[styles.progressCircle, { borderColor: colors.border }]}>
              <View style={[styles.progressCircleInner, { 
                height: `${healthScore}%`, 
                backgroundColor: status.color,
                opacity: 0.2,
                position: 'absolute',
                bottom: 0,
                width: '100%',
              }]} />
              <Text style={{ fontSize: 32, fontWeight: '700', color: colors.text }}>{healthScore}<Text style={{fontSize: 16, color: colors.muted}}>%</Text></Text>
            </View>
          </View>
          <View style={styles.healthStatusWrapper}>
            <Text style={typography.metaText}>Status</Text>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <Text style={[typography.cardTitle, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={[typography.sectionTitle, { marginTop: 24, marginBottom: 16 }]}>Security Controls</Text>
      
      <View style={styles.modernCard}>
        <View style={styles.controlRow}>
          <View style={styles.controlIconWrapper}>
            <Icon source="fingerprint" size={24} color={colors.primary} />
          </View>
          <View style={styles.controlTextWrapper}>
            <Text style={typography.cardTitle}>Biometric Authentication</Text>
            <Text style={typography.description}>Use Face ID or Fingerprint for secure login</Text>
          </View>
          <Switch 
            value={data?.biometricsEnabled} 
            onValueChange={handleToggleBiometrics} 
            disabled={isUpdating} 
            color={colors.primary}
          />
        </View>
        <Divider style={styles.divider} />
        <View style={styles.controlRow}>
          <View style={styles.controlIconWrapper}>
            <Icon source="bell-ring-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.controlTextWrapper}>
            <Text style={typography.cardTitle}>Login Alerts</Text>
            <Text style={typography.description}>Get notified when new devices access your account</Text>
          </View>
          <Switch 
            value={data?.loginAlertsEnabled} 
            onValueChange={handleToggleLoginAlerts} 
            disabled={isUpdating} 
            color={colors.primary}
          />
        </View>
      </View>

      <Text style={[typography.sectionTitle, { marginTop: 24, marginBottom: 16 }]}>Account Actions</Text>
      
      <View style={styles.modernCard}>
        <TouchableOpacity style={styles.actionRow} onPress={() => setShowIPDialog(true)}>
          <View style={styles.controlIconWrapper}>
            <Icon source="ip-network-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.controlTextWrapper}>
            <Text style={typography.cardTitle}>Manage IP Whitelist</Text>
            <Text style={typography.description}>Restrict access to verified IP addresses</Text>
          </View>
          <Icon source="chevron-right" size={24} color={colors.muted} />
        </TouchableOpacity>
        <Divider style={styles.divider} />
        <TouchableOpacity style={styles.actionRow} onPress={handleExportData}>
          <View style={styles.controlIconWrapper}>
            <Icon source="download-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.controlTextWrapper}>
            <Text style={typography.cardTitle}>Download All Data</Text>
            <Text style={typography.description}>Export business data to JSON</Text>
          </View>
          <Icon source="chevron-right" size={24} color={colors.muted} />
        </TouchableOpacity>
        <Divider style={styles.divider} />
        <TouchableOpacity style={styles.actionRow} onPress={handleUndeleteLeads}>
          <View style={styles.controlIconWrapper}>
            <Icon source="database-refresh-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.controlTextWrapper}>
            <Text style={typography.cardTitle}>Data Recovery</Text>
            <Text style={typography.description}>Undelete recently lost leads</Text>
          </View>
          <Icon source="chevron-right" size={24} color={colors.muted} />
        </TouchableOpacity>
        <Divider style={styles.divider} />
        <TouchableOpacity style={styles.actionRow} onPress={() => setShowKillSwitchDialog(true)}>
          <View style={[styles.controlIconWrapper, { backgroundColor: '#FEE2E2' }]}>
            <Icon source="alert-octagon-outline" size={24} color={colors.error} />
          </View>
          <View style={styles.controlTextWrapper}>
            <Text style={[typography.cardTitle, { color: colors.error }]}>Emergency Kill Switch</Text>
            <Text style={typography.description}>Lock account and revoke all sessions</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderSessions = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 24 }}>
      {sessions.map((s, index) => (
        <View key={s.id} style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <View style={styles.sessionIconWrapper}>
              <Icon source="monitor-cellphone" size={24} color={colors.text} />
            </View>
            <View style={styles.sessionInfo}>
              <Text style={typography.cardTitle}>{s.deviceName || 'Unknown Device'}</Text>
              <Text style={typography.metaText}>{s.browser || 'Unknown Browser'} on {s.os || 'Unknown OS'}</Text>
            </View>
            {index === 0 && (
              <View style={styles.currentSessionBadge}>
                <Text style={styles.currentSessionText}>Current Session</Text>
              </View>
            )}
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.sessionFooter}>
            <View>
              <Text style={typography.metaText}>IP: {s.ipAddress}</Text>
              <Text style={typography.metaText}>Last Active: {s.lastActiveAt}</Text>
            </View>
            <TouchableOpacity style={styles.dangerButton} onPress={() => handleRevokeSession(s.id)}>
              <Text style={styles.dangerButtonText}>Revoke</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <Button mode="outlined" style={{marginTop: 16, borderColor: colors.border}} textColor={colors.text} onPress={fetchSessions}>
        Refresh Sessions
      </Button>
    </ScrollView>
  );

  const renderHistory = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.modernCard}>
        {logs.map((log, index) => {
          const isSuccess = log.status === 'SUCCESS';
          return (
            <View key={log.id} style={styles.timelineItem}>
              <View style={styles.timelineIconContainer}>
                <View style={[styles.timelineIcon, { backgroundColor: isSuccess ? '#DCFCE7' : '#FEE2E2' }]}>
                  <Icon source={isSuccess ? 'check' : 'close'} size={14} color={isSuccess ? colors.success : colors.error} />
                </View>
                {index !== logs.length - 1 && <View style={styles.timelineLine} />}
              </View>
              <View style={styles.timelineContent}>
                <Text style={typography.cardTitle}>{log.action.replace(/_/g, ' ')}</Text>
                <Text style={typography.description}>{log.details}</Text>
                <Text style={[typography.metaText, { marginTop: 4 }]}>
                  {new Date(log.timestamp).toLocaleString()}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft size={24} color="#0F766E" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <Text style={typography.pageTitle}>Privacy & Security</Text>
            <View style={[styles.statusBadgeSmall, { backgroundColor: badge.bg }]}>
              <Text style={[styles.statusBadgeSmallText, { color: badge.color }]}>{badge.label}</Text>
            </View>
          </View>
          <Text style={[typography.description, { marginTop: 4 }]}>
            Manage account protection, login activity and security controls.
          </Text>
        </View>
      </View>

      {/* Segmented Tabs */}
      <View style={styles.tabsContainerWrapper}>
        <View style={styles.tabsContainer}>
          {(['overview', 'sessions', 'history'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'history' ? 'Audit Log' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'sessions' && renderSessions()}
      {activeTab === 'history' && renderHistory()}

      {/* Dialogs */}
      <Portal>
        <Dialog visible={showKillSwitchDialog} onDismiss={() => setShowKillSwitchDialog(false)} style={{ backgroundColor: colors.card, borderRadius: 14 }}>
          <Dialog.Icon icon="alert-octagon" color={colors.error} />
          <Dialog.Title style={{textAlign: 'center', color: colors.text}}>Emergency Kill Switch</Dialog.Title>
          <Dialog.Content>
            <Text style={[typography.description, { textAlign: 'center' }]}>
              This will immediately lock your account and revoke ALL active sessions. You will need to contact support to regain access.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowKillSwitchDialog(false)} textColor={colors.muted}>Cancel</Button>
            <Button onPress={handleKillSwitch} textColor={colors.error}>Lock Account</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showIPDialog} onDismiss={() => setShowIPDialog(false)} style={{ backgroundColor: colors.card, borderRadius: 14 }}>
          <Dialog.Title style={{ color: colors.text }}>IP Whitelist</Dialog.Title>
          <Dialog.Content>
            <Text style={[typography.description, { marginBottom: 16 }]}>Restrict access to your CRM to only verified IP addresses.</Text>
            <TextInput 
              label="Add New IP" 
              value={ipAddress} 
              onChangeText={setIpAddress} 
              mode="outlined" 
              placeholder="e.g. 192.168.1.1" 
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              style={{ backgroundColor: colors.card }}
              right={<TextInput.Icon icon="plus" onPress={handleUpdateIPs} />}
            />
            <ScrollView style={{maxHeight: 200, marginTop: 16}}>
              {(data?.ipWhitelist || []).map((ip: string) => (
                <View key={ip} style={styles.ipRow}>
                  <Text style={typography.cardTitle}>{ip}</Text>
                  <IconButton icon="delete-outline" iconColor={colors.error} size={20} onPress={() => handleRemoveIP(ip)} />
                </View>
              ))}
              {(!data?.ipWhitelist || data?.ipWhitelist.length === 0) && (
                <Text style={[typography.metaText, { textAlign: 'center', marginTop: 16 }]}>No IPs whitelisted. Open access enabled.</Text>
              )}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowIPDialog(false)} textColor={colors.primary}>Done</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background,
  },
  centered: { 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  header: { 
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 24,
    paddingTop: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flex: 1,
    paddingTop: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadgeSmall: {
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeSmallText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabsContainerWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background,
  },
  tabsContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#E2E8F0', 
    borderRadius: 8, 
    padding: 4,
  },
  tab: { 
    flex: 1, 
    paddingVertical: 8, 
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: { 
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: { 
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
  },
  activeTabText: { 
    color: colors.text, 
    fontWeight: '600' 
  },
  tabContent: { 
    paddingHorizontal: 16,
  },
  modernCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  healthCardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  healthScoreContainer: {
    flexDirection: 'row',
    padding: 24,
    alignItems: 'center',
  },
  progressRingWrapper: {
    marginRight: 24,
  },
  progressCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  progressCircleInner: {
    // animated or static height filler
  },
  healthStatusWrapper: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  controlIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  controlTextWrapper: {
    flex: 1,
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
  },
  sessionCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  sessionIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  currentSessionBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentSessionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0284C7',
  },
  sessionFooter: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAF9',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  dangerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.error,
  },
  dangerButtonText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  timelineItem: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 0,
  },
  timelineIconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 24,
  },
  ipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  }
});

export default SecurityDashboard;
