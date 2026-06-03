import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../services/supabase';

// ─── Reusable Menu Row ────────────────────────────────────────────────────────
interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  isLast?: boolean;
  isDestructive?: boolean;
  onPress?: () => void;
  rightLabel?: string;
}

const MenuRow = ({ icon, label, isLast, isDestructive, onPress, rightLabel }: MenuItemProps) => (
  <Pressable
    style={({ pressed }) => [
      styles.menuRow,
      !isLast && styles.menuRowBorder,
      pressed && styles.menuRowPressed,
    ]}
    onPress={onPress}
  >
    <View style={styles.menuLeft}>
      <View style={[styles.menuIconBox, isDestructive && styles.destructiveIconBox]}>
        <Ionicons name={icon} size={20} color={isDestructive ? '#E11D48' : '#64748B'} />
      </View>
      <Text style={[styles.menuLabel, isDestructive && styles.destructiveLabel]}>{label}</Text>
    </View>
    <View style={styles.menuRight}>
      {rightLabel ? (
        <Text style={styles.menuRightLabel}>{rightLabel}</Text>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    </View>
  </Pressable>
);

// ─── Edit Income Modal ────────────────────────────────────────────────────────
interface EditIncomeModalProps {
  visible: boolean;
  currentIncome: number;
  currentMonthSpent: number;
  onClose: () => void;
  onSave: (newIncome: number) => Promise<void>;
}

const EditIncomeModal = ({
  visible,
  currentIncome,
  currentMonthSpent,
  onClose,
  onSave,
}: EditIncomeModalProps) => {
  const [value, setValue] = useState(currentIncome.toString());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setValue(currentIncome.toString());
      setError('');
    }
  }, [visible, currentIncome]);

  const handleSave = async () => {
    const parsed = parseFloat(value.replace(/,/g, ''));
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid income amount.');
      return;
    }
    if (parsed < currentMonthSpent) {
      setError(
        `Income cannot be less than your current month's expenses (₹${currentMonthSpent.toLocaleString()}).`
      );
      return;
    }
    setSaving(true);
    try {
      await onSave(parsed);
      onClose();
    } catch {
      setError('Failed to update income. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <Text style={styles.modalTitle}>Edit Monthly Income</Text>
          <Text style={styles.modalSubtitle}>
            Income must be at least ₹{currentMonthSpent.toLocaleString()} (this month's expenses)
          </Text>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputPrefix}>₹</Text>
            <TextInput
              style={styles.incomeInput}
              value={value}
              onChangeText={(t) => {
                setValue(t);
                setError('');
              }}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#CBD5E1"
              autoFocus
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#E11D48" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.modalActions}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Logout Confirmation Modal ────────────────────────────────────────────────
interface LogoutModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const LogoutModal = ({ visible, onClose, onConfirm }: LogoutModalProps) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.logoutOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.logoutSheet}>
          <View style={styles.logoutIconRing}>
            <Ionicons name="log-out-outline" size={32} color="#E11D48" />
          </View>
          <Text style={styles.logoutTitle}>Log Out?</Text>
          <Text style={styles.logoutSubtitle}>
            You'll be signed out of your account. Your data is safely stored in the cloud.
          </Text>
          <View style={styles.modalActions}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.logoutConfirmBtn} onPress={handleConfirm} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Log Out</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function Profile() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditIncome, setShowEditIncome] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error) setProfile(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchProfile(); }, [fetchProfile]));

  const handleSaveIncome = async (newIncome: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('profiles')
      .update({ monthly_income: newIncome })
      .eq('id', user.id);

    if (error) throw error;

    // Optimistically update local state so rest of app re-reads on focus
    setProfile((prev: any) => ({ ...prev, monthly_income: newIncome }));
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', 'Failed to log out. Please try again.');
      return;
    }
    router.replace('/onboarding'); // adjust route to your auth screen
  };

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#166534" />
      
      {/* Centered Notch Header with Settings Icon */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerInner}>
          <View style={styles.headerSide} /> 
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerSide}>
            <Pressable style={styles.headerIconBtn}>
              <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* UPGRADED USER HERO CARD */}
        <View style={styles.userHeroWrapper}>
          <LinearGradient colors={['#F0FDF4', '#DCFCE7']} style={styles.userHeroGradient}>
            {/* Decorative Background Elements */}
            <View style={styles.textureCircle1} />
            <View style={styles.textureCircle2} />

            <View style={styles.userContentZIndex}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                </View>
              </View>
              
              <Text style={styles.userName}>{profile?.full_name || 'User'}</Text>
              <Text style={styles.userEmail}>{profile?.email || 'Loading...'}</Text>
              
              <View style={styles.userBadgeChip}>
                <Ionicons name="shield-checkmark" size={14} color="#166534" />
                <Text style={styles.userBadgeText}>Verified Account</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* FINANCES SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Finances</Text>
        </View>
        
        <View style={styles.incomeCard}>
          <View style={styles.incomeRow}>
            <View style={styles.incomeLeft}>
              <View style={styles.incomeIconBox}>
                <Ionicons name="wallet-outline" size={24} color="#166534" />
              </View>
              <View>
                <Text style={styles.incomeLabel}>Monthly Income</Text>
                {loading ? (
                  <ActivityIndicator size="small" color="#166534" style={{ marginTop: 4 }} />
                ) : (
                  <Text style={styles.incomeValue}>
                    ₹{(profile?.monthly_income || 0).toLocaleString()}
                  </Text>
                )}
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [styles.editIncomeBtn, pressed && { opacity: 0.7 }]}
              onPress={() => setShowEditIncome(true)}
            >
              <Ionicons name="pencil-outline" size={14} color="#166534" />
              <Text style={styles.editIncomeBtnText}>Edit</Text>
            </Pressable>
          </View>
        </View>

        {/* ACCOUNT PREFERENCES SECTION (Visual filler to look better) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Preferences</Text>
        </View>
        
        <View style={styles.menuCard}>
          <MenuRow icon="notifications-outline" label="Notifications" />
          <MenuRow icon="lock-closed-outline" label="Privacy & Security" />
          <MenuRow icon="help-circle-outline" label="Help & Support" isLast />
        </View>

        {/* LOG OUT */}
        <View style={[styles.menuCard, { marginTop: 12 }]}>
          <MenuRow
            icon="log-out-outline"
            label="Log Out"
            isLast
            isDestructive
            onPress={() => setShowLogout(true)}
          />
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>SpenWyse v1.0.0</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* MODALS */}
      <EditIncomeModal
        visible={showEditIncome}
        currentIncome={profile?.monthly_income || 0}
        currentMonthSpent={profile?.current_month_spent || 0}
        onClose={() => setShowEditIncome(false)}
        onSave={handleSaveIncome}
      />

      <LogoutModal
        visible={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={handleLogout}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  
  // Header
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
    width: 44, // Match icon button width
    alignItems: 'center'
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

  scrollContent: { paddingHorizontal: 20, paddingTop: 24 },

  // UPGRADED USER HERO CARD
  userHeroWrapper: { 
    borderRadius: 28, 
    borderWidth: 1, 
    borderColor: '#D1FAE5', 
    overflow: 'hidden', 
    marginBottom: 36,
    elevation: 4,
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  userHeroGradient: { 
    alignItems: 'center', 
    paddingVertical: 36,
    paddingHorizontal: 24,
    position: 'relative'
  },
  textureCircle1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: '#FFFFFF', opacity: 0.5, top: -60, left: -60,
  },
  textureCircle2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: '#86EFAC', opacity: 0.25, bottom: -20, right: -20,
  },
  userContentZIndex: { zIndex: 10, alignItems: 'center' },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { 
    width: 88, 
    height: 88, 
    borderRadius: 44, 
    backgroundColor: '#FFFFFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 3, 
    borderColor: '#DCFCE7',
    elevation: 4,
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#166534' },
  verifiedBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 2 },
  userName: { fontSize: 26, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5, marginBottom: 4 },
  userEmail: { fontSize: 14, fontWeight: '500', color: '#475569', marginBottom: 16 },
  userBadgeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  userBadgeText: { fontSize: 12, fontWeight: '700', color: '#166534' },

  // FINANCES SECTION
  sectionHeader: { marginBottom: 12, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  
  incomeCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    marginBottom: 32, 
    padding: 20,
    elevation: 2,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  incomeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  incomeLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  incomeIconBox: { 
    width: 56, 
    height: 56, 
    borderRadius: 16, 
    backgroundColor: '#F0FDF4', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  incomeLabel: { fontSize: 13, fontWeight: '500', color: '#64748B', marginBottom: 4 },
  incomeValue: { fontSize: 24, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  editIncomeBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, 
    backgroundColor: '#F0FDF4', paddingHorizontal: 14, paddingVertical: 10, 
    borderRadius: 14, borderWidth: 1, borderColor: '#DCFCE7' 
  },
  editIncomeBtnText: { fontSize: 13, fontWeight: '700', color: '#166534' },

  // MENU
  menuCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    marginBottom: 16,
    overflow: 'hidden'
  },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  menuRowPressed: { backgroundColor: '#F8FAFC' },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  destructiveIconBox: { backgroundColor: '#FFF1F2' },
  menuLabel: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  destructiveLabel: { color: '#E11D48' },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuRightLabel: { fontSize: 13, fontWeight: '500', color: '#94A3B8' },

  // VERSION
  versionContainer: { alignItems: 'center', marginTop: 20 },
  versionText: { fontSize: 12, fontWeight: '500', color: '#94A3B8', letterSpacing: 0.5 },

  // MODAL SHARED
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  logoutOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.6)' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.6)' },
  modalHandle: { width: 48, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, alignSelf: 'center', marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 28 },
  cancelBtn: { flex: 1, paddingVertical: 18, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center' },
  cancelBtnText: { fontWeight: '700', fontSize: 15, color: '#64748B' },
  saveBtn: { flex: 1, paddingVertical: 18, borderRadius: 18, backgroundColor: '#166534', alignItems: 'center' },
  saveBtnText: { fontWeight: '700', fontSize: 15, color: '#FFFFFF' },
  logoutConfirmBtn: { flex: 1, paddingVertical: 18, borderRadius: 18, backgroundColor: '#E11D48', alignItems: 'center', shadowColor: '#E11D48', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },

  // EDIT INCOME MODAL
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingBottom: 40 },
  modalTitle: { fontWeight: '800', fontSize: 24, color: '#0F172A', letterSpacing: -0.5, marginBottom: 8 },
  modalSubtitle: { fontWeight: '500', fontSize: 14, color: '#64748B', marginBottom: 28, lineHeight: 22 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 20, paddingVertical: 6 },
  inputPrefix: { fontWeight: '800', fontSize: 32, color: '#166534', marginRight: 10 },
  incomeInput: { flex: 1, fontWeight: '800', fontSize: 36, color: '#0F172A', paddingVertical: 16 },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 16, backgroundColor: '#FFF1F2', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#FFE4E6' },
  errorText: { fontWeight: '500', fontSize: 13, color: '#E11D48', flex: 1, lineHeight: 18 },

  // LOGOUT MODAL
  logoutSheet: { width: '90%', backgroundColor: '#FFFFFF', borderRadius: 32, padding: 32, alignItems: 'center', elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
  logoutIconRing: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF1F2', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  logoutTitle: { fontWeight: '800', fontSize: 24, color: '#0F172A', letterSpacing: -0.5, marginBottom: 12 },
  logoutSubtitle: { fontWeight: '500', fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 8 },
});