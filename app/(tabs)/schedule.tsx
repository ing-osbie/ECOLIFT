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

import { GradientBackground } from '@/components/gradient-background';
import { GlassCard } from '@/components/glass-card';
import { Colors, getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { CustomAlert, useCustomAlert } from '@/components/custom-alert';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  MapPin, 
  Trash2, 
  UserCheck,
  Clock,
  Check,
  X
} from 'lucide-react-native';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MARCH_2026_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

interface ScheduledItem {
  id: string;
  title: string;
  driver: string;
  dateRange: string;
  timeSlot: string;
  color: string;
  wasteType: string;
  address: string;
}

export default function Schedule() {
  const { isDarkMode, userName } = useApp();

  const C = getColors(isDarkMode);
  const { showAlert, alertProps } = useCustomAlert();

  const [isCalendarModalVisible, setIsCalendarModalVisible] = useState(false);
  const currentMonth = 'March 2026';

  const [selectedDay, setSelectedDay] = useState<number>(15);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('Morning (8 - 11 AM)');
  const [newTitle, setNewTitle] = useState('');
  const [newAddress, setNewAddress] = useState('12 Ring Road Central, Osu');
  const [selectedWasteType, setSelectedWasteType] = useState('Plastic & Metal');

  const [scheduledItems, setScheduledItems] = useState<ScheduledItem[]>([
    {
      id: '1',
      title: 'Plastic & Bottles Pickup',
      driver: 'Kwame Mensah (Ecolift Fleet)',
      dateRange: 'Mar 15, 2026',
      timeSlot: 'Morning (8 - 11 AM)',
      color: '#3B82F6',
      wasteType: 'Plastic',
      address: '12 Ring Road Central, Accra',
    },
    {
      id: '2',
      title: 'Organic Food & Compost',
      driver: 'Kofi Owusu',
      dateRange: 'Mar 18, 2026',
      timeSlot: 'Afternoon (1 - 4 PM)',
      color: '#8B5CF6',
      wasteType: 'Organic',
      address: '45 Cantonments Rd, Accra',
    },
    {
      id: '3',
      title: 'Bulk E-Waste & Metal',
      driver: 'Abena Osei',
      dateRange: 'Mar 24, 2026',
      timeSlot: 'Evening (5 - 8 PM)',
      color: '#10B981',
      wasteType: 'E-Waste',
      address: '12 Ring Road Central, Accra',
    },
  ]);

  const handleDeleteItem = (id: string) => {
    setScheduledItems(prev => prev.filter(item => item.id !== id));
    showAlert({
      type: 'success',
      title: 'Pickup Cancelled',
      message: 'The scheduled pickup has been removed from your list.',
    });
  };

  const handleSaveNewSchedule = () => {
    const titleToUse = newTitle.trim() || `${selectedWasteType} Pickup`;
    const newScheduleItem: ScheduledItem = {
      id: Date.now().toString(),
      title: titleToUse,
      driver: 'Ecolift Express Driver',
      dateRange: `Mar ${selectedDay}, 2026`,
      timeSlot: selectedTimeSlot,
      color: selectedWasteType === 'Plastic' ? '#3B82F6' : selectedWasteType === 'Organic' ? '#8B5CF6' : '#10B981',
      wasteType: selectedWasteType,
      address: newAddress,
    };

    setScheduledItems(prev => [newScheduleItem, ...prev]);
    setIsCalendarModalVisible(false);
    setNewTitle('');

    showAlert({
      type: 'success',
      title: 'Schedule Saved!',
      message: `Your pickup for Mar ${selectedDay}, 2026 (${selectedTimeSlot}) has been confirmed.`,
    });
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
        >
          
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.headerTitle, { color: C.text }]}>Schedule</Text>
              <Text style={[styles.headerSubtitle, { color: C.greyText }]}>Your active scheduled collections</Text>
            </View>

            {/* Avatar Circle */}
            <View style={[styles.avatarCircle, { backgroundColor: isDarkMode ? '#2C3230' : '#FFFFFF' }]}>
              <Text style={styles.avatarInitials}>
                {userName ? userName.substring(0, 2).toUpperCase() : 'KM'}
              </Text>
            </View>
          </View>

          {/* Top Stat Banner (Sleek 16px radius card) */}
          <GlassCard style={styles.summaryBannerCard}>
            <View style={styles.summaryLeft}>
              <Text style={[styles.summaryBigNumber, { color: isDarkMode ? Colors.accent : Colors.primary }]}>
                {scheduledItems.length} Scheduled
              </Text>
              <Text style={[styles.summarySubtext, { color: C.greyText }]}>
                Next pickup in 2 days (Mar 15)
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.bannerAddBtn, { backgroundColor: isDarkMode ? Colors.accent : Colors.primary }]}
              onPress={() => setIsCalendarModalVisible(true)}
              activeOpacity={0.9}
            >
              <Plus size={18} color={isDarkMode ? '#000000' : '#FFFFFF'} />
              <Text style={[styles.bannerAddText, { color: isDarkMode ? '#000000' : '#FFFFFF' }]}>Schedule</Text>
            </TouchableOpacity>
          </GlassCard>

          {/* 3 Metric Counter Stat Cards */}
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { backgroundColor: C.card, borderColor: C.border }]}>
              <Text style={[styles.metricNumber, { color: C.text }]}>9</Text>
              <Text style={[styles.metricLabel, { color: C.greyText }]}>Completed</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: C.card, borderColor: C.border }]}>
              <Text style={[styles.metricNumber, { color: C.text }]}>89 kg</Text>
              <Text style={[styles.metricLabel, { color: C.greyText }]}>Recycled</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: C.card, borderColor: C.border }]}>
              <Text style={[styles.metricNumber, { color: C.text }]}>6</Text>
              <Text style={[styles.metricLabel, { color: C.greyText }]}>Eco Badges</Text>
            </View>
          </View>

          {/* Scheduled Pickups List */}
          <View style={styles.listSection}>
            <View style={styles.listHeaderRow}>
              <Text style={[styles.listSectionTitle, { color: C.text }]}>Active Schedules</Text>
              <Text style={[styles.listCountText, { color: C.greyText }]}>{scheduledItems.length} items</Text>
            </View>

            {scheduledItems.map((item) => (
              <GlassCard key={item.id} style={styles.pickupItemCard}>
                <View style={styles.pickupCardHeader}>
                  <View style={styles.titleWithBadge}>
                    <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                    <Text style={[styles.itemTitle, { color: C.text }]}>{item.title}</Text>
                  </View>

                  <TouchableOpacity onPress={() => handleDeleteItem(item.id)}>
                    <Trash2 size={16} color={Colors.danger} />
                  </TouchableOpacity>
                </View>

                <View style={styles.itemMetaRow}>
                  <UserCheck size={13} color={C.greyText} />
                  <Text style={[styles.itemMetaText, { color: C.greyText }]}>{item.driver}</Text>
                </View>

                <View style={styles.itemMetaRow}>
                  <CalendarIcon size={13} color={C.greyText} />
                  <Text style={[styles.itemMetaText, { color: C.greyText }]}>{item.dateRange} · {item.timeSlot}</Text>
                </View>

                <View style={styles.itemMetaRow}>
                  <MapPin size={13} color={C.greyText} />
                  <Text style={[styles.itemMetaText, { color: C.greyText }]} numberOfLines={1}>{item.address}</Text>
                </View>
              </GlassCard>
            ))}
          </View>

          {/* Bottom Floating Add Button (Clear of Tab Bar) */}
          <TouchableOpacity 
            style={[
              styles.floatingAddBtn, 
              { backgroundColor: isDarkMode ? Colors.accent : Colors.primary }
            ]}
            onPress={() => setIsCalendarModalVisible(true)}
            activeOpacity={0.9}
          >
            <Plus size={20} color={isDarkMode ? '#000000' : '#FFFFFF'} />
            <Text style={[styles.floatingAddText, { color: isDarkMode ? '#000000' : '#FFFFFF' }]}>Schedule New Pickup</Text>
          </TouchableOpacity>

        </ScrollView>

        {/* ------------------- INTERACTIVE CALENDAR MODAL ------------------- */}
        <Modal
          visible={isCalendarModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsCalendarModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: isDarkMode ? '#1E2321' : '#FFFFFF' }]}>
              
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: C.text }]}>Schedule New Pickup</Text>
                <TouchableOpacity onPress={() => setIsCalendarModalVisible(false)}>
                  <X size={20} color={C.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Month Selector */}
                <View style={styles.monthHeaderRow}>
                  <Text style={[styles.monthText, { color: C.text }]}>{currentMonth}</Text>
                  <View style={styles.navBtns}>
                    <TouchableOpacity style={[styles.smallNavBtn, { borderColor: C.border }]}>
                      <ChevronLeft size={16} color={C.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.smallNavBtn, { borderColor: C.border }]}>
                      <ChevronRight size={16} color={C.text} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Day of Week Row */}
                <View style={styles.daysOfWeekRow}>
                  {DAYS_OF_WEEK.map((day, idx) => (
                    <Text key={idx} style={[styles.dayOfWeekText, { color: C.greyText }]}>{day}</Text>
                  ))}
                </View>

                {/* Interactive Calendar Date Grid */}
                <View style={styles.daysGrid}>
                  {MARCH_2026_DAYS.map((day) => {
                    const isSelected = day === selectedDay;
                    return (
                      <TouchableOpacity
                        key={day}
                        style={styles.dayCell}
                        onPress={() => setSelectedDay(day)}
                        activeOpacity={0.8}
                      >
                        <View style={[
                          styles.dayPill,
                          isSelected && { backgroundColor: isDarkMode ? Colors.accent : Colors.primary }
                        ]}>
                          <Text style={[
                            styles.dayCellText,
                            { color: isSelected ? (isDarkMode ? '#000000' : '#FFFFFF') : C.text },
                            isSelected && { fontFamily: 'Poppins-Bold' }
                          ]}>{day}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Time Slot Selector */}
                <Text style={[styles.inputLabel, { color: C.text }]}>Preferred Time Slot</Text>
                <View style={styles.timeSlotsRow}>
                  {['Morning (8 - 11 AM)', 'Afternoon (1 - 4 PM)', 'Evening (5 - 8 PM)'].map((slot) => {
                    const isSelected = selectedTimeSlot === slot;
                    return (
                      <TouchableOpacity
                        key={slot}
                        style={[
                          styles.timeSlotChip,
                          { borderColor: isSelected ? (isDarkMode ? Colors.accent : Colors.primary) : C.border },
                          isSelected && { backgroundColor: isDarkMode ? 'rgba(182, 255, 60, 0.15)' : 'rgba(11, 61, 46, 0.08)' }
                        ]}
                        onPress={() => setSelectedTimeSlot(slot)}
                      >
                        <Clock size={12} color={isSelected ? (isDarkMode ? Colors.accent : Colors.primary) : C.greyText} />
                        <Text style={[
                          styles.timeSlotText,
                          { color: isSelected ? (isDarkMode ? Colors.accent : Colors.primary) : C.text },
                          isSelected && { fontFamily: 'Poppins-Bold' }
                        ]}>{slot}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Waste Type Selector */}
                <Text style={[styles.inputLabel, { color: C.text }]}>Waste Type</Text>
                <View style={styles.timeSlotsRow}>
                  {['Plastic & Metal', 'Organic Food', 'Bulk E-Waste'].map((wType) => {
                    const isSelected = selectedWasteType === wType;
                    return (
                      <TouchableOpacity
                        key={wType}
                        style={[
                          styles.timeSlotChip,
                          { borderColor: isSelected ? (isDarkMode ? Colors.accent : Colors.primary) : C.border },
                          isSelected && { backgroundColor: isDarkMode ? 'rgba(182, 255, 60, 0.15)' : 'rgba(11, 61, 46, 0.08)' }
                        ]}
                        onPress={() => setSelectedWasteType(wType)}
                      >
                        <Text style={[
                          styles.timeSlotText,
                          { color: isSelected ? (isDarkMode ? Colors.accent : Colors.primary) : C.text },
                          isSelected && { fontFamily: 'Poppins-Bold' }
                        ]}>{wType}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Address Input */}
                <Text style={[styles.inputLabel, { color: C.text }]}>Pickup Address</Text>
                <View style={[styles.addressInputContainer, { borderColor: C.border, backgroundColor: isDarkMode ? '#141716' : '#F7FAF8' }]}>
                  <MapPin size={16} color={C.primary} />
                  <TextInput
                    style={[styles.addressInput, { color: C.text }]}
                    value={newAddress}
                    onChangeText={setNewAddress}
                    placeholder="Enter pickup address"
                    placeholderTextColor={C.greyText}
                  />
                </View>

                {/* Done CTA Button */}
                <TouchableOpacity 
                  style={[styles.donePrimaryBtn, { backgroundColor: isDarkMode ? Colors.accent : Colors.primary }]}
                  onPress={handleSaveNewSchedule}
                  activeOpacity={0.9}
                >
                  <Check size={18} color={isDarkMode ? '#000000' : '#FFFFFF'} />
                  <Text style={[styles.doneBtnText, { color: isDarkMode ? '#000000' : '#FFFFFF' }]}>Done & Save Schedule</Text>
                </TouchableOpacity>
              </ScrollView>

            </View>
          </View>
        </Modal>

      </SafeAreaView>
      <CustomAlert {...alertProps} />
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
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 130,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 12 : 24,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarInitials: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: Colors.primary,
  },
  summaryBannerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  summaryLeft: {
    flex: 1,
  },
  summaryBigNumber: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    marginBottom: 2,
  },
  summarySubtext: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
  },
  bannerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  bannerAddText: {
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricNumber: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    marginBottom: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
  },
  listSection: {
    marginBottom: 16,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  listSectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  listCountText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  pickupItemCard: {
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
  },
  pickupCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  itemMetaText: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
  },
  floatingAddBtn: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
  },
  floatingAddText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
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
    maxHeight: '88%',
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
  monthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthText: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
  },
  navBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  smallNavBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayOfWeekText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'Poppins-SemiBold',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPill: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    marginBottom: 8,
    marginTop: 6,
  },
  timeSlotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  timeSlotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  timeSlotText: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
    marginBottom: 20,
  },
  addressInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
  },
  donePrimaryBtn: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  doneBtnText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
  },
});
