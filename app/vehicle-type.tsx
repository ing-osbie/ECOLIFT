import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { GradientBackground } from '@/components/gradient-background';
import { GlassCard } from '@/components/glass-card';
import { getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { CustomAlert, useCustomAlert } from '@/components/custom-alert';
import { Truck, ArrowLeft, Shield } from 'lucide-react-native';

interface VehicleOption {
  id: string;
  name: string;
  loadLimit: string;
  description: string;
}

const VEHICLE_OPTIONS: VehicleOption[] = [
  { id: 'tricycle', name: 'Ecolift Tricycle Pro', loadLimit: 'Up to 500 kg', description: 'Best for narrow streets and standard residential pickups.' },
  { id: 'minitruck', name: 'Ecolift Mini-Truck', loadLimit: 'Up to 1.5 Tons', description: 'Perfect for commercial areas and large-capacity bags.' },
  { id: 'compactor', name: 'Eco Compactor Truck', loadLimit: 'Up to 5.0 Tons', description: 'Reserved for construction rubble, heavy bulk loads and community events.' },
];

export default function VehicleType() {
  const router = useRouter();
  const { isDarkMode } = useApp();
  const C = getColors(isDarkMode);
  const { showAlert, alertProps } = useCustomAlert();

  const [selectedVehicle, setSelectedVehicle] = useState('tricycle');
  const [plateNo, setPlateNo] = useState('GT-4921-26');
  const [model, setModel] = useState('Tricycle Pro (2025)');

  const handleSave = () => {
    if (!plateNo.trim() || !model.trim()) {
      showAlert({
        type: 'error',
        title: 'Empty Fields',
        message: 'Please complete all details including registration plate number.',
      });
      return;
    }

    const vehName = VEHICLE_OPTIONS.find(v => v.id === selectedVehicle)?.name || 'Tricycle';
    
    showAlert({
      type: 'success',
      title: 'Vehicle Configured',
      message: `Your active collection vehicle is set to: ${vehName} (${plateNo}).`,
      actions: [
        {
          label: 'Got it',
          onPress: () => router.back(),
        }
      ]
    });
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF', borderColor: C.border }]}>
            <ArrowLeft size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.text }]}>Vehicle Configuration</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          <Text style={[styles.subTitle, { color: C.greyText }]}>
            Configure the default vehicle profile used to manage your waste collections.
          </Text>

          {/* Vehicle Selectors */}
          <View style={styles.optionsList}>
            {VEHICLE_OPTIONS.map((item) => {
              const isActive = selectedVehicle === item.id;
              return (
                <GlassCard 
                  key={item.id} 
                  style={[
                    styles.vehicleCard,
                    isActive && { borderColor: C.primary, borderWidth: 1.5 }
                  ]}
                >
                  <TouchableOpacity 
                    style={styles.cardContent}
                    onPress={() => setSelectedVehicle(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(11,61,46,0.05)' }]}>
                      <Truck size={24} color={C.primary} />
                    </View>
                    <View style={styles.textContainer}>
                      <View style={styles.row}>
                        <Text style={[styles.vehicleName, { color: C.text }]}>{item.name}</Text>
                        <View style={[styles.loadPill, { backgroundColor: isDarkMode ? 'rgba(182,255,60,0.15)' : 'rgba(182,255,60,0.2)' }]}>
                          <Text style={[styles.loadText, { color: C.primary }]}>{item.loadLimit}</Text>
                        </View>
                      </View>
                      <Text style={[styles.desc, { color: C.greyText }]}>{item.description}</Text>
                    </View>
                  </TouchableOpacity>
                </GlassCard>
              );
            })}
          </View>

          {/* Text details input */}
          <GlassCard style={styles.detailsForm}>
            <Text style={[styles.formTitle, { color: C.text }]}>Registration Details</Text>
            
            <View style={styles.inputRow}>
              <Text style={[styles.inputLabel, { color: C.greyText }]}>License Plate Number</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDarkMode ? '#2C2C2E' : '#F3F4F6', color: C.text, borderColor: C.border }]}
                value={plateNo}
                onChangeText={setPlateNo}
                placeholder="e.g. GT-4921-26"
                placeholderTextColor={isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(11,61,46,0.3)'}
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={[styles.inputLabel, { color: C.greyText }]}>Vehicle Model / Spec</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDarkMode ? '#2C2C2E' : '#F3F4F6', color: C.text, borderColor: C.border }]}
                value={model}
                onChangeText={setModel}
                placeholder="e.g. Tricycle Pro (2025)"
                placeholderTextColor={isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(11,61,46,0.3)'}
              />
            </View>
          </GlassCard>

          <View style={[styles.shieldRow, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(11,61,46,0.03)' }]}>
            <Shield size={16} color={C.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.shieldText, { color: C.greyText }]}>All vehicles must be fully vetted and insured.</Text>
          </View>

          <TouchableOpacity 
            style={[styles.saveBtn, { backgroundColor: C.primary, shadowColor: C.primary }]}
            onPress={handleSave}
          >
            <Text style={[styles.saveBtnText, { color: isDarkMode ? '#000000' : '#FFFFFF' }]}>
              Save Vehicle Profile
            </Text>
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
  optionsList: {
    gap: 12,
    marginBottom: 20,
  },
  vehicleCard: {
    padding: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  vehicleName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
  },
  loadPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  loadText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
  },
  desc: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  detailsForm: {
    padding: 20,
    marginBottom: 16,
  },
  formTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    marginBottom: 16,
  },
  inputRow: {
    marginBottom: 12,
  },
  inputLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  shieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
  },
  shieldText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
  },
  saveBtn: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  saveBtnText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
  },
});
