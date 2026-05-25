import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/onboarding");
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>SPENDWISE</Text>
      <Text style={styles.tagline}>
        Safe intelligent spending.
      </Text>

      <ActivityIndicator
        size="small"
        color="#5EEAD4"
        style={{ marginTop: 40 }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#0F1115",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    logo: {
      color: "#F8FAFC",
      fontSize: 40,
      fontWeight: "800",
      letterSpacing: 1,
    },
    tagline: {
      color: "#94A3B8",
      marginTop: 12,
      fontSize: 16,
    },
  });