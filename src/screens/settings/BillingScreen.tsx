import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, SafeAreaView } from 'react-native';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';
import { billingApi } from '../../services/api';
import { ChevronLeft, CreditCard, Calendar, BarChart2, ShieldAlert, CheckCircle2, XCircle, Clock } from 'lucide-react-native';

interface BillingScreenProps {
  onBack: () => void;
  onUpgrade: () => void;
}

export default function BillingScreen({ onBack, onUpgrade }: BillingScreenProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const [subRes, txRes] = await Promise.all([
        billingApi.getSubscriptionStatus(),
        billingApi.getTransactions()
      ]);
      setSubscription(subRes.data);
      setTransactions(txRes.data || []);
    } catch (error) {
      console.error('Error fetching billing info:', error);
      Alert.alert('Error', 'Failed to fetch subscription and billing records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    );
  }

  const planId = subscription?.planId || 'FREE';
  const planName = subscription?.planName || 'Free Starter Pack';
  const status = subscription?.status || 'FREE_TRIAL';
  const billingCycle = subscription?.billingCycle || 'MONTHLY';
  const renewalDate = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'N/A';

  const limits = subscription?.limits || {
    employeeLimit: 1,
    primaryResourceLimit: 100,
    secondaryResourceLimit: 15,
    ticketLimit: 10,
    emailLimit: 500,
    hasWhatsapp: false,
    hasCustomWidget: false
  };

  const primaryResource = subscription?.primaryResource || 'LEAD';
  const leadLimit = primaryResource === 'LEAD' ? limits.primaryResourceLimit : limits.secondaryResourceLimit;
  const bookingLimit = (primaryResource === 'BOOKING' || primaryResource === 'APPOINTMENT') ? limits.primaryResourceLimit : limits.secondaryResourceLimit;

  const usage = subscription?.usage || {
    employeesCount: 0,
    leadsCount: 0,
    bookingsCount: 0,
    appointmentsCount: 0,
    ticketsCount: 0,
    emailsCount: 0
  };

  const combinedBookings = usage.bookingsCount + usage.appointmentsCount;

  const getStatusStyle = (statusStr: string) => {
    switch (statusStr.toUpperCase()) {
      case 'ACTIVE':
        return { bg: '#ECFDF5', text: '#059669', label: 'Active' };
      case 'FREE_TRIAL':
        return { bg: '#EFF6FF', text: '#2563EB', label: 'Free Trial' };
      case 'PAST_DUE':
        return { bg: '#FEF3C7', text: '#D97706', label: 'Past Due' };
      case 'CANCELLED':
        return { bg: '#FEE2E2', text: '#EF4444', label: 'Cancelled' };
      default:
        return { bg: '#F1F5F9', text: '#475569', label: 'Inactive' };
    }
  };

  const statusStyle = getStatusStyle(status);

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
            <Text style={styles.pageTitle}>Subscription & Billing</Text>
            <Text style={styles.pageSubtitle}>Manage plan limits and view invoices</Text>
          </View>
        </View>

        {/* ===== CURRENT PLAN CARD ===== */}
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planSub}>Current Plan</Text>
              <Text style={styles.planTitle}>{planName}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
            </View>
          </View>

          <View style={styles.planDivider} />

          <View style={styles.planDetails}>
            <View style={styles.detailRow}>
              <Calendar size={18} color="#64748B" style={styles.detailIcon} />
              <Text style={styles.detailText}>
                {status === 'CANCELLED' ? 'Expires on: ' : 'Renews on: '}
                <Text style={styles.detailHighlight}>{renewalDate}</Text>
              </Text>
            </View>
            <View style={styles.detailRow}>
              <CreditCard size={18} color="#64748B" style={styles.detailIcon} />
              <Text style={styles.detailText}>
                Billing period: <Text style={styles.detailHighlight}>{billingCycle.toLowerCase()}</Text>
              </Text>
            </View>
          </View>

          {planId === 'FREE' ? (
            <TouchableOpacity style={styles.upgradeBtn} onPress={onUpgrade}>
              <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.manageBtn} onPress={onUpgrade}>
              <Text style={styles.manageBtnText}>Change Subscription Plan</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ===== QUOTAS SECTION ===== */}
        <SectionCard title="Plan Quota & Usage" icon={<BarChart2 size={20} color="#0F766E" />}>
          <QuotaProgress 
            label="Employees / Seats" 
            current={usage.employeesCount} 
            max={limits.employeeLimit} 
            unit="seats"
          />
          <QuotaProgress 
            label="Lead Storage" 
            current={usage.leadsCount} 
            max={leadLimit} 
            unit="leads"
          />
          <QuotaProgress 
            label="Monthly Bookings & Appts" 
            current={combinedBookings} 
            max={bookingLimit} 
            unit="slots"
          />
          <QuotaProgress 
            label="Active Support Tickets" 
            current={usage.ticketsCount} 
            max={limits.ticketLimit} 
            unit="tickets"
          />
          <QuotaProgress 
            label="Email Campaign Credits" 
            current={usage.emailsCount} 
            max={limits.emailLimit} 
            unit="emails"
          />

          <View style={styles.featureRow}>
            <Text style={styles.featureLabel}>WhatsApp Integration:</Text>
            <Text style={[styles.featureValue, { color: limits.hasWhatsapp ? '#059669' : '#EF4444' }]}>
              {limits.hasWhatsapp ? '✓ Included' : '✕ Unavailable (Upgrade Required)'}
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureLabel}>Custom Chatbot Branding:</Text>
            <Text style={[styles.featureValue, { color: limits.hasCustomWidget ? '#059669' : '#EF4444' }]}>
              {limits.hasCustomWidget ? '✓ Included' : '✕ Unavailable (Upgrade Required)'}
            </Text>
          </View>
        </SectionCard>

        {/* ===== INVOICE HISTORY SECTION ===== */}
        <SectionCard title="Invoice & Payment History" icon={<CreditCard size={20} color="#0F766E" />}>
          {transactions.length === 0 ? (
            <Text style={styles.emptyText}>No transaction records found.</Text>
          ) : (
            transactions.map((tx, idx) => {
              const txDate = new Date(tx.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
              const amountStr = tx.currency === 'INR' ? `₹${tx.amount}` : `$${tx.amount}`;
              
              return (
                <View key={tx.id || idx} style={[styles.txItem, idx === transactions.length - 1 && styles.lastTxItem]}>
                  <View style={styles.txIconContainer}>
                    {tx.status === 'SUCCESS' ? (
                      <CheckCircle2 size={20} color="#059669" />
                    ) : tx.status === 'FAILED' ? (
                      <XCircle size={20} color="#EF4444" />
                    ) : (
                      <Clock size={20} color="#64748B" />
                    )}
                  </View>
                  <View style={styles.txContent}>
                    <Text style={styles.txTitle}>{tx.gatewayTransactionId || 'Transaction'}</Text>
                    <Text style={styles.txMeta}>{txDate} • via {tx.paymentGateway}</Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={styles.txAmount}>{amountStr}</Text>
                    <Text style={[styles.txStatus, { color: tx.status === 'SUCCESS' ? '#059669' : tx.status === 'FAILED' ? '#EF4444' : '#64748B' }]}>
                      {tx.status}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </SectionCard>

        {/* ===== BOTTOM SPACER ===== */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

interface QuotaProgressProps {
  label: string;
  current: number;
  max: number;
  unit: string;
}

function QuotaProgress({ label, current, max, unit }: QuotaProgressProps) {
  const isInfinite = max >= 1000000;
  const displayMax = isInfinite ? '∞' : max.toLocaleString();
  const percentage = isInfinite ? 0 : Math.min((current / max) * 100, 100);
  
  let progressColor = '#0F766E';
  if (percentage >= 90) {
    progressColor = '#EF4444';
  } else if (percentage >= 70) {
    progressColor = '#D97706';
  }

  return (
    <View style={styles.quotaWrapper}>
      <View style={styles.quotaHeader}>
        <Text style={styles.quotaLabel}>{label}</Text>
        <Text style={styles.quotaValues}>
          {current.toLocaleString()} / <Text style={styles.quotaMax}>{displayMax}</Text> {unit}
        </Text>
      </View>
      
      {!isInfinite && (
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: progressColor }]} />
        </View>
      )}
      
      {!isInfinite && percentage >= 90 && (
        <View style={styles.warningRow}>
          <ShieldAlert size={14} color="#EF4444" />
          <Text style={styles.warningText}>Approaching or reached plan limit. Consider upgrading.</Text>
        </View>
      )}
    </View>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconContainer}>{icon}</View>
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
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  planTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  planDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  planDetails: {
    gap: 12,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#475569',
  },
  detailHighlight: {
    fontWeight: '600',
    color: '#0F172A',
  },
  upgradeBtn: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  manageBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  manageBtnText: {
    color: '#0F766E',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionContent: {
    gap: 16,
  },
  quotaWrapper: {
    marginBottom: 4,
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quotaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  quotaValues: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  quotaMax: {
    color: '#64748B',
    fontWeight: '400',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  warningText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '500',
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  featureLabel: {
    fontSize: 14,
    color: '#475569',
  },
  featureValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    paddingVertical: 20,
    fontSize: 14,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  lastTxItem: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  txIconContainer: {
    marginRight: 12,
  },
  txContent: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  txMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  txStatus: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  }
});
