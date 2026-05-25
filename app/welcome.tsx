import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.heading}>
          Understand how much you can safely spend every day.
        </Text>

        <Text style={styles.subText}>
          Smart expense tracking for students and salaried employees.
        </Text>
      </View>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/auth")}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#0F1115",
      padding: 24,
      justifyContent: "space-between",
    },
    heading: {
      color: "#F8FAFC",
      fontSize: 36,
      fontWeight: "800",
      marginTop: 100,
      lineHeight: 48,
    },
    subText: {
      color: "#94A3B8",
      fontSize: 16,
      marginTop: 20,
      lineHeight: 24,
    },
    button: {
      backgroundColor: "#5EEAD4",
      paddingVertical: 18,
      borderRadius: 20,
      marginBottom: 40,
    },
    buttonText: {
        textAlign: "center",
        color: "#0F1115",
        fontWeight: "700",
        fontSize: 16,
      },
    });