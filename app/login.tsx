import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Pressable,
  Platform 
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { signInWithGoogle } from '../services/auth';

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = () => {
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields to continue");
      return;
    }
    
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    router.replace("/(tabs)"); 
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Access Account</Text>
          <View style={{ width: 40 }} /> 
        </View>
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={18} color="#E11D48" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Ionicons name="close" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        )}

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.introSection}>
            <Text style={styles.heading}>Welcome Back</Text>
            <Text style={styles.subHeading}>Sign in to resume your optimized spending journey.</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={() => console.log("Navigate to Forgot Password")} 
              style={styles.forgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Recover Password?</Text>
            </TouchableOpacity>

            <Pressable 
              style={({ pressed }) => [
                styles.loginButton,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
              ]} 
              onPress={handleLogin}
            >
              <Text style={styles.loginText}>Sign In</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>

            <View style={styles.dividerContainer}>
              <View style={styles.line} />
              <Text style={styles.orText}>OR LOGIN WITH</Text>
              <View style={styles.line} />
            </View>

            <Pressable 
              style={({ pressed }) => [
                styles.googleButton,
                pressed && { backgroundColor: '#F1F5F9', transform: [{ scale: 0.98 }] }
              ]}
              onPress={signInWithGoogle}
            >
              <View style={styles.googleContent}>
                <Image 
                  source={require('../assets/images/google.png')} 
                  style={styles.googleIcon} 
                />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to SpendWise? </Text>
            <TouchableOpacity onPress={() => router.push("/auth")}>
              <Text style={styles.signUpLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { 
    color: "#0F172A", 
    fontSize: 16, 
    fontFamily: 'Jakarta-Bold' 
  },
  scrollContent: { paddingHorizontal: 30, paddingTop: 20, paddingBottom: 40 },
  
  introSection: { marginBottom: 32 },
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

  formSection: { marginBottom: 20 },
  label: { 
    color: "#0F172A", 
    fontSize: 11, 
    fontFamily: 'Jakarta-ExtraBold', 
    letterSpacing: 1.5, 
    marginBottom: 10,
    marginLeft: 4
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 18,
    color: "#0F172A",
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    marginBottom: 24,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 18,
    color: "#0F172A",
    fontSize: 15,
    fontFamily: 'Inter-Medium',
  },
  eyeIcon: { paddingHorizontal: 16 },

  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: 32,
    marginRight: 4
  },
  forgotPasswordText: {
    color: "#166534",
    fontSize: 14,
    fontFamily: 'Jakarta-Bold',
  },

  loginButton: {
    backgroundColor: "#166534",
    paddingVertical: 20,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loginText: { color: "#FFFFFF", fontFamily: 'Jakarta-Bold', fontSize: 18 },

  dividerContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 32 
  },
  line: { flex: 1, height: 1, backgroundColor: "#E2E8F0" },
  orText: { 
    color: "#94A3B8", 
    fontSize: 10, 
    fontFamily: 'Jakarta-Bold', 
    marginHorizontal: 12,
    letterSpacing: 1
  },

  googleButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  googleContent: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  googleIcon: { width: 20, height: 20, marginRight: 12, borderRadius: 30 },
  googleButtonText: { 
    color: "#0F172A", 
    fontFamily: 'Jakarta-Bold', 
    fontSize: 16 
  },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { color: "#64748B", fontSize: 15, fontFamily: 'Inter-Medium' },
  signUpLink: { 
    color: "#166534", 
    fontFamily: 'Jakarta-Bold', 
    fontSize: 15 
  },

  errorContainer: {
    marginHorizontal: 30,
    backgroundColor: "#FFF1F2",
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#FECDD3",
    marginTop: 10,
  },
  errorText: {
    color: "#E11D48",
    fontSize: 13,
    fontFamily: 'Inter-Bold',
    flex: 1,
    marginLeft: 10,
  },
});