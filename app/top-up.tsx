import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { GradientBackground } from '@/components/gradient-background';
import { GlassCard } from '@/components/glass-card';
import { Colors, getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { CustomAlert, useCustomAlert } from '@/components/custom-alert';
import { Wallet, ArrowLeft, CheckCircle2, Smartphone, DollarSign, CreditCard, ChevronRight } from 'lucide-react-native';

const PRESET_AMOUNTS = [10, 20, 50, 100, 200];

export default function TopUp() {
  const router = useRouter();
  const { isDarkMode, walletBalance, topUpWallet } = useApp();
  const C = getColors(isDarkMode);
  const { showAlert, alertProps } = useCustomAlert();

  const [amount, setAmount] = useState('50');
  const [provider, setProvider] = useState<'mtn' | 'telecel' | 'airteltigo'>('mtn');
  const [isLoading, setIsLoading] = useState(false);

  const handleTopUp = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      showAlert({
        type: 'error',
        title: 'Invalid Amount',
        message: 'Please enter a valid top-up amount greater than zero.',
      });
      return;
    }

    setIsLoading(true);
    try {
      await topUpWallet(val, `Top-up via ${provider.toUpperCase()} MoMo`);
      showAlert({
        type: 'success',
        title: 'Top Up Success',
        message: `GHS ${val.toFixed(2)} was successfully added to your Ecolift Wallet.`,
        actions: [{ label: 'Back to Profile', onPress: () => router.back() }],
      });
    } catch {
      showAlert({
        type: 'error',
        title: 'Top Up Failed',
        message: 'Could not complete wallet top-up. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF', borderColor: C.border }]}>
            <ArrowLeft size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.text }]}>Top Up Wallet</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Current balance display */}
          <GlassCard style={styles.balanceCard}>
            <View style={styles.walletHeader}>
              <Wallet size={20} color={C.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.walletTitle, { color: C.greyText }]}>Current Balance</Text>
            </View>
            <Text style={[styles.balanceValue, { color: isDarkMode ? '#FFFFFF' : Colors.primary }]}>
              GHS {walletBalance.toFixed(2)}
            </Text>
          </GlassCard>

          {/* Amount select section */}
          <GlassCard style={styles.amountCard}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Select Amount</Text>
            
            {/* Presets */}
            <View style={styles.presetsRow}>
              {PRESET_AMOUNTS.map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.presetChip,
                    amount === val.toString()
                      ? { backgroundColor: C.primary }
                      : { backgroundColor: isDarkMode ? '#2C2C2E' : '#F3F4F6', borderColor: C.border, borderWidth: 1 }
                  ]}
                  onPress={() => setAmount(val.toString())}
                >
                  <Text style={[
                    styles.presetText,
                    amount === val.toString() ? { color: isDarkMode ? '#000000' : '#FFFFFF' } : { color: C.text }
                  ]}>
                    GHS {val}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom input */}
            <View style={[styles.inputBox, { backgroundColor: isDarkMode ? '#2C2C2E' : '#F3F4F6', borderColor: C.border }]}>
              <DollarSign size={20} color={C.greyText} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.customInput, { color: C.text }]}
                keyboardType="numeric"
                placeholder="Enter custom amount"
                placeholderTextColor={isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(11,61,46,0.3)'}
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </GlassCard>

          {/* Provider selector */}
          <GlassCard style={styles.providerCard}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>MoMo Operator</Text>
            
            <View style={styles.providerRow}>
              {(['mtn', 'telecel', 'airteltigo'] as const).map((op) => {
                const isActive = provider === op;
                const label = op === 'mtn' ? 'MTN MoMo' : op === 'telecel' ? 'Telecel Cash' : 'AirtelTigo Money';
                return (
                  <TouchableOpacity
                    key={op}
                    style={[
                      styles.providerChip,
                      isActive 
                        ? { borderColor: C.primary, borderWidth: 1.5, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(11,61,46,0.02)' }
                        : { borderColor: C.border, borderWidth: 1 }
                    ]}
                    onPress={() => setProvider(op)}
                  >
                    <Smartphone size={16} color={C.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.providerText, { color: C.text }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>

          {/* Confirm Top Up Button with CheckCircle2 Icon */}
          <TouchableOpacity 
            style={[styles.topUpBtn, { backgroundColor: isDarkMode ? Colors.accent : Colors.primary, opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleTopUp}
            activeOpacity={0.9}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={isDarkMode ? '#000000' : '#FFFFFF'} style={{ marginRight: 8 }} />
            ) : (
              <CheckCircle2 size={20} color={isDarkMode ? '#000000' : '#FFFFFF'} style={{ marginRight: 8 }} />
            )}
            <Text style={[styles.topUpBtnText, { color: isDarkMode ? '#000000' : '#FFFFFF' }]}>
              {isLoading ? 'Processing...' : 'Confirm Top Up'}
            </Text>
          </TouchableOpacity>

          {/* Use Different Payment Method Button */}
          <TouchableOpacity 
            style={[styles.switchPaymentBtn, { borderColor: C.border }]}
            onPress={() => router.push('/payment-methods' as any)}
            activeOpacity={0.8}
          >
            <CreditCard size={18} color={C.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.switchPaymentText, { color: C.text }]}>Use Different Payment Method</Text>
            <ChevronRight size={16} color={C.greyText} />
          </TouchableOpacity>

        </ScrollView>

        <CustomAlert {...alertProps} />
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 12 : 24,
    marginBottom: 16,
    gap: 14,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    letterSpacing: -0.5,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  balanceCard: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  walletTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
  },
  balanceValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
  },
  amountCard: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    marginBottom: 12,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  presetText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  customInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  providerCard: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
  },
  providerRow: {
    gap: 10,
  },
  providerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
  },
  providerText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  topUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  topUpBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
  },
  switchPaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  switchPaymentText: {
    flex: 1,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
  },
});
