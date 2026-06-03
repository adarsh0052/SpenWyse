import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../services/supabase";

export default function RewardScreen() {
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    fetchSnapshot();
  }, []);

  const fetchSnapshot = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("monthly_snapshots")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.log(
          "SNAPSHOT FETCH ERROR",
          error
        );
        return;
      }

      setSnapshot(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const startFresh = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
  
    if (!user) return;
  
    await supabase
      .from('profiles')
      .update({
        current_month_spent: 0,
        reward_pending: false,
      })
      .eq('id', user.id);
  
    await supabase
      .from('allocations')
      .delete()
      .eq('user_id', user.id);
  
    router.replace('/(tabs)');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.content}>
          <ActivityIndicator
            size="large"
            color="#166534"
          />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        <Text style={styles.title}>
          🎉 Month Complete
        </Text>

        <Text style={styles.subtitle}>
          Here's how you did this month
        </Text>

        {snapshot && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>
                Monthly Income
              </Text>

              <Text style={styles.statValue}>
                ₹{Number(snapshot.income).toLocaleString()}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>
                Total Spent
              </Text>

              <Text style={styles.statValue}>
                ₹{Number(snapshot.spent).toLocaleString()}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>
                Locked Amount
              </Text>

              <Text style={styles.statValue}>
                ₹{Number(snapshot.locked).toLocaleString()}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>
                Total Saved
              </Text>

              <Text style={styles.savedValue}>
                ₹{Number(snapshot.saved).toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        <Pressable
          style={styles.button}
          onPress={startFresh}
        >
          <Text style={styles.buttonText}>
            Start Fresh
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },

  title: {
    fontSize: 34,
    fontWeight: "700",
    textAlign: "center",
    color: "#166534",
  },

  subtitle: {
    marginTop: 10,
    textAlign: "center",
    color: "#64748B",
    fontSize: 16,
  },

  statsContainer: {
    marginTop: 32,
    gap: 12,
  },

  statCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  statLabel: {
    color: "#64748B",
    fontSize: 14,
  },

  statValue: {
    color: "#0F172A",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 6,
  },

  savedValue: {
    color: "#166534",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 6,
  },

  button: {
    marginTop: 32,
    backgroundColor: "#166534",
    padding: 18,
    borderRadius: 16,
  },

  buttonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});