import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const INITIAL_FLEX_POOL = 8200;

const CATEGORIES = [
  { id: '1', name: 'Food', icon: 'fast-food', color: '#10B981' },
  { id: '2', name: 'Shopping', icon: 'bag-handle', color: '#F59E0B' },
  { id: '3', name: 'Transport', icon: 'car', color: '#6366F1' },
  { id: '4', name: 'Bills', icon: 'receipt', color: '#E11D48' },
  { id: '5', name: 'Travel', icon: 'airplane', color: '#8B5CF6' },
  { id: '6', name: 'Health', icon: 'fitness', color: '#0EA5E9' },
];

export default function AddExpenseScreen() {
  const router = useRouter();
  const [screenState, setScreenState] = useState<'typing' | 'success'>('typing');
  const [amount, setAmount] = useState('0');
  const [selectedCat, setSelectedCat] = useState('1');

  useFocusEffect(
    useCallback(() => {
      setScreenState('typing');
      setAmount('0');
    }, [])
  );

  const numericAmount = parseInt(amount) || 0;
  const isOverBudget = numericAmount > INITIAL_FLEX_POOL;

  const handlePressNumber = (num: string) => {
    if (amount === '0') setAmount(num);
    else if (amount.length < 9) setAmount(amount + num);
  };

  const handleAddExpense = () => {
    if (numericAmount > 0 && !isOverBudget) setScreenState('success');
  };

  if (screenState === 'success') {
    return (
      <Animated.View entering={FadeIn.duration(500)} style={styles.container}>
        <View style={styles.successContent}>
          <View style={styles.checkCircle}><Ionicons name="checkmark-sharp" size={40} color="#FFFFFF" /></View>
          <Text style={styles.successTitle}>Transaction Logged</Text>
          <Text style={styles.successSub}>₹{amount} successfully recorded.</Text>
        </View>
        <View style={styles.bottomCtaContainer}>
          <Pressable style={styles.primaryBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.primaryBtnText}>View Dashboard</Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Entry Log</Text>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={18} color="#0F172A" />
          </Pressable>
        </View>

        <Animated.View entering={FadeInUp.springify()} style={styles.body}>
          <View style={styles.amountDisplay}>
            <Text style={[styles.amountTextLarge, isOverBudget && { color: '#E11D48' }]}>₹{amount}</Text>
            {isOverBudget && <Text style={styles.errorText}>Exceeds budget</Text>}
          </View>

          <View style={styles.catGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable key={cat.id} onPress={() => setSelectedCat(cat.id)} style={[styles.catItem, selectedCat === cat.id && { backgroundColor: `${cat.color}15`, borderColor: cat.color }]}>
                <Ionicons name={cat.icon as any} size={18} color={selectedCat === cat.id ? cat.color : '#94A3B8'} />
              </Pressable>
            ))}
          </View>

          <View style={styles.numpadGrid}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((num) => (
              <Pressable key={num} style={styles.key} onPress={() => num === '⌫' ? setAmount(prev => prev.length > 1 ? prev.slice(0,-1) : '0') : handlePressNumber(num)}>
                <Text style={styles.keyText}>{num}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={[styles.primaryBtn, (amount === '0' || isOverBudget) && { opacity: 0.4 }]} onPress={handleAddExpense} disabled={amount === '0' || isOverBudget}>
            <Text style={styles.primaryBtnText}>Confirm Transaction</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingVertical: 15 },
  headerTitle: { fontFamily: 'Jakarta-ExtraBold', fontSize: 18, color: '#0F172A' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  body: { flex: 1, paddingHorizontal: 25, justifyContent: 'space-between' },
  amountDisplay: { alignItems: 'center', marginVertical: 10 },
  amountTextLarge: { fontSize: 52, fontFamily: 'Jakarta-ExtraBold', color: '#0F172A' },
  errorText: { color: '#E11D48', fontFamily: 'Inter-Bold', fontSize: 12, marginTop: 4 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  catItem: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9', backgroundColor: '#F8FAFC' },
  numpadGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6,marginTop:-1 },
  key: { width: '30%', height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 14, backgroundColor: '#F8FAFC' },
  keyText: { fontSize: 20, fontFamily: 'Jakarta-Bold' },
  primaryBtn: { backgroundColor: '#166534', paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginBottom: 100 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Jakarta-Bold' },
  successContent: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  checkCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successTitle: { fontSize: 22, fontFamily: 'Jakarta-ExtraBold' },
  successSub: { fontSize: 14, color: '#64748B', marginTop: 8 },
  bottomCtaContainer: { paddingBottom: 60, paddingHorizontal: 25 }
});