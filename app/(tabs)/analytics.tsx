import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts';
import { supabase } from '../../services/supabase';
import { calculateFinanceSnapshot } from '../../services/finance';

// ─── Constants ────────────────────────────────────────────────────────────────

const { width } = Dimensions.get('window');

const HORIZONTAL_PADDING = 20;
const CARD_PADDING = 16;
const COLS = 9;
const CELL_GAP = 5;
const AVAILABLE_WIDTH = width - (HORIZONTAL_PADDING * 2) - (CARD_PADDING * 2);
const CELL_SIZE = Math.floor((AVAILABLE_WIDTH - (CELL_GAP * (COLS - 1))) / COLS);
const CELL_RADIUS = CELL_SIZE / 2;

const CATEGORIES = [
  { name: 'Food', color: '#10B981' },
  { name: 'Shopping', color: '#F59E0B' },
  { name: 'Transport', color: '#6366F1' },
  { name: 'Bills', color: '#E11D48' },
  { name: 'Health', color: '#0EA5E9' },
  { name: 'Others', color: '#64748B' },
];

// ─── Streak Card ──────────────────────────────────────────────────────────────

function StreakCard({
  streak,
  dailyLimit,
  loaded,
}: {
  streak: number;
  dailyLimit: number;
  loaded: boolean;
}) {
  if (!loaded) return null;

  const isEmpty = streak === 0;
  const limitLabel = `₹${dailyLimit.toLocaleString()} flexible / day`;

  return (
    <View style={streakStyles.card}>
      <View style={[streakStyles.countBlock, isEmpty && streakStyles.countBlockEmpty]}>
        <Text style={[streakStyles.countNum, isEmpty && streakStyles.countNumEmpty]}>
          {streak}
        </Text>
        <Text style={[streakStyles.countUnit, isEmpty && streakStyles.countUnitEmpty]}>
          {streak === 1 ? 'day' : 'days'}
        </Text>
      </View>

      <View style={streakStyles.divider} />

      <View style={streakStyles.infoBlock}>
        <View style={streakStyles.infoTopRow}>
          <Text style={streakStyles.infoTitle}>On-Track Streak</Text>
          <View style={[streakStyles.statusPill, isEmpty && streakStyles.statusPillEmpty]}>
            <View style={[streakStyles.statusDot, isEmpty && streakStyles.statusDotEmpty]} />
            <Text style={[streakStyles.statusText, isEmpty && streakStyles.statusTextEmpty]}>
              {isEmpty ? 'Start today' : 'Active'}
            </Text>
          </View>
        </View>

        <Text style={streakStyles.limitLine}>{limitLabel}</Text>

        <View style={streakStyles.noticeRow}>
          <Ionicons name="refresh-outline" size={11} color="#94A3B8" />
          <Text style={streakStyles.noticeText}>Recurring bills excluded from streak</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Analytics() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // ─── Data Fetching ─────────────────────────────────────────────────────────

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', user.id).single();
      setProfile(profileData);

      const { data: expensesData } = await supabase
        .from('expenses').select('*').eq('user_id', user.id);
      setExpenses(expensesData || []);

      const { data: allocationsData, error: allocationsError } = await supabase
        .from('allocations').select('*').eq('user_id', user.id);
      if (!allocationsError) setAllocations(allocationsData || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchAnalytics();
    }, [])
  );

  // ─── Derived Values ────────────────────────────────────────────────────────

  const profileLoaded = !loading && profile != null;
  const totalSpent = profile?.current_month_spent || 0;
  const totalAllocated = allocations.reduce((sum, item) => sum + item.amount, 0);

  const finance = calculateFinanceSnapshot({
    income: profile?.monthly_income || 0,
    spent: totalSpent,
    commitments: totalAllocated,
  });

  const dailyLimit = finance.dailySpendLimit;

  const recurringSpend = expenses
    .filter(item => {
      if (!item.is_recurring) return false;
      const expenseDate = new Date(item.expense_date);
      const today = new Date();
      return (
        expenseDate.getMonth() === today.getMonth() &&
        expenseDate.getFullYear() === today.getFullYear()
      );
    })
    .reduce((sum, item) => sum + item.amount, 0);

  // ─── Heatmap / Calendar Data ───────────────────────────────────────────────

  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

  const dailySpendMap: Record<number, number> = {};
  const dailyRecurringMap: Record<number, number> = {};

  expenses.forEach(expense => {
    const day = new Date(expense.expense_date).getDate();
    dailySpendMap[day] = (dailySpendMap[day] || 0) + expense.amount;
    if (expense.is_recurring) {
      dailyRecurringMap[day] = (dailyRecurringMap[day] || 0) + expense.amount;
    }
  });

  const getIntensity = (totalAmount: number, recurringAmount: number) => {
    if (totalAmount === 0) return '#F1F5F9';
    if ((totalAmount - recurringAmount) <= dailyLimit) return '#16A34A';
    return '#EF4444';
  };

  // ─── Streak Logic ──────────────────────────────────────────────────────────

  let currentStreak = 0;
  if (profileLoaded && dailyLimit > 0) {
    const profileCreatedDate = new Date(profile.created_at);
    const startDay =
      profileCreatedDate.getMonth() === currentDate.getMonth() &&
      profileCreatedDate.getFullYear() === currentDate.getFullYear()
        ? profileCreatedDate.getDate()
        : 1;

    for (let day = currentDay; day >= startDay; day--) {
      const totalForDay = dailySpendMap[day] || 0;
      const recurringForDay = dailyRecurringMap[day] || 0;
      const flexibleForDay = totalForDay - recurringForDay;

      if (flexibleForDay <= dailyLimit) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  const totalCells = Math.ceil(daysInMonth / COLS) * COLS;

  // ─── Category Breakdown ────────────────────────────────────────────────────

  const currentMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.expense_date);
    const today = new Date();
    return (
      expenseDate.getMonth() === today.getMonth() &&
      expenseDate.getFullYear() === today.getFullYear()
    );
  });
  
  const trackedSpent = currentMonthExpenses.reduce((sum, item) => sum + item.amount, 0);

  const categoryTotals: Record<string, number> = {};
  currentMonthExpenses.forEach(({ category, amount }) => {
    categoryTotals[category] = (categoryTotals[category] || 0) + amount;
  });

  const categoryBreakdown = Object.entries(categoryTotals).map(([name, amount]) => ({
    name,
    rawAmount: amount,
    amount: `₹${amount.toLocaleString()}`,
    percent: trackedSpent > 0 ? Math.round((amount / trackedSpent) * 100) : 0,
    color: CATEGORIES.find(c => c.name === name)?.color || '#94A3B8',
  }));

  const pieData = categoryBreakdown.map(({ rawAmount: value, color }) => ({ value, color }));

  // ─── Summary Stats ─────────────────────────────────────────────────────────

  const summaryStats = [
    { label: 'Total Spent', value: `₹${totalSpent.toLocaleString()}`, highlight: true, fullWidth: true },
    { label: 'Allocations', value: `₹${totalAllocated.toLocaleString()}`, highlight: false, fullWidth: false },
    { label: 'Remaining', value: `₹${finance.flexiblePool.toLocaleString()}`, highlight: false, fullWidth: false },
    { label: 'Daily Spend Limit', value: `₹${finance.dailySpendLimit.toLocaleString()}`, highlight: false, fullWidth: false },
    { label: 'Bills', value: `₹${recurringSpend.toLocaleString()}`, highlight: false, fullWidth: false },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#166534" />
      
      {/* Centered Notch Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerInner}>
          <View style={styles.headerSide} />
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={styles.headerSide}>
            <Pressable style={styles.headerIconBtn}>
              <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Summary Stats Grid */}
        <View style={styles.statsGrid}>
          {summaryStats.map((stat, i) => (
            <View
              key={i}
              style={[styles.statCard, stat.fullWidth ? styles.statCardFull : styles.statCardHalf]}
            >
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={[
                styles.statValue,
                stat.highlight && { color: '#166534' },
                stat.fullWidth && { fontSize: 32 },
              ]}>
                {stat.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Spending Activity — Calendar Heatmap */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Spending Activity</Text>

          <View style={styles.heatmapCard}>
            {Array.from({ length: Math.ceil(totalCells / COLS) }, (_, rowIdx) => (
              <View key={rowIdx} style={[styles.calendarRow, { marginBottom: CELL_GAP }]}>
                {Array.from({ length: COLS }, (_, colIdx) => {
                  const day = rowIdx * COLS + colIdx + 1;
                  const isValid = day >= 1 && day <= daysInMonth;
                  const isFuture = isValid && day > currentDay;
                  const isToday = isValid && day === currentDay;
                  const amount = isValid ? (dailySpendMap[day] || 0) : 0;
                  const recurringAmount = isValid ? (dailyRecurringMap[day] || 0) : 0;
                  const isSelected = selectedDay === day && isValid;
                  const bgColor = isFuture ? '#F1F5F9' : getIntensity(amount, recurringAmount);
                  const textColor = (amount === 0 || isFuture) ? '#94A3B8' : '#FFFFFF';

                  if (!isValid) {
                    return <View key={colIdx} style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
                  }

                  return (
                    <Pressable
                      key={colIdx}
                      onPress={() => setSelectedDay(isSelected ? null : day)}
                      style={[
                        styles.heatCell,
                        {
                          width: CELL_SIZE,
                          height: CELL_SIZE,
                          borderRadius: CELL_RADIUS,
                          backgroundColor: bgColor,
                          borderWidth: isToday ? 2 : isSelected ? 1.5 : 0,
                          borderColor: isToday ? '#0F172A' : '#64748B',
                        },
                      ]}
                    >
                      <Text style={[
                        styles.cellDateText,
                        { color: textColor, fontWeight: isToday ? 'bold' : '500' },
                      ]}>
                        {day}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}

            {selectedDay != null && (() => {
              const selTotal = dailySpendMap[selectedDay] || 0;
              const selRecurring = dailyRecurringMap[selectedDay] || 0;
              const selFlexible = selTotal - selRecurring;
              const overLimit = selFlexible > dailyLimit;
              return (
                <View style={styles.tooltipRow}>
                  <Text style={styles.tooltipDate}>
                    {new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay)
                      .toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </Text>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Text style={[
                      styles.tooltipAmount,
                      selTotal === 0
                        ? { color: '#94A3B8' }
                        : overLimit
                          ? { color: '#EF4444' }
                          : { color: '#16A34A' },
                    ]}>
                      {selTotal === 0 ? 'No spend' : `₹${selTotal.toLocaleString()}`}
                    </Text>
                    {selRecurring > 0 && (
                      <Text style={styles.tooltipBill}>
                        Bills ₹{selRecurring.toLocaleString()}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })()}
          </View>

          <StreakCard
            streak={currentStreak}
            dailyLimit={dailyLimit}
            loaded={profileLoaded}
          />
        </View>

        {/* Category Breakdown */}
        <View style={[styles.sectionContainer, { marginTop: 16 }]}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          
          {trackedSpent === 0 ? (
            <View style={styles.emptyBreakdownCard}>
              <Ionicons name="pie-chart-outline" size={40} color="#94A3B8" />
              <Text style={styles.emptyBreakdownTitle}>No expenses this month</Text>
              <Text style={styles.emptyBreakdownText}>
                Your spending breakdown will appear here once you log your first transaction.
              </Text>
            </View>
          ) : (
            <View style={styles.breakdownCard}>
              <View style={styles.pieContainer}>
                <PieChart
                  data={pieData}
                  donut
                  radius={50}
                  innerRadius={32}
                  innerCircleColor={'#FFFFFF'}
                  centerLabelComponent={() => <View style={styles.pieCenter} />}
                />
              </View>
              <View style={styles.categoryLegend}>
                {categoryBreakdown.map((item, i) => (
                  <View key={i} style={styles.legendItem}>
                    <View style={styles.legendLeft}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <Text style={styles.legendName} numberOfLines={1}>{item.name}</Text>
                    </View>
                    <View style={styles.legendRight}>
                      <Text style={styles.legendPercent}>{item.percent}%</Text>
                      <Text style={styles.legendAmount} numberOfLines={1}>{item.amount}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  
  // Header
  header: { 
    backgroundColor: '#166534', 
    paddingBottom: 20, 
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  headerInner: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20 
  },
  headerSide: { 
    width: 44, // Matches the icon button width for perfect centering
    alignItems: 'center'
  },
  headerTitle: { 
    flex: 1, 
    textAlign: 'center', 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#FFFFFF', 
  },
  headerIconBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  scrollContent: { paddingHorizontal: HORIZONTAL_PADDING, paddingTop: 20, },

  sectionContainer: { marginBottom: 32 },
  sectionTitle: { fontSize: 19, fontWeight: '700', color: '#0F172A', marginBottom: 16 },

  heatmapCard: { backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', padding: CARD_PADDING },
  calendarRow: { flexDirection: 'row', justifyContent: 'space-between' },
  heatCell: { justifyContent: 'center', alignItems: 'center' },
  cellDateText: { fontSize: 10 },

  tooltipRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  tooltipDate: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  tooltipAmount: { fontSize: 13, fontWeight: '700' },
  tooltipBill: { fontSize: 11, fontWeight: '500', color: '#64748B' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  statCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 12, elevation: 2 },
  statCardFull: { width: '100%', paddingVertical: 20 },
  statCardHalf: { width: '48.5%' },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },

  // Breakdown Card
  breakdownCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  pieContainer: { width: 110, height: 110, justifyContent: 'center', alignItems: 'center' },
  pieCenter: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF' },
  categoryLegend: { flex: 1, paddingLeft: 12 },
  legendItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  legendLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  legendName: { fontSize: 13, fontWeight: '600', color: '#0F172A', flexShrink: 1 },
  legendRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendPercent: { fontSize: 11, fontWeight: '500', color: '#64748B', width: 28, textAlign: 'right' },
  legendAmount: { fontSize: 13, fontWeight: '700', color: '#0F172A', width: 60, textAlign: 'right' },

  // Empty State
  emptyBreakdownCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyBreakdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  emptyBreakdownText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
});

const streakStyles = StyleSheet.create({
  card: { flexDirection: 'row', marginTop: 16, backgroundColor: '#FAFFFE', borderRadius: 20, borderWidth: 1, borderColor: '#D1FAE5', overflow: 'hidden', alignItems: 'stretch' },
  countBlock: { backgroundColor: '#166534', paddingVertical: 20, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', minWidth: 72 },
  countBlockEmpty: { backgroundColor: '#F1F5F9' },
  countNum: { fontSize: 34, fontWeight: '800', color: '#FFFFFF', lineHeight: 38 },
  countNumEmpty: { color: '#CBD5E1' },
  countUnit: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },
  countUnitEmpty: { color: '#94A3B8' },
  divider: { width: 1, backgroundColor: '#E2F0E8' },
  infoBlock: { flex: 1, paddingVertical: 14, paddingHorizontal: 14, justifyContent: 'center', gap: 6 },
  infoTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  infoTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#DCFCE7', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  statusPillEmpty: { backgroundColor: '#F1F5F9' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  statusDotEmpty: { backgroundColor: '#CBD5E1' },
  statusText: { fontSize: 11, fontWeight: '700', color: '#166534' },
  statusTextEmpty: { color: '#94A3B8' },
  limitLine: { fontSize: 13, fontWeight: '500', color: '#475569', lineHeight: 17 },
  noticeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  noticeText: { fontSize: 11, fontWeight: '500', color: '#94A3B8', lineHeight: 15 },
});