import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboarding } from "../context/OnboardingContext";
import { supabase } from "../services/supabase";
import { calculateFinanceSnapshot } from "../services/finance";

export default function SpentThisMonthScreen() {
  const { data, updateData } = useOnboarding();
  const [spentThisMonth, setSpentThisMonth] = useState("");
  const [loading, setLoading] = useState(false);
  const spent = parseFloat(spentThisMonth) || 0;
  const utilization = spent / (data.income || 1);
  const isOverBudget = utilization > 1;
  const getActiveColor = () => {
    if (utilization <= 0.4) return "#166534"; 
    if (utilization <= 0.7) return "#CA8A04"; 
    if (utilization <= 0.9) return "#EA580C"; 
    return "#E11D48";                         
  };
  const activeColor = getActiveColor();

  const finance = calculateFinanceSnapshot({
    income: data.income || 0,
    commitments: 0, 
    spent,
  });

  const dailySpendLimit = finance.dailySpendLimit;
  
  
  const handleContinue = async () => {
    if (isOverBudget || loading) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; 
      const { error } = await supabase
        .from("profiles")
        .update({
          current_month_spent: spent,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (error) {
        console.log("Profile Update Error:", error);
        return; 
      }
      updateData({ spentThisMonth: spent });
      router.replace("/transition");
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled" 
          >
            <View style={styles.stepperContainer}>
              {[1, 2, 3, 4].map((step) => (
                <View
                  key={step}
                  style={[
                    styles.stepLine,
                    { backgroundColor: step <= 3 ? "#166534" : "#E2E8F0" },
                  ]}
                />
              ))}
            </View>
            <View style={styles.headerSection}>
              <Text style={styles.heading}>
                What's gone so far?
              </Text>
              <Text style={styles.subHeading}>
                Include everything since the 1st — groceries,
                outings, any bills already paid. A rough number
                is completely fine.
              </Text>
            </View>
            <View
              style={[
                styles.summaryCard,
                { borderColor: isOverBudget ? "#E11D48" : "#E2E8F0" },
              ]}
            >
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryLabel}>SPENT THIS MONTH</Text>
                <Text style={[styles.summaryAmount, { color: activeColor }]}>
                  ₹{spent.toLocaleString()}
                </Text>
                {!isOverBudget && spent > 0 && (
                  <Text style={[styles.dailyHint, { color: activeColor }]}>
                    ₹{Math.round(dailySpendLimit).toLocaleString()} / day left
                  </Text>
                )}
              </View>
              <View
                style={[
                  styles.iconCircleLarge,
                  { backgroundColor: `${activeColor}10` },
                ]}
              >
                <Ionicons
                  name={isOverBudget ? "alert-circle" : "wallet-outline"}
                  size={28}
                  color={activeColor}
                />
              </View>
            </View>
            <View style={styles.usageContainer}>
              <View style={styles.barBackground}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.min(utilization * 100, 100)}%`,
                      backgroundColor: activeColor,
                    },
                  ]}
                />
              </View>
              <View style={styles.usageLabels}>
                <Text style={styles.usageText}>Monthly usage</Text>
                <Text style={[styles.usagePercent, { color: activeColor }]}>
                  {Math.round(utilization * 100)}%
                </Text>
              </View>
            </View>

            <View style={styles.inputCard}>
              <View style={styles.cardLeft}>
                <View style={styles.iconCircleSmall}>
                  <Ionicons name="card-outline" size={16} color="#166534" />
                </View>
                <View>
                  <Text style={styles.cardLabelSmall}>TOTAL SPENT</Text>
                  <Text style={styles.cardSubtext}>Since the 1st</Text>
                </View>
              </View>

              <View style={styles.inputWrapperSmall}>
                <Text style={styles.currencySmall}>₹</Text>
                <TextInput
                  placeholder="0"
                  placeholderTextColor="#CBD5E1"
                  keyboardType="numeric"
                  style={styles.mainInputSmall}
                  value={spentThisMonth}
                  onChangeText={setSpentThisMonth}
                />
              </View>
            </View>
            
            <View style={{ height: 120 }} />
          </ScrollView>

          <View style={styles.buttonWrapper}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                isOverBudget
                  ? styles.buttonDisabled
                  : { backgroundColor: "#166534" },
              ]}
              onPress={handleContinue}
              disabled={isOverBudget || loading}
            >
              <Text style={styles.buttonText}>
                {loading
                  ? "Saving..."
                  : isOverBudget
                  ? "Amount Exceeds Income"
                  : "Continue"}
              </Text>
              {!isOverBudget && (
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },

  // Stepper
  stepperContainer: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 28,
  },
  stepLine: {
    flex: 1,
    height: 3,
    borderRadius: 99,
  },

  // Header
  headerSection: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subHeading: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 21,
  },

  // Summary card
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  summaryInfo: {
    gap: 3,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94A3B8",
    letterSpacing: 0.8,
  },
  summaryAmount: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  dailyHint: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  iconCircleLarge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },

  // Utilization bar
  usageContainer: {
    marginBottom: 14,
  },
  barBackground: {
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 99,
    overflow: "hidden",
    marginBottom: 6,
  },
  barFill: {
    height: "100%",
    borderRadius: 99,
  },
  usageLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  usageText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  usagePercent: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Input card
  inputCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconCircleSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabelSmall: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94A3B8",
    letterSpacing: 0.8,
  },
  cardSubtext: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  inputWrapperSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  currencySmall: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
  },
  mainInputSmall: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    minWidth: 80,
    textAlign: "right",
  },

  // Hint card
  hintCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  hintLeft: {
    marginTop: 1,
  },
  hintTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4338CA",
    marginBottom: 3,
  },
  hintText: {
    fontSize: 12,
    color: "#6366F1",
    lineHeight: 18,
  },

  // Button
  buttonWrapper: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 32 : 20,
    paddingTop: 12,
    backgroundColor: "#F8FAFC",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 14,
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: "#F1F5F9",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});