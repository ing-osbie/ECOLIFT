import { CustomAlert, useCustomAlert } from "@/components/custom-alert";
import { GlassCard } from "@/components/glass-card";
import { GradientBackground } from "@/components/gradient-background";
import { Colors, getColors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  FileText,
  Moon,
  Plus,
  Recycle,
  Sun,
  Trash2,
  X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SummaryItem {
  id: string;
  title: string;
  qty: string;
  icon: "paper" | "plastic" | "organic" | "ewaste";
}

const INITIAL_SUMMARY: SummaryItem[] = [
  {
    id: "1",
    title: "Mixed Paper & Cardboard",
    qty: "Approx. 2 bags",
    icon: "paper",
  },
  {
    id: "2",
    title: "Plastics (Type 1 & 2)",
    qty: "1 large bin",
    icon: "plastic",
  },
];

const DAYS_OF_WEEK = ["S", "M", "T", "W", "T", "F", "S"];
const DAYS_IN_MONTH = 31;
const START_DAY_OFFSET = 2; // Starts on Tuesday

export default function Schedule() {
  const router = useRouter();
  const { isDarkMode } = useApp();
  const C = getColors(isDarkMode);
  const { showAlert, alertProps } = useCustomAlert();

  const [summaryItems, setSummaryItems] = useState<SummaryItem[]>(INITIAL_SUMMARY);
  const [selectedDay, setSelectedDay] = useState<number>(15);
  const [selectedSlot, setSelectedSlot] = useState<"morning" | "afternoon" | "evening">("morning");
  const [monthName, setMonthName] = useState("October 2023");

  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemQty, setNewItemQty] = useState("");

  const handleDeleteItem = (id: string) => {
    setSummaryItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddItem = () => {
    if (!newItemTitle.trim()) return;
    const newItem: SummaryItem = {
      id: Date.now().toString(),
      title: newItemTitle,
      qty: newItemQty || "1 bag / bin",
      icon: "paper",
    };
    setSummaryItems((prev) => [...prev, newItem]);
    setNewItemTitle("");
    setNewItemQty("");
    setShowAddModal(false);
  };

  const handleConfirmSchedule = () => {
    if (summaryItems.length === 0) {
      showAlert({
        type: "error",
        title: "No Waste Items",
        message: "Please add at least one waste item to schedule a pickup.",
      });
      return;
    }

    const slotLabel =
      selectedSlot === "morning"
        ? "Morning (8:00 AM - 12:00 PM)"
        : "Afternoon (12:00 PM - 4:00 PM)";

    showAlert({
      type: "success",
      title: "Pickup Confirmed!",
      message: `Your pickup is scheduled for ${monthName.split(" ")[0]} ${selectedDay} (${slotLabel}). Our driver will arrive in your requested time window.`,
      actions: [
        {
          label: "View History",
          onPress: () => router.push("/(tabs)/orders" as any),
        },
      ],
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? "#0E1412" : "#F9F9FF" }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Text style={[styles.brandTitle, { color: isDarkMode ? "#95D3BA" : "#003527" }]}>
              EcoLift
            </Text>
            <Text style={[styles.headerDivider, { color: C.greyText }]}>|</Text>
            <Text style={[styles.headerSubTitle, { color: C.text }]}>Schedule</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile" as any)}
            style={styles.avatarBtn}
            activeOpacity={0.8}
          >
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida/AP1WRLvvebFOZ6ynMsVwLT_RhMB47PIf8hxioUnplUngiLRck_uwziGuo8q9YO5aj1foVEUmhejlyafL2z2OHqEPi7FC8azbJoc-ziJbt6qsF5SMnw3GGseHcRNMOLhOvVO7v71vEGCzSy99We7_7rFyQI5Xzz2j4GcrsBMMWBjTRHPbwqUwGF-tolAZtlI0fp2FGa_-ATEKQMsHpKcZA_Q1cKK8GQq6hUUor6q0TpvsuD-ZBS35WmtkQvEqKtrn1A2MHmfBS2lh9XHmQQ",
              }}
              style={styles.avatarImage}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Visual Context Hero Image */}
          <View style={styles.heroBanner}>
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBGmt3379VzH-TBw12m01zbVy_x5r-ps4-pkhQLUZeJCeuZNsMkeO26sdUQZKLrNE7Pc-EQQs4DJuTFD7MRlX3LgSYcJivnTM4N1ShxlwXjUbotPacfmuy0EvVCEeAqhAvGfmUwf8Udd1jWHQw7o5QsjXIGlEr4fCPeXfZSAbudbxkHb7RHLVL00fRYrhf3Tha9qIQ3wRCHDvMHs-vgQhhYQHQZ235gp0XZ-sjhhvzn3qhzUxkcpUte",
              }}
              style={styles.heroBannerImage}
            />
            <View style={styles.heroGradient}>
              <Text style={styles.heroTitle}>Schedule Pickup</Text>
            </View>
          </View>

          {/* Pickup Summary Card */}
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: isDarkMode ? "#1A211E" : "#E7EEFE",
                borderColor: isDarkMode ? "#2B3530" : "#DCE2F3",
              },
            ]}
          >
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <Recycle size={18} color="#006C49" />
                <Text style={[styles.sectionTitle, { color: C.text }]}>Pickup Summary</Text>
              </View>
              <TouchableOpacity
                style={styles.addSmallBtn}
                onPress={() => setShowAddModal(true)}
              >
                <Plus size={16} color="#006C49" />
                <Text style={styles.addSmallBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.summaryItemsList}>
              {summaryItems.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.summaryItemRow,
                    {
                      backgroundColor: isDarkMode ? "#141A17" : "#FFFFFF",
                      borderColor: isDarkMode ? "#2B3530" : "#DCE2F3",
                    },
                  ]}
                >
                  <View style={styles.summaryItemLeft}>
                    <View
                      style={[
                        styles.summaryItemIcon,
                        {
                          backgroundColor:
                            item.icon === "paper"
                              ? "rgba(6, 78, 59, 0.15)"
                              : "rgba(108, 248, 187, 0.2)",
                        },
                      ]}
                    >
                      {item.icon === "paper" ? (
                        <FileText size={18} color="#006C49" />
                      ) : (
                        <Recycle size={18} color="#00714D" />
                      )}
                    </View>
                    <View>
                      <Text style={[styles.summaryItemTitle, { color: C.text }]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.summaryItemQty, { color: C.greyText }]}>
                        {item.qty}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDeleteItem(item.id)}
                    style={styles.deleteItemBtn}
                  >
                    <Trash2 size={16} color="#BA1A1A" />
                  </TouchableOpacity>
                </View>
              ))}

              {summaryItems.length === 0 && (
                <Text style={[styles.emptySummaryText, { color: C.greyText }]}>
                  No items selected. Tap "+ Add" to include waste categories.
                </Text>
              )}
            </View>
          </View>

          {/* Select Date Calendar Card */}
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: isDarkMode ? "#1A211E" : "#E7EEFE",
                borderColor: isDarkMode ? "#2B3530" : "#DCE2F3",
              },
            ]}
          >
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <CalendarIcon size={18} color="#006C49" />
                <Text style={[styles.sectionTitle, { color: C.text }]}>Select Date</Text>
              </View>
            </View>

            {/* Calendar Controls */}
            <View style={styles.calendarMonthRow}>
              <TouchableOpacity
                onPress={() => setMonthName("September 2023")}
                style={styles.monthNavBtn}
              >
                <ChevronLeft size={18} color={C.text} />
              </TouchableOpacity>
              <Text style={[styles.calendarMonthTitle, { color: C.text }]}>
                {monthName}
              </Text>
              <TouchableOpacity
                onPress={() => setMonthName("November 2023")}
                style={styles.monthNavBtn}
              >
                <ChevronRight size={18} color={C.text} />
              </TouchableOpacity>
            </View>

            {/* Days of Week Header */}
            <View style={styles.daysOfWeekGrid}>
              {DAYS_OF_WEEK.map((d, index) => (
                <Text key={index} style={[styles.dayOfWeekHeader, { color: C.greyText }]}>
                  {d}
                </Text>
              ))}
            </View>

            {/* 7-column Calendar Grid */}
            <View style={styles.daysGrid}>
              {/* Start Day Empty Offsets */}
              {Array.from({ length: START_DAY_OFFSET }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.dayCell} />
              ))}

              {/* Days Numbers */}
              {Array.from({ length: DAYS_IN_MONTH }).map((_, i) => {
                const dayNum = i + 1;
                const isPast = dayNum < 14;
                const isSelected = dayNum === selectedDay;

                return (
                  <TouchableOpacity
                    key={`day-${dayNum}`}
                    style={[
                      styles.dayCell,
                      isSelected && {
                        backgroundColor: "#003527",
                        shadowColor: "#000000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 3,
                      },
                    ]}
                    disabled={isPast}
                    onPress={() => setSelectedDay(dayNum)}
                  >
                    <Text
                      style={[
                        styles.dayCellText,
                        {
                          color: isSelected
                            ? "#FFFFFF"
                            : isPast
                            ? isDarkMode
                              ? "rgba(255, 255, 255, 0.2)"
                              : "rgba(0, 0, 0, 0.25)"
                            : C.text,
                        },
                        isSelected && { fontFamily: "Poppins-Bold" },
                      ]}
                    >
                      {dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Select Time Slot Card */}
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: isDarkMode ? "#1A211E" : "#E7EEFE",
                borderColor: isDarkMode ? "#2B3530" : "#DCE2F3",
              },
            ]}
          >
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <Sun size={18} color="#006C49" />
                <Text style={[styles.sectionTitle, { color: C.text }]}>Select Time Slot</Text>
              </View>
            </View>

            <View style={styles.timeSlotsColumn}>
              {/* Morning Slot */}
              <TouchableOpacity
                style={[
                  styles.timeSlotCard,
                  {
                    backgroundColor: isDarkMode ? "#141A17" : "#FFFFFF",
                    borderColor:
                      selectedSlot === "morning"
                        ? "#003527"
                        : isDarkMode
                        ? "#2B3530"
                        : "#DCE2F3",
                    borderWidth: selectedSlot === "morning" ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedSlot("morning")}
                activeOpacity={0.85}
              >
                <View style={styles.timeSlotLeft}>
                  <Sun size={20} color="#006C49" />
                  <View>
                    <Text style={[styles.timeSlotName, { color: C.text }]}>Morning</Text>
                    <Text style={[styles.timeSlotHours, { color: C.greyText }]}>
                      8:00 AM - 12:00 PM
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.radioIndicator,
                    {
                      borderColor:
                        selectedSlot === "morning" ? "#003527" : "#707974",
                    },
                  ]}
                >
                  {selectedSlot === "morning" && (
                    <View style={styles.radioInnerFilled} />
                  )}
                </View>
              </TouchableOpacity>

              {/* Afternoon Slot */}
              <TouchableOpacity
                style={[
                  styles.timeSlotCard,
                  {
                    backgroundColor: isDarkMode ? "#141A17" : "#FFFFFF",
                    borderColor:
                      selectedSlot === "afternoon"
                        ? "#003527"
                        : isDarkMode
                        ? "#2B3530"
                        : "#DCE2F3",
                    borderWidth: selectedSlot === "afternoon" ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedSlot("afternoon")}
                activeOpacity={0.85}
              >
                <View style={styles.timeSlotLeft}>
                  <CloudSun size={20} color="#006C49" />
                  <View>
                    <Text style={[styles.timeSlotName, { color: C.text }]}>Afternoon</Text>
                    <Text style={[styles.timeSlotHours, { color: C.greyText }]}>
                      12:00 PM - 4:00 PM
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.radioIndicator,
                    {
                      borderColor:
                        selectedSlot === "afternoon" ? "#003527" : "#707974",
                    },
                  ]}
                >
                  {selectedSlot === "afternoon" && (
                    <View style={styles.radioInnerFilled} />
                  )}
                </View>
              </TouchableOpacity>

              {/* Evening Slot (Disabled) */}
              <View
                style={[
                  styles.timeSlotCard,
                  {
                    backgroundColor: isDarkMode ? "#141A17" : "#FFFFFF",
                    borderColor: isDarkMode ? "#2B3530" : "#DCE2F3",
                    opacity: 0.5,
                  },
                ]}
              >
                <View style={styles.timeSlotLeft}>
                  <Moon size={20} color={C.greyText} />
                  <View>
                    <Text style={[styles.timeSlotName, { color: C.greyText }]}>
                      Evening (Unavailable)
                    </Text>
                    <Text style={[styles.timeSlotHours, { color: C.greyText }]}>
                      4:00 PM - 8:00 PM
                    </Text>
                  </View>
                </View>

                <View style={[styles.radioIndicator, { borderColor: "#707974" }]} />
              </View>
            </View>
          </View>

          {/* Confirm Schedule Button */}
          <TouchableOpacity
            style={[styles.confirmScheduleBtn, { backgroundColor: "#003527" }]}
            onPress={handleConfirmSchedule}
            activeOpacity={0.9}
          >
            <Text style={styles.confirmScheduleBtnText}>Confirm Schedule</Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </ScrollView>

        {/* Add Item Modal */}
        <Modal
          visible={showAddModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.addModalCard,
                { backgroundColor: isDarkMode ? "#1A211E" : "#FFFFFF" },
              ]}
            >
              <Text style={[styles.addModalTitle, { color: C.text }]}>Add Waste Item</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    color: C.text,
                    backgroundColor: isDarkMode ? "#141A17" : "#F0F3FF",
                    borderColor: isDarkMode ? "#2B3530" : "#DCE2F3",
                  },
                ]}
                placeholder="Item Name (e.g. Glass Bottles)"
                placeholderTextColor={C.greyText}
                value={newItemTitle}
                onChangeText={setNewItemTitle}
              />
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    color: C.text,
                    backgroundColor: isDarkMode ? "#141A17" : "#F0F3FF",
                    borderColor: isDarkMode ? "#2B3530" : "#DCE2F3",
                  },
                ]}
                placeholder="Quantity (e.g. 2 bins, 1 box)"
                placeholderTextColor={C.greyText}
                value={newItemQty}
                onChangeText={setNewItemQty}
              />
              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={[styles.modalCancelBtn, { borderColor: C.border }]}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={[styles.modalCancelBtnText, { color: C.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSubmitBtn, { backgroundColor: "#003527" }]}
                  onPress={handleAddItem}
                >
                  <Text style={styles.modalSubmitBtnText}>Add Item</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
      <CustomAlert {...alertProps} />
    </View>
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
    height: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandTitle: {
    fontSize: 22,
    fontFamily: "Poppins-Bold",
    letterSpacing: -0.5,
  },
  headerDivider: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
  },
  headerSubTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
  },
  avatarBtn: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#95D3BA",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 110,
    gap: 16,
  },
  heroBanner: {
    width: "100%",
    height: 140,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  heroBannerImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
    padding: 16,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "Poppins-Bold",
  },
  sectionCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
  },
  addSmallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(108, 248, 187, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  addSmallBtnText: {
    fontSize: 12,
    fontFamily: "Poppins-Bold",
    color: "#006C49",
  },
  summaryItemsList: {
    gap: 10,
  },
  summaryItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  summaryItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryItemTitle: {
    fontSize: 14,
    fontFamily: "Poppins-Bold",
  },
  summaryItemQty: {
    fontSize: 11,
    fontFamily: "Poppins-Medium",
    marginTop: 2,
  },
  deleteItemBtn: {
    padding: 6,
  },
  emptySummaryText: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    textAlign: "center",
    paddingVertical: 10,
  },
  calendarMonthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  monthNavBtn: {
    padding: 6,
  },
  calendarMonthTitle: {
    fontSize: 15,
    fontFamily: "Poppins-Bold",
  },
  daysOfWeekGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 4,
  },
  dayOfWeekHeader: {
    fontSize: 12,
    fontFamily: "Poppins-Bold",
    width: 36,
    textAlign: "center",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  dayCell: {
    width: (Dimensions.get("window").width - 74) / 7,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
  },
  dayCellText: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
  },
  timeSlotsColumn: {
    gap: 10,
  },
  timeSlotCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
  },
  timeSlotLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeSlotName: {
    fontSize: 14,
    fontFamily: "Poppins-Bold",
  },
  timeSlotHours: {
    fontSize: 11,
    fontFamily: "Poppins-Medium",
    marginTop: 2,
  },
  radioIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInnerFilled: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#003527",
  },
  confirmScheduleBtn: {
    height: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmScheduleBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins-Bold",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  addModalCard: {
    width: "100%",
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  addModalTitle: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
  },
  modalInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: "Poppins-Medium",
  },
  modalActionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontFamily: "Poppins-Bold",
  },
  modalSubmitBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubmitBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Poppins-Bold",
  },
});
