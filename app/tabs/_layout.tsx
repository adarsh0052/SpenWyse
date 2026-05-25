import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#166534',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "stats-chart" : "stats-chart-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* THE PUFFED FAB */}
      <Tabs.Screen
        name="add"
        options={{
          tabBarIcon: () => (
            <View style={styles.fabWrapper}>
              <View style={styles.fab}>
                <Ionicons name="add" size={32} color="#FFFFFF" />
              </View>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="allocations"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "layers" : "layers-outline"} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    height: Platform.OS === 'ios' ? 88 : 70, // Standard height + safe area for iOS
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    paddingTop: 10,
    position: 'absolute', // Still absolute to allow the FAB to "pop" out of bounds
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  fabWrapper: {
    top: -15, // This "puffs" the button out above the bar line
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30, // Circular for that classic puffed feel
    backgroundColor: '#166534',
    justifyContent: 'center',
    alignItems: 'center',
    // The "Slight Glow" Effect
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8, // Android glow/shadow
    borderWidth: 4,
    borderColor: '#FFFFFF', // Adds a "cutout" look against the bar
  },
});