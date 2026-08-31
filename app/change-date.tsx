import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { GradientBackground } from '@/components/gradient-background';
import { GlassCard } from '@/components/glass-card';
import { getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { CustomAlert, useCustomAlert } from '@/components/custom-alert';
import { Calendar, ArrowLeft, Clock, Check } from 'lucide-react-native';

const DATE_OPTIONS = [
  { id: 'today', label: 'Today', subLabel: 'Immediate Match' },
  { id: 'tomorrow', label: 'Tomorrow', subLabel: 'Next Day pickup' },
  { id: 'mid_week', label: 'Wednesday, July 15', subLabel: 'Mid-week cycle' },
  { id: 'weekend', label: 'Saturday, July 18', subLabel: 'Weekend cleanup' },
];

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning', time: '08:00 AM - 12:00 PM' },
  { id: 'afternoon', label: 'Afternoon', time: '12:00 PM - 04:00 PM' },
  { id: 'evening', label: 'Evening', time: '04:00 PM - 08:00 PM' },
];

export default function ChangeDate() {
  const router = useRouter();
  const { isDarkMode, setPickupDate } = useApp();
  const C = getColors(isDarkMode);

  const { showAlert, alertProps } = useCustomAlert();

  const [selectedDate, setSelectedDate] = useState('today');
  const [selectedTime, setSelectedTime] = useState('morning');

  const handleSave = () => {
    const dateLabel = DATE_OPTIONS.find(d => d.id === selectedDate)?.label || 'Today';
    const timeLabel = TIME_SLOTS.find(t => t.id === selectedTime)?.time || 'Morning';
    
    setPickupDate(`${dateLabel} (${timeLabel})`);

    showAlert({
      type: 'success',
      title: 'Schedule Set',
      message: `Your pickup is scheduled for ${dateLabel} during the ${selectedTime} slot.`,
      actions: [
        {
          label: 'Perfect',
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
          <Text style={[styles.headerTitle, { color: C.text }]}>Schedule Date</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          <Text style={[styles.subTitle, { color: C.greyText }]}>
            Choose your preferred day and time window for the garbage pickup.
          </Text>

          {/* Date Selector Card */}
          <GlassCard style={styles.card}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Pickup Day</Text>
            
            <View style={styles.optionsList}>
              {DATE_OPTIONS.map((item) => {
                const isActive = selectedDate === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.optionRow,
                      { borderColor: C.border },
                      isActive && { borderColor: C.primary, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(11,61,46,0.02)' }
                    ]}
                    onPress={() => setSelectedDate(item.id)}
                  >
                    <View style={styles.optionDetails}>
                      <Calendar size={18} color={C.primary} style={{ marginRight: 10 }} />
                      <View>
                        <Text style={[styles.optionLabel, { color: C.text }]}>{item.label}</Text>
                        <Text style={[styles.optionSub, { color: C.greyText }]}>{item.subLabel}</Text>
                      </View>
                    </View>
                    <View style={[
                      styles.radioCircle,
                      { borderColor: C.border },
                      isActive && { borderColor: C.primary, backgroundColor: C.primary }
                    ]}>
                      {isActive && <Check size={10} color={isDarkMode ? '#000000' : '#FFFFFF'} strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>

          {/* Time Selector Card */}
          <GlassCard style={styles.card}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Time Window</Text>
            
            <View style={styles.optionsList}>
              {TIME_SLOTS.map((item) => {
                const isActive = selectedTime === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.optionRow,
                      { borderColor: C.border },
                      isActive && { borderColor: C.primary, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(11,61,46,0.02)' }
                    ]}
                    onPress={() => setSelectedTime(item.id)}
                  >
                    <View style={styles.optionDetails}>
                      <Clock size={18} color={C.primary} style={{ marginRight: 10 }} />
                      <View>
                        <Text style={[styles.optionLabel, { color: C.text }]}>{item.label}</Text>
                        <Text style={[styles.optionSub, { color: C.greyText }]}>{item.time}</Text>
                      </View>
                    </View>
                    <View style={[
                      styles.radioCircle,
                      { borderColor: C.border },
                      isActive && { borderColor: C.primary, backgroundColor: C.primary }
                    ]}>
                      {isActive && <Check size={10} color={isDarkMode ? '#000000' : '#FFFFFF'} strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>

          <TouchableOpacity 
            style={[styles.saveBtn, { backgroundColor: C.primary, shadowColor: C.primary }]}
            onPress={handleSave}
          >
            <Text style={[styles.saveBtnText, { color: isDarkMode ? '#000000' : '#FFFFFF' }]}>
              Save Schedule
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
  card: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    marginBottom: 14,
  },
  optionsList: {
    gap: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  optionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
  },
  optionSub: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
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
