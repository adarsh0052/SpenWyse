import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import LottieView from "lottie-react-native";
// import { useOnboarding } from "../context/OnboardingContext";
// import { supabase } from '../services/supabase';

export default function TransitionScreen() {
  // const { data } = useOnboarding();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  
    const timer = setTimeout(() => {
      router.replace("/(tabs)");
    }, 5500);
  
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
          
          <Text style={styles.label}>ANALYSING FLOW</Text>
          <Text style={styles.heading}>Structuring your{'\n'}financial blueprint...</Text>
          
          <LottieView
            source={require('../assets/gifs/Calculations.json')}
            autoPlay
            loop={true}
            style={styles.lottie}
            colorFilters={[
              {
                keypath: "GreenLayer", 
                color: "#166534", 
              },
              {
                keypath: "SandLayer", 
                color: "#D97706",
              }
            ]}
          />
          
          <Text style={styles.subtext}>
            Syncing data for your dashboard...
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  inner: { alignItems: 'center', width: '100%' },
  label: { 
    color: "#166534",
    fontSize: 12, 
    fontFamily: 'Jakarta-Bold', 
    letterSpacing: 2, 
    marginBottom: 12 
  },
  heading: { 
    color: "#0F172A", 
    fontSize: 24, 
    fontFamily: 'Jakarta-ExtraBold', 
    textAlign: 'center', 
    lineHeight: 32 
  },
  lottie: { width: 280, height: 280, marginVertical: 20 },
  subtext: { 
    color: "#64748B", 
    fontSize: 15, 
    fontFamily: 'Inter-Medium', 
    textAlign: 'center', 
    marginTop: 10 
  }
});