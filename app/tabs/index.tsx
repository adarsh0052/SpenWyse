import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../../context/OnboardingContext';

const { width } = Dimensions.get('window');

// --- Mock Data ---
const categoryData = [
  { name: 'Food', spent: 1200, budget: 3000, color: '#10B981', icon: 'fast-food' as const },
  { name: 'Shopping', spent: 820, budget: 2000, color: '#F59E0B', icon: 'bag-handle' as const },
  { name: 'Transport', spent: 650, budget: 1500, color: '#6366F1', icon: 'car' as const },
];

const weeklyDataAmounts = [400, 700, 450, 900, 650, 300, 200];
const maxWeeklyAmount = 1000; 
const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const recentExpenses = [
  { title: 'Shopping', cat: 'Shopping', price: '₹320', time: '1:30 PM', icon: 'bag-handle', color: '#F59E0B' },
  { title: 'Lunch - Zomato', cat: 'Food', price: '₹220', time: '12:20 PM', icon: 'fast-food', color: '#10B981' },
  { title: 'Uber Premier', cat: 'Transport', price: '₹120', time: 'Yesterday', icon: 'car', color: '#6366F1' },
];

export default function Dashboard() {
  const { data } = useOnboarding();

  // Logic for Dynamic Date & Time
  const { greeting, chartDayIndex } = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    
    let currentGreeting = 'Good Evening,';
    if (hour < 12) currentGreeting = 'Good Morning,';
    else if (hour < 17) currentGreeting = 'Good Afternoon,';

    const currentDay = now.getDay();
    const activeIndex = (currentDay + 6) % 7; 

    return { greeting: currentGreeting, chartDayIndex: activeIndex };
  }, []);

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(chartDayIndex);

  // Logic for Daily Gauge
  const dailyLimit = 800; 
  const spentToday = 260; 
  const remaining = dailyLimit - spentToday;
  const consumptionRatio = Math.min(1, spentToday / dailyLimit);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>{greeting}</Text>
            <Text style={styles.nameText}>Adarsh</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={20} color="#0F172A" />
              <View style={styles.notifDot} />
            </Pressable>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>A</Text>
            </View>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* HERO: UNIVERSAL GREEN HEADER / SAFE TO SPEND */}
          <LinearGradient colors={['#166534', '#14532D']} style={styles.heroCard}>
            <View style={styles.heroLayout}>
              <View style={styles.heroTextContent}>
                <Text style={styles.heroLabel}>SAFE TO SPEND TODAY</Text>
                <View style={styles.amountRow}>
                  <Text style={styles.currency}>₹</Text>
                  <Text style={styles.mainAmount}>{remaining.toLocaleString()}</Text>
                </View>
                
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBarFill, { width: `${(1 - consumptionRatio) * 100}%` }]} />
                </View>
                
                <View style={styles.heroFooter}>
                  <Text style={styles.heroSubLabel}>₹8,200 remaining</Text>
                  <Text style={styles.heroSubLabel}>18 days left</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* TOP CATEGORIES */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Spending Categories</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {categoryData.map((cat, i) => {
              const progress = (cat.spent / cat.budget) * 100;
              return (
                <View key={i} style={styles.catCard}>
                  <View style={[styles.catIconContainer, { backgroundColor: `${cat.color}15` }]}>
                    <Ionicons name={cat.icon} size={20} color={cat.color} />
                  </View>
                  <Text style={styles.catName}>{cat.name}</Text>
                  <Text style={styles.catAmount}>₹{cat.spent.toLocaleString()} <Text style={styles.catBudget}>/ ₹{cat.budget.toLocaleString()}</Text></Text>
                  
                  <View style={styles.catProgressTrack}>
                    <View style={[styles.catProgressFill, { width: `${progress}%`, backgroundColor: cat.color }]} />
                  </View>
                  <Text style={styles.catPercent}>{Math.round(progress)}%</Text>
                </View>
              );
            })}
          </ScrollView>

          {/* WEEKLY SPENDING: INTERACTIVE THIN BARS */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weekly Spending</Text>
          </View>
          
          <View style={styles.chartContainer}>
            <View style={styles.chartBody}>
              {/* Y-Axis Labels */}
              <View style={styles.yAxis}>
                <Text style={styles.yAxisLabel}>₹1k</Text>
                <Text style={styles.yAxisLabel}>₹500</Text>
                <Text style={styles.yAxisLabel}>0</Text>
              </View>

              <View style={styles.graphArea}>
                <View style={[styles.gridLine, { top: 0 }]} />
                <View style={[styles.gridLine, { top: '50%' }]} />
                <View style={[styles.gridLine, { bottom: 0 }]} />

                <View style={styles.barsContainer}>
                  {weeklyDataAmounts.map((val, i) => {
                    const isSelected = i === selectedDayIndex;
                    const heightPercent = (val / maxWeeklyAmount) * 100;
                    
                    return (
                      <Pressable 
                        key={i} 
                        style={styles.barWrapper}
                        onPress={() => setSelectedDayIndex(i)}
                      >
                        {/* Tooltip absolutely positioned to prevent squishing */}
                        {isSelected && (
                          <View style={[styles.tooltipContainer, { bottom: `${heightPercent}%` }]}>
                            <Text style={styles.tooltipText} numberOfLines={1}>₹{val}</Text>
                          </View>
                        )}
                        <View style={[
                          styles.thinBar, 
                          { 
                            height: `${heightPercent}%`, 
                            backgroundColor: '#166534', 
                            opacity: isSelected ? 1 : 0.3, 
                            width: isSelected ? 12 : 8 
                          }
                        ]} />
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* X-Axis Labels */}
            <View style={styles.xAxis}>
              <View style={styles.xAxisSpacer} />
              <View style={styles.xAxisLabelsContainer}>
                {days.map((day, i) => {
                  const isSelected = i === selectedDayIndex;
                  return (
                    <Text key={i} style={[styles.dayLabel, isSelected && { color: '#166534' }]}>
                      {day}
                    </Text>
                  );
                })}
              </View>
            </View>
          </View>

          {/* RECENT EXPENSES */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>
          
          {recentExpenses.map((item, i) => (
            <View key={i} style={styles.expenseItem}>
              <View style={[styles.expenseIcon, { backgroundColor: `${item.color}15` }]}>
                 <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseTitle}>{item.title}</Text>
                <Text style={styles.expenseMeta}>Today, {item.time}</Text>
              </View>
              <Text style={styles.expensePrice}>-{item.price}</Text>
            </View>
          ))}

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' }, 
  safeArea: { flex: 1 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingVertical: 15 },
  greetingText: { fontSize: 13, fontFamily: 'Inter-Medium', color: '#64748B' },
  nameText: { fontSize: 24, fontFamily: 'Jakarta-ExtraBold', color: '#0F172A', letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', position: 'relative' },
  notifDot: { position: 'absolute', top: 8, right: 10, width: 6, height: 6, borderRadius: 3, backgroundColor: '#E11D48' },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#166534', fontFamily: 'Jakarta-ExtraBold', fontSize: 16 },

  scrollContent: { paddingHorizontal: 25, paddingTop: 10 },

  heroCard: { borderRadius: 24, padding: 25, shadowColor: '#166534', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
  heroLayout: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroTextContent: { flex: 1 },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: 'Inter-Bold', letterSpacing: 1.5, textTransform: 'uppercase' }, 
  amountRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 },
  currency: { color: '#FFFFFF', fontSize: 32, fontFamily: 'Jakarta-ExtraBold', marginRight: 2, marginTop: 4, letterSpacing: -1 },
  mainAmount: { color: '#FFFFFF', fontSize: 52, fontFamily: 'Jakarta-ExtraBold', letterSpacing: -2 }, 
  
  progressBarContainer: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginTop: 16 },
  progressBarFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 3 },
  heroFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  heroSubLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Inter-Medium' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontFamily: 'Jakarta-Bold', color: '#0F172A' },
  catScroll: { marginHorizontal: -25, paddingHorizontal: 25 },
  
  catCard: { width: 140, padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16, marginRight: 15, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  catIconContainer: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  catName: { fontSize: 14, fontFamily: 'Jakarta-Bold', color: '#0F172A', marginBottom: 4 }, 
  catAmount: { fontSize: 12, fontFamily: 'Inter-Bold', color: '#0F172A', marginBottom: 12 }, 
  catBudget: { color: '#94A3B8', fontFamily: 'Inter-Medium' },
  catProgressTrack: { height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, marginBottom: 6 },
  catProgressFill: { height: '100%', borderRadius: 2 },
  catPercent: { fontSize: 10, color: '#94A3B8', fontFamily: 'Inter-Bold', alignSelf: 'flex-end', letterSpacing: 0.5 },

  chartContainer: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  chartBody: { flexDirection: 'row', height: 160 }, 
  yAxis: { width: 32, justifyContent: 'space-between', paddingVertical: 2 },
  yAxisLabel: { fontSize: 10, fontFamily: 'Inter-Medium', color: '#94A3B8' },
  graphArea: { flex: 1, position: 'relative' },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#F1F5F9' },
  barsContainer: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  barWrapper: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' },
  thinBar: { borderRadius: 4, zIndex: 1 },
  
  // FIX: Absolute positioning and minWidth added here
  tooltipContainer: { 
    position: 'absolute',
    backgroundColor: '#0F172A', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6, 
    marginBottom: 6, 
    zIndex: 10,
    minWidth: 45, // Prevents squishing
    alignItems: 'center',
    justifyContent: 'center'
  },
  tooltipText: { color: '#FFFFFF', fontSize: 11, fontFamily: 'Inter-Bold' },

  xAxis: { flexDirection: 'row', marginTop: 12, alignItems: 'center' },
  xAxisSpacer: { width: 32 },
  xAxisLabelsContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 11, color: '#94A3B8', fontFamily: 'Inter-Bold', letterSpacing: 0.5 },

  expenseItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  expenseIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  expenseInfo: { flex: 1, marginHorizontal: 16 },
  expenseTitle: { fontSize: 15, fontFamily: 'Jakarta-Bold', color: '#0F172A' },
  expenseMeta: { fontSize: 12, color: '#64748B', marginTop: 4, fontFamily: 'Inter-Medium' },
  expensePrice: { fontSize: 15, fontFamily: 'Inter-Bold', color: '#0F172A' }
});