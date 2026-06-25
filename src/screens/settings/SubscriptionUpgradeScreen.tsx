import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, SafeAreaView, Linking } from 'react-native';
import { Text, ActivityIndicator, useTheme, Dialog, Portal, Button as PaperButton } from 'react-native-paper';
import { billingApi } from '../../services/api';
import { ChevronLeft, Check, Sparkles, Globe, CreditCard, ShieldAlert } from 'lucide-react-native';

interface SubscriptionUpgradeScreenProps {
  onBack: () => void;
  currentPlanId?: string;
  onSuccess: () => void;
}

export default function SubscriptionUpgradeScreen({ onBack, currentPlanId = 'FREE', onSuccess }: SubscriptionUpgradeScreenProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<string>(currentPlanId);

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      try {
        const res = await billingApi.getSubscriptionStatus();
        if (res.data?.planId) {
          setCurrentPlan(res.data.planId);
        }
      } catch (e) {
        console.error("Error fetching current plan:", e);
      }
    };
    fetchCurrentPlan();
  }, [currentPlanId]);
  
  // Payment selection dialog
  const [paymentDialogVisible, setPaymentDialogVisible] = useState(false);
  
  // Razorpay sandbox simulation dialog
  const [simulationDialogVisible, setSimulationDialogVisible] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const plans = [
    {
      id: 'FREE',
      name: 'Free Starter Pack',
      priceMonthly: 0,
      priceYearly: 0,
      features: [
        '1 Employee Seat limit',
        'Up to 100 Leads storage',
        '15 Monthly Bookings / Appts',
        '10 Active Support Tickets',
        '500 Email campaigns / month',
        '✕ WhatsApp API Integration',
        '✕ Custom Chatbot Branding',
      ],
      color: '#64748B',
      isPopular: false,
    },
    {
      id: 'PRO',
      name: 'Scale Professional',
      priceMonthly: 2999,
      priceYearly: 28790, // ~20% off
      features: [
        '10 Employee Seats included',
        'Unlimited Leads storage',
        'Unlimited Bookings & Appts',
        'Unlimited Support Tickets',
        '25,000 Emails / month',
        '✓ WhatsApp API Integration',
        '✓ Custom Chatbot Branding',
      ],
      color: '#0F766E', // primary teal
      isPopular: true,
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise Custom',
      priceMonthly: 9999,
      priceYearly: 95990, // ~20% off
      features: [
        'Unlimited Employee Seats',
        'Unlimited Leads storage',
        'Unlimited Bookings & Appts',
        'Unlimited Support Tickets',
        'Unlimited Emails / month',
        '✓ WhatsApp API Integration',
        '✓ Custom Chatbot Branding',
        '✓ Dedicated Account Manager',
      ],
      color: '#7C3AED', // premium purple
      isPopular: false,
    },
  ];

  const handlePlanSelect = (plan: any) => {
    if (plan.id === currentPlan) {
      Alert.alert('Current Plan', `You are already subscribed to the ${plan.name}.`);
      return;
    }
    if (plan.id === 'FREE') {
      Alert.alert('Downgrade Plan', 'Downgrades to the Free tier are not processed automatically. Please contact our support team.');
      return;
    }
    setSelectedPlan(plan);
    setPaymentDialogVisible(true);
  };

  const handleCheckout = async (gateway: 'STRIPE' | 'RAZORPAY') => {
    setPaymentDialogVisible(false);
    setLoading(true);
    
    try {
      const response = await billingApi.initiateCheckout({
        planId: selectedPlan.id,
        billingCycle,
        gateway
      });

      if (gateway === 'STRIPE') {
        const { checkoutUrl } = response.data;
        if (checkoutUrl) {
          Alert.alert(
            'Redirecting to Stripe',
            'We are opening secure card payment interface in your web browser. Return to the app after completion.',
            [
              {
                text: 'Proceed',
                onPress: () => {
                  Linking.openURL(checkoutUrl).catch(() => {
                    Alert.alert('Error', 'Failed to open the checkout URL automatically.');
                  });
                  // Trigger success check since Stripe completed in browser
                  onSuccess();
                }
              },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
        } else {
          Alert.alert('Error', 'Stripe checkout URL not returned.');
        }
      } else if (gateway === 'RAZORPAY') {
        const { orderId } = response.data;
        setPendingOrderId(orderId);
        // Show simulation modal for Razorpay Sandbox
        setSimulationDialogVisible(true);
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      const msg = error.response?.data || 'Failed to initiate checkout session.';
      Alert.alert('Checkout Error', typeof msg === 'string' ? msg : 'An error occurred during checkout initiation.');
    } finally {
      setLoading(false);
    }
  };

  const simulateSuccess = async () => {
    setSimulationDialogVisible(false);
    if (!pendingOrderId) return;
    setLoading(true);
    try {
      await billingApi.initiateCheckout({
        planId: selectedPlan.id,
        billingCycle,
        gateway: 'MOCK_SUCCESS', // Trigger directly or via our custom mock endpoint
      }).catch(() => {}); // Fallback

      // Let's call the dedicated mock success API
      const res = await apiMockSuccess(pendingOrderId);
      Alert.alert(
        'Payment Successful',
        `Success! Your tenant subscription has been upgraded to ${selectedPlan.name} in sandbox mode.`,
        [{ text: 'Great', onPress: onSuccess }]
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  const apiMockSuccess = async (orderId: string) => {
    // Custom wrapper call
    const axiosInstance = require('../../services/api').default;
    return axiosInstance.post('/billing/mock-success', { orderId });
  };

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
            <Text style={styles.pageTitle}>Upgrade Subscription</Text>
            <Text style={styles.pageSubtitle}>Select the perfect growth plan for your team</Text>
          </View>
        </View>

        {/* ===== BILLING CYCLE TOGGLE ===== */}
        <View style={styles.cycleToggleContainer}>
          <TouchableOpacity 
            style={[styles.cycleBtn, billingCycle === 'MONTHLY' && styles.cycleBtnActive]}
            onPress={() => setBillingCycle('MONTHLY')}
          >
            <Text style={[styles.cycleText, billingCycle === 'MONTHLY' && styles.cycleTextActive]}>
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.cycleBtn, billingCycle === 'YEARLY' && styles.cycleBtnActive, { position: 'relative' }]}
            onPress={() => setBillingCycle('YEARLY')}
          >
            <Text style={[styles.cycleText, billingCycle === 'YEARLY' && styles.cycleTextActive]}>
              Yearly
            </Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>SAVE 20%</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ===== PRICING CARDS ===== */}
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const displayPrice = billingCycle === 'YEARLY' ? plan.priceYearly : plan.priceMonthly;
          const periodSuffix = billingCycle === 'YEARLY' ? '/ year' : '/ month';
          const calculatedMonthlyPrice = billingCycle === 'YEARLY' ? Math.round(plan.priceYearly / 12) : plan.priceMonthly;
          
          return (
            <View 
              key={plan.id} 
              style={[
                styles.planCard, 
                { borderColor: plan.isPopular ? '#0F766E' : '#E2E8F0' },
                plan.isPopular && styles.popularPlanCard
              ]}
            >
              {plan.isPopular && (
                <View style={styles.popularLabel}>
                  <Sparkles size={12} color="#fff" />
                  <Text style={styles.popularLabelText}>MOST POPULAR</Text>
                </View>
              )}

              <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
              
              <View style={styles.priceContainer}>
                {plan.priceMonthly === 0 ? (
                  <Text style={styles.priceAmount}>Free</Text>
                ) : (
                  <>
                    <Text style={styles.priceCurrency}>₹</Text>
                    <Text style={styles.priceAmount}>{displayPrice.toLocaleString()}</Text>
                    <Text style={styles.pricePeriod}>{periodSuffix}</Text>
                  </>
                )}
              </View>

              {billingCycle === 'YEARLY' && plan.priceMonthly > 0 && (
                <Text style={styles.yearlySubtext}>
                  Equivalent to ₹{calculatedMonthlyPrice.toLocaleString()}/month, billed annually
                </Text>
              )}

              <View style={styles.divider} />

              <View style={styles.featuresContainer}>
                {plan.features.map((feature, index) => {
                  const isCross = feature.startsWith('✕');
                  return (
                    <View key={index} style={styles.featureRow}>
                      <Check 
                        size={16} 
                        color={isCross ? '#EF4444' : plan.color} 
                        style={styles.featureIcon} 
                      />
                      <Text style={[styles.featureText, isCross && styles.featureTextDisabled]}>
                        {feature.replace(/^[✕✓]\s*/, '')}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity 
                style={[
                  styles.selectBtn, 
                  { backgroundColor: isCurrent ? '#F1F5F9' : plan.color },
                  isCurrent && styles.disabledSelectBtn
                ]}
                onPress={() => handlePlanSelect(plan)}
                disabled={isCurrent}
              >
                <Text style={[styles.selectBtnText, { color: isCurrent ? '#94A3B8' : '#fff' }]}>
                  {isCurrent ? 'Current Plan' : 'Select Plan'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* ===== BOTTOM SPACER ===== */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ===== PAYMENT GATEWAY SELECTOR DIALOG ===== */}
      <Portal>
        <Dialog 
          visible={paymentDialogVisible} 
          onDismiss={() => setPaymentDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Select Payment Method</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogDescription}>
              Choose a billing gateway to upgrade your plan to <Text style={{ fontWeight: '700' }}>{selectedPlan?.name}</Text>:
            </Text>
            
            <TouchableOpacity style={styles.gatewayOption} onPress={() => handleCheckout('RAZORPAY')}>
              <View style={styles.gatewayIconContainer}>
                <Globe size={22} color="#0F766E" />
              </View>
              <View style={styles.gatewayTextContainer}>
                <Text style={styles.gatewayTitle}>Razorpay (India Domestic)</Text>
                <Text style={styles.gatewaySubtitle}>UPI, NetBanking, Domestic Credit/Debit Cards</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gatewayOption} onPress={() => handleCheckout('STRIPE')}>
              <View style={styles.gatewayIconContainer}>
                <CreditCard size={22} color="#0F766E" />
              </View>
              <View style={styles.gatewayTextContainer}>
                <Text style={styles.gatewayTitle}>Stripe (International Cards)</Text>
                <Text style={styles.gatewaySubtitle}>Visa, MasterCard, American Express, Apple Pay</Text>
              </View>
            </TouchableOpacity>
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={() => setPaymentDialogVisible(false)}>Cancel</PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* ===== RAZORPAY SANDBOX CHECKOUT SIMULATOR ===== */}
      <Portal>
        <Dialog 
          visible={simulationDialogVisible} 
          onDismiss={() => setSimulationDialogVisible(false)}
          style={styles.simulatorDialog}
          dismissable={false}
        >
          <Dialog.Title style={styles.simulatorTitle}>
            Razorpay Sandbox checkout
          </Dialog.Title>
          <Dialog.Content>
            <View style={styles.simulatorWarningRow}>
              <ShieldAlert size={20} color="#0F766E" />
              <Text style={styles.simulatorWarningText}>
                Demo sandbox checkout mode is active.
              </Text>
            </View>
            <Text style={styles.simulatorText}>
              Your test order <Text style={{ fontWeight: '700' }}>{pendingOrderId}</Text> has been created. Click below to simulate payment success and test quota updates.
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ flexDirection: 'column', gap: 10, paddingBottom: 16 }}>
            <PaperButton 
              onPress={simulateSuccess} 
              mode="contained"
              buttonColor="#0F766E"
              textColor="#fff"
              style={{ width: '100%', borderRadius: 8 }}
            >
              Simulate Successful Payment
            </PaperButton>
            <PaperButton 
              onPress={() => setSimulationDialogVisible(false)} 
              textColor="#64748B"
              style={{ width: '100%' }}
            >
              Cancel Payment
            </PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.overlayText}>Processing subscription request...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  cycleToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    alignSelf: 'center',
    width: '70%',
  },
  cycleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  cycleBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cycleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  cycleTextActive: {
    color: '#0F766E',
  },
  saveBadge: {
    position: 'absolute',
    top: -12,
    right: -10,
    backgroundColor: '#0F766E',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  saveBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  popularPlanCard: {
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  popularLabel: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#0F766E',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
  },
  popularLabelText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  priceCurrency: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 2,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
  },
  pricePeriod: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 4,
  },
  yearlySubtext: {
    fontSize: 12,
    color: '#0F766E',
    fontWeight: '500',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    marginRight: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#334155',
  },
  featureTextDisabled: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  selectBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledSelectBtn: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  overlayText: {
    marginTop: 16,
    color: '#0F766E',
    fontWeight: '600',
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 14,
  },
  dialogTitle: {
    fontWeight: '700',
    color: '#0F172A',
    fontSize: 18,
  },
  dialogDescription: {
    color: '#64748B',
    fontSize: 14,
    marginBottom: 16,
  },
  gatewayOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  gatewayIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  gatewayTextContainer: {
    flex: 1,
  },
  gatewayTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  gatewaySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  simulatorDialog: {
    backgroundColor: '#fff',
    borderRadius: 14,
  },
  simulatorTitle: {
    color: '#0F766E',
    fontWeight: '800',
  },
  simulatorWarningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  simulatorWarningText: {
    color: '#0F766E',
    fontWeight: '700',
    fontSize: 14,
  },
  simulatorText: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  }
});
