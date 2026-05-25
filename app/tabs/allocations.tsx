import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type ViewState = 'overview' | 'creating' | 'adding' | 'releasing';

interface Allocation {
  id: string;
  title: string;
  amount: number;
  icon: string;
}

interface RolloverGoal {
  id: string;
  title: string;
  savedLastMonth: number;
  icon: string;
}

const ROLLOVER_GOALS: RolloverGoal[] = [
  { id: 'ro-1', title: 'MacBook Pro', savedLastMonth: 15000, icon: 'laptop-outline' }
];

export default function Allocations() {
  const INITIAL_FLEX_POOL = 8200; 
  
  const daysLeftInMonth = useMemo(() => {
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return endOfMonth.getDate() - today.getDate() + 1;
  }, []);

  // Application State
  const [viewState, setViewState] = useState<ViewState>('overview');
  const [flexiblePool, setFlexiblePool] = useState<number>(INITIAL_FLEX_POOL);
  const [activeAllocations, setActiveAllocations] = useState<Allocation[]>([
    { id: '1', title: 'Goa Trip', amount: 3000, icon: 'airplane-outline' }
  ]);
  const [rolloverGoals, setRolloverGoals] = useState<RolloverGoal[]>(ROLLOVER_GOALS);
  
  // Transaction Tracking
  const [targetGoalId, setTargetGoalId] = useState<string | null>(null);
  const targetGoal = activeAllocations.find(a => a.id === targetGoalId);

  // Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newAmount, setNewAmount] = useState<string>('');
  const [releaseAmount, setReleaseAmount] = useState<string>('');
  const [isReleaseAll, setIsReleaseAll] = useState<boolean>(false);

  // Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Derived Values
  const parsedAmount = parseInt(newAmount) || 0;
  const parsedReleaseAmount = parseInt(releaseAmount) || 0;
  const safeAllocation = Math.min(parsedAmount, flexiblePool); 
  const safeRelease = Math.min(parsedReleaseAmount, targetGoal?.amount || 0);

  const projectedPool = flexiblePool - safeAllocation;
  const projectedPoolAfterRelease = flexiblePool + safeRelease;

  // --------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------
  const showSuccess = (newPoolAmount: number) => {
    const updatedDailySpend = Math.floor(newPoolAmount / daysLeftInMonth);
    setModalMessage(`Your dashboard daily spend has been updated to ₹${updatedDailySpend.toLocaleString()}`);
    setViewState('overview');
    setShowSuccessModal(true);
    resetForm();
  };

  const resetForm = () => {
    setNewTitle('');
    setNewAmount('');
    setReleaseAmount('');
    setIsReleaseAll(false);
    setTargetGoalId(null);
  };

  // ADD FUNDS
  const handleInitAddFunds = (id: string) => {
    setTargetGoalId(id);
    setNewAmount('');
    setViewState('adding');
  };

  const handleConfirmAddFunds = () => {
    if (!targetGoalId || safeAllocation <= 0) return;
    setFlexiblePool(projectedPool);
    setActiveAllocations((prev) => 
      prev.map(goal => goal.id === targetGoalId ? { ...goal, amount: goal.amount + safeAllocation } : goal)
    );
    showSuccess(projectedPool);
  };

  // CREATE ALLOCATION
  const handleConfirmNewAllocation = () => {
    if (!newTitle || safeAllocation <= 0) return;
    setFlexiblePool(projectedPool);
    setActiveAllocations((prev) => [
      { id: Date.now().toString(), title: newTitle, amount: safeAllocation, icon: 'bookmark-outline' },
      ...prev
    ]);
    showSuccess(projectedPool);
  };

  // RELEASE FUNDS
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
    if (targetGoal && parseInt(val) === targetGoal.amount) {
      setIsReleaseAll(true);
    } else {
      setIsReleaseAll(false);
    }
  };

  const handleConfirmRelease = () => {
    if (!targetGoalId || safeRelease <= 0) return;
    setFlexiblePool(projectedPoolAfterRelease);
    
    setActiveAllocations((prev) => 
      prev.map(goal => 
        goal.id === targetGoalId ? { ...goal, amount: goal.amount - safeRelease } : goal
      ).filter(goal => goal.amount > 0)
    );
    showSuccess(projectedPoolAfterRelease);
  };

  // ROLLOVER
  const handleContinueSaving = (id: string, title: string) => {
    setNewTitle(title);
    setRolloverGoals((prev) => prev.filter(g => g.id !== id));
    setViewState('creating');
  };


  // --------------------------------------------------------
  // RENDER: RELEASE FUNDS
  // --------------------------------------------------------
  if (viewState === 'releasing' && targetGoal) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Release Funds</Text>
            <Pressable style={styles.iconBtn} onPress={() => setViewState('overview')}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 25, paddingBottom: 120 }}>
            <View style={styles.targetGoalCard}>
              <Ionicons name={targetGoal.icon as any} size={28} color="#166534" />
              <View style={{ marginLeft: 16 }}>
                <Text style={styles.targetGoalTitle}>{targetGoal.title}</Text>
                <Text style={styles.targetGoalAmount}>Currently locked: ₹{targetGoal.amount.toLocaleString()}</Text>
              </View>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 32 }]}>AMOUNT TO RELEASE</Text>
            <View style={styles.currencyInputWrapper}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput 
                style={styles.currencyInput}
                placeholder="0"
                placeholderTextColor="#E2E8F0"
                keyboardType="number-pad"
                value={releaseAmount}
                onChangeText={handleReleaseAmountChange}
                maxLength={7}
              />
            </View>

            <Pressable style={styles.checkboxContainer} onPress={handleToggleReleaseAll}>
              <Ionicons 
                name={isReleaseAll ? "checkbox" : "square-outline"} 
                size={24} 
                color={isReleaseAll ? "#166534" : "#94A3B8"} 
              />
              <Text style={styles.checkboxText}>Release all funds back to pool</Text>
            </Pressable>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#64748B" style={{ marginTop: 2 }} />
              <Text style={styles.infoText}>
                Released funds will return to your Flexible Pool, increasing your daily safe-to-spend allowance on the dashboard.
              </Text>
            </View>

            <Pressable 
              style={[styles.primaryBtn, { marginTop: 40 }, (safeRelease <= 0) && styles.primaryBtnDisabled]} 
              onPress={handleConfirmRelease}
            >
              <Text style={styles.primaryBtnText}>Confirm Release</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  }

  // --------------------------------------------------------
  // RENDER: ADDING FUNDS 
  // --------------------------------------------------------
  if (viewState === 'adding' && targetGoal) {
    const allocationPercent = flexiblePool > 0 ? (safeAllocation / flexiblePool) * 100 : 0;

    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Top Up Goal</Text>
            <Pressable style={styles.iconBtn} onPress={() => setViewState('overview')}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 25, paddingBottom: 120 }}>
            <View style={styles.targetGoalCard}>
              <Ionicons name={targetGoal.icon as any} size={28} color="#166534" />
              <View style={{ marginLeft: 16 }}>
                <Text style={styles.targetGoalTitle}>{targetGoal.title}</Text>
                <Text style={styles.targetGoalAmount}>Currently locked: ₹{targetGoal.amount.toLocaleString()}</Text>
              </View>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 32 }]}>HOW MUCH TO ADD?</Text>
            <View style={styles.currencyInputWrapper}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput 
                style={styles.currencyInput}
                placeholder="0"
                placeholderTextColor="#E2E8F0"
                keyboardType="number-pad"
                value={newAmount}
                onChangeText={setNewAmount}
                maxLength={7}
              />
            </View>

            <View style={styles.visualBarSection}>
              <View style={styles.visualBarLabels}>
                <Text style={styles.visualLabelLeft}>Adding: ₹{safeAllocation.toLocaleString()}</Text>
                <Text style={styles.visualLabelRight}>Remaining Pool: ₹{projectedPool.toLocaleString()}</Text>
              </View>
              <View style={styles.visualBarTrack}>
                <View style={[styles.visualBarFill, { width: `${allocationPercent}%` }]} />
              </View>
            </View>

            <Pressable 
              style={[styles.primaryBtn, { marginTop: 40 }, (safeAllocation <= 0) && styles.primaryBtnDisabled]} 
              onPress={handleConfirmAddFunds}
            >
              <Text style={styles.primaryBtnText}>Confirm Add Funds</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  }

  // --------------------------------------------------------
  // RENDER: CREATE NEW ALLOCATION
  // --------------------------------------------------------
  if (viewState === 'creating') {
    const allocationPercent = flexiblePool > 0 ? (safeAllocation / flexiblePool) * 100 : 0;

    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>New Goal Allocation</Text>
            <Pressable style={styles.iconBtn} onPress={() => setViewState('overview')}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 25, paddingBottom: 120 }}>
            <Text style={styles.inputLabel}>WHAT ARE YOU SAVING FOR?</Text>
            <TextInput 
              style={styles.textInput}
              placeholder="e.g., Weekend Trip"
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
                placeholderTextColor="#E2E8F0"
                keyboardType="number-pad"
                value={newAmount}
                onChangeText={setNewAmount}
                maxLength={7}
              />
            </View>

            <View style={styles.visualBarSection}>
              <View style={styles.visualBarLabels}>
                <Text style={styles.visualLabelLeft}>Allocating: ₹{safeAllocation.toLocaleString()}</Text>
                <Text style={styles.visualLabelRight}>Remaining Pool: ₹{projectedPool.toLocaleString()}</Text>
              </View>
              <View style={styles.visualBarTrack}>
                <View style={[styles.visualBarFill, { width: `${allocationPercent}%` }]} />
              </View>
            </View>

            <Pressable 
              style={[styles.primaryBtn, { marginTop: 40 }, (!newTitle || safeAllocation <= 0) && styles.primaryBtnDisabled]} 
              onPress={handleConfirmNewAllocation}
            >
              <Text style={styles.primaryBtnText}>Confirm Allocation</Text>
            </Pressable>

          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  }

  // --------------------------------------------------------
  // RENDER: OVERVIEW
  // --------------------------------------------------------
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { fontSize: 28, letterSpacing: -1 }]}>Allocations</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* TEXTURED POOL HERO */}
          <View style={styles.poolWrapper}>
            <LinearGradient colors={['#F0FDF4', '#DCFCE7']} style={styles.lightPoolHero}>
              
              {/* Texture Elements (Geometric overlapping opacity) */}
              <View style={styles.textureCircle1} />
              <View style={styles.textureCircle2} />
              <View style={styles.textureCircle3} />

              <View style={styles.poolContentZIndex}>
                <View style={styles.poolTopRow}>
                  <View style={styles.poolBadgeLight}>
                    <Ionicons name="water-outline" size={14} color="#166534" />
                    <Text style={styles.poolBadgeTextLight}>AVAILABLE POOL</Text>
                  </View>
                </View>
                
                <View style={styles.poolCenter}>
                  <Text style={styles.poolCurrencyLight}>₹</Text>
                  <Text style={styles.poolAmountLight}>{flexiblePool.toLocaleString()}</Text>
                </View>

                <View style={styles.poolBottomRow}>
                  <View style={styles.poolPill}>
                    <Ionicons name="calendar-outline" size={14} color="#166534" />
                    <Text style={styles.poolPillText}>{daysLeftInMonth} Days Left</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* ROLLOVER SECTION */}
          {rolloverGoals.length > 0 && (
            <View style={styles.rolloverSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Rollovers from Last Month</Text>
              </View>
              {rolloverGoals.map((goal) => (
                <View key={goal.id} style={styles.rolloverCard}>
                  <View style={styles.rolloverLeft}>
                    <View style={styles.rolloverIconBox}>
                      <Ionicons name={goal.icon as any} size={20} color="#64748B" />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.rolloverTitle}>{goal.title}</Text>
                      <Text style={styles.rolloverSub}>₹{goal.savedLastMonth.toLocaleString()} saved so far</Text>
                    </View>
                  </View>
                  <Pressable style={styles.continueBtn} onPress={() => handleContinueSaving(goal.id, goal.title)}>
                    <Text style={styles.continueBtnText}>Continue</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* ACTIVE ALLOCATIONS */}
          <View style={[styles.sectionHeader, { marginTop: rolloverGoals.length > 0 ? 10 : 0 }]}>
            <Text style={styles.sectionTitle}>Active Goals</Text>
            <Pressable onPress={() => setViewState('creating')}>
              <Text style={styles.viewAll}>+ New Goal</Text>
            </Pressable>
          </View>

          {activeAllocations.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No funds locked this month.</Text>
            </View>
          )}

          {activeAllocations.map((item) => (
            <View key={item.id} style={styles.vaultCard}>
              <View style={styles.vaultTop}>
                <View style={styles.vaultIconBox}>
                  <Ionicons name={item.icon as any} size={24} color="#166534" />
                </View>
                <View style={styles.vaultInfo}>
                  <Text style={styles.vaultTitle}>{item.title}</Text>
                  <Text style={styles.vaultAmount}>₹{item.amount.toLocaleString()}</Text>
                </View>
              </View>
              
              <View style={styles.vaultBottom}>
                <Text style={styles.lockedText}>Secured Funds</Text>
                <View style={styles.actionRow}>
                  <Pressable style={styles.actionBtnRelease} onPress={() => handleInitRelease(item.id)}>
                    <Text style={styles.actionBtnTextRelease}>Release</Text>
                  </Pressable>

                  <Pressable style={styles.actionBtnAdd} onPress={() => handleInitAddFunds(item.id)}>
                    <Ionicons name="add" size={14} color="#166534" />
                    <Text style={styles.actionBtnTextAdd}>Add</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>

      {/* SUCCESS MODAL POPUP */}
      <Modal visible={showSuccessModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="checkmark" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.modalTitle}>Success!</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  safeArea: { flex: 1 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingVertical: 15 },
  headerTitle: { fontFamily: 'Jakarta-ExtraBold', color: '#0F172A' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },

  scrollContent: { paddingHorizontal: 25, paddingTop: 10 },

  // TEXTURED POOL HERO
  poolWrapper: { marginBottom: 32, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#BBF7D0' },
  lightPoolHero: { padding: 24, position: 'relative' },
  poolContentZIndex: { zIndex: 10 },
  
  // Texture Shapes
  textureCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#FFFFFF', opacity: 0.6, top: -50, right: -40 },
  textureCircle2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#86EFAC', opacity: 0.2, bottom: -20, left: -20 },
  textureCircle3: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFFFFF', opacity: 0.4, top: 40, left: 60 },

  poolTopRow: { alignItems: 'center', marginBottom: 16 },
  poolBadgeLight: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  poolBadgeTextLight: { fontSize: 10, fontFamily: 'Inter-Bold', color: '#166534', marginLeft: 4, letterSpacing: 1.5 },
  poolCenter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', marginBottom: 24 },
  poolCurrencyLight: { fontSize: 24, fontFamily: 'Jakarta-ExtraBold', color: '#166534', marginTop: 6, marginRight: 2 },
  poolAmountLight: { fontSize: 56, fontFamily: 'Jakarta-ExtraBold', color: '#0F172A', letterSpacing: -2.5 },
  poolBottomRow: { flexDirection: 'row', justifyContent: 'center' },
  poolPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#DCFCE7' },
  poolPillText: { fontSize: 13, fontFamily: 'Inter-Bold', color: '#166534', marginLeft: 6 },

  // SECTION HEADERS
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontFamily: 'Jakarta-Bold', color: '#0F172A' },
  viewAll: { fontSize: 13, fontFamily: 'Inter-Bold', color: '#166534' },

  // ROLLOVER & VAULT
  rolloverSection: { marginBottom: 32 },
  rolloverCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  rolloverLeft: { flexDirection: 'row', alignItems: 'center' },
  rolloverIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  rolloverTitle: { fontSize: 14, fontFamily: 'Jakarta-Bold', color: '#0F172A' },
  rolloverSub: { fontSize: 12, fontFamily: 'Inter-Medium', color: '#64748B', marginTop: 2 },
  continueBtn: { backgroundColor: '#166534', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  continueBtnText: { color: '#FFFFFF', fontSize: 12, fontFamily: 'Inter-Bold' },

  emptyState: { padding: 30, alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', borderStyle: 'dashed' },
  emptyText: { fontFamily: 'Inter-Medium', color: '#94A3B8' },
  
  vaultCard: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 16, shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  vaultTop: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 16 },
  vaultIconBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  vaultInfo: { flex: 1 },
  vaultTitle: { fontSize: 16, fontFamily: 'Jakarta-Bold', color: '#0F172A' },
  vaultAmount: { fontSize: 22, fontFamily: 'Jakarta-ExtraBold', color: '#166534', marginTop: 2, letterSpacing: -0.5 },
  
  vaultBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20, paddingTop: 4 },
  lockedText: { fontSize: 12, fontFamily: 'Inter-Medium', color: '#94A3B8' },
  
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtnRelease: { backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  actionBtnTextRelease: { fontSize: 12, fontFamily: 'Inter-Bold', color: '#0F172A' },
  actionBtnAdd: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  actionBtnTextAdd: { fontSize: 12, fontFamily: 'Inter-Bold', color: '#166534', marginLeft: 4 },

  // FORMS
  targetGoalCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#DCFCE7' },
  targetGoalTitle: { fontSize: 16, fontFamily: 'Jakarta-Bold', color: '#0F172A' },
  targetGoalAmount: { fontSize: 13, fontFamily: 'Inter-Medium', color: '#166534', marginTop: 2 },

  inputLabel: { fontSize: 11, fontFamily: 'Inter-Bold', color: '#64748B', letterSpacing: 1.2, marginBottom: 10 },
  textInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 16, padding: 16, fontSize: 16, fontFamily: 'Inter-Medium', color: '#0F172A' },
  
  currencyInputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#166534', paddingBottom: 8 },
  currencySymbol: { fontSize: 36, fontFamily: 'Jakarta-ExtraBold', color: '#0F172A', marginRight: 8 },
  currencyInput: { flex: 1, fontSize: 44, fontFamily: 'Jakarta-ExtraBold', color: '#0F172A' },

  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingVertical: 8 },
  checkboxText: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#0F172A', marginLeft: 10 },

  visualBarSection: { marginTop: 32, marginBottom: 24 },
  visualBarLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  visualLabelLeft: { fontSize: 11, fontFamily: 'Inter-Bold', color: '#166534' },
  visualLabelRight: { fontSize: 11, fontFamily: 'Inter-Medium', color: '#94A3B8' },
  visualBarTrack: { height: 12, backgroundColor: '#F8FAFC', borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
  visualBarFill: { height: '100%', backgroundColor: '#166534', borderRadius: 6 },

  infoBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', marginTop: 10 },
  infoText: { flex: 1, marginLeft: 10, fontSize: 12, fontFamily: 'Inter-Medium', color: '#64748B', lineHeight: 18 },

  primaryBtn: { backgroundColor: '#166534', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  primaryBtnDisabled: { backgroundColor: '#94A3B8', opacity: 0.5 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Jakarta-Bold' },

  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  modalIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontFamily: 'Jakarta-ExtraBold', color: '#0F172A', marginBottom: 8 },
  modalMessage: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#64748B', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  modalBtn: { width: '100%', backgroundColor: '#F8FAFC', paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  modalBtnText: { fontSize: 15, fontFamily: 'Jakarta-Bold', color: '#0F172A' }
});