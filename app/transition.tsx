import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboarding } from "../context/OnboardingContext";

export default function TransitionScreen() {
  const { data } = useOnboarding();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Calculate the result
  const totalFixed = Object.entries(data.obligations || {})
    .filter(([key]) => key !== 'spent')
    .reduce((acc, [_, val]) => acc + (val as number), 0);
  
  const spentSoFar = data.obligations?.spent || 0;
  const remainingPool = data.income - totalFixed - spentSoFar;

  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysLeft = lastDay - today.getDate() + 1;
  const dailyLimit = Math.max(0, Math.floor(remainingPool / daysLeft));

  useEffect(() => {
    // 1. Fade in the text
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();

    // 2. Wait 2.5 seconds and move to Dashboard
    const timer = setTimeout(() => {
      router.replace("/tabs"); // Points to your future Tab system
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.loaderLine}>
             <Animated.View style={styles.loaderFill} />
          </View>
          
          <Text style={styles.label}>ANALYSING FLOW</Text>
          <Text style={styles.heading}>Calculating your daily safe limit...</Text>
          
          <View style={styles.resultPreview}>
            <Text style={styles.currency}>₹</Text>
            <Text style={styles.amount}>{dailyLimit.toLocaleString()}</Text>
            <Text style={styles.perDay}>/day</Text>
          </View>
          
          <Text style={styles.subtext}>
            Factoring in ₹{totalFixed.toLocaleString()} for obligations and {daysLeft} days remaining.
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  inner: { alignItems: 'center', width: '100%' },
  
  loaderLine: { width: 60, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, marginBottom: 24, overflow: 'hidden' },
  loaderFill: { width: '100%', height: '100%', backgroundColor: '#166534' }, // Will add animation here later
  
  label: { color: "#166534", fontSize: 12, fontFamily: 'Jakarta-Bold', letterSpacing: 2, marginBottom: 12 },
  heading: { color: "#0F172A", fontSize: 24, fontFamily: 'Jakarta-ExtraBold', textAlign: 'center', lineHeight: 32, marginBottom: 40 },
  
  resultPreview: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  currency: { fontSize: 28, color: "#94A3B8", fontFamily: 'Inter-Medium' },
  amount: { fontSize: 64, color: "#0F172A", fontFamily: 'Inter-Medium', letterSpacing: -2 },
  perDay: { fontSize: 22, color: "#94A3B8", fontFamily: 'Inter-Medium' },
  
  subtext: { color: "#64748B", fontSize: 15, fontFamily: 'Inter-Medium', textAlign: 'center', marginTop: 32, lineHeight: 22 }
});