import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  Dimensions, 
  KeyboardAvoidingView, 
  Platform, 
  StatusBar 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useNavigation, Tabs } from 'expo-router';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { supabase } from '../../services/supabase';
import { calculateFinanceSnapshot } from '../../services/finance';
import { triggerDailyLimitExceeded, triggerBudgetWarning } from '../../services/notifications';

const CATEGORIES = [
  { id: '1', name: 'Food', icon: 'fast-food', color: '#10B981' },
  { id: '2', name: 'Shopping', icon: 'bag-handle', color: '#F59E0B' },
  { id: '3', name: 'Transport', icon: 'car', color: '#6366F1' },
  { id: '4', name: 'Bills', icon: 'receipt', color: '#E11D48' },
  { id: '5', name: 'Health', icon: 'fitness', color: '#0EA5E9' },
  { id: '6', name: 'Others', icon: 'ellipsis-horizontal', color: '#64748B' },
];

export default function AddExpenseScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [screenState, setScreenState] = useState<'typing' | 'success'>('typing');
  const [amount, setAmount] = useState('0');
  const [selectedCat, setSelectedCat] = useState('1');
  const [isRecurring, setIsRecurring] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loadingPool, setLoadingPool] = useState(true);

  const totalAllocated = allocations.reduce((sum, item) => sum + item.amount, 0);
  const finance = calculateFinanceSnapshot({
    income: profile?.monthly_income || 0,
    spent: profile?.current_month_spent || 0,
    commitments: totalAllocated,
  });

  const flexiblePool = finance.flexiblePool;
  const dailyLimit = finance.dailySpendLimit;

  const fetchPoolData = useCallback(async () => {
    try {
      setLoadingPool(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: allocationsData } = await supabase
        .from('allocations')
        .select('*')
        .eq('user_id', user.id);

      setProfile(profileData);
      setAllocations(allocationsData || []);
    } catch (err) {
      console.error('Error fetching pool data in add.tsx:', err);
    } finally {
      setLoadingPool(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setScreenState('typing');
      setAmount('0');
      fetchPoolData();

      const parent = navigation.getParent();
      parent?.setOptions({
        tabBarStyle: { display: 'none' },
      });

      return () => {
        parent?.setOptions({
          tabBarStyle: { display: 'flex' },
        });
      };
    }, [navigation, fetchPoolData])
  );

  const numericAmount = parseInt(amount) || 0;
  const isOverBudget = profile ? numericAmount > flexiblePool : false;
  
  const getCategoryName = (id: string) => {
    return CATEGORIES.find(cat => cat.id === id)?.name || 'Other';
  };

  const handlePressNumber = (num: string) => {
    if (amount === '0') setAmount(num);
    else if (amount.length < 9) setAmount(amount + num);
  };

  const handleAddExpense = async () => {
    try {
      if (numericAmount <= 0 || isOverBudget) return;
      setSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; 

      const { error: expenseError } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          expense: getCategoryName(selectedCat),
          category: getCategoryName(selectedCat),
          amount: numericAmount,
          is_recurring: isRecurring,
        });

      if (expenseError) {
        console.log(expenseError);
        return; 
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.log(profileError);
        return; 
      }

      const updatedSpent = profile.current_month_spent + numericAmount;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ current_month_spent: updatedSpent })
        .eq('id', user.id);

      if (updateError) {
        console.log(updateError);
        return; 
      }

      // Trigger push notifications in the background
      (async () => {
        try {
          // 1. Check for Monthly Budget Warnings (crossing 85% of monthly income)
          const monthlyIncome = profile.monthly_income || 0;
          const threshold = monthlyIncome * 0.85;
          if (updatedSpent >= threshold && profile.current_month_spent < threshold) {
            await triggerBudgetWarning(updatedSpent, monthlyIncome);
          }

          // 2. Check for Daily Limit Exceeded
          const today = new Date();
          const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0).toISOString();
          const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

          const { data: todayExpenses } = await supabase
            .from('expenses')
            .select('amount, category')
            .eq('user_id', user.id)
            .gte('created_at', todayStart)
            .lte('created_at', todayEnd);

          const categoryName = getCategoryName(selectedCat);
          const hasCurrent = (todayExpenses || []).some(
            item => item.amount === numericAmount && item.category === categoryName
          );
          let spentToday = (todayExpenses || []).reduce((sum, item) => sum + (item.amount || 0), 0);
          if (!hasCurrent) {
            spentToday += numericAmount;
          }

          if (spentToday > dailyLimit) {
            await triggerDailyLimitExceeded(spentToday, dailyLimit);
          }
        } catch (notifErr) {
          console.log('Error triggering push notifications:', notifErr);
        }
      })();

      setScreenState('success');
    } catch (err) {
      console.log(err);
    } finally {
      setSaving(false);
    }
  };

  if (screenState === 'success') {
    return (
      <Animated.View entering={FadeIn.duration(500)} style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        <Tabs.Screen options={{ tabBarStyle: { display: 'none' } }} />
        
        <View style={styles.successContent}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark-sharp" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.successTitle}>Transaction Logged</Text>
          <Text style={styles.successSub}>₹{amount} successfully recorded.</Text>
        </View>
        
        <View style={[styles.bottomCtaContainer, { paddingBottom: insets.bottom + 20 }]}>
          <Pressable style={styles.primaryBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.primaryBtnText}>View Dashboard</Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#166534" />
      
      <Tabs.Screen options={{ tabBarStyle: { display: 'none' } }} />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerInner}>
          <View style={styles.headerSide} /> 
          <Text style={styles.headerTitle}>Entry Log</Text>
          <View style={styles.headerSide}>
            <Pressable onPress={() => router.back()} style={styles.headerIconBtn}>
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </View>

      <Animated.View entering={FadeInUp.springify()} style={styles.body}>
        <View style={styles.topSection}>
          
          <View style={styles.amountDisplay}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <Text style={[styles.amountTextLarge, isOverBudget && { color: '#E11D48' }]}>
              {amount}
            </Text>
          </View>
          
          {isOverBudget && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={14} color="#E11D48" />
              <Text style={styles.errorText}>Exceeds budget limit</Text>
            </View>
          )}

          <View style={styles.catGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable 
                key={cat.id} 
                onPress={() => setSelectedCat(cat.id)} 
                style={[
                  styles.catItem, 
                  selectedCat === cat.id && { backgroundColor: `${cat.color}15`, borderColor: cat.color }
                ]}
              >
                <Ionicons 
                  name={cat.icon as any} 
                  size={24} 
                  color={selectedCat === cat.id ? cat.color : '#94A3B8'} 
                />
                <Text style={[styles.catText, selectedCat === cat.id && { color: cat.color, fontWeight: '700' }]}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.bottomSection, { paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 30 }]}>
          
          <Pressable
            style={styles.recurringRow}
            onPress={() => setIsRecurring(!isRecurring)}
          >
            <View
              style={[
                styles.checkbox,
                isRecurring && { backgroundColor: '#166534', borderColor: '#166534' },
              ]}
            >
              {isRecurring && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </View>
            <Text style={styles.recurringText}>This is a recurring bill</Text>
          </Pressable>

          <View style={styles.numpadGrid}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((num) => (
              <Pressable 
                key={num} 
                style={styles.key} 
                onPress={() => num === '⌫' ? setAmount(prev => prev.length > 1 ? prev.slice(0,-1) : '0') : handlePressNumber(num)}
              >
                {num === '⌫' ? (
                  <Ionicons name="backspace-outline" size={24} color="#0F172A" />
                ) : (
                  <Text style={styles.keyText}>{num}</Text>
                )}
              </Pressable>
            ))}
          </View>

          <Pressable 
            style={[styles.primaryBtn, (amount === '0' || isOverBudget) && { opacity: 0.5 }]} 
            onPress={handleAddExpense} 
            disabled={amount === '0' || isOverBudget}
          >
            <Text style={styles.primaryBtnText}>
              {saving ? 'Saving...' : 'Confirm Transaction'}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  
  // Header
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

  body: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between', paddingTop: 10 },
  topSection: { flex: 1, justifyContent: 'center' }, // Centers the top content dynamically
  bottomSection: { },

  // Amount
  amountDisplay: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  currencyPrefix: { fontSize: 32, fontWeight: '800', color: '#94A3B8', marginRight: 8, marginTop: 10 },
  amountTextLarge: { fontSize: 64, fontWeight: '800', color: '#0F172A', letterSpacing: -2 },
  errorBox: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: '#FFF1F2', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, alignSelf: 'center', marginBottom: 10 },
  errorText: { color: '#E11D48', fontWeight: '700', fontSize: 13 },

  // Categories
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  catItem: { width: '30%', paddingVertical: 16, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9', backgroundColor: '#F8FAFC' },
  catText: { fontSize: 12, fontWeight: '500', color: '#64748B', marginTop: 8 },

  // Recurring (Moved to sit directly above Numpad)
  recurringRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, backgroundColor: '#F8FAFC', paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center' },
  recurringText: { marginLeft: 12, fontSize: 15, fontWeight: '600', color: '#334155' },

  // Numpad
  numpadGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginBottom: 20 },
  key: { width: '31%', height: 60, justifyContent: 'center', alignItems: 'center', borderRadius: 16, backgroundColor: '#F8FAFC' },
  keyText: { fontSize: 24, fontWeight: '800', color: '#0F172A' },

  // Buttons
  primaryBtn: { backgroundColor: '#166534', paddingVertical: 20, borderRadius: 20, alignItems: 'center', shadowColor: '#166534', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },

  // Success State
  successContent: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  checkCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#10B981', shadowOpacity: 0.4, shadowRadius: 15, elevation: 8 },
  successTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  successSub: { fontSize: 16, fontWeight: '500', color: '#64748B', marginTop: 12 },
  bottomCtaContainer: { paddingHorizontal: 25 },
});