import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Pressable, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboarding } from "../context/OnboardingContext";

export default function IncomeScreen() {
  const { data, updateData } = useOnboarding();
  const [primaryIncome, setPrimaryIncome] = useState("");
  const [secondaryIncome, setSecondaryIncome] = useState("");

  const isStudent = data.userType === 'student';
  const total = (parseFloat(primaryIncome) || 0) + (parseFloat(secondaryIncome) || 0);

  const handleContinue = () => {
    updateData({ income: total });
    router.push("/obligations");
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. PROGRESS STEPPER */}
            <View style={styles.stepperContainer}>
              {[1, 2, 3, 4].map((step) => (
                <View 
                  key={step} 
                  style={[styles.stepLine, { backgroundColor: step <= 2 ? '#166534' : '#E2E8F0' }]} 
                />
              ))}
            </View>

            {/* 2. HEADER */}
            <View style={styles.headerSection}>
              <Text style={styles.heading}>{isStudent ? "Monthly Allowance" : "Monthly Salary"}</Text>
              <Text style={styles.subHeading}>
                {isStudent 
                  ? "Input your recurring pocket money or stipend." 
                  : "Enter your primary base pay and any side earnings."}
              </Text>
            </View>

            {/* 3. DYNAMIC SUMMARY CARD */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryLabel}>TOTAL MONTHLY INFLOW</Text>
                <Text style={styles.summaryAmount}>₹{total.toLocaleString()}</Text>
              </View>
              <View style={styles.iconCircle}>
                <Ionicons name="wallet-outline" size={28} color="#166534" />
              </View>
            </View>

            <Text style={styles.sectionLabel}>BREAKDOWN</Text>

            {/* 4. INPUT GROUP 1 */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>{isStudent ? "Primary Allowance" : "Base Take-home Pay"}</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  placeholder="0"
                  placeholderTextColor="#CBD5E1"
                  keyboardType="numeric"
                  style={styles.input}
                  value={primaryIncome}
                  onChangeText={setPrimaryIncome}
                />
              </View>
            </View>

            {/* 5. INPUT GROUP 2 */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>{isStudent ? "Other (Gifts/Side Hustle)" : "Bonus / Variable Income"}</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  placeholder="0"
                  placeholderTextColor="#CBD5E1"
                  keyboardType="numeric"
                  style={styles.input}
                  value={secondaryIncome}
                  onChangeText={setSecondaryIncome}
                />
              </View>
            </View>

            {/* SPACER FOR BUTTON */}
            <View style={{ height: 120 }} />
          </ScrollView>

          {/* 6. FIXED BOTTOM ACTION */}
          <View style={styles.buttonWrapper}>
            <Pressable
              style={({ pressed }) => [
                styles.button, 
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                !primaryIncome && styles.buttonDisabled
              ]}
              onPress={handleContinue}
              disabled={!primaryIncome}
            >
              <Text style={styles.buttonText}>Continue to Layout</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { paddingHorizontal: 30, paddingTop: 10 },
  
  stepperContainer: { flexDirection: 'row', marginBottom: 25, gap: 6 },
  stepLine: { flex: 1, height: 2.5, borderRadius: 2 },

  headerSection: { marginBottom: 24 },
  heading: { 
    color: "#0F172A", 
    fontSize: 34, 
    fontFamily: 'Jakarta-ExtraBold', 
    letterSpacing: -1.2 
  },
  subHeading: { 
    color: "#64748B", 
    fontSize: 16, 
    fontFamily: 'Inter-Medium', 
    lineHeight: 22, 
    marginTop: 8 
  },
  
  summaryCard: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 32,
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 15, elevation: 2,
  },
  summaryInfo: { flex: 1 },
  summaryLabel: { 
    color: "#64748B", 
    fontSize: 11, 
    fontFamily: 'Jakarta-Bold', 
    letterSpacing: 1.5 
  },
  summaryAmount: { 
    color: "#0F172A", 
    fontSize: 36, 
    fontFamily: 'Inter-Black', 
    marginTop: 4,
    letterSpacing: -1.5
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F0FDF4",
    justifyContent: 'center',
    alignItems: 'center',
  },

  sectionLabel: { 
    color: "#0F172A", 
    fontSize: 11, 
    fontFamily: 'Jakarta-ExtraBold', 
    letterSpacing: 2, 
    marginBottom: 16 
  },

  inputCard: { 
    backgroundColor: "#FFFFFF", 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#F1F5F9' 
  },
  inputLabel: { 
    color: "#64748B", 
    fontSize: 12, 
    fontFamily: 'Inter-Medium', 
    marginBottom: 8 
  },
  inputWrapper: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  currencySymbol: { 
    fontSize: 20, 
    color: "#94A3B8", 
    fontFamily: 'Inter-Bold' 
  },
  input: { 
    flex: 1, 
    color: "#0F172A", 
    fontSize: 24, 
    fontFamily: 'Inter-Medium', // Sophisticated lighter weight for large inputs
    letterSpacing: -1 
  },

  buttonWrapper: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: 30, 
    backgroundColor: 'rgba(248, 250, 252, 0.95)' 
  },
  button: {
    backgroundColor: "#166534",
    paddingVertical: 22,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  buttonDisabled: { backgroundColor: "#94A3B8", opacity: 0.5 },
  buttonText: { 
    color: "#FFFFFF", 
    fontFamily: 'Jakarta-Bold', 
    fontSize: 18, 
    letterSpacing: 0.5 
  },
});