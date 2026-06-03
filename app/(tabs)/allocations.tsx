import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { calculateFinanceSnapshot } from '../../services/finance';

type ViewState = 'overview' | 'creating' | 'adding' | 'releasing';

interface Allocation {
  id: string;
  title: string;
  amount: number;
}

interface Profile {
  monthly_income: number;
  current_month_spent: number;
}

export default function Allocations() {
  const insets = useSafeAreaInsets();

  // ── State ──────────────────────────────────────────────────────────────────
  const [viewState, setViewState] = useState<ViewState>('overview');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeAllocations, setActiveAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [releaseAmount, setReleaseAmount] = useState('');
  const [isReleaseAll, setIsReleaseAll] = useState(false);
  const [targetGoalId, setTargetGoalId] = useState<string | null>(null);

  // Modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalAllocated = activeAllocations.reduce((sum, a) => sum + a.amount, 0);
  const finance = calculateFinanceSnapshot({
    income: profile?.monthly_income ?? 0,
    spent: profile?.current_month_spent ?? 0,
    commitments: totalAllocated,
  });

  const flexiblePool = finance.flexiblePool;
  const remainingDays = finance.remainingDays;

  const targetGoal = activeAllocations.find((a) => a.id === targetGoalId);

  const parsedAmount = parseInt(newAmount) || 0;
  const parsedReleaseAmount = parseInt(releaseAmount) || 0;
  const safeAllocation = Math.max(0, Math.min(parsedAmount, flexiblePool));
  const safeRelease = Math.max(0, Math.min(parsedReleaseAmount, targetGoal?.amount ?? 0));

  const projectedPool = flexiblePool - safeAllocation;
  const projectedPoolAfterRelease = flexiblePool + safeRelease;

  // ── Data Fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('monthly_income, current_month_spent')
        .eq('id', user.id)
        .single();

      const { data: allocationsData } = await supabase
        .from('allocations')
        .select('*')
        .eq('user_id', user.id);

      setProfile(profileData);
      setActiveAllocations(allocationsData || []);
    } catch (err) {
      console.error('fetchData error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setNewTitle('');
    setNewAmount('');
    setReleaseAmount('');
    setIsReleaseAll(false);
    setTargetGoalId(null);
  };

  /**
   * After any mutation: re-fetch data so we know the real new flexiblePool,
   * update the profile's daily_spend_limit in the DB, then show the modal.
   */
  const finaliseAndShowSuccess = async (userId: string) => {
    // Re-fetch so totals are accurate
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('monthly_income, current_month_spent')
      .eq('id', userId)
      .single();

    const { data: updatedAllocations } = await supabase
      .from('allocations')
      .select('*')
      .eq('user_id', userId);

    const newTotalAllocated = (updatedAllocations || []).reduce(
      (sum: number, a: Allocation) => sum + a.amount,
      0,
    );

    setProfile(updatedProfile);
    setActiveAllocations(updatedAllocations || []);

    const projected = calculateFinanceSnapshot({
      income: updatedProfile?.monthly_income ?? 0,
      spent: updatedProfile?.current_month_spent ?? 0,
      commitments: newTotalAllocated,
    });

    setModalMessage(
      `Safe to spend today is now ₹${projected.dailySpendLimit.toLocaleString()}.`
    );
    setViewState('overview');
    setShowSuccessModal(true);
    resetForm();
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  // CREATE
  const handleConfirmNewAllocation = async () => {
    try {
      if (!newTitle.trim() || safeAllocation <= 0) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('allocations')
        .insert({
          user_id: user.id,
          title: newTitle.trim(),
          amount: safeAllocation,
        })
        .select();

      if (error) {
        console.error('INSERT ERROR:', error);
        return;
      }
      await finaliseAndShowSuccess(user.id);
    } catch (err) {
      console.error('handleConfirmNewAllocation error:', err);
    }
  };

  // ADD FUNDS
  const handleInitAddFunds = (id: string) => {
    setTargetGoalId(id);
    setNewAmount('');
    setViewState('adding');
  };

  const handleConfirmAddFunds = async () => {
    try {
      if (!targetGoalId || safeAllocation <= 0 || !targetGoal) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('allocations')
        .update({ amount: targetGoal.amount + safeAllocation })
        .eq('id', targetGoalId);

      if (error) {
        console.error('ADD FUNDS ERROR:', error);
        return;
      }

      await finaliseAndShowSuccess(user.id);
    } catch (err) {
      console.error('handleConfirmAddFunds error:', err);
    }
  };

  // RELEASE
  const handleInitRelease = (id: string) => {
    setTargetGoalId(id);
    setReleaseAmount('');
    setIsReleaseAll(false);
    setViewState('releasing');
  };

  const handleToggleReleaseAll = () => {
    if (!targetGoal) return;
    if (isReleaseAll) {
      setIsReleaseAll(false);
      setReleaseAmount('');
    } else {
      setIsReleaseAll(true);
      setReleaseAmount(targetGoal.amount.toString());
    }
  };

  const handleReleaseAmountChange = (val: string) => {
    setReleaseAmount(val);
    setIsReleaseAll(targetGoal ? parseInt(val) === targetGoal.amount : false);
  };

  const handleConfirmRelease = async () => {
    try {
      if (!targetGoalId || !targetGoal || safeRelease <= 0) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const remaining = targetGoal.amount - safeRelease;

      if (remaining <= 0) {
        const { error } = await supabase
          .from('allocations')
          .delete()
          .eq('id', targetGoalId);
        if (error) { console.error('DELETE ERROR:', error); return; }
      } else {
        const { error } = await supabase
          .from('allocations')
          .update({ amount: remaining })
          .eq('id', targetGoalId);
        if (error) { console.error('UPDATE ERROR:', error); return; }
      }

      await finaliseAndShowSuccess(user.id);
    } catch (err) {
      console.error('handleConfirmRelease error:', err);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#166534" />
        <Text style={styles.loadingText}>Loading your locker</Text>
      </SafeAreaView>
    );
  }

  // ── RENDER: RELEASE ────────────────────────────────────────────────────────
  if (viewState === 'releasing' && targetGoal) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar barStyle="light-content" backgroundColor="#166534" />
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerInner}>
            <View style={styles.headerSide} />
            <Text style={styles.headerTitle}>Release Funds</Text>
            <View style={styles.headerSide}>
              <Pressable style={styles.headerIconBtn} onPress={() => setViewState('overview')}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 25, paddingBottom: 120 }}
        >
          <View style={styles.targetGoalCard}>
            <View style={styles.targetGoalIconBox}>
              <Ionicons name="wallet-outline" size={28} color="#166534" />
            </View>
            <View style={{ marginLeft: 16 }}>
              <Text style={styles.targetGoalTitle}>{targetGoal.title}</Text>
              <Text style={styles.targetGoalAmount}>
                Locked: ₹{targetGoal.amount.toLocaleString()}
              </Text>
            </View>
          </View>

          <Text style={[styles.inputLabel, { marginTop: 32 }]}>AMOUNT TO RELEASE</Text>
          <View style={styles.currencyInputWrapper}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.currencyInput}
              placeholder="0"
              placeholderTextColor="#CBD5E1"
              keyboardType="number-pad"
              value={releaseAmount}
              onChangeText={handleReleaseAmountChange}
              maxLength={7}
            />
          </View>

          {safeRelease > 0 && (
            <View style={styles.projectionRow}>
              <Ionicons name="trending-up-outline" size={16} color="#166534" />
              <Text style={styles.projectionText}>
                Pool becomes ₹{projectedPoolAfterRelease.toLocaleString()}
              </Text>
            </View>
          )}

          <Pressable style={styles.checkboxContainer} onPress={handleToggleReleaseAll}>
            <Ionicons
              name={isReleaseAll ? 'checkbox' : 'square-outline'}
              size={24}
              color={isReleaseAll ? '#166534' : '#94A3B8'}
            />
            <Text style={styles.checkboxText}>Release all funds back to pool</Text>
          </Pressable>

          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#64748B"
              style={{ marginTop: 2 }}
            />
            <Text style={styles.infoText}>
              Released funds return to your Flexible Pool and increase your daily safe-to-spend
              on the dashboard.
            </Text>
          </View>

          <Pressable
            style={[
              styles.primaryBtn,
              { marginTop: 40 },
              safeRelease <= 0 && styles.primaryBtnDisabled,
            ]}
            onPress={handleConfirmRelease}
            disabled={safeRelease <= 0}
          >
            <Text style={styles.primaryBtnText}>Confirm Release</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── RENDER: ADD FUNDS ──────────────────────────────────────────────────────
  if (viewState === 'adding' && targetGoal) {
    const allocationPercent =
      flexiblePool > 0 ? Math.min((safeAllocation / flexiblePool) * 100, 100) : 0;

    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar barStyle="light-content" backgroundColor="#166534" />
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerInner}>
            <View style={styles.headerSide} />
            <Text style={styles.headerTitle}>Top Up Goal</Text>
            <View style={styles.headerSide}>
              <Pressable style={styles.headerIconBtn} onPress={() => setViewState('overview')}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 25, paddingBottom: 120 }}
        >
          <View style={styles.targetGoalCard}>
            <View style={styles.targetGoalIconBox}>
              <Ionicons name="wallet-outline" size={28} color="#166534" />
            </View>
            <View style={{ marginLeft: 16 }}>
              <Text style={styles.targetGoalTitle}>{targetGoal.title}</Text>
              <Text style={styles.targetGoalAmount}>
                Currently locked: ₹{targetGoal.amount.toLocaleString()}
              </Text>
            </View>
          </View>

          <Text style={[styles.inputLabel, { marginTop: 32 }]}>HOW MUCH TO ADD?</Text>
          <View style={styles.currencyInputWrapper}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.currencyInput}
              placeholder="0"
              placeholderTextColor="#CBD5E1"
              keyboardType="number-pad"
              value={newAmount}
              onChangeText={setNewAmount}
              maxLength={7}
            />
          </View>

          <View style={styles.visualBarSection}>
            <View style={styles.visualBarLabels}>
              <Text style={styles.visualLabelLeft}>
                Adding: ₹{safeAllocation.toLocaleString()}
              </Text>
              <Text style={styles.visualLabelRight}>
                Remaining: ₹{projectedPool.toLocaleString()}
              </Text>
            </View>
            <View style={styles.visualBarTrack}>
              <View style={[styles.visualBarFill, { width: `${allocationPercent}%` }]} />
            </View>
          </View>

          <Pressable
            style={[
              styles.primaryBtn,
              { marginTop: 40 },
              safeAllocation <= 0 && styles.primaryBtnDisabled,
            ]}
            onPress={handleConfirmAddFunds}
            disabled={safeAllocation <= 0}
          >
            <Text style={styles.primaryBtnText}>Confirm Add Funds</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── RENDER: CREATE ─────────────────────────────────────────────────────────
  if (viewState === 'creating') {
    const allocationPercent =
      flexiblePool > 0 ? Math.min((safeAllocation / flexiblePool) * 100, 100) : 0;
    const canConfirm = newTitle.trim().length > 0 && safeAllocation > 0;

    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar barStyle="light-content" backgroundColor="#166534" />
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerInner}>
            <View style={styles.headerSide} />
            <Text style={styles.headerTitle}>New Goal</Text>
            <View style={styles.headerSide}>
              <Pressable style={styles.headerIconBtn} onPress={() => setViewState('overview')}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 25, paddingBottom: 120 }}
        >
          {/* Pool indicator */}
          <View style={styles.poolIndicatorRow}>
            <Ionicons name="water-outline" size={16} color="#166534" />
            <Text style={styles.poolIndicatorText}>
              Available pool: ₹{flexiblePool.toLocaleString()}
            </Text>
          </View>

          <Text style={styles.inputLabel}>WHAT ARE YOU SAVING FOR?</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., Weekend Trip, New Laptop…"
            placeholderTextColor="#94A3B8"
            value={newTitle}
            onChangeText={setNewTitle}
          />

          <Text style={[styles.inputLabel, { marginTop: 32 }]}>AMOUNT TO LOCK</Text>
          <View style={styles.currencyInputWrapper}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.currencyInput}
              placeholder="0"
              placeholderTextColor="#CBD5E1"
              keyboardType="number-pad"
              value={newAmount}
              onChangeText={setNewAmount}
              maxLength={7}
            />
          </View>

          {parsedAmount > flexiblePool && (
            <Text style={styles.capWarning}>
              Capped at ₹{flexiblePool.toLocaleString()} (your full pool)
            </Text>
          )}

          <View style={styles.visualBarSection}>
            <View style={styles.visualBarLabels}>
              <Text style={styles.visualLabelLeft}>
                Locking: ₹{safeAllocation.toLocaleString()}
              </Text>
              <Text style={styles.visualLabelRight}>
                Remaining: ₹{projectedPool.toLocaleString()}
              </Text>
            </View>
            <View style={styles.visualBarTrack}>
              <View style={[styles.visualBarFill, { width: `${allocationPercent}%` }]} />
            </View>
          </View>

          <Pressable
            style={[styles.primaryBtn, { marginTop: 40 }, !canConfirm && styles.primaryBtnDisabled]}
            onPress={handleConfirmNewAllocation}
            disabled={!canConfirm}
          >
            <Text style={styles.primaryBtnText}>Add to Locker</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── RENDER: OVERVIEW ───────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#166534" />
      
      {/* Centered Notch Header with Locker Icon */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerInner}>
          <View style={styles.headerSide} /> 
          <Text style={styles.headerTitle}>Locker</Text>
          <View style={styles.headerSide}>
            <Pressable style={styles.headerIconBtn}>
              <Ionicons name="lock-closed-outline" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── POOL HERO ── */}
        <View style={styles.poolWrapper}>
          <LinearGradient colors={['#F0FDF4', '#DCFCE7']} style={styles.lightPoolHero}>
            <View style={styles.textureCircle1} />
            <View style={styles.textureCircle2} />
            <View style={styles.textureCircle3} />

            <View style={styles.poolContentZIndex}>
              <View style={styles.poolTopRow}>
                <View style={styles.poolBadgeLight}>
                  <Ionicons name="water-outline" size={14} color="#166534" />
                  <Text style={styles.poolBadgeTextLight}>FLEXIBLE POOL</Text>
                </View>
              </View>

              <View style={styles.poolCenter}>
                <Text style={styles.poolCurrencyLight}>₹</Text>
                <Text style={styles.poolAmountLight}>{flexiblePool.toLocaleString()}</Text>
              </View>

              {/* Enhanced Quick Stats */}
              <View style={styles.poolStatsRow}>
                <View style={styles.poolStatChip}>
                  <Ionicons name="lock-closed-outline" size={14} color="#64748B" />
                  <Text style={styles.poolStatText}>
                    ₹{totalAllocated.toLocaleString()} locked
                  </Text>
                </View>
                <View style={styles.poolStatChip}>
                  <Ionicons name="calendar-outline" size={14} color="#166534" />
                  <Text style={[styles.poolStatText, { color: '#166534' }]}>
                    {finance.remainingDays}d left
                  </Text>
                </View>
                <View style={styles.poolStatChip}>
                  <Ionicons name="trending-up-outline" size={14} color="#64748B" />
                  <Text style={styles.poolStatText}>
                    ₹{finance.dailySpendLimit.toLocaleString()}/day
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── ACTIVE GOALS ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Goals</Text>
          <Pressable
            style={styles.newGoalBtn}
            onPress={() => setViewState('creating')}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.newGoalBtnText}>New Goal</Text>
          </Pressable>
        </View>

        {activeAllocations.length === 0 ? (
          /* ── EMPTY STATE ── */
          <View style={styles.emptyStateWrapper}>
            <LinearGradient
              colors={['#F8FAFC', '#F0FDF4']}
              style={styles.emptyStateCard}
            >
              <View style={styles.emptyRing1} />
              <View style={styles.emptyRing2} />

              <View style={styles.emptyIconOuter}>
                <View style={styles.emptyIconInner}>
                  <Ionicons name="wallet-outline" size={36} color="#166534" />
                </View>
              </View>

              <Text style={styles.emptyTitle}>No goals yet</Text>
              <Text style={styles.emptySubtitle}>
                Lock funds for a purpose — a trip, a gadget, an emergency buffer. Your daily
                spend stays accurate and your goals stay safe.
              </Text>

              <Pressable
                style={styles.emptyActionBtn}
                onPress={() => setViewState('creating')}
              >
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.emptyActionBtnText}>Create First Goal</Text>
              </Pressable>

              <Text style={styles.emptyPoolHint}>
                ₹{flexiblePool.toLocaleString()} available to allocate
              </Text>
            </LinearGradient>
          </View>
        ) : (
          activeAllocations.map((item) => (
            <View key={item.id} style={styles.vaultCard}>
              <View style={styles.vaultTop}>
                <View style={styles.vaultIconBox}>
                  <Ionicons name="wallet-outline" size={26} color="#166534" />
                </View>
                <View style={styles.vaultInfo}>
                  <Text style={styles.vaultTitle}>{item.title}</Text>
                  <Text style={styles.vaultAmount}>₹{item.amount.toLocaleString()}</Text>
                </View>
              </View>

              <View style={styles.vaultBottom}>
                <View style={styles.vaultStatusPill}>
                  <Ionicons name="shield-checkmark" size={12} color="#16A34A" />
                  <Text style={styles.lockedText}>Secured</Text>
                </View>
                <View style={styles.actionRow}>
                  <Pressable
                    style={styles.actionBtnRelease}
                    onPress={() => handleInitRelease(item.id)}
                  >
                    <Text style={styles.actionBtnTextRelease}>Release</Text>
                  </Pressable>
                  <Pressable
                    style={styles.actionBtnAdd}
                    onPress={() => handleInitAddFunds(item.id)}
                  >
                    <Ionicons name="add" size={14} color="#FFFFFF" />
                    <Text style={styles.actionBtnTextAdd}>Top Up</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── SUCCESS MODAL ── */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="checkmark" size={36} color="#FFFFFF" />
            </View>
            <Text style={styles.modalTitle}>Done!</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <Pressable style={styles.modalBtn} onPress={() => setShowSuccessModal(false)}>
              <Text style={styles.modalBtnText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  loadingText: { marginTop: 12, fontWeight: '500', color: '#64748B', fontSize: 14 },

  // Matched Header
  header: { 
    backgroundColor: '#166534', 
    paddingBottom: 20, 
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerInner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20 
  },
  headerSide: { 
    width: 44, // Match icon button width for perfect centering
    alignItems: 'center'
  },
  headerTitle: { 
    flex: 1, 
    textAlign: 'center', 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#FFFFFF' 
  },
  headerIconBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  scrollContent: { paddingHorizontal: 20, paddingTop: 24 },

  // Upgraded Pool Hero
  poolWrapper: {
    marginBottom: 36,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    elevation: 4,
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  lightPoolHero: { padding: 28, position: 'relative' },
  poolContentZIndex: { zIndex: 10 },
  textureCircle1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: '#FFFFFF', opacity: 0.5, top: -70, right: -50,
  },
  textureCircle2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: '#86EFAC', opacity: 0.25, bottom: -30, left: -30,
  },
  textureCircle3: {
    position: 'absolute', width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#FFFFFF', opacity: 0.4, top: 50, left: 70,
  },
  poolTopRow: { alignItems: 'center', marginBottom: 18 },
  poolBadgeLight: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: 24,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1
  },
  poolBadgeTextLight: {
    fontSize: 11, fontWeight: '700', color: '#166534',
    marginLeft: 6, letterSpacing: 1.2,
  },
  poolCenter: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'flex-start', marginBottom: 28,
  },
  poolCurrencyLight: {
    fontSize: 26, fontWeight: '800',
    color: '#166534', marginTop: 8, marginRight: 4,
  },
  poolAmountLight: {
    fontSize: 62, fontWeight: '800',
    color: '#0F172A', letterSpacing: -2.5,
  },
  poolStatsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%' 
  },
  poolStatChip: {
    flex: 1,
    flexDirection: 'column', 
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)', 
    paddingVertical: 10,
    borderRadius: 14, 
    marginHorizontal: 4,
  },
  poolStatText: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#475569',
    marginTop: 4,
    textAlign: 'center'
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  newGoalBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#166534', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 14, shadowColor: '#166534', shadowOpacity: 0.2, shadowRadius: 4, elevation: 2
  },
  newGoalBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  // Empty State
  emptyStateWrapper: { marginBottom: 16 },
  emptyStateCard: {
    borderRadius: 28, padding: 36, alignItems: 'center',
    borderWidth: 1, borderColor: '#DCFCE7', overflow: 'hidden', position: 'relative',
  },
  emptyRing1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    borderWidth: 1.5, borderColor: '#DCFCE7', top: -60, right: -60, opacity: 0.6,
  },
  emptyRing2: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    borderWidth: 1.5, borderColor: '#BBF7D0', bottom: -40, left: -40, opacity: 0.6,
  },
  emptyIconOuter: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#DCFCE7', justifyContent: 'center',
    alignItems: 'center', marginBottom: 24, zIndex: 1,
  },
  emptyIconInner: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#F0FDF4', justifyContent: 'center',
    alignItems: 'center', borderWidth: 1.5, borderColor: '#BBF7D0',
  },
  emptyTitle: {
    fontSize: 24, fontWeight: '800',
    color: '#0F172A', marginBottom: 12, zIndex: 1,
  },
  emptySubtitle: {
    fontSize: 15, fontWeight: '500', color: '#64748B',
    textAlign: 'center', lineHeight: 24, marginBottom: 28, zIndex: 1,
  },
  emptyActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#166534', paddingHorizontal: 28, paddingVertical: 16,
    borderRadius: 16, marginBottom: 16, zIndex: 1,
    shadowColor: '#166534', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
  },
  emptyActionBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  emptyPoolHint: {
    fontSize: 13, fontWeight: '500',
    color: '#94A3B8', zIndex: 1,
  },

  // Upgraded Vault Cards
  vaultCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1,
    borderColor: '#E2E8F0', marginBottom: 18,
    shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  vaultTop: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingBottom: 20 },
  vaultIconBox: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: '#F0FDF4', justifyContent: 'center',
    alignItems: 'center', marginRight: 18,
  },
  vaultInfo: { flex: 1 },
  vaultTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  vaultAmount: {
    fontSize: 24, fontWeight: '800',
    color: '#166534', marginTop: 4, letterSpacing: -0.5,
  },
  vaultBottom: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 24, paddingBottom: 20, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: '#F8FAFC', backgroundColor: '#FAFAFA', borderBottomLeftRadius: 24, borderBottomRightRadius: 24
  },
  vaultStatusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12
  },
  lockedText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtnRelease: {
    backgroundColor: '#FFFFFF', paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0',
  },
  actionBtnTextRelease: { fontSize: 13, fontWeight: '700', color: '#475569' },
  actionBtnAdd: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#166534', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12,
  },
  actionBtnTextAdd: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  // Forms
  poolIndicatorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0FDF4', paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 16, marginBottom: 28, borderWidth: 1, borderColor: '#DCFCE7',
  },
  poolIndicatorText: { fontSize: 14, fontWeight: '700', color: '#166534' },

  targetGoalCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', padding: 20, borderRadius: 20,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  targetGoalIconBox: {
    width: 60, height: 60, borderRadius: 20,
    backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center',
  },
  targetGoalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  targetGoalAmount: { fontSize: 14, fontWeight: '500', color: '#166534', marginTop: 4 },

  inputLabel: {
    fontSize: 12, fontWeight: '700', color: '#64748B',
    letterSpacing: 1.2, marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 16, padding: 18, fontSize: 16,
    fontWeight: '500', color: '#0F172A',
  },
  currencyInputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: '#166534', paddingBottom: 10,
  },
  currencySymbol: {
    fontSize: 40, fontWeight: '800',
    color: '#0F172A', marginRight: 10,
  },
  currencyInput: {
    flex: 1, fontSize: 48, fontWeight: '800', color: '#0F172A',
  },
  capWarning: {
    fontSize: 13, fontWeight: '500', color: '#F59E0B',
    marginTop: 8,
  },

  projectionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 16,
  },
  projectionText: { fontSize: 14, fontWeight: '700', color: '#166534' },

  checkboxContainer: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 24, paddingVertical: 10,
  },
  checkboxText: {
    fontSize: 15, fontWeight: '500',
    color: '#0F172A', marginLeft: 12,
  },

  visualBarSection: { marginTop: 36, marginBottom: 28 },
  visualBarLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  visualLabelLeft: { fontSize: 12, fontWeight: '700', color: '#166534' },
  visualLabelRight: { fontSize: 12, fontWeight: '500', color: '#94A3B8' },
  visualBarTrack: {
    height: 14, backgroundColor: '#F1F5F9', borderRadius: 7,
    overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0',
  },
  visualBarFill: { height: '100%', backgroundColor: '#166534', borderRadius: 7 },

  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#F8FAFC', padding: 18, borderRadius: 16,
    borderWidth: 1, borderColor: '#E2E8F0', marginTop: 16,
  },
  infoText: {
    flex: 1, marginLeft: 12, fontSize: 13,
    fontWeight: '500', color: '#64748B', lineHeight: 20,
  },

  primaryBtn: {
    backgroundColor: '#166534', paddingVertical: 20,
    borderRadius: 20, alignItems: 'center',
    shadowColor: '#166534', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5
  },
  primaryBtnDisabled: { backgroundColor: '#94A3B8', opacity: 0.6, shadowOpacity: 0, elevation: 0 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },

  // Enhanced Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(15,23,42,0.7)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalCard: {
    width: '100%', backgroundColor: '#FFFFFF', borderRadius: 28,
    padding: 36, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 12,
  },
  modalIconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#10B981', justifyContent: 'center',
    alignItems: 'center', marginBottom: 24,
  },
  modalTitle: {
    fontSize: 26, fontWeight: '800',
    color: '#0F172A', marginBottom: 10,
  },
  modalMessage: {
    fontSize: 15, fontWeight: '500', color: '#64748B',
    textAlign: 'center', marginBottom: 36, lineHeight: 24,
  },
  modalBtn: {
    width: '100%', backgroundColor: '#166534', paddingVertical: 18,
    borderRadius: 20, alignItems: 'center',
  },
  modalBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});