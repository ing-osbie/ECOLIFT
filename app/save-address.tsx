import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { GradientBackground } from '@/components/gradient-background';
import { GlassCard } from '@/components/glass-card';
import { getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { CustomAlert, useCustomAlert } from '@/components/custom-alert';
import { ArrowLeft, Plus, Trash2, Home, Briefcase, Heart } from 'lucide-react-native';

interface AddressItem {
  id: string;
  label: string;
  address: string;
  type: 'home' | 'work' | 'other';
}

export default function SaveAddress() {
  const router = useRouter();
  const { isDarkMode, pickupAddress, setPickupAddress } = useApp();
  const C = getColors(isDarkMode);
  const { showAlert, alertProps } = useCustomAlert();

  const [addresses, setAddresses] = useState<AddressItem[]>([
    { id: '1', label: 'My House', address: pickupAddress || '18 Kojo Thompson Road, Accra', type: 'home' },
    { id: '2', label: 'Office HQ', address: '12 Ring Road Central, Accra', type: 'work' },
    { id: '3', label: 'Mom\'s Place', address: 'Block 4, Airport Residential Area, Accra', type: 'other' },
  ]);

  const [newLabel, setNewLabel] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newType, setNewType] = useState<'home' | 'work' | 'other'>('home');
  const [showAddForm, setShowAddForm] = useState(false);

  const getIcon = (type: string) => {
    const size = 18;
    const color = C.primary;
    if (type === 'home') return <Home size={size} color={color} />;
    if (type === 'work') return <Briefcase size={size} color={color} />;
    return <Heart size={size} color={color} />;
  };

  const handleAddAddress = () => {
    if (!newLabel || !newAddress) {
      showAlert({
        type: 'error',
        title: 'Missing Fields',
        message: 'Please fill in both the address name and physical address.',
      });
      return;
    }

    const newItem: AddressItem = {
      id: Math.random().toString(),
      label: newLabel,
      address: newAddress,
      type: newType,
    };

    setAddresses(prev => [...prev, newItem]);
    setNewLabel('');
    setAddressText(newAddress);
    setNewAddress('');
    setShowAddForm(false);

    showAlert({
      type: 'success',
      title: 'Address Saved',
      message: `"${newLabel}" has been successfully added to your saved locations.`,
    });
  };

  const handleSelectAddress = (addr: string) => {
    setPickupAddress(addr);
    showAlert({
      type: 'success',
      title: 'Address Set',
      message: `Your default pickup address is now set to: ${addr}`,
      actions: [
        {
          label: 'OK',
          onPress: () => router.back(),
        }
      ]
    });
  };

  const handleDeleteAddress = (id: string, label: string) => {
    setAddresses(prev => prev.filter(item => item.id !== id));
    showAlert({
      type: 'info',
      title: 'Deleted',
      message: `"${label}" was removed from your saved list.`,
    });
  };

  const setAddressText = (addr: string) => {
    // Helper to sync
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF', borderColor: C.border }]}>
            <ArrowLeft size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.text }]}>Saved Addresses</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          <Text style={[styles.subTitle, { color: C.greyText }]}>
            Select a saved location to set it as your active pickup address.
          </Text>

          {/* Saved Addresses list */}
          {addresses.map((item) => (
            <GlassCard key={item.id} style={styles.addressCard}>
              <TouchableOpacity 
                style={styles.cardContent}
                onPress={() => handleSelectAddress(item.address)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(11,61,46,0.05)' }]}>
                  {getIcon(item.type)}
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.label, { color: C.text }]}>{item.label}</Text>
                  <Text style={[styles.addressText, { color: C.greyText }]}>{item.address}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => handleDeleteAddress(item.id, item.label)}
                style={styles.deleteBtn}
              >
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
            </GlassCard>
          ))}

          {/* Add New Section Toggle */}
          {!showAddForm ? (
            <TouchableOpacity 
              style={[styles.addToggleBtn, { borderColor: C.border }]}
              onPress={() => setShowAddForm(true)}
            >
              <Plus size={20} color={C.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.addToggleText, { color: C.primary }]}>Add New Location</Text>
            </TouchableOpacity>
          ) : (
            <GlassCard style={styles.formCard}>
              <Text style={[styles.formTitle, { color: C.text }]}>New Location Details</Text>

              {/* Tag selector */}
              <View style={styles.typeSelectorRow}>
                {(['home', 'work', 'other'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeChip,
                      newType === type 
                        ? { backgroundColor: C.primary } 
                        : { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF', borderColor: C.border, borderWidth: 1 }
                    ]}
                    onPress={() => setNewType(type)}
                  >
                    <Text style={[
                      styles.typeChipText,
                      newType === type ? { color: isDarkMode ? '#000000' : '#FFFFFF' } : { color: C.greyText }
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Name Input */}
              <TextInput
                style={[styles.input, { backgroundColor: isDarkMode ? '#2C2C2E' : '#F3F4F6', color: C.text, borderColor: C.border }]}
                placeholder="Give this place a name (e.g. Grandma's)"
                placeholderTextColor={isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(11,61,46,0.3)'}
                value={newLabel}
                onChangeText={setNewLabel}
              />

              {/* Address Input */}
              <TextInput
                style={[styles.input, { backgroundColor: isDarkMode ? '#2C2C2E' : '#F3F4F6', color: C.text, borderColor: C.border }]}
                placeholder="Enter physical address / location"
                placeholderTextColor={isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(11,61,46,0.3)'}
                value={newAddress}
                onChangeText={setNewAddress}
              />

              <View style={styles.formActions}>
                <TouchableOpacity 
                  style={[styles.cancelFormBtn, { borderColor: C.border }]}
                  onPress={() => setShowAddForm(false)}
                >
                  <Text style={[styles.cancelBtnText, { color: C.greyText }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.saveAddressBtn, { backgroundColor: C.primary }]}
                  onPress={handleAddAddress}
                >
                  <Text style={[styles.saveBtnText, { color: isDarkMode ? '#000000' : '#FFFFFF' }]}>Save Location</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          )}

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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
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
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  subTitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 21,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
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
  label: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
  },
  addressText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
  },
  addToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addToggleText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },
  formCard: {
    padding: 20,
    marginTop: 12,
  },
  formTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    marginBottom: 16,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  typeChipText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    marginBottom: 12,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelFormBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  saveAddressBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },
});
