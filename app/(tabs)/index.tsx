import React, { useMemo, useState, ComponentProps, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  StatusBar 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import { useOnboarding } from '../../context/OnboardingContext';
import { calculateFinanceSnapshot } from '../../services/finance';
import { supabase } from '../../services/supabase';
import { checkAndProcessMonthEnd } from '../../services/monthProcessor';
import { scheduleDailyReminder } from '../../services/notifications';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface RecentExpense {
  title: string;
  cat: string;
  price: string;
  time: string;
  icon: IconName;
  color: string;
}

interface WeekDay {
  label: string;      
  dateKey: string;    
  total: number;      
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function buildWeekDays(): WeekDay[] {
  const now = new Date();
  const dayOfWeek = now.getDay(); 
  
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(now);
  
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0); 

  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { 
      label: labels[i], 
      dateKey: getLocalDateKey(d),
      total: 0 
    };
  });
}

function formatYLabel(val: number): string {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
  return `₹${val}`;
}

export default function Dashboard() {
  const { data } = useOnboarding();
  const insets = useSafeAreaInsets(); 
  const router = useRouter(); 
  
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0); 
  const [profile, setProfile] = useState<any>(null); 
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<RecentExpense[]>([]); 
  const [weekDays, setWeekDays] = useState<WeekDay[]>(buildWeekDays()); 
  const [allocations, setAllocations] = useState<any[]>([]); 

  const totalAllocated = allocations.reduce((sum, item) => sum + item.amount, 0);

  const finance = calculateFinanceSnapshot({
    income: profile?.monthly_income || 0,
    spent: profile?.current_month_spent || 0,
    commitments: totalAllocated,
  });

  const {
    income,
    spent: spentTillNow,
    flexiblePool: remainingSafeToSpend,
    dailySpendLimit: dailyLimit,
    remainingDays: daysLeft,
  } = finance;

  const spentPct = income > 0 ? Math.min((spentTillNow / income) * 100, 100) : 0;

  const getLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  }, []);

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A';
  
  const firstName = profile?.full_name 
    ? profile.full_name.split(' ')[0] 
    : 'User';

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
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
      
      await checkAndProcessMonthEnd(); 
      setAllocations(allocationsData || []);

      const week = buildWeekDays();
      const weekStart = week[0].dateKey; 
      const weekEnd = week[6].dateKey;  

      const { data: allWeekData } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', `${weekStart}T00:00:00`) 
        .lte('created_at', `${weekEnd}T23:59:59`)   
        .order('created_at', { ascending: false });

      const updatedWeek = week.map((day) => {
        const total = (allWeekData || [])
          .filter((item: any) => item.created_at?.slice(0, 10) === day.dateKey)
          .reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
        return { ...day, total };
        
      });

      setWeekDays(updatedWeek);

      const todayKey =
  getLocalDateKey(new Date());
      const todayIdx = updatedWeek.findIndex((d) => d.dateKey === todayKey);
      if (todayIdx !== -1) setSelectedDayIndex(todayIdx);

      const formattedExpenses = (allWeekData || []).slice(0, 3).map((item: any) => ({
        title: item.expense,
        cat: item.category,
        price: item.amount.toString(),
        time: 'Recently',
        icon: 'wallet' as IconName, 
        color: '#166534',
      }));

      setExpenses(formattedExpenses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);
 

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      scheduleDailyReminder(20, 0); // Schedule daily at 8:00 PM
    }, [fetchProfile])
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#166534" />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerInnerLeftAligned}>
          <View style={styles.headerGreetingCol}>
            <Text style={styles.headerGreetingText}>{greeting}</Text>
            <Text style={styles.headerNameText}>{firstName}</Text>
          </View>
          
          <Pressable 
            style={({ pressed }) => [styles.headerAvatarBtn, pressed && { opacity: 0.8 }]} 
            onPress={() => router.push('/profile')}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </Pressable>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroCardWrapper}>
          <LinearGradient colors={['#166534', '#064E3B']} style={styles.heroCard}>
            <View style={styles.textureCircle1} />
            <View style={styles.textureCircle2} />
            
            <View style={styles.heroContentZIndex}>
              <Text style={styles.heroLabel}>Safe to Spend Today</Text>
              
              <View style={styles.amountRow}>
                <Text style={styles.currency}>₹</Text>
                <Text style={styles.mainAmount}>{Math.floor(dailyLimit).toLocaleString()}</Text>
              </View>

              <View style={styles.simpleBarContainer}>
                <View style={[styles.barSegment, { width: `${spentPct}%`, backgroundColor: '#F87171' }]} />
                <View style={[styles.barSegment, { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)' }]} />
              </View>

              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#F87171' }]} />
                  <Text style={styles.legendText}>Spent</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#FFFFFF' }]} />
                  <Text style={styles.legendText}>Remaining</Text>
                </View>
              </View>

              <View style={styles.heroFooter}>
                <Text style={styles.heroSubLabel}>₹{remainingSafeToSpend.toLocaleString()} left</Text>
                <Text style={styles.heroSubLabel}>{daysLeft} days left</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Weekly Spending</Text>
        </View>

        {(() => {
          const hasWeekData = weekDays.some((d) => d.total > 0);
          if (!hasWeekData) return (
            <View style={styles.emptyCard}>
              <Ionicons name="bar-chart-outline" size={36} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No spending data yet</Text>
              <Text style={styles.emptyText}>Trends will appear once you log expenses.</Text>
            </View>
          );

          const maxTotal = Math.max(...weekDays.map((d) => d.total), 1);
          const niceStep = Math.ceil((maxTotal / 2) / 100) * 100; 
          const yMax = niceStep * 2; 

          return (
            <View style={styles.chartContainer}>
              <View style={styles.chartTooltipRow}>
                <Text style={styles.chartTooltipDay}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][selectedDayIndex]}
                </Text>
                <Text style={styles.chartTooltipAmount}>
                  {weekDays[selectedDayIndex].total > 0 
                    ? `₹${weekDays[selectedDayIndex].total.toLocaleString()}` 
                    : 'No expenses'}
                </Text>
              </View>

              <View style={styles.chartBody}>
                <View style={styles.yAxis}>
                  <Text style={styles.yAxisLabel}>{formatYLabel(yMax)}</Text>
                  <Text style={styles.yAxisLabel}>{formatYLabel(niceStep)}</Text>
                  <Text style={styles.yAxisLabel}>0</Text>
                </View>

                <View style={styles.graphArea}>
                  <View style={[styles.gridLine, { top: 0 }]} />
                  <View style={[styles.gridLine, { top: '50%' }]} />
                  <View style={[styles.gridLine, { bottom: 0 }]} />

                  <View style={styles.barsContainer}>
                    {weekDays.map((day, i) => {
                      const isSelected = i === selectedDayIndex;
                      const heightPct = day.total > 0 ? Math.max((day.total / yMax) * 100, 4) : 0;

                      return (
                        <Pressable key={day.dateKey} style={styles.barWrapper} onPress={() => setSelectedDayIndex(i)}>
                          {day.total === 0 ? (
                            <View style={styles.emptyBarPlaceholder} />
                          ) : (
                            <View style={[
                              styles.thinBar, 
                              { 
                                height: `${heightPct}%`, 
                                backgroundColor: '#166534', 
                                opacity: isSelected ? 1 : 0.25, 
                                width: isSelected ? 14 : 8 
                              }
                            ]} />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>

              <View style={styles.xAxis}>
                <View style={styles.xAxisSpacer} />
                <View style={styles.xAxisLabelsContainer}>
                  {weekDays.map((day, i) => (
                    <Text key={day.dateKey} style={[styles.dayLabel, i === selectedDayIndex && styles.dayLabelActive]}>
                      {day.label}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          );
        })()}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>

        {expenses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No expenses logged</Text>
            <Text style={styles.emptyText}>Your recent transactions will show up here.</Text>
          </View>
        ) : (
          <View style={styles.recentActivityCard}>
            {expenses.map((item, i) => (
              <View key={i} style={[styles.expenseItem, i === expenses.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[styles.expenseIcon, { backgroundColor: `${item.color}15` }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseTitle}>{item.title}</Text>
                  <Text style={styles.expenseMeta}>{item.cat}</Text>
                </View>
                <Text style={styles.expensePrice}>-₹{item.price}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  
  // Header Redesign
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
  headerInnerLeftAligned: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerGreetingCol: {
    flex: 1,
    justifyContent: 'center',
  },
  headerGreetingText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
  },
  headerNameText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  headerAvatarBtn: {
    marginLeft: 16,
  },
  avatar: { 
    width: 46, 
    height: 46, 
    borderRadius: 23, 
    backgroundColor: '#FFFFFF', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarText: { color: '#166534', fontWeight: '800', fontSize: 18 },

  // Scroll Content
  scrollContent: { paddingHorizontal: 24, paddingTop: 24 },

  // Hero Card with Textures
  heroCardWrapper: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    elevation: 4,
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    marginBottom: 32,
  },
  heroCard: { padding: 28, position: 'relative' },
  textureCircle1: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: '#FFFFFF', opacity: 0.05, top: -70, right: -50 },
  textureCircle2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: '#86EFAC', opacity: 0.1, bottom: -30, left: -30 },
  heroContentZIndex: { zIndex: 10 },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  amountRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10 },
  currency: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', marginRight: 4, marginTop: 4 },
  mainAmount: { color: '#FFFFFF', fontSize: 56, fontWeight: '800', letterSpacing: -2 },
  simpleBarContainer: { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, marginTop: 24, flexDirection: 'row', overflow: 'hidden' },
  barSegment: { height: '100%' },
  legendRow: { flexDirection: 'row', gap: 20, marginTop: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '500' },
  heroFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, paddingTop: 18, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' },
  heroSubLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  // Section Headers
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  
  // Weekly Chart
  chartContainer: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 32, elevation: 2, shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
  chartTooltipRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  chartTooltipDay: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  chartTooltipAmount: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  chartBody: { flexDirection: 'row', height: 160 },
  yAxis: { width: 36, justifyContent: 'space-between', paddingVertical: 2 },
  yAxisLabel: { fontSize: 11, fontWeight: '500', color: '#94A3B8' },
  graphArea: { flex: 1, position: 'relative', marginLeft: 4 },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#F1F5F9' },
  barsContainer: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  barWrapper: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  thinBar: { borderRadius: 6, zIndex: 1 },
  emptyBarPlaceholder: { width: 8, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },
  xAxis: { flexDirection: 'row', marginTop: 12, alignItems: 'center' },
  xAxisSpacer: { width: 40 },
  xAxisLabelsContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  dayLabelActive: { color: '#166534', fontWeight: '700' },

  // Recent Activity
  recentActivityCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 10, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2, shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
  expenseItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  expenseIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  expenseInfo: { flex: 1, marginHorizontal: 16 },
  expenseTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  expenseMeta: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },
  expensePrice: { fontSize: 16, fontWeight: '800', color: '#0F172A' },

  // Empty State
  emptyCard: { backgroundColor: '#F8FAFC', borderRadius: 24, paddingVertical: 40, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginTop: 16 },
  emptyText: { fontSize: 14, fontWeight: '500', color: '#64748B', textAlign: 'center', lineHeight: 22, marginTop: 8 },
});