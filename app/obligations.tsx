import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform 
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from "../context/OnboardingContext";

const CATEGORIES = [
  { id: 'rent', label: 'Rent / PG', icon: 'home-outline' },
  { id: 'groceries', label: 'Groceries', icon: 'cart-outline' },
  { id: 'transport', label: 'Transport / Fuel', icon: 'car-outline' },
  { id: 'bills', label: 'Bills / Utility', icon: 'flash-outline' },
  { id: 'subs', label: 'Subscriptions', icon: 'play-circle-outline' },
  { id: 'emi', label: 'Loans / EMI', icon: 'calendar-outline' },
  { id: 'tuition', label: 'Fees / Tuition', icon: 'book-outline' },
];

export default function ObligationsScreen() {
  const { data, updateData } = useOnboarding();
  const [amounts, setAmounts] = useState<{ [key: string]: string }>({});
  const [alreadySpent, setAlreadySpent] = useState("");

  const handleAmountChange = (id: string, val: string) => {
    setAmounts(prev => ({ ...prev, [id]: val }));
  };

  const totalFixed = Object.values(amounts).reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
  const totalOutflow = totalFixed + (parseFloat(alreadySpent) || 0);
  const utilization = totalOutflow / (data.income || 1);
  const isOverBudget = utilization > 1;

  // REFINED ACTIVE COLOR LOGIC (Green -> Amber -> Red)
  const getActiveColor = () => {
    if (utilization <= 0.4) return '#166534'; // Forest Green (Matches Already Spent)
    if (utilization <= 0.7) return '#CA8A04'; // Amber
    if (utilization <= 0.9) return '#EA580C'; // Orange
    return '#E11D48'; // Rose Red
  };

  const activeColor = getActiveColor();

  const onFinish = () => {
    if (isOverBudget) return;
    updateData({ 
      obligations: { 
        ...Object.fromEntries(Object.entries(amounts).map(([k, v]) => [k, parseFloat(v) || 0])), 
        spent: parseFloat(alreadySpent) || 0 
      }
    });
    router.push("/transition");
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={{ flex: 1 }}
          keyboardVerticalOffset={20}
        >
          <View style={styles.fixedTop}>
            <View style={styles.stepperContainer}>
              {[1, 2, 3, 4].map((step) => (
                <View key={step} style={[styles.stepLine, { backgroundColor: step <= 3 ? '#166534' : '#E2E8F0' }]} />
              ))}
            </View>
            <View style={styles.headerSection}>
              <Text style={styles.heading}>Monthly Layout</Text>
            </View>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* SUMMARY CARD - Now uses dynamic Active Color */}
            <View style={[styles.summaryCard, { borderColor: isOverBudget ? '#E11D48' : '#E2E8F0' }]}>
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryLabel}>TOTAL OUTFLOW</Text>
                <Text style={[styles.summaryAmount, { color: activeColor }]}>
                  ₹{totalOutflow.toLocaleString()}
                </Text>
              </View>
              <View style={[styles.iconCircleLarge, { backgroundColor: `${activeColor}10` }]}>
                <Ionicons name={isOverBudget ? "alert-circle" : "receipt-outline"} size={28} color={activeColor} /> 
              </View>
            </View>

            {/* PROGRESS BAR - Matches Active Color */}
            <View style={styles.usageContainer}>
              <View style={styles.barBackground}>
                <View style={[styles.barFill, { width: `${Math.min(utilization * 100, 100)}%`, backgroundColor: activeColor }]} />
              </View>
              <View style={styles.usageLabels}>
                <Text style={styles.usageText}>Utilization</Text>
                <Text style={[styles.usagePercent, { color: activeColor }]}>{Math.round(utilization * 100)}%</Text>
              </View>
            </View>

            {/* ALREADY SPENT - COMPACT */}
            <View style={styles.specialCardSmall}>
              <View style={styles.cardLeft}>
                <View style={styles.iconCircleSmall}>
                  <Ionicons name="card-outline" size={16} color="#166534" />
                </View>
                <View>
                   <Text style={styles.cardLabelSmall}>ALREADY SPENT</Text>
                   <Text style={styles.cardSubtext}>Current month</Text>
                </View>
              </View>
              <View style={styles.inputWrapperSmall}>
                <Text style={styles.currencySmall}>₹</Text>
                <TextInput
                  placeholder="0"
                  placeholderTextColor="#CBD5E1"
                  keyboardType="numeric"
                  style={styles.mainInputSmall}
                  value={alreadySpent}
                  onChangeText={setAlreadySpent}
                />
              </View>
            </View>

            <View style={styles.dividerThin} />
            
            <Text style={styles.sectionLabel}>FIXED OBLIGATIONS</Text>

            {CATEGORIES.map((cat) => (
              <View key={cat.id} style={styles.listItem}>
                <View style={styles.itemLeft}>
                  <Ionicons name={cat.icon as any} size={18} color="#64748B" />
                  <Text style={styles.itemText}>{cat.label}</Text>
                </View>
                <View style={styles.itemInputWrapper}>
                  <Text style={styles.itemCurrency}>₹</Text>
                  <TextInput
                    placeholder="0"
                    placeholderTextColor="#CBD5E1"
                    keyboardType="numeric"
                    style={styles.itemInput}
                    value={amounts[cat.id] || ""}
                    onChangeText={(val) => handleAmountChange(cat.id, val)}
                  />
                </View>
              </View>
            ))}

            <View style={{ height: 110 }} />
          </ScrollView>

          <View style={styles.buttonWrapper}>
            <Pressable 
              style={({ pressed }) => [
                styles.button, 
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }, 
                isOverBudget ? styles.buttonDisabled : { backgroundColor: '#166534' }
              ]} 
              onPress={onFinish}
              disabled={isOverBudget}
            >
              <Text style={styles.buttonText}>{isOverBudget ? "Budget Exceeded" : "Confirm Layout"}</Text>
              {!isOverBudget && <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  fixedTop: { paddingHorizontal: 24, paddingTop: 8 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 12 },
  stepperContainer: { flexDirection: 'row', marginBottom: 16, gap: 5 },
  stepLine: { flex: 1, height: 2.5, borderRadius: 2 },
  headerSection: { marginBottom: 4 },
  heading: { color: "#0F172A", fontSize: 30, fontFamily: 'Jakarta-ExtraBold', letterSpacing: -1 },
  summaryCard: {
    backgroundColor: "#FFFFFF", padding: 18, borderRadius: 22,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, marginBottom: 12,
  },
  summaryInfo: { flex: 1 },
  summaryLabel: { color: "#64748B", fontSize: 10, fontFamily: 'Jakarta-Bold', letterSpacing: 1.2 },
  summaryAmount: { fontSize: 30, fontFamily: 'Inter-Black', marginTop: 2, letterSpacing: -1 },
  iconCircleLarge: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  usageContainer: { marginBottom: 20 },
  barBackground: { height: 6, backgroundColor: "#E2E8F0", borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  barFill: { height: '100%', borderRadius: 3 },
  usageLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  usageText: { color: "#64748B", fontSize: 12, fontFamily: 'Inter-Medium' },
  usagePercent: { fontSize: 12, fontFamily: 'Inter-Bold' },
  specialCardSmall: { 
    backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#E2E8F0',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircleSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  cardLabelSmall: { color: "#166534", fontSize: 10, fontFamily: 'Jakarta-Bold', letterSpacing: 1 },
  cardSubtext: { color: "#94A3B8", fontSize: 11, fontFamily: 'Inter-Medium' },
  inputWrapperSmall: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  currencySmall: { fontSize: 18, color: "#94A3B8", fontFamily: 'Inter-Bold' },
  mainInputSmall: { fontSize: 24, fontFamily: 'Inter-Black', color: "#0F172A", minWidth: 60, textAlign: 'right' },
  dividerThin: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 20 },
  sectionLabel: { color: "#0F172A", fontSize: 10, fontFamily: 'Jakarta-ExtraBold', letterSpacing: 1.5, marginBottom: 12 },
  listItem: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, marginBottom: 8,
    borderWidth: 1, borderColor: '#F1F5F9'
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemText: { color: "#475569", fontSize: 14, fontFamily: 'Inter-Medium' },
  itemInputWrapper: { 
    flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F8FAFC', 
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 
  },
  itemCurrency: { color: "#94A3B8", fontSize: 12, fontFamily: 'Inter-Bold' },
  itemInput: { color: "#0F172A", fontSize: 15, fontFamily: 'Inter-Bold', minWidth: 50, textAlign: 'right' },
  buttonWrapper: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, 
    backgroundColor: 'rgba(248, 250, 252, 0.95)' 
  },
  button: { 
    paddingVertical: 20, borderRadius: 18, 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', 
  },
  buttonDisabled: { backgroundColor: "#94A3B8" },
  buttonText: { color: "#FFFFFF", fontFamily: 'Jakarta-Bold', fontSize: 16, letterSpacing: 0.5 },
});