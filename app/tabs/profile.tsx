import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// --- Reusable Menu Item Component ---
interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  isLast?: boolean;
  isDestructive?: boolean;
}

const MenuRow = ({ icon, label, isLast, isDestructive }: MenuItemProps) => (
  <Pressable style={[styles.menuRow, !isLast && styles.menuRowBorder]}>
    <View style={styles.menuLeft}>
      {/* FIXED: Changed <div> to <View> and fixed style logic */}
      <View style={[styles.menuIconBox, isDestructive ? styles.destructiveIconBox : null]}>
        <Ionicons name={icon} size={20} color={isDestructive ? '#E11D48' : '#64748B'} />
      </View>
      <Text style={[styles.menuLabel, isDestructive ? styles.destructiveLabel : null]}>{label}</Text>
    </View>
    
    <View style={styles.menuRight}>
      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    </View>
  </Pressable>
);

export default function Profile() {
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { fontSize: 28, letterSpacing: -1 }]}>Profile</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* USER INFO CARD */}
          <View style={styles.userCard}>
            <LinearGradient colors={['#F0FDF4', '#FFFFFF']} style={styles.userCardGradient}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>A</Text>
                </View>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                </View>
              </View>
              
              <View style={styles.userInfo}>
                <Text style={styles.userName}>Adarsh</Text>
                <Text style={styles.userEmail}>adarsh@architect.dev</Text>
                
                <View style={styles.memberPill}>
                  <Text style={styles.memberPillText}>MEMBER SINCE 2025</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* ACCOUNT SECTION */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account</Text>
          </View>
          <View style={styles.menuCard}>
            <MenuRow icon="person-outline" label="Personal Information" isLast />
          </View>

          {/* SECURITY SECTION */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Security</Text>
          </View>
          <View style={styles.menuCard}>
            <MenuRow icon="key-outline" label="Change Passcode" isLast />
          </View>

          {/* SUPPORT & LOGOUT */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Support</Text>
          </View>
          <View style={styles.menuCard}>
            <MenuRow icon="help-buoy-outline" label="Help Center" />
            <MenuRow icon="document-text-outline" label="Terms & Privacy" />
            <MenuRow 
              icon="log-out-outline" 
              label="Log Out" 
              isLast 
              isDestructive 
            />
          </View>

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Architect App v1.0.4 (Build 205)</Text>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingVertical: 15 },
  headerTitle: { fontFamily: 'Jakarta-ExtraBold', color: '#0F172A' },
  scrollContent: { paddingHorizontal: 25, paddingTop: 10 },

  // USER CARD
  userCard: { borderRadius: 24, borderWidth: 1, borderColor: '#DCFCE7', overflow: 'hidden', marginBottom: 32 },
  userCardGradient: { flexDirection: 'row', alignItems: 'center', padding: 24 },
  avatarContainer: { position: 'relative', marginRight: 20 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  avatarText: { fontSize: 28, fontFamily: 'Jakarta-ExtraBold', color: '#166534' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 2 },
  userInfo: { flex: 1 },
  userName: { fontSize: 22, fontFamily: 'Jakarta-ExtraBold', color: '#0F172A', letterSpacing: -0.5 },
  userEmail: { fontSize: 13, fontFamily: 'Inter-Medium', color: '#64748B', marginTop: 2, marginBottom: 10 },
  memberPill: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  memberPillText: { fontSize: 10, fontFamily: 'Inter-Bold', color: '#94A3B8', letterSpacing: 1.5 },

  // SECTIONS
  sectionHeader: { marginBottom: 12, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 16, fontFamily: 'Jakarta-Bold', color: '#0F172A' },

  // MENU CARDS
  menuCard: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 28 },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  destructiveIconBox: { backgroundColor: '#FFF1F2' },
  menuLabel: { fontSize: 15, fontFamily: 'Jakarta-Bold', color: '#0F172A' },
  destructiveLabel: { color: '#E11D48' },
  menuRight: { flexDirection: 'row', alignItems: 'center' },

  // VERSION TEXT
  versionContainer: { alignItems: 'center', marginTop: 10 },
  versionText: { fontSize: 11, fontFamily: 'Inter-Medium', color: '#CBD5E1', letterSpacing: 0.5 },
});