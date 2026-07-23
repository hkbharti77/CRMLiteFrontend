import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, SafeAreaView } from 'react-native';
import { Text, ActivityIndicator, useTheme, Dialog, Portal, TextInput, Button as PaperButton } from 'react-native-paper';
import { userApi } from '../../services/api';
import { ChevronLeft, Plus } from 'lucide-react-native';

interface StaffManagementViewProps {
  onBack: () => void;
}

export default function StaffManagementView({ onBack }: StaffManagementViewProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [activeStaff, setActiveStaff] = useState<any[]>([]);
  
  // Invite Modal State
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState('AGENT');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  // Block/Unblock Dialog State
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [blockReason, setBlockReason] = useState('');
  const [isUnblockingAction, setIsUnblockingAction] = useState(false);

  // Delete Dialog State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<any>(null);
  const [deletingStaff, setDeletingStaff] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffRes, profileRes] = await Promise.all([
        userApi.getTenantStaff(),
        userApi.getProfile()
      ]);
      if (staffRes.data) setActiveStaff(staffRes.data);
      if (profileRes.data) setCurrentUserRole(profileRes.data.role);
    } catch (error) {
      console.error('Error fetching staff data:', error);
      Alert.alert('Error', 'Failed to fetch staff data.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = (staff: any) => {
    const isBlocked = staff.accountStatus !== 'ACTIVE';
    setSelectedStaff(staff);
    setIsUnblockingAction(isBlocked);
    setBlockReason('');
    setBlockModalVisible(true);
  };

  const handleSubmitStatusChange = async () => {
    if (!selectedStaff) return;
    if (!blockReason.trim()) {
      Alert.alert('Validation Error', 'Please enter a reason.');
      return;
    }

    setLoading(true);
    setBlockModalVisible(false);
    try {
      const newStatus = isUnblockingAction ? 'ACTIVE' : 'LOCKED';
      await userApi.updateStaffStatus(selectedStaff.id, newStatus, blockReason.trim());
      Alert.alert('Success', `Staff member successfully ${isUnblockingAction ? 'unblocked' : 'blocked'}.`);
      fetchData();
    } catch (error: any) {
      console.error('Error updating staff status:', error);
      const msg = error.response?.data?.message || error.response?.data || 'Failed to update staff status.';
      Alert.alert('Error', typeof msg === 'string' ? msg : 'Error updating staff status');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = (staff: any) => {
    setStaffToDelete(staff);
    setDeleteModalVisible(true);
  };

  const confirmDeleteStaff = async () => {
    if (!staffToDelete) return;
    setDeletingStaff(true);
    try {
      await userApi.deleteStaffUser(staffToDelete.id);
      setDeleteModalVisible(false);
      setStaffToDelete(null);
      Alert.alert('Success', 'Staff member permanently deleted.');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting staff member:', error);
      const msg = error.response?.data?.message || error.response?.data || 'Failed to delete staff member.';
      Alert.alert('Error', typeof msg === 'string' ? msg : 'Error deleting staff member');
    } finally {
      setDeletingStaff(false);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteName.trim()) {
      Alert.alert('Validation Error', 'Please enter a full name.');
      return;
    }
    if (!inviteEmail.trim()) {
      Alert.alert('Validation Error', 'Please enter an email address.');
      return;
    }
    setSendingInvite(true);
    try {
      await userApi.createStaffUser({
        email: inviteEmail.trim(),
        displayName: inviteName.trim(),
        role: inviteRole,
        phone: invitePhone.trim() || undefined
      });
      Alert.alert('Success', 'Staff member account created successfully!');
      setInviteModalVisible(false);
      setInviteEmail('');
      setInviteName('');
      setInvitePhone('');
      setInviteRole('AGENT');
      fetchData();
    } catch (error: any) {
      console.error('Error creating staff:', error);
      const msg = error.response?.data?.message || error.response?.data || 'Failed to create staff member.';
      Alert.alert('Error', typeof msg === 'string' ? msg : 'Error creating staff member');
    } finally {
      setSendingInvite(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== HEADER ===== */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ChevronLeft size={24} color="#0F766E" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.pageTitle}>Staff Management</Text>
            <Text style={styles.pageSubtitle}>Create and manage staff accounts</Text>
          </View>
        </View>

        {/* ===== ACTIONS ===== */}
        <TouchableOpacity style={styles.inviteCard} onPress={() => setInviteModalVisible(true)}>
          <View style={styles.inviteCardLeft}>
            <View style={styles.inviteIconContainer}>
              <Plus size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.inviteTitle}>Add Staff Member</Text>
              <Text style={styles.inviteSubtitle}>Create an account for an admin or agent</Text>
            </View>
          </View>
          <ChevronLeft size={20} color="#94A3B8" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>

        {/* ===== ACTIVE STAFF ===== */}
        <SectionCard title="Active Staff" icon="👥">
          {activeStaff.length === 0 ? (
            <Text style={styles.emptyText}>No active staff found.</Text>
          ) : (
            activeStaff.map((staff, idx) => {
              const isOwner = staff.role === 'OWNER';
              const isBlocked = staff.accountStatus !== 'ACTIVE';
              const showBlockButton = 
                !isOwner && 
                (currentUserRole === 'OWNER' || (currentUserRole === 'ADMIN' && staff.role === 'AGENT'));
              const showDeleteButton = 
                !isOwner && currentUserRole === 'OWNER';

              return (
                <View key={idx} style={[styles.listItem, idx === activeStaff.length - 1 && styles.lastListItem]}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {staff.displayName?.charAt(0).toUpperCase() || 'S'}
                    </Text>
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={styles.itemName}>{staff.displayName || 'No Name'}</Text>
                    <Text style={styles.itemSubText}>{staff.email} • {staff.role || 'AGENT'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={isBlocked ? styles.statusBadgeBlocked : styles.statusBadgeActive}>
                      <Text style={isBlocked ? styles.statusTextBlocked : styles.statusTextActive}>
                        {isBlocked ? 'Blocked' : 'Active'}
                      </Text>
                    </View>
                    
                    {showBlockButton && (
                      <TouchableOpacity 
                        onPress={() => handleToggleBlock(staff)} 
                        style={[styles.actionBtn, { borderColor: theme.colors.primary }]}
                      >
                        <Text style={[styles.actionBtnText, { color: theme.colors.primary }]}>
                          {isBlocked ? 'Unblock' : 'Block'}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {showDeleteButton && (
                      <TouchableOpacity 
                        onPress={() => handleDeleteStaff(staff)} 
                        style={[styles.actionBtn, { borderColor: '#EF4444' }]}
                      >
                        <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>
                          Delete
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </SectionCard>

        {/* ===== BOTTOM SPACER ===== */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Staff Modal */}
      <Portal>
        <Dialog visible={inviteModalVisible} onDismiss={() => setInviteModalVisible(false)} style={{ borderRadius: 14, backgroundColor: '#fff' }}>
          <Dialog.Title style={{ fontWeight: '700', color: '#0F172A' }}>Add Staff Member</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Full Name"
              value={inviteName}
              onChangeText={setInviteName}
              mode="outlined"
              style={{ marginBottom: 12, backgroundColor: '#fff' }}
              outlineColor="#E2E8F0"
              activeOutlineColor="#0F766E"
            />
            <TextInput
              label="Email Address"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ marginBottom: 12, backgroundColor: '#fff' }}
              outlineColor="#E2E8F0"
              activeOutlineColor="#0F766E"
            />
            <TextInput
              label="Phone Number (Optional)"
              value={invitePhone}
              onChangeText={setInvitePhone}
              mode="outlined"
              keyboardType="phone-pad"
              style={{ marginBottom: 16, backgroundColor: '#fff' }}
              outlineColor="#E2E8F0"
              activeOutlineColor="#0F766E"
            />
            <Text style={{ marginBottom: 8, fontSize: 13, fontWeight: '600', color: '#0F172A' }}>Select Role</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity 
                style={[styles.roleBtn, inviteRole === 'AGENT' && styles.roleBtnActive]}
                onPress={() => setInviteRole('AGENT')}
              >
                <Text style={[styles.roleBtnText, inviteRole === 'AGENT' && styles.roleBtnTextActive]}>Agent</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.roleBtn, inviteRole === 'ADMIN' && styles.roleBtnActive]}
                onPress={() => setInviteRole('ADMIN')}
              >
                <Text style={[styles.roleBtnText, inviteRole === 'ADMIN' && styles.roleBtnTextActive]}>Admin</Text>
              </TouchableOpacity>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={() => setInviteModalVisible(false)} disabled={sendingInvite} textColor="#64748B">Cancel</PaperButton>
            <PaperButton onPress={handleSendInvite} loading={sendingInvite} disabled={sendingInvite} buttonColor="#0F766E" textColor="#fff" style={{ borderRadius: 8 }}>
              Create Account
            </PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Block/Unblock Reason Modal */}
      <Portal>
        <Dialog visible={blockModalVisible} onDismiss={() => setBlockModalVisible(false)} style={{ borderRadius: 14, backgroundColor: '#fff' }}>
          <Dialog.Title style={{ fontWeight: '700', color: '#0F172A' }}>
            {isUnblockingAction ? 'Unblock Staff Member' : 'Block Staff Member'}
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ marginBottom: 12, color: '#64748B', fontSize: 14 }}>
              {isUnblockingAction 
                ? `Please provide a reason for unblocking ${selectedStaff?.displayName || selectedStaff?.email || 'this employee'}:`
                : `Please provide a reason for blocking ${selectedStaff?.displayName || selectedStaff?.email || 'this employee'}:`
              }
            </Text>
            <TextInput
              label="Reason"
              value={blockReason}
              onChangeText={setBlockReason}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={{ backgroundColor: '#fff' }}
              outlineColor="#E2E8F0"
              activeOutlineColor="#0F766E"
              placeholder={isUnblockingAction ? "e.g., Access restored by admin" : "e.g., Policy violation"}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={() => setBlockModalVisible(false)} textColor="#64748B">Cancel</PaperButton>
            <PaperButton 
              onPress={handleSubmitStatusChange} 
              buttonColor={isUnblockingAction ? "#0F766E" : "#EF4444"} 
              textColor="#fff" 
              style={{ borderRadius: 8 }}
            >
              {isUnblockingAction ? 'Unblock' : 'Block'}
            </PaperButton>
          </Dialog.Actions>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog visible={deleteModalVisible} onDismiss={() => !deletingStaff && setDeleteModalVisible(false)} style={{ borderRadius: 14, backgroundColor: '#fff' }}>
          <Dialog.Title style={{ fontWeight: '700', color: '#EF4444' }}>Confirm Permanent Deletion</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: '#64748B', fontSize: 14 }}>
              Are you sure you want to PERMANENTLY delete {staffToDelete?.displayName || staffToDelete?.email}? This action cannot be undone and all user sessions and logs will be permanently deleted.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={() => setDeleteModalVisible(false)} disabled={deletingStaff} textColor="#64748B">Cancel</PaperButton>
            <PaperButton 
              onPress={confirmDeleteStaff} 
              loading={deletingStaff}
              disabled={deletingStaff}
              buttonColor="#EF4444" 
              textColor="#fff" 
              style={{ borderRadius: 8 }}
            >
              Delete
            </PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>

    </SafeAreaView>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function SectionCard({ title, icon, children }: { title: string; icon?: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        {icon && <Text style={styles.sectionIcon}>{icon}</Text>}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
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
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  inviteCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  inviteCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  inviteIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0F766E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  inviteSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  lastListItem: {
    borderBottomWidth: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  listItemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  itemSubText: {
    fontSize: 13,
    color: '#64748B',
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTextPending: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadgeActive: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTextActive: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  roleBtnActive: {
    borderColor: '#0F766E',
    backgroundColor: '#F0FDFA',
  },
  roleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  roleBtnTextActive: {
    color: '#0F766E',
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748B',
    paddingVertical: 20,
    fontSize: 14,
  },
  statusBadgeBlocked: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTextBlocked: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtn: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  }
});
