import { CollectorHeader } from "@/components/collector-header";
import { CustomAlert, useCustomAlert } from "@/components/custom-alert";
import { EcoliftMap } from "@/components/ecolift-map";
import { GlassCard } from "@/components/glass-card";
import { Colors, getColors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { useRouter } from "expo-router";
import {
  CheckCircle,
  CheckCircle2,
  ChevronRight,
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
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CollectorHome() {
  const router = useRouter();
  const { isDarkMode, userName, isCollectorVerified } = useApp();
  const { showAlert, alertProps } = useCustomAlert();

  const C = getColors(isDarkMode);
  const [isOnline, setIsOnline] = useState(true);
  const [activeJobState, setActiveJobState] = useState<
    "idle" | "offered" | "navigating" | "payment_pending" | "completed"
  >("offered");
  const [offerCountdown, setOfferCountdown] = useState(20);

  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    if (isOnline) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isOnline]);

  useEffect(() => {
    let timer: any;
    if (activeJobState === "offered" && offerCountdown > 0) {
      timer = setInterval(() => setOfferCountdown((p) => p - 1), 1000);
    } else if (offerCountdown === 0 && activeJobState === "offered") {
      setActiveJobState("idle");
    }
    return () => clearInterval(timer);
  }, [activeJobState, offerCountdown]);

  const mapMarkers = [
    { id: "driver", latitude: 5.564, longitude: -0.192, title: "Your Location", type: "collector" as const },
    { id: "pickup1", latitude: 5.5593, longitude: -0.1974, title: "Abena Serwaa (Osu RE)", type: "user" as const },
    { id: "station", latitude: 5.57, longitude: -0.185, title: "Agbogbloshie Station #2", type: "destination" as const },
  ];

  const routePolyline = [
    { latitude: 5.564, longitude: -0.192 },
    { latitude: 5.5593, longitude: -0.1974 },
    { latitude: 5.57, longitude: -0.185 },
  ];

  const handleAcceptJob = () => {
    setActiveJobState("navigating");
    showAlert({ type: "success", title: "Job Accepted!", message: "Navigating to Abena Serwaa in Osu RE (2.4 km away)." });
  };

  const handleDeclineJob = () => {
    setActiveJobState("idle");
    showAlert({ type: "info", title: "Job Declined", message: "Searching for next nearby pickup offer..." });
  };

  const handleArrivedAtCustomer = () => setActiveJobState("payment_pending");

  const handleConfirmMoMoPayment = () => {
    setActiveJobState("idle");
    showAlert({ type: "success", title: "Payment Received!", message: "GH₵ 38.00 MTN Mobile Money confirmed. Wallet updated." });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.screenBg }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <CollectorHeader
          title="Driver Home"
          subtitle={`Welcome back, ${userName || "Collector"}`}
          unread={3}
        />

        {/* Verification Reminder Banner */}
        {!isCollectorVerified && (
          <TouchableOpacity
            style={[
              styles.verificationBanner,
              {
                backgroundColor: isDarkMode ? "#271E0B" : "#FFF8E1",
                borderColor: isDarkMode ? "#5C4308" : "#FFE082",
              },
            ]}
            onPress={() => router.push("/upload-id" as any)}
            activeOpacity={0.85}
          >
            <ShieldCheck size={20} color={isDarkMode ? "#FBBF24" : "#F59E0B"} />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.verifTitle,
                  { color: isDarkMode ? "#FDE68A" : "#B45309" },
                ]}
              >
                Ghana Card Verification Pending
              </Text>
              <Text
                style={[
                  styles.verifSub,
                  { color: isDarkMode ? "#FCD34D" : "#92400E" },
                ]}
              >
                Tap to submit your Ghana Card & unlock higher job limits
              </Text>
            </View>
            <ChevronRight size={18} color={isDarkMode ? "#FBBF24" : "#F59E0B"} />
          </TouchableOpacity>
        )}

        {/* Online Status Toggle */}
        <View style={styles.statusRow}>
          <View style={styles.statusLeft}>
            <View style={styles.pulseWrapper}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  { backgroundColor: isOnline ? "#4edea3" : "#bfc9c3", transform: [{ scale: pulseAnim }], opacity: isOnline ? 0.4 : 0 },
                ]}
              />
              <View style={[styles.pulseCore, { backgroundColor: isOnline ? "#4edea3" : "#bfc9c3" }]} />
            </View>
            <Text style={styles.statusText}>{isOnline ? "ONLINE FOR PICKUPS" : "OFFLINE"}</Text>
          </View>
          <Switch
            trackColor={{ false: "#dce2f3", true: "#003527" }}
            thumbColor={isOnline ? "#b0f0d6" : "#f0f3ff"}
            onValueChange={setIsOnline}
            value={isOnline}
          />
        </View>

        {/* Earnings Card */}
        <View style={[styles.earningsCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={styles.earningsTopBar} />
          <View style={styles.earningsHeaderRow}>
            <View>
              <Text style={[styles.earningsLabel, { color: C.greyText }]}>Today's Earnings</Text>
              <Text style={[styles.earningsAmount, { color: C.text }]}>GH₵ 345.50</Text>
            </View>
            <View style={[styles.growthBadge, { backgroundColor: isDarkMode ? 'rgba(182,255,60,0.12)' : 'rgba(149,211,186,0.2)' }]}>
              <TrendingUp size={14} color={C.iconPrimary} />
              <Text style={[styles.growthText, { color: C.iconPrimary }]}>+14%</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            {[
              { icon: <Truck size={18} color={C.greyText} />, value: "8 Jobs", label: "Done" },
              { icon: <Star size={18} color="#F59E0B" fill="#F59E0B" />, value: "4.9", label: "Rating" },
              { icon: <Zap size={18} color="#8B5CF6" />, value: "24.5 km", label: "Driven" },
            ].map((s, i) => (
              <View key={i} style={[styles.statBox, { backgroundColor: C.cardSecondary, borderColor: C.border }]}>
                {s.icon}
                <Text style={[styles.statValue, { color: C.text }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: C.greyText }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Map Area */}
        <View style={[styles.mapCard, { borderColor: C.border }]}>
          <EcoliftMap markers={mapMarkers} routeCoordinates={routePolyline} style={styles.mapView} />

          {/* Map Controls */}
          <View style={styles.mapControls}>
            <TouchableOpacity style={styles.mapControlBtn}>
              <Navigation size={18} color="#151c27" />
            </TouchableOpacity>
          </View>

          {/* Job Offer Overlay */}
          {activeJobState === "offered" && isOnline && (
            <GlassCard style={styles.overlayCard}>
              <View style={styles.overlayHeader}>
                <View style={styles.offerBadge}>
                  <Zap size={12} color="#006c49" />
                  <Text style={styles.offerBadgeText}>New Job Offer</Text>
                </View>
                <View style={styles.timerBadge}>
                  <Clock size={12} color="#ba1a1a" />
                  <Text style={[styles.timerText, offerCountdown <= 5 && styles.timerPulse]}>
                    {offerCountdown}s
                  </Text>
                </View>
              </View>
              <View style={styles.offerRow}>
                <Text style={styles.offerName}>Abena Serwaa (Osu RE)</Text>
                <Text style={styles.offerPrice}>GH₵ 38.00</Text>
              </View>
              <Text style={styles.offerMeta}>2.4 km away · Plastic & Metal (approx 45 kg)</Text>
              <View style={styles.offerBtns}>
                <TouchableOpacity style={styles.declineBtn} onPress={handleDeclineJob}>
                  <X size={16} color="#151c27" />
                  <Text style={styles.declineBtnText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptJob}>
                  <CheckCircle size={16} color="#fff" />
                  <Text style={styles.acceptBtnText}>Accept & Navigate</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          )}

          {activeJobState === "navigating" && (
            <GlassCard style={styles.overlayCard}>
              <View style={styles.overlayHeader}>
                <View style={[styles.offerBadge, { backgroundColor: "rgba(59,130,246,0.15)" }]}>
                  <Navigation size={12} color="#3B82F6" />
                  <Text style={[styles.offerBadgeText, { color: "#3B82F6" }]}>Navigation Active</Text>
                </View>
                <TouchableOpacity onPress={() => router.push("/chat" as any)}>
                  <PhoneCall size={16} color="#003527" />
                </TouchableOpacity>
              </View>
              <Text style={styles.offerName}>Abena Serwaa - 12 Ring Rd</Text>
              <Text style={styles.offerMeta}>2.4 km to pickup · ETA 6 mins</Text>
              <TouchableOpacity style={[styles.acceptBtn, { marginTop: 10 }]} onPress={handleArrivedAtCustomer}>
                <MapPin size={16} color="#fff" />
                <Text style={styles.acceptBtnText}>Arrived at Customer</Text>
              </TouchableOpacity>
            </GlassCard>
          )}

          {activeJobState === "payment_pending" && (
            <GlassCard style={styles.overlayCard}>
              <View style={styles.overlayHeader}>
                <View style={[styles.offerBadge, { backgroundColor: "rgba(16,185,129,0.15)" }]}>
                  <CreditCard size={12} color="#10B981" />
                  <Text style={[styles.offerBadgeText, { color: "#10B981" }]}>Payment Verification</Text>
                </View>
                <ShieldCheck size={18} color="#10B981" />
              </View>
              <Text style={styles.offerName}>Confirm Payment Received</Text>
              <View style={styles.momoPill}>
                <CheckCircle2 size={16} color="#10B981" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.momoTitle}>GH₵ 38.00 - MTN Mobile Money</Text>
                  <Text style={styles.momoRef}>Ref: #MM-892410 · Confirmed</Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.acceptBtn, { marginTop: 10 }]} onPress={handleConfirmMoMoPayment}>
                <CheckCircle size={16} color="#fff" />
                <Text style={styles.acceptBtnText}>Confirm & Complete Pickup</Text>
              </TouchableOpacity>
            </GlassCard>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: C.card, borderColor: C.border }]}
            onPress={() => showAlert({ type: "info", title: "Navigation Active", message: "Centering map on active customer location." })}
          >
            <Navigation size={22} color={C.text} />
            <Text style={[styles.quickTitle, { color: C.text }]}>Map Navigation</Text>
            <Text style={[styles.quickSub, { color: C.greyText }]}>Focus user location</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: C.card, borderColor: C.border }]}
            onPress={() => router.push("/(tabs-collector)/earnings" as any)}
          >
            <DollarSign size={22} color={C.iconPrimary} />
            <Text style={[styles.quickTitle, { color: C.text }]}>Earnings</Text>
            <Text style={[styles.quickSub, { color: C.greyText }]}>Payout history</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <CustomAlert {...alertProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120, gap: 14 },

  // Status row
  statusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  pulseWrapper: { width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  pulseRing: { position: "absolute", width: 20, height: 20, borderRadius: 10 },
  pulseCore: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 12, fontFamily: "Poppins-Bold", color: "#151c27", letterSpacing: 0.6 },

  // Earnings card
  earningsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  earningsTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#003527",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  earningsHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, marginTop: 4 },
  earningsLabel: { fontSize: 13, fontFamily: "Poppins-Medium", color: "#404944" },
  earningsAmount: { fontSize: 28, fontFamily: "Poppins-Bold", color: "#151c27" },
  growthBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(149,211,186,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  growthText: { fontSize: 12, fontFamily: "Poppins-Bold", color: "#006c49" },
  statsGrid: { flexDirection: "row", gap: 8 },
  statBox: { flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f8", borderRadius: 10, paddingVertical: 10, alignItems: "center", gap: 2 },
  statValue: { fontSize: 13, fontFamily: "Poppins-Bold", color: "#151c27" },
  statLabel: { fontSize: 10, fontFamily: "Poppins-Medium", color: "#404944" },

  // Map
  mapCard: { height: 400, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#e2e8f8", position: "relative" },
  mapView: { width: "100%", height: "100%" },
  mapControls: { position: "absolute", top: 12, right: 12, gap: 8 },
  mapControlBtn: { width: 40, height: 40, backgroundColor: "#fff", borderRadius: 20, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },

  // Overlay card
  overlayCard: { position: "absolute", bottom: 12, left: 12, right: 12, borderRadius: 14, padding: 14 },
  overlayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  offerBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(149,211,186,0.2)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  offerBadgeText: { fontSize: 11, fontFamily: "Poppins-Bold", color: "#006c49" },
  timerBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#ffdad6", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  timerText: { fontSize: 11, fontFamily: "Poppins-Bold", color: "#ba1a1a" },
  timerPulse: { opacity: 0.6 },
  offerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  offerName: { fontSize: 14, fontFamily: "Poppins-Bold", color: "#151c27" },
  offerPrice: { fontSize: 16, fontFamily: "Poppins-Bold", color: "#151c27" },
  offerMeta: { fontSize: 12, fontFamily: "Poppins-Medium", color: "#404944", marginBottom: 12 },
  offerBtns: { flexDirection: "row", gap: 8 },
  declineBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 16, height: 44, borderRadius: 10, borderWidth: 1, borderColor: "#bfc9c3", gap: 4 },
  declineBtnText: { fontSize: 13, fontFamily: "Poppins-Bold", color: "#151c27" },
  acceptBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", height: 44, borderRadius: 10, backgroundColor: "#003527", gap: 6 },
  acceptBtnText: { fontSize: 13, fontFamily: "Poppins-Bold", color: "#fff" },
  momoPill: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#10B981", borderRadius: 10, padding: 10, marginVertical: 8 },
  momoTitle: { fontSize: 12, fontFamily: "Poppins-Bold", color: "#151c27" },
  momoRef: { fontSize: 10, fontFamily: "Poppins-Medium", color: "#404944" },

  // Quick grid
  quickGrid: { flexDirection: "row", gap: 10 },
  quickCard: { flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f8", borderRadius: 12, padding: 16, alignItems: "center", gap: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  quickTitle: { fontSize: 13, fontFamily: "Poppins-Bold", color: "#151c27", textAlign: "center" },
  quickSub: { fontSize: 11, fontFamily: "Poppins-Medium", color: "#404944", textAlign: "center" },

  // Verification banner
  verificationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  verifTitle: {
    fontSize: 13,
    fontFamily: "Poppins-Bold",
  },
  verifSub: {
    fontSize: 11,
    fontFamily: "Poppins-Medium",
    marginTop: 2,
  },
});
