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
  Platform,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { signInWithGoogle } from '../services/auth';
import { supabase } from '../services/supabase';
import { ensureProfileExists } from '../services/auth';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const handleSignUp = async () => {
    try {
      setError(null);
  
      if (!name || !email || !password) {
        setError("Please fill in all fields to continue");
        return;
      }
  
      if (!validateEmail(email)) {
        setError("That email doesn't look right.");
        return;
      }
  
      const { data, error } =
  await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  });

console.log(
  'SIGNUP DATA',
  JSON.stringify(data, null, 2)
);

console.log(
  'SIGNUP ERROR',
  JSON.stringify(error, null, 2)
);
  
      if (error) {
        setError(error.message);
        return;
      }
  
      await ensureProfileExists();

router.replace('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#166534" />

      {/* Centered Notch Header (No Back Button) */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerInner}>
          <View style={styles.headerSide} />
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={styles.headerSide} />
        </View>
      </View>

      {/* ERROR TOAST */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#E11D48" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Ionicons name="close-circle" size={20} color="#FECDD3" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HERO SECTION */}
        <View style={styles.introSection}>
          <Text style={styles.heading}>Join SpenWyse</Text>
          <Text style={styles.subHeading}>
            Start your journey toward guilt-free spending and clarity.
          </Text>
        </View>

        {/* FORM */}
        <View style={styles.formSection}>
          <Text style={styles.label}>FULL NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor="#94A3B8"
            value={name}
            onChangeText={setName}
          />

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
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#94A3B8"
              />
            </TouchableOpacity>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.signUpButton,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleSignUp}
          >
            <Text style={styles.signUpText}>Sign Up</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </Pressable>

          {/* DIVIDER */}
          <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR CONTINUE WITH</Text>
            <View style={styles.line} />
          </View>

          {/* GOOGLE BUTTON */}
          <Pressable
            style={({ pressed }) => [
              styles.googleButton,
              pressed && {
                backgroundColor: "#F8FAFC",
                transform: [{ scale: 0.98 }],
              },
            ]}
            onPress={signInWithGoogle}
          >
            <View style={styles.googleContent}>
              <Image
                source={require("../assets/images/google.png")}
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </View>
          </Pressable>

          <Text style={styles.termsText}>
            By continuing, you agree to our Terms & Privacy Policy.
          </Text>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  // Header Matching Global Design
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
  headerInner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20 
  },
  headerSide: { 
    width: 44, 
    alignItems: 'flex-start' 
  },
  headerTitle: { 
    flex: 1, 
    textAlign: 'center', 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#FFFFFF' 
  },
  headerIconBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },

  introSection: { marginBottom: 36 },
  heading: {
    color: "#0F172A",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
  },
  subHeading: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    marginTop: 8,
  },

  formSection: { marginBottom: 20 },
  label: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 4,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    padding: 20,
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 24,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    marginBottom: 36,
  },
  passwordInput: {
    flex: 1,
    padding: 20,
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "500",
  },
  eyeIcon: { paddingHorizontal: 18 },

  signUpButton: {
    backgroundColor: "#166534",
    paddingVertical: 20,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    elevation: 4,
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  signUpText: { color: "#FFFFFF", fontWeight: "700", fontSize: 17 },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 36,
  },
  line: { flex: 1, height: 1, backgroundColor: "#E2E8F0" },
  orText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
    marginHorizontal: 16,
    letterSpacing: 1,
  },

  googleButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  googleContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    resizeMode: "contain",
  },
  googleButtonText: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 16,
  },

  termsText: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
    color: "#94A3B8",
    paddingHorizontal: 12,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: { color: "#64748B", fontSize: 15, fontWeight: "500" },
  loginLink: { color: "#166534", fontWeight: "700", fontSize: 15 },

  errorContainer: {
    marginHorizontal: 24,
    marginTop: 16,
    backgroundColor: "#FFF1F2",
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFE4E6",
  },
  errorText: {
    color: "#E11D48",
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
    marginLeft: 12,
  },
});