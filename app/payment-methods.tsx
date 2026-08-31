import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  TextInput, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { GradientBackground } from '@/components/gradient-background';
import { GlassCard } from '@/components/glass-card';
import { Colors, getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { CustomAlert, useCustomAlert } from '@/components/custom-alert';
import { CreditCard, Smartphone, ArrowLeft, Plus, Check, Trash2, X, ShieldCheck } from 'lucide-react-native';

interface PaymentMethod {
  id: string;
  type: 'momo' | 'card';
  name: string;
  details: string;
  isDefault: boolean;
}

export default function PaymentMethods() {
  const router = useRouter();
  const { isDarkMode, selectedPaymentMethod, setSelectedPaymentMethod } = useApp();
  const C = getColors(isDarkMode);
  const { showAlert, alertProps } = useCustomAlert();

  const [methods, setMethods] = useState<PaymentMethod[]>([
    { id: '1', type: 'momo', name: 'MTN Mobile Money', details: '+233 24 123 4567', isDefault: selectedPaymentMethod === 'moolre_momo' },
    { id: '2', type: 'card', name: 'Visa Gold Card', details: '•••• •••• •••• 4291', isDefault: selectedPaymentMethod === 'card' },
  ]);

  // Modal state for linking new card / wallet
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newType, setNewType] = useState<'card' | 'momo'>('card');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const handleSelectDefault = (id: string, type: 'momo' | 'card') => {
    setMethods(prev => prev.map(m => ({ ...m, isDefault: m.id === id })));
    setSelectedPaymentMethod(type === 'momo' ? 'moolre_momo' : 'card');
    showAlert({
      type: 'success',
      title: 'Payment Method Updated',
      message: 'Your default checkout payment option has been successfully updated.',
    });
  };

  const handleSaveNewMethod = () => {
    if (!accountName.trim() || !accountNumber.trim()) {
      showAlert({
        type: 'error',
        title: 'Missing Fields',
        message: 'Please fill out your account name and card/phone number.',
      });
      return;
    }

    const maskedDetails = newType === 'card' 
      ? `•••• •••• •••• ${accountNumber.slice(-4) || '9999'}`
      : `+233 ${accountNumber}`;

    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      type: newType,
      name: accountName.trim(),
      details: maskedDetails,
      isDefault: true,
    };

    setMethods(prev => [newMethod, ...prev.map(m => ({ ...m, isDefault: false }))]);
    setSelectedPaymentMethod(newType === 'momo' ? 'moolre_momo' : 'card');
    setIsModalVisible(false);

    // Clear form inputs
    setAccountName('');
    setAccountNumber('');
    setExpiry('');
    setCvv('');

    showAlert({
      type: 'success',
      title: 'Payment Account Linked!',
      message: `${newMethod.name} has been successfully added to your wallet and set as default.`,
    });
  };

  const handleDeleteMethod = (id: string, name: string) => {
    setMethods(prev => prev.filter(m => m.id !== id));
    showAlert({
      type: 'info',
      title: 'Removed',
      message: `${name} has been unlinked from your account.`,
    });
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF', borderColor: C.border }]}>
            <ArrowLeft size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.text }]}>Payment Methods</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          <Text style={[styles.subTitle, { color: C.greyText }]}>
            Set your primary account for waste pickup checkouts.
          </Text>

          {methods.map((item) => (
            <GlassCard 
              key={item.id} 
              style={[
                styles.methodCard,
                item.isDefault && { borderColor: C.primary, borderWidth: 1.5 }
              ]}
            >
              <TouchableOpacity 
                style={styles.cardContent}
                onPress={() => handleSelectDefault(item.id, item.type)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(11,61,46,0.05)' }]}>
                  {item.type === 'momo' 
                    ? <Smartphone size={20} color={C.primary} />
                    : <CreditCard size={20} color={C.primary} />
                  }
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.methodName, { color: C.text }]}>{item.name}</Text>
                  <Text style={[styles.methodDetails, { color: C.greyText }]}>{item.details}</Text>
                </View>

                {item.isDefault && (
                  <View style={[styles.checkBadge, { backgroundColor: isDarkMode ? Colors.accent : Colors.primary }]}>
                    <Check size={12} color={isDarkMode ? '#000000' : '#FFFFFF'} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>

              {!item.isDefault && (
                <TouchableOpacity 
                  onPress={() => handleDeleteMethod(item.id, item.name)}
                  style={styles.deleteBtn}
                >
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              )}
            </GlassCard>
          ))}

          {/* Link Card or Wallet Button */}
          <TouchableOpacity 
            style={[styles.addBtn, { backgroundColor: isDarkMode ? Colors.accent : Colors.primary }]}
            onPress={() => setIsModalVisible(true)}
            activeOpacity={0.9}
          >
            <Plus size={20} color={isDarkMode ? '#000000' : '#FFFFFF'} style={{ marginRight: 8 }} />
            <Text style={[styles.addBtnText, { color: isDarkMode ? '#000000' : '#FFFFFF' }]}>
              Link Card or Wallet
            </Text>
          </TouchableOpacity>

        </ScrollView>

        {/* ------------------- LINK CARD OR WALLET MODAL ------------------- */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: isDarkMode ? '#1E2321' : '#FFFFFF' }]}>
              
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: C.text }]}>Link Card or Wallet</Text>
                <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                  <X size={20} color={C.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Selector: Card vs MoMo */}
                <View style={styles.typeSelectorRow}>
                  <TouchableOpacity
                    style={[
                      styles.typeChip,
                      newType === 'card' && { backgroundColor: isDarkMode ? Colors.accent : Colors.primary, borderColor: Colors.primary }
                    ]}
                    onPress={() => setNewType('card')}
                  >
                    <CreditCard size={16} color={newType === 'card' ? (isDarkMode ? '#000000' : '#FFFFFF') : C.text} />
                    <Text style={[
                      styles.typeText,
                      { color: newType === 'card' ? (isDarkMode ? '#000000' : '#FFFFFF') : C.text }
                    ]}>Credit / Debit Card</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeChip,
                      newType === 'momo' && { backgroundColor: isDarkMode ? Colors.accent : Colors.primary, borderColor: Colors.primary }
                    ]}
                    onPress={() => setNewType('momo')}
                  >
                    <Smartphone size={16} color={newType === 'momo' ? (isDarkMode ? '#000000' : '#FFFFFF') : C.text} />
                    <Text style={[
                      styles.typeText,
                      { color: newType === 'momo' ? (isDarkMode ? '#000000' : '#FFFFFF') : C.text }
                    ]}>Mobile Money</Text>
                  </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <Text style={[styles.inputLabel, { color: C.text }]}>Account / Card Title</Text>
                <View style={[styles.inputContainer, { borderColor: C.border, backgroundColor: isDarkMode ? '#141716' : '#F7FAF8' }]}>
                  <TextInput
                    style={[styles.textInput, { color: C.text }]}
                    placeholder={newType === 'card' ? 'e.g. Visa Premium Card' : 'e.g. MTN Mobile Money'}
                    placeholderTextColor={C.greyText}
                    value={accountName}
                    onChangeText={setAccountName}
                  />
                </View>

                <Text style={[styles.inputLabel, { color: C.text }]}>
                  {newType === 'card' ? 'Card Number' : 'MoMo Phone Number'}
                </Text>
                <View style={[styles.inputContainer, { borderColor: C.border, backgroundColor: isDarkMode ? '#141716' : '#F7FAF8' }]}>
                  <TextInput
                    style={[styles.textInput, { color: C.text }]}
                    placeholder={newType === 'card' ? '4111 2222 3333 4444' : '24 123 4567'}
                    placeholderTextColor={C.greyText}
                    keyboardType="numeric"
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                  />
                </View>

                {newType === 'card' && (
                  <View style={styles.cardExtrasRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: C.text }]}>Expiry Date</Text>
                      <View style={[styles.inputContainer, { borderColor: C.border, backgroundColor: isDarkMode ? '#141716' : '#F7FAF8' }]}>
                        <TextInput
                          style={[styles.textInput, { color: C.text }]}
                          placeholder="MM/YY"
                          placeholderTextColor={C.greyText}
                          value={expiry}
                          onChangeText={setExpiry}
                        />
                      </View>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: C.text }]}>CVV</Text>
                      <View style={[styles.inputContainer, { borderColor: C.border, backgroundColor: isDarkMode ? '#141716' : '#F7FAF8' }]}>
                        <TextInput
                          style={[styles.textInput, { color: C.text }]}
                          placeholder="123"
                          placeholderTextColor={C.greyText}
                          keyboardType="numeric"
                          maxLength={3}
                          value={cvv}
                          onChangeText={setCvv}
                          secureTextEntry
                        />
                      </View>
                    </View>
                  </View>
                )}

                <TouchableOpacity 
                  style={[styles.saveBtn, { backgroundColor: isDarkMode ? Colors.accent : Colors.primary }]}
                  onPress={handleSaveNewMethod}
                  activeOpacity={0.9}
                >
                  <ShieldCheck size={18} color={isDarkMode ? '#000000' : '#FFFFFF'} />
                  <Text style={[styles.saveBtnText, { color: isDarkMode ? '#000000' : '#FFFFFF' }]}>Save & Link Account</Text>
                </TouchableOpacity>
              </ScrollView>

            </View>
          </View>
        </Modal>

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
  subTitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  methodName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
  },
  methodDetails: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  deleteBtn: {
    padding: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    marginTop: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  addBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  typeText: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    marginBottom: 6,
    marginTop: 4,
  },
  inputContainer: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
    marginBottom: 12,
  },
  textInput: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
  },
  cardExtrasRow: {
    flexDirection: 'row',
    gap: 10,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 16,
    gap: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
  },
});
