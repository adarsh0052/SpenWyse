import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboarding } from "../context/OnboardingContext";
import { supabase } from "../services/supabase";


export default function UserTypeScreen() {
  const [selectedType, setSelectedType] = useState<"student" | "employee" | null>(null);
  const { updateData } = useOnboarding();

  const handleSelect = (choice: 'student' | 'employee') => {
    setSelectedType(choice);
    updateData({ userType: choice });
  };

  const [loading, setLoading] = useState(false);

const handleContinue = async () => {
  if (!selectedType) return;
    try {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("No authenticated user");

      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        user_type: selectedType,
      })
      .eq("id", user.id);

    if (error) {
      console.log(
        "Profile Update Error:",
        error
      );

      return;
    }

    updateData({
      userType: selectedType,
    });

    router.push("/income");
  } catch (err) {
    console.log(err);
  } finally {
    setLoading(false);
  }
};
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        
        {/* TOP SECTION */}
        <View style={styles.topSection}>
          <View style={styles.stepperContainer}>
            {[1, 2, 3, 4].map((step) => (
              <View 
                key={step} 
                style={[styles.stepLine, { backgroundColor: step === 1 ? '#166534' : '#E2E8F0' }]} 
              />
            ))}
          </View>

          <View style={styles.headerSection}>
            <Text style={styles.heading}>Choose profile</Text>
            <Text style={styles.subHeading}>We'll customize your strategy based on your choice.</Text>
          </View>
        </View>

        {/* MID SECTION (Selection Cards) */}
        <View style={styles.midSection}>
          <Pressable
            style={({ pressed }) => [
              styles.card, 
              selectedType === "student" && styles.selectedCard,
              pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }
            ]}
            onPress={() => handleSelect("student")}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, selectedType === "student" && styles.selectedIconBox]}>
                <Ionicons 
                  name="school-outline" 
                  size={22} 
                  color={selectedType === "student" ? "#FFFFFF" : "#166534"} 
                />
              </View>
              <Ionicons 
                name={selectedType === "student" ? "checkmark-circle" : "ellipse-outline"} 
                size={24} 
                color={selectedType === "student" ? "#166534" : "#E2E8F0"} 
              />
            </View>
            <Text style={styles.cardTitle}>Student</Text>
            <Text style={styles.cardText}>Optimize allowance and track recurring campus expenses.</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.card, 
              selectedType === "employee" && styles.selectedCard,
              pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }
            ]}
            onPress={() => handleSelect("employee")}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, selectedType === "employee" && styles.selectedIconBox]}>
                <Ionicons 
                  name="briefcase-outline" 
                  size={22} 
                  color={selectedType === "employee" ? "#FFFFFF" : "#166534"} 
                />
              </View>
              <Ionicons 
                name={selectedType === "employee" ? "checkmark-circle" : "ellipse-outline"} 
                size={24} 
                color={selectedType === "employee" ? "#166534" : "#E2E8F0"} 
              />
            </View>
            <Text style={styles.cardTitle}>Salaried Employee</Text>
            <Text style={styles.cardText}>Manage take-home pay, fixed obligations, and savings goals.</Text>
          </Pressable>
        </View>

        {/* BOTTOM SECTION */}
        <View style={styles.bottomSection}>
          <Pressable 
            style={({ pressed }) => [
              styles.button, 
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              !selectedType && styles.buttonDisabled
            ]} 
            onPress={handleContinue}
            disabled={!selectedType || loading}
          >
            <Text style={styles.buttonText}>
  {loading ? "Saving..." : "Continue"}
</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  safeArea: { flex: 1, paddingHorizontal: 30 },

  topSection: { flex: 1, justifyContent: 'center' },
  midSection: { flex: 2.5, justifyContent: 'center' },
  bottomSection: { flex: 1, justifyContent: 'flex-end', paddingBottom: 20 },

  stepperContainer: { flexDirection: 'row', marginBottom: 25, gap: 6 },
  stepLine: { flex: 1, height: 2.5, borderRadius: 2 },
  
  headerSection: { marginBottom: 10 },
  heading: { 
    color: "#0F172A", 
    fontSize: 42, 
    fontFamily: 'Jakarta-ExtraBold', 
    letterSpacing: -1.8 
  },
  subHeading: { 
    color: "#64748B", 
    fontSize: 17, 
    fontFamily: 'Inter-Medium', 
    lineHeight: 24, 
    marginTop: 10 
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 26,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 10, elevation: 2,
  },
  selectedCard: { borderColor: "#166534", backgroundColor: "#FFFFFF" },
  
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  iconBox: { 
    width: 48, 
    height: 48, 
    backgroundColor: "#F0FDF4", 
    borderRadius: 16, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  selectedIconBox: { backgroundColor: "#166534" },
  
  cardTitle: { 
    color: "#0F172A", 
    fontSize: 22, 
    fontFamily: 'Jakarta-Bold', 
    letterSpacing: -0.5 
  },
  cardText: { 
    color: "#64748B", 
    fontFamily: 'Inter-Regular', 
    marginTop: 8, 
    lineHeight: 20, 
    fontSize: 14 
  },

  button: { 
    backgroundColor: "#166534", 
    paddingVertical: 22, 
    borderRadius: 20, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 12 
  },
  buttonDisabled: { backgroundColor: "#94A3B8", opacity: 0.5 },
  buttonText: { 
    color: "#FFFFFF", 
    fontFamily: 'Jakarta-Bold', 
    fontSize: 18, 
    letterSpacing: 0.5 
  },
});