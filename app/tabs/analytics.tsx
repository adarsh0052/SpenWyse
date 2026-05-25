import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts';

const { width } = Dimensions.get('window');

// --- Mock Data ---
const timeTabs = ['Month', '3M', 'Year'];

const summaryStats = [
  { label: 'Total Spent', value: '₹12,420', highlight: true },
  { label: 'Total Saved', value: '₹3,980', highlight: false },
  { label: 'Avg. Daily Spend', value: '₹401', highlight: false },
  { label: 'Highest Day', value: '₹620', highlight: false },
];

// Bar Chart Mock Data for Analytics
const barDataAmounts = [400, 700, 1200, 900, 650, 1100, 850];
const barLabels = ['1', '5', '10', '15', '20', '25', '30'];
const maxBarAmount = 1500;

const categoryBreakdown = [
  { name: 'Food', percent: 35, amount: '₹4,340', color: '#166534' },
  { name: 'Shopping', percent: 30, amount: '₹3,720', color: '#F59E0B' },
  { name: 'Transport', percent: 15, amount: '₹1,860', color: '#6366F1' },
  { name: 'Entertainment', percent: 10, amount: '₹1,240', color: '#E11D48' },
  { name: 'Others', percent: 10, amount: '₹1,260', color: '#94A3B8' },
];

const pieData = categoryBreakdown.map(cat => ({
  value: cat.percent,
  color: cat.color,
}));

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('Month');
  const [selectedBarIndex, setSelectedBarIndex] = useState<number>(6); // Default select last item

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Pressable style={styles.iconBtn}>
            <Ionicons name="calendar-outline" size={20} color="#0F172A" />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* TIMEFRAME TOGGLE */}
          <View style={styles.toggleContainer}>
            {timeTabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <Pressable 
                  key={tab} 
                  style={[styles.toggleBtn, isActive && styles.toggleBtnActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.toggleText, isActive && styles.toggleTextActive]}>
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* SUMMARY STATS GRID */}
          <View style={styles.statsGrid}>
            {summaryStats.map((stat, i) => (
              <View key={i} style={styles.statCard}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={[styles.statValue, stat.highlight && { color: '#166534' }]}>
                  {stat.value}
                </Text>
              </View>
            ))}
          </View>

          {/* SPENDING OVERVIEW (BAR CHART REPLACEMENT) */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Spending Overview</Text>
            
            <View style={styles.chartContainer}>
              <View style={styles.chartBody}>
                {/* Y-Axis */}
                <View style={styles.yAxis}>
                  <Text style={styles.yAxisLabel}>₹1.5k</Text>
                  <Text style={styles.yAxisLabel}>₹750</Text>
                  <Text style={styles.yAxisLabel}>0</Text>
                </View>

                {/* Graph Area */}
                <View style={styles.graphArea}>
                  <View style={[styles.gridLine, { top: 0 }]} />
                  <View style={[styles.gridLine, { top: '50%' }]} />
                  <View style={[styles.gridLine, { bottom: 0 }]} />

                  <View style={styles.barsContainer}>
                    {barDataAmounts.map((val, i) => {
                      const isSelected = i === selectedBarIndex;
                      const heightPercent = (val / maxBarAmount) * 100;
                      
                      return (
                        <Pressable 
                          key={i} 
                          style={styles.barWrapper}
                          onPress={() => setSelectedBarIndex(i)}
                        >
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

              {/* X-Axis */}
              <View style={styles.xAxis}>
                <View style={styles.xAxisSpacer} />
                <View style={styles.xAxisLabelsContainer}>
                  {barLabels.map((day, i) => {
                    const isSelected = i === selectedBarIndex;
                    return (
                      <Text key={i} style={[styles.dayLabel, isSelected && { color: '#166534' }]}>
                        {day}
                      </Text>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>

          {/* CATEGORY BREAKDOWN (DONUT CHART + LEGEND) */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Category Breakdown</Text>
            
            <View style={styles.breakdownCard}>
              <View style={styles.pieContainer}>
                <PieChart
                  data={pieData}
                  donut
                  radius={50}          // Reduced to prevent overflow
                  innerRadius={32}     // Adjusted proportionately
                  innerCircleColor={'#FFFFFF'}
                  centerLabelComponent={() => {
                    return <View style={styles.pieCenter} />;
                  }}
                />
              </View>
              
              <View style={styles.legendContainer}>
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
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  safeArea: { flex: 1 },
  
  // HEADER
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingVertical: 15 },
  headerTitle: { fontSize: 24, fontFamily: 'Jakarta-ExtraBold', color: '#0F172A', letterSpacing: -0.5 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },

  scrollContent: { paddingHorizontal: 25, paddingTop: 10 },

  // TOGGLE TABS
  toggleContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4, marginBottom: 24 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  toggleBtnActive: { backgroundColor: '#166534', shadowColor: '#166534', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  toggleText: { fontSize: 13, fontFamily: 'Inter-Bold', color: '#64748B' },
  toggleTextActive: { color: '#FFFFFF' },

  // STATS GRID
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 32 },
  statCard: { width: '48%', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 15, shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statLabel: { fontSize: 10, fontFamily: 'Inter-Bold', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  statValue: { fontSize: 22, fontFamily: 'Jakarta-ExtraBold', color: '#0F172A', letterSpacing: -0.5 },

  // SECTION HEADERS
  sectionContainer: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontFamily: 'Jakarta-Bold', color: '#0F172A', marginBottom: 16 },

  // BAR CHART REPLACEMENT
  chartContainer: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  chartBody: { flexDirection: 'row', height: 160 }, 
  yAxis: { width: 38, justifyContent: 'space-between', paddingVertical: 2 },
  yAxisLabel: { fontSize: 10, fontFamily: 'Inter-Medium', color: '#94A3B8' },
  graphArea: { flex: 1, position: 'relative' },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#F1F5F9' },
  barsContainer: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  barWrapper: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' },
  thinBar: { borderRadius: 4, zIndex: 1 },
  
  tooltipContainer: { 
    position: 'absolute',
    backgroundColor: '#0F172A', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6, 
    marginBottom: 6, 
    zIndex: 10,
    minWidth: 45, 
    alignItems: 'center',
    justifyContent: 'center'
  },
  tooltipText: { color: '#FFFFFF', fontSize: 11, fontFamily: 'Inter-Bold' },

  xAxis: { flexDirection: 'row', marginTop: 12, alignItems: 'center' },
  xAxisSpacer: { width: 38 },
  xAxisLabelsContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 11, color: '#94A3B8', fontFamily: 'Inter-Bold', letterSpacing: 0.5 },

  // BREAKDOWN AREA
  breakdownCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  pieContainer: { width: 110, height: 110, justifyContent: 'center', alignItems: 'center' },
  pieCenter: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF' },
  
  // LEGEND (Fixed Overflow)
  legendContainer: { flex: 1, paddingLeft: 12 }, // flex 1 takes remaining space without pushing out
  legendItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  legendLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 }, // allows name to shrink if needed
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  legendName: { fontSize: 12, fontFamily: 'Inter-Bold', color: '#0F172A', flexShrink: 1 },
  legendRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendPercent: { fontSize: 11, fontFamily: 'Inter-Medium', color: '#64748B', width: 28, textAlign: 'right' },
  legendAmount: { fontSize: 12, fontFamily: 'Inter-Bold', color: '#0F172A', width: 50, textAlign: 'right' } // Reduced width slightly to prevent text cutoff
});