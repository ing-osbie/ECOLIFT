import { CustomAlert, useCustomAlert } from "@/components/custom-alert";
import { EcoliftMap } from "@/components/ecolift-map";
import { GlassCard } from "@/components/glass-card";
import { GradientBackground } from "@/components/gradient-background";
import { Colors, getColors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { useRouter } from "expo-router";
import {
  CheckCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  MapPin,
  Navigation,
  PhoneCall,
  ShieldCheck,
  Star,
  TrendingUp,
  Truck,
  X,
  Zap,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CollectorHome() {
  const router = useRouter();
  const { isDarkMode, collectorEarningsToday } = useApp();
  const C = getColors(isDarkMode);
  const { showAlert, alertProps } = useCustomAlert();

  const [isOnline, setIsOnline] = useState(true);
  const [activeJobState, setActiveJobState] = useState<
    "idle" | "offered" | "navigating" | "payment_pending" | "completed"
  >("offered");
  const [offerCountdown, setOfferCountdown] = useState(25);

  // Pulse animation for online indicator
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    if (isOnline) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.4,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isOnline, pulseAnim]);

  useEffect(() => {
    let timer: any;
    if (activeJobState === "offered" && offerCountdown > 0) {
      timer = setInterval(() => {
        setOfferCountdown((prev) => prev - 1);
      }, 1000);
    } else if (offerCountdown === 0 && activeJobState === "offered") {
      setActiveJobState("idle");
    }
    return () => clearInterval(timer);
  }, [activeJobState, offerCountdown]);

  const mapMarkers = [
    {
      id: "driver",
      latitude: 5.564,
      longitude: -0.192,
      title: "Your Location (Truck #4)",
      type: "collector" as const,
    },
    {
      id: "pickup1",
      latitude: 5.5593,
      longitude: -0.1974,
      title: "Customer: Abena Serwaa (Osu RE)",
      type: "user" as const,
    },
    {
      id: "station",
      latitude: 5.57,
      longitude: -0.185,
      title: "Agbogbloshie Station #2",
      type: "destination" as const,
    },
  ];

  const routePolyline = [
    { latitude: 5.564, longitude: -0.192 },
    { latitude: 5.5593, longitude: -0.1974 },
    { latitude: 5.57, longitude: -0.185 },
  ];

  const handleAcceptJob = () => {
    setActiveJobState("navigating");
    showAlert({
      type: "success",
      title: "Job Accepted & Map Navigation Active!",
      message: "Navigating to Abena Serwaa in Osu RE (2.4 km away).",
    });
  };

  const handleDeclineJob = () => {
    setActiveJobState("idle");
    showAlert({
      type: "info",
      title: "Job Declined",
      message: "Searching for next nearby pickup offer...",
    });
  };

  const handleArrivedAtCustomer = () => {
    setActiveJobState("payment_pending");
  };

  const handleConfirmMoMoPayment = () => {
    setActiveJobState("idle");
    showAlert({
      type: "success",
      title: "Payment Received & Job Completed!",
      message: "GH₵ 38.00 MTN Mobile Money confirmed. Wallet updated.",
    });
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Status Header Bar */}
        <View style={styles.topBarContainer}>
          <View style={styles.onlineStatusRow}>
            {/* Animated Pulse Dot */}
            <View style={styles.pulseWrapper}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    backgroundColor: isOnline ? "#10B981" : "#6B7C77",
                    transform: [{ scale: pulseAnim }],
                    opacity: isOnline ? 0.4 : 0,
                  },
                ]}
              />
              <View
                style={[
                  styles.pulseCore,
                  { backgroundColor: isOnline ? "#10B981" : "#6B7C77" },
                ]}
              />
            </View>

            <Text style={[styles.statusText, { color: C.text }]}>
              {isOnline ? "ONLINE FOR PICKUPS" : "OFFLINE"}
            </Text>
          </View>

          {/* Toggle Switch */}
          <Switch
            trackColor={{ false: "#E2ECE9", true: Colors.primary }}
            thumbColor={isOnline ? Colors.accent : "#F3F4F6"}
            onValueChange={setIsOnline}
            value={isOnline}
          />
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Today's Driver Earnings Summary Card */}
          <View style={styles.earningsSection}>
            <GlassCard style={styles.earningsCard}>
              <View style={styles.earningsHeaderRow}>
                <View>
                  <Text style={[styles.earningsLabel, { color: C.greyText }]}>
                    Todays Earnings
                  </Text>
                  <Text style={[styles.earningsAmount, { color: C.text }]}>
                    {collectorEarningsToday > 0
                      ? `GH₵ ${collectorEarningsToday.toFixed(2)}`
                      : "GH₵ 345.50"}
                  </Text>
                </View>

                <View
                  style={[
                    styles.growthBadge,
                    { backgroundColor: "rgba(16, 185, 129, 0.15)" },
                  ]}
                >
                  <TrendingUp size={14} color="#10B981" />
                  <Text style={styles.growthText}>+14%</Text>
                </View>
              </View>

              {/* 3 Driver Stat Pills */}
              <View style={styles.driverStatsRow}>
                <View
                  style={[
                    styles.driverStatBox,
                    {
                      backgroundColor: isDarkMode ? "#1E2321" : "#F9FBF9",
                      borderColor: C.border,
                    },
                  ]}
                >
                  <Truck size={15} color={C.primary} />
                  <Text style={[styles.statValue, { color: C.text }]}>
                    8 Jobs
                  </Text>
                  <Text style={[styles.statSub, { color: C.greyText }]}>
                    Done
                  </Text>
                </View>

                <View
                  style={[
                    styles.driverStatBox,
                    {
                      backgroundColor: isDarkMode ? "#1E2321" : "#F9FBF9",
                      borderColor: C.border,
                    },
                  ]}
                >
                  <Star size={15} color="#F59E0B" />
                  <Text style={[styles.statValue, { color: C.text }]}>
                    4.9 ⭐
                  </Text>
                  <Text style={[styles.statSub, { color: C.greyText }]}>
                    Rating
                  </Text>
                </View>

                <View
                  style={[
                    styles.driverStatBox,
                    {
                      backgroundColor: isDarkMode ? "#1E2321" : "#F9FBF9",
                      borderColor: C.border,
                    },
                  ]}
                >
                  <Zap size={15} color="#8B5CF6" />
                  <Text style={[styles.statValue, { color: C.text }]}>
                    24.5 km
                  </Text>
                  <Text style={[styles.statSub, { color: C.greyText }]}>
                    Driven
                  </Text>
                </View>
              </View>
            </GlassCard>
          </View>

          {/* Interactive Live Map View with Route Navigation */}
          <View style={styles.mapSection}>
            <View style={styles.mapFrame}>
              <EcoliftMap
                markers={mapMarkers}
                routeCoordinates={routePolyline}
                style={styles.mapView}
              />

              {/* Offer Banner Card Overlay if offered */}
              {activeJobState === "offered" && isOnline && (
                <GlassCard style={styles.offerOverlayCard}>
                  <View style={styles.offerHeaderRow}>
                    <View style={styles.offerBadgePill}>
                      <Zap size={13} color="#10B981" />
                      <Text style={styles.offerBadgeText}>New Job Offer</Text>
                    </View>

                    <View style={styles.timerPill}>
                      <Clock size={12} color="#EF4444" />
                      <Text style={styles.timerText}>{offerCountdown}s</Text>
                    </View>
                  </View>

                  <View style={styles.offerPayoutRow}>
                    <Text style={[styles.offerCustomer, { color: C.text }]}>
                      Abena Serwaa (Osu RE)
                    </Text>
                    <Text style={[styles.offerPrice, { color: C.text }]}>
                      GH₵ 38.00
                    </Text>
                  </View>

                  <Text style={[styles.offerMetaText, { color: C.greyText }]}>
                    2.4 km away · Plastic & Metal (approx 45 kg)
                  </Text>

                  {/* Accept / Decline Buttons */}
                  <View style={styles.offerActionBtnsRow}>
                    <TouchableOpacity
                      style={[styles.declineBtn, { borderColor: C.border }]}
                      onPress={handleDeclineJob}
                    >
                      <X size={16} color={C.text} />
                      <Text style={[styles.declineBtnText, { color: C.text }]}>
                        Decline
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.acceptBtn,
                        {
                          backgroundColor: isDarkMode
                            ? Colors.accent
                            : Colors.primary,
                        },
                      ]}
                      onPress={handleAcceptJob}
                      activeOpacity={0.9}
                    >
                      <CheckCircle
                        size={16}
                        color={isDarkMode ? "#000000" : "#FFFFFF"}
                      />
                      <Text
                        style={[
                          styles.acceptBtnText,
                          { color: isDarkMode ? "#000000" : "#FFFFFF" },
                        ]}
                      >
                        Accept & Navigate
                      </Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              )}

              {/* Navigating to Customer View */}
              {activeJobState === "navigating" && (
                <GlassCard style={styles.offerOverlayCard}>
                  <View style={styles.offerHeaderRow}>
                    <View
                      style={[
                        styles.offerBadgePill,
                        { backgroundColor: "rgba(59, 130, 246, 0.15)" },
                      ]}
                    >
                      <Navigation size={13} color="#3B82F6" />
                      <Text
                        style={[styles.offerBadgeText, { color: "#3B82F6" }]}
                      >
                        Map Navigation Active
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => router.push("/chat" as any)}
                    >
                      <PhoneCall size={16} color={C.primary} />
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.offerCustomer, { color: C.text }]}>
                    Abena Serwaa - 12 Ring Rd
                  </Text>
                  <Text style={[styles.offerMetaText, { color: C.greyText }]}>
                    2.4 km to pickup point · ETA 6 mins
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.acceptBtn,
                      {
                        backgroundColor: isDarkMode
                          ? Colors.accent
                          : Colors.primary,
                        marginTop: 10,
                      },
                    ]}
                    onPress={handleArrivedAtCustomer}
                  >
                    <MapPin
                      size={16}
                      color={isDarkMode ? "#000000" : "#FFFFFF"}
                    />
                    <Text
                      style={[
                        styles.acceptBtnText,
                        { color: isDarkMode ? "#000000" : "#FFFFFF" },
                      ]}
                    >
                      Arrived at Customer
                    </Text>
                  </TouchableOpacity>
                </GlassCard>
              )}

              {/* Mobile Money Payment Confirmation View */}
              {activeJobState === "payment_pending" && (
                <GlassCard style={styles.offerOverlayCard}>
                  <View style={styles.offerHeaderRow}>
                    <View
                      style={[
                        styles.offerBadgePill,
                        { backgroundColor: "rgba(16, 185, 129, 0.15)" },
                      ]}
                    >
                      <CreditCard size={13} color="#10B981" />
                      <Text
                        style={[styles.offerBadgeText, { color: "#10B981" }]}
                      >
                        Payment Verification
                      </Text>
                    </View>
                    <ShieldCheck size={18} color="#10B981" />
                  </View>

                  <Text style={[styles.offerCustomer, { color: C.text }]}>
                    Confirm Payment Received
                  </Text>

                  <View
                    style={[
                      styles.momoPillBox,
                      {
                        backgroundColor: isDarkMode ? "#141716" : "#F0FDF4",
                        borderColor: "#10B981",
                      },
                    ]}
                  >
                    <CheckCircle2 size={16} color="#10B981" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.momoTitle, { color: C.text }]}>
                        GH₵ 38.00 - MTN Mobile Money
                      </Text>
                      <Text style={[styles.momoRef, { color: C.greyText }]}>
                        Ref: #MM-892410 · Confirmed
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.acceptBtn,
                      {
                        backgroundColor: isDarkMode
                          ? Colors.accent
                          : Colors.primary,
                        marginTop: 10,
                      },
                    ]}
                    onPress={handleConfirmMoMoPayment}
                  >
                    <CheckCircle
                      size={16}
                      color={isDarkMode ? "#000000" : "#FFFFFF"}
                    />
                    <Text
                      style={[
                        styles.acceptBtnText,
                        { color: isDarkMode ? "#000000" : "#FFFFFF" },
                      ]}
                    >
                      Confirm & Complete Pickup
                    </Text>
                  </TouchableOpacity>
                </GlassCard>
              )}
            </View>
          </View>

          {/* Quick Action Grid */}
          <View style={styles.quickGridSection}>
            <TouchableOpacity
              style={[
                styles.quickGridCard,
                { backgroundColor: C.card, borderColor: C.border },
              ]}
              onPress={() => {
                setActiveJobState("navigating");
                showAlert({
                  type: "info",
                  title: "Navigation Active",
                  message: "Centering map on active customer location pin.",
                });
              }}
            >
              <Navigation size={20} color={C.primary} />
              <Text style={[styles.quickGridTitle, { color: C.text }]}>
                Map Navigation
              </Text>
              <Text style={[styles.quickGridSub, { color: C.greyText }]}>
                Focus user location
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickGridCard,
                { backgroundColor: C.card, borderColor: C.border },
              ]}
              onPress={() => router.push("/(tabs-collector)/earnings" as any)}
            >
              <DollarSign size={20} color="#10B981" />
              <Text style={[styles.quickGridTitle, { color: C.text }]}>
                Earnings
              </Text>
              <Text style={[styles.quickGridSub, { color: C.greyText }]}>
                Payout history
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  topBarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: Platform.OS === "ios" ? 12 : 24,
    marginBottom: 12,
  },
  onlineStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pulseWrapper: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  pulseRing: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  pulseCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 13,
    fontFamily: "Poppins-Bold",
    letterSpacing: 0.5,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  earningsSection: {
    marginBottom: 14,
  },
  earningsCard: {
    borderRadius: 16,
    padding: 16,
  },
  earningsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  earningsLabel: {
    fontSize: 11,
    fontFamily: "Poppins-Medium",
  },
  earningsAmount: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
  },
  growthBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  growthText: {
    fontSize: 11,
    fontFamily: "Poppins-Bold",
    color: "#10B981",
  },
  driverStatsRow: {
    flexDirection: "row",
    gap: 8,
  },
  driverStatBox: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 12,
    fontFamily: "Poppins-Bold",
    marginTop: 2,
  },
  statSub: {
    fontSize: 10,
    fontFamily: "Poppins-Medium",
  },
  mapSection: {
    flex: 1,
    marginBottom: 14,
  },
  mapFrame: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
  },
  mapView: {
    width: "100%",
    height: "100%",
  },
  offerOverlayCard: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    borderRadius: 16,
    padding: 14,
    elevation: 4,
  },
  offerHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  offerBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  offerBadgeText: {
    fontSize: 10,
    fontFamily: "Poppins-Bold",
    color: "#10B981",
  },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 10,
    fontFamily: "Poppins-Bold",
    color: "#EF4444",
  },
  offerPayoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  offerCustomer: {
    fontSize: 14,
    fontFamily: "Poppins-Bold",
  },
  offerPrice: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
  },
  offerMetaText: {
    fontSize: 11,
    fontFamily: "Poppins-Medium",
    marginBottom: 12,
  },
  offerActionBtnsRow: {
    flexDirection: "row",
    gap: 8,
  },
  declineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  declineBtnText: {
    fontSize: 12,
    fontFamily: "Poppins-Bold",
  },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 42,
    borderRadius: 12,
    gap: 6,
  },
  acceptBtnText: {
    fontSize: 13,
    fontFamily: "Poppins-Bold",
  },
  momoPillBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginVertical: 8,
  },
  momoTitle: {
    fontSize: 12,
    fontFamily: "Poppins-Bold",
  },
  momoRef: {
    fontSize: 10,
    fontFamily: "Poppins-Medium",
  },
  quickGridSection: {
    flexDirection: "row",
    gap: 10,
  },
  quickGridCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  quickGridTitle: {
    fontSize: 12,
    fontFamily: "Poppins-Bold",
    marginTop: 4,
  },
  quickGridSub: {
    fontSize: 10,
    fontFamily: "Poppins-Medium",
  },
});
