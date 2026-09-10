import { CustomAlert, useCustomAlert } from "@/components/custom-alert";
import { EcoliftMap } from "@/components/ecolift-map";
import { getColors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/src/context/AuthContext";
import { acceptJob, completeCollectorJob, getCollectorJobs, setCollectorLocation, setCollectorOnline, setOrderEnRoute } from "@/src/services/collector";
import { declineOffer, distanceMeters, ensureCollectorOnline, setOrderLifecycle, startActiveJobLocationTracking, subscribeToAssignedJobs } from "@/src/services/dispatch";
import { getOrderById } from "@/src/services/orders";
import { CollectorJob } from "@/src/types/collector";
import { Order } from "@/src/types/order";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    CheckCircle,
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    Layers,
    Leaf,
    MapPin,
    Navigation,
    PhoneCall,
    Radio,
    ShieldCheck,
    Star,
    TrendingUp,
    Truck,
    X,
    Zap,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    Animated,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

const COLLECTOR_AVATAR_URI =
  "https://lh3.googleusercontent.com/aida/AEtjO1XcXV5fbdHGNsqeCGly0UlSej52rtC_mjiNz-wgtk0IBvm41436Cn7_bH9IuDiDvPj1XQSSO44Hr7AyapNiRtQB5kBbalFGbLkan0qIhiWUqxd8wsp5doOx5bEsgKli46jrIB_MALi29-JIacOn2bNGMtxgtTwDyKeQcm2blObJA3fmUpgrt2IV1okVTRPF8nMFwl28EpQTFJGxSZp_CpCW8WoJpcSQKvN-XoqbMu_XpGLQPiuWQgR6DJaPWS5IlNcQiXDOgKPOvw";

export default function CollectorHome() {
  const router = useRouter();
  const { isDarkMode, collectorEarningsToday } = useApp();
  const { user } = useAuth();
  const C = getColors(isDarkMode);
  const { showAlert, alertProps } = useCustomAlert();

  const [isOnline, setIsOnline] = useState(true);
  const [activeJob, setActiveJob] = useState<CollectorJob | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [pickupStarted, setPickupStarted] = useState(false);
  const [waitSeconds, setWaitSeconds] = useState(0);
  const [activeJobState, setActiveJobState] = useState<
    "idle" | "offered" | "navigating" | "payment_pending" | "completed"
  >("idle");
  const [offerCountdown, setOfferCountdown] = useState(25);
  const [locationWatcher, setLocationWatcher] = useState<{ remove: () => void } | null>(null);
  const [driverCoords, setDriverCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: 5.564,
    longitude: -0.192,
  });

  useEffect(() => {
    if (!user?.id) return;

    // 1. Ensure collector is present in public.collectors and online
    void ensureCollectorOnline(user.id).then((profile) => {
      if (profile) setIsOnline(profile.is_online);
    });

    // 2. Fetch current GPS position for collector map marker
    Location.requestForegroundPermissionsAsync().then((perm) => {
      if (perm.status === "granted") {
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
          .then((pos) => {
            setCollectorLocation(pos.coords.latitude, pos.coords.longitude);
            setDriverCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          })
          .catch(() => {});
      }
    });

    const loadJob = async (job: CollectorJob) => {
      setActiveJob(job);
      if (job.order_id) {
        const order = await getOrderById(job.order_id);
        setActiveOrder(order);
      }
      if (job.status === "offered") {
        console.log("COLLECTOR: [SHOWING REQUEST]", job.id);
        setOfferCountdown(25);
        setActiveJobState("offered");
      } else if (["accepted", "en_route", "in_progress"].includes(job.status)) {
        setActiveJobState("navigating");
      } else if (job.status === "arrived" || job.status === "pickup_in_progress") {
        setActiveJobState("payment_pending");
      } else if (["cancelled", "declined", "completed"].includes(job.status)) {
        setActiveJobState("idle");
      }
    };

    void getCollectorJobs(user.id).then((jobs) => {
      const active = jobs.find((job) =>
        ["offered", "accepted", "en_route", "in_progress", "arrived", "pickup_in_progress"].includes(job.status)
      );
      if (active) void loadJob(active);
    });

    return subscribeToAssignedJobs(user.id, loadJob);
  }, [user?.id]);

  // Server time is stored as arrived_at. Reconstruct the four-minute period on
  // every app launch instead of trusting a local countdown.
  useEffect(() => {
    const arrivedAt = activeJob?.arrived_at;
    if (!arrivedAt) return;
    const update = () => setWaitSeconds(Math.max(0, 240 - Math.floor((Date.now() - new Date(arrivedAt).getTime()) / 1000)));
    update(); const timer = setInterval(update, 1000); return () => clearInterval(timer);
  }, [activeJob?.arrived_at]);

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
        setOfferCountdown((prev) => {
          if (prev <= 1) {
            setActiveJobState("idle");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeJobState, offerCountdown]);

  const pickupLat = activeOrder?.pickup_lat ?? activeJob?.pickup_lat ?? 5.5593;
  const pickupLng = activeOrder?.pickup_lng ?? activeJob?.pickup_lng ?? -0.1974;
  const disposalLat = activeOrder?.disposal_lat ?? 5.57;
  const disposalLng = activeOrder?.disposal_lng ?? -0.185;
  const customerName = activeJob?.customer_name || activeOrder?.customer_name || "Customer";
  const pickupAddr = activeJob?.pickup_address || activeOrder?.pickup_address || "Pickup location";

  const mapMarkers = [
    {
      id: "driver",
      latitude: driverCoords.latitude,
      longitude: driverCoords.longitude,
      title: "Your Location (EcoLift Collector)",
      type: "collector" as const,
    },
    ...(activeJobState !== "idle"
      ? [
          {
            id: "pickup1",
            latitude: pickupLat,
            longitude: pickupLng,
            title: `Customer: ${customerName}`,
            type: "user" as const,
          },
        ]
      : []),
    {
      id: "station",
      latitude: disposalLat,
      longitude: disposalLng,
      title: activeOrder?.disposal_address || "Recycling Depot #2",
      type: "destination" as const,
    },
  ];

  const routePolyline = [
    driverCoords,
    { latitude: pickupLat, longitude: pickupLng },
    { latitude: disposalLat, longitude: disposalLng },
  ];

  const handleAcceptJob = async () => {
    if (!activeJob?.order_id) return;
    try {
      console.log("COLLECTOR: [ACCEPT PRESSED]", activeJob.order_id);
      await acceptJob(activeJob.order_id);
      await setOrderEnRoute(activeJob.order_id);
      console.log("COLLECTOR: [ACCEPT SUCCESS]", activeJob.order_id);
      setActiveJobState("navigating");

      const order = activeOrder ?? (await getOrderById(activeJob.order_id));
      if (order) {
        setActiveOrder(order);
        const watcher = await startActiveJobLocationTracking(order, () => handleArrivedAtCustomer());
        setLocationWatcher(watcher);
      }
    } catch (error: any) {
      showAlert({ type: "error", title: "Offer unavailable", message: error.message });
      return;
    }

    showAlert({
      type: "success",
      title: "Job Accepted & Navigation Active!",
      message: `Navigating to ${customerName} at ${pickupAddr}.`,
    });
  };

  const handleDeclineJob = async () => {
    if (activeJob) await declineOffer(activeJob.id, activeJob.order_id ?? undefined);
    setActiveJobState("idle");
    showAlert({
      type: "info",
      title: "Job Declined",
      message: "Searching for next nearby pickup offer...",
    });
  };

  const handleArrivedAtCustomer = async () => {
    if (!activeJob?.order_id) return;
    try {
      console.log("ARRIVAL: [ARRIVED EVENT RECEIVED]", activeJob.order_id);
      await setOrderLifecycle(activeJob.order_id, "arrived");
      setActiveJobState("payment_pending");
    } catch (error: any) {
      showAlert({ type: "error", title: "Could not mark arrival", message: error.message });
    }
  };

  const handleConfirmMoMoPayment = async () => {
    if (!activeJob?.order_id) return;
    try {
      if (!pickupStarted) {
        await setOrderLifecycle(activeJob.order_id, "pickup_in_progress");
        setPickupStarted(true);
        showAlert({ type: "success", title: "Pickup Started", message: "Customer has been notified in real time." });
        return;
      }
      await completeCollectorJob(activeJob.order_id);
      if (locationWatcher) {
        locationWatcher.remove();
        setLocationWatcher(null);
      }
      setActiveJobState("idle");
      setActiveJob(null);
      setActiveOrder(null);
      setPickupStarted(false);
      showAlert({
        type: "success",
        title: "Job Completed!",
        message: `GH₵ ${Number(activeJob?.fare || 38).toFixed(2)} payment confirmed. Wallet updated.`,
      });
    } catch (error: any) {
      showAlert({ type: "error", title: "Could not complete pickup", message: error.message });
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#0E1412" : "#F9F9FF" },
      ]}
    >
      {/* Ambient Eco Radial Background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg height="100%" width="100%">
          <Defs>
            <RadialGradient
              id="bgGlow1"
              cx="15%"
              cy="20%"
              rx="45%"
              ry="45%"
              fx="15%"
              fy="20%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop
                offset="0%"
                stopColor={isDarkMode ? "#6CF8BB" : "#B0F0D6"}
                stopOpacity={isDarkMode ? "0.08" : "0.35"}
              />
              <Stop
                offset="100%"
                stopColor={isDarkMode ? "#0E1412" : "#F9F9FF"}
                stopOpacity="0"
              />
            </RadialGradient>
            <RadialGradient
              id="bgGlow2"
              cx="85%"
              cy="65%"
              rx="50%"
              ry="50%"
              fx="85%"
              fy="65%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop
                offset="0%"
                stopColor={isDarkMode ? "#10B981" : "#4EDEA3"}
                stopOpacity={isDarkMode ? "0.06" : "0.22"}
              />
              <Stop
                offset="100%"
                stopColor={isDarkMode ? "#0E1412" : "#F9F9FF"}
                stopOpacity="0"
              />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#bgGlow1)" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#bgGlow2)" />
        </Svg>
      </View>

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <Modal visible={activeJobState === "offered" && !!activeJob} transparent animationType="slide" onRequestClose={handleDeclineJob}>
          <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)", padding: 18 }}>
            <View style={{ backgroundColor: isDarkMode ? "#141C18" : "#FFFFFF", borderRadius: 24, padding: 22, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 12 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Zap size={16} color={C.primary} />
                  <Text style={{ color: C.primary, fontFamily: "Poppins-Bold", fontSize: 13, letterSpacing: 0.5 }}>NEW PICKUP OFFER</Text>
                </View>
                <View style={{ backgroundColor: "rgba(239, 68, 68, 0.12)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Clock size={12} color="#EF4444" />
                  <Text style={{ color: "#EF4444", fontFamily: "Poppins-Bold", fontSize: 13 }}>{offerCountdown}s</Text>
                </View>
              </View>

              <Text style={{ color: C.text, fontFamily: "Poppins-Bold", fontSize: 20, marginTop: 10 }}>
                {activeJob?.waste_type.replace("_", " ").toUpperCase()} COLLECTION
              </Text>

              <View style={{ marginTop: 10, padding: 12, backgroundColor: isDarkMode ? "rgba(255,255,255,0.04)" : "#F8FAFC", borderRadius: 14, gap: 6 }}>
                <Text style={{ color: C.text, fontFamily: "Poppins-Medium", fontSize: 15 }}>
                  👤 {activeJob?.customer_name || activeOrder?.customer_name || "EcoLift Customer"}
                  {activeJob?.customer_phone ? ` · 📞 ${activeJob.customer_phone}` : ""}
                </Text>
                <Text style={{ color: C.greyText, fontSize: 13 }}>
                  📍 {activeJob?.pickup_address || "Pickup address shared after acceptance"}
                </Text>
                <Text style={{ color: C.greyText, fontSize: 13 }}>
                  📦 {activeJob?.bags_count || 1} bags / containers
                </Text>
              </View>

              <View style={{ marginTop: 12, padding: 12, backgroundColor: isDarkMode ? "rgba(108, 248, 187, 0.08)" : "#F0FDF4", borderRadius: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: C.greyText, fontSize: 14 }}>Driver Payout</Text>
                <Text style={{ color: isDarkMode ? "#6CF8BB" : "#006C49", fontFamily: "Poppins-Bold", fontSize: 19 }}>
                  GH₵ {Number(activeJob?.fare ?? 38).toFixed(2)}
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 12, marginTop: 18 }}>
                <TouchableOpacity
                  onPress={handleDeclineJob}
                  style={{ flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" }}
                >
                  <Text style={{ color: C.text, fontFamily: "Poppins-Medium", fontSize: 15 }}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAcceptJob}
                  style={{ flex: 1.6, padding: 14, borderRadius: 14, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" }}
                >
                  <Text style={{ color: "#FFFFFF", fontFamily: "Poppins-Bold", fontSize: 15 }}>Accept & Navigate</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.brandLeft}>
            <View
              style={[
                styles.brandLogoCircle,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(108, 248, 187, 0.15)"
                    : "rgba(0, 108, 73, 0.12)",
                },
              ]}
            >
              <Leaf size={20} color={isDarkMode ? "#6CF8BB" : "#006C49"} />
            </View>
            <View>
              <View style={styles.brandTitleRow}>
                <Text
                  style={[
                    styles.brandTitle,
                    { color: isDarkMode ? "#F9F9FF" : "#003527" },
                  ]}
                >
                  EcoLift
                </Text>
                <View
                  style={[
                    styles.collectorBadge,
                    {
                      backgroundColor: isDarkMode
                        ? "rgba(108, 248, 187, 0.2)"
                        : "#B0F0D6",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.collectorBadgeText,
                      { color: isDarkMode ? "#6CF8BB" : "#003527" },
                    ]}
                  >
                    DRIVER
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.brandSubtitle,
                  { color: isDarkMode ? "#8E9A94" : "#4A5568" },
                ]}
              >
                Collector Workspace
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.avatarContainer,
              {
                borderColor: isDarkMode
                  ? "rgba(108, 248, 187, 0.4)"
                  : "rgba(0, 108, 73, 0.3)",
              },
            ]}
            onPress={() => router.push("/(tabs-collector)/profile" as any)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: user?.avatar_url || COLLECTOR_AVATAR_URI }}
              style={styles.avatarImage}
            />
            <View
              style={[
                styles.avatarStatusBadge,
                { backgroundColor: isOnline ? "#10B981" : "#6B7C77" },
              ]}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Status Toggle Row */}
          <View
            style={[
              styles.statusRowCard,
              {
                backgroundColor: isDarkMode
                  ? "rgba(20, 28, 24, 0.75)"
                  : "rgba(255, 255, 255, 0.85)",
                borderColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 108, 73, 0.1)",
              },
            ]}
          >
            <View style={styles.onlineStatusRow}>
              {/* Animated Pulse Dot */}
              <View style={styles.pulseWrapper}>
                <Animated.View
                  style={[
                    styles.pulseRing,
                    {
                      backgroundColor: isOnline ? "#10B981" : "#6B7C77",
                      transform: [{ scale: pulseAnim }],
                      opacity: isOnline ? 0.35 : 0,
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

              <View>
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: isOnline
                        ? isDarkMode
                          ? "#6CF8BB"
                          : "#006C49"
                        : C.greyText,
                    },
                  ]}
                >
                  {isOnline ? "ONLINE FOR PICKUPS" : "OFFLINE"}
                </Text>
                <Text
                  style={[
                    styles.statusSubText,
                    { color: isDarkMode ? "#8E9A94" : "#718096" },
                  ]}
                >
                  {isOnline
                    ? "Broadcasting GPS to nearby clients"
                    : "Switch on to receive pickup requests"}
                </Text>
              </View>
            </View>

            {/* Toggle Switch */}
            <Switch
              trackColor={{
                false: isDarkMode ? "#2C3531" : "#E2ECE9",
                true: isDarkMode ? "#10B981" : "#006C49",
              }}
              thumbColor={isOnline ? "#B6FF3C" : "#F3F4F6"}
              onValueChange={async (online) => {
                setIsOnline(online);
                try { await setCollectorOnline(online); } catch (error: any) { setIsOnline(!online); showAlert({ type: "error", title: "Status not updated", message: error.message }); }
              }}
              value={isOnline}
            />
          </View>

          {/* Today's Driver Earnings Summary Card */}
          <View style={styles.earningsSection}>
            <View
              style={[
                styles.earningsCard,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(20, 28, 24, 0.85)"
                    : "rgba(255, 255, 255, 0.95)",
                  borderColor: isDarkMode
                    ? "rgba(108, 248, 187, 0.18)"
                    : "rgba(0, 108, 73, 0.12)",
                },
              ]}
            >
              {/* Top Accent Gradient Bar */}
              <LinearGradient
                colors={["#006C49", "#10B981", "#6CF8BB"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cardTopGradient}
              />

              <View style={styles.earningsHeaderRow}>
                <View>
                  <Text
                    style={[
                      styles.earningsLabel,
                      { color: isDarkMode ? "#8E9A94" : "#718096" },
                    ]}
                  >
                    Today&apos;s Earnings
                  </Text>
                  <Text
                    style={[
                      styles.earningsAmount,
                      { color: isDarkMode ? "#F9F9FF" : "#003527" },
                    ]}
                  >
                    {collectorEarningsToday > 0
                      ? `GH₵ ${collectorEarningsToday.toFixed(2)}`
                      : "GH₵ 345.50"}
                  </Text>
                </View>

                <View
                  style={[
                    styles.growthBadge,
                    {
                      backgroundColor: isDarkMode
                        ? "rgba(108, 248, 187, 0.15)"
                        : "rgba(16, 185, 129, 0.15)",
                    },
                  ]}
                >
                  <TrendingUp
                    size={14}
                    color={isDarkMode ? "#6CF8BB" : "#10B981"}
                  />
                  <Text
                    style={[
                      styles.growthText,
                      { color: isDarkMode ? "#6CF8BB" : "#10B981" },
                    ]}
                  >
                    +14%
                  </Text>
                </View>
              </View>

              {/* 3 Driver Stat Pills */}
              <View style={styles.driverStatsRow}>
                <View
                  style={[
                    styles.driverStatBox,
                    {
                      backgroundColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.04)"
                        : "#F4FAF7",
                      borderColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.06)"
                        : "rgba(0, 108, 73, 0.08)",
                    },
                  ]}
                >
                  <Truck size={16} color={isDarkMode ? "#6CF8BB" : "#006C49"} />
                  <Text
                    style={[
                      styles.statValue,
                      { color: isDarkMode ? "#F9F9FF" : "#003527" },
                    ]}
                  >
                    8 Jobs
                  </Text>
                  <Text
                    style={[
                      styles.statSub,
                      { color: isDarkMode ? "#8E9A94" : "#718096" },
                    ]}
                  >
                    Done
                  </Text>
                </View>

                <View
                  style={[
                    styles.driverStatBox,
                    {
                      backgroundColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.04)"
                        : "#F4FAF7",
                      borderColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.06)"
                        : "rgba(0, 108, 73, 0.08)",
                    },
                  ]}
                >
                  <Star size={16} color="#F59E0B" />
                  <Text
                    style={[
                      styles.statValue,
                      { color: isDarkMode ? "#F9F9FF" : "#003527" },
                    ]}
                  >
                    4.9 ⭐
                  </Text>
                  <Text
                    style={[
                      styles.statSub,
                      { color: isDarkMode ? "#8E9A94" : "#718096" },
                    ]}
                  >
                    Rating
                  </Text>
                </View>

                <View
                  style={[
                    styles.driverStatBox,
                    {
                      backgroundColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.04)"
                        : "#F4FAF7",
                      borderColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.06)"
                        : "rgba(0, 108, 73, 0.08)",
                    },
                  ]}
                >
                  <Zap size={16} color="#8B5CF6" />
                  <Text
                    style={[
                      styles.statValue,
                      { color: isDarkMode ? "#F9F9FF" : "#003527" },
                    ]}
                  >
                    24.5 km
                  </Text>
                  <Text
                    style={[
                      styles.statSub,
                      { color: isDarkMode ? "#8E9A94" : "#718096" },
                    ]}
                  >
                    Driven
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Active 400px Map Section */}
          <View style={styles.mapSection}>
            <View
              style={[
                styles.mapFrame,
                {
                  borderColor: isDarkMode
                    ? "rgba(108, 248, 187, 0.15)"
                    : "rgba(0, 108, 73, 0.12)",
                },
              ]}
            >
              <EcoliftMap
                markers={mapMarkers}
                routeCoordinates={routePolyline}
                style={styles.mapView}
              />

              {/* Floating Top Map Controls */}
              <View style={styles.mapTopControls}>
                <TouchableOpacity
                  style={[
                    styles.mapControlBtn,
                    {
                      backgroundColor: isDarkMode
                        ? "rgba(20, 28, 24, 0.88)"
                        : "rgba(255, 255, 255, 0.92)",
                      borderColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.12)"
                        : "rgba(0, 0, 0, 0.08)",
                    },
                  ]}
                  onPress={() => {
                    showAlert({
                      type: "info",
                      title: "Recenter Map",
                      message:
                        "Centered on your active collector location (Truck #4).",
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <Navigation
                    size={17}
                    color={isDarkMode ? "#6CF8BB" : "#006C49"}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.mapControlBtn,
                    {
                      backgroundColor: isDarkMode
                        ? "rgba(20, 28, 24, 0.88)"
                        : "rgba(255, 255, 255, 0.92)",
                      borderColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.12)"
                        : "rgba(0, 0, 0, 0.08)",
                    },
                  ]}
                  onPress={() => {
                    showAlert({
                      type: "info",
                      title: "Map Layer",
                      message:
                        "Switched to eco-routing high-contrast traffic view.",
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <Layers
                    size={17}
                    color={isDarkMode ? "#6CF8BB" : "#006C49"}
                  />
                </TouchableOpacity>
              </View>

              {/* Bottom Gradient Readability Overlay */}
              <LinearGradient
                colors={[
                  "transparent",
                  isDarkMode
                    ? "rgba(14, 20, 18, 0.85)"
                    : "rgba(249, 249, 255, 0.7)",
                ]}
                style={styles.mapBottomGradient}
                pointerEvents="none"
              />

              {/* Floating Job Offer / Status Overlay Card */}
              {activeJobState === "offered" && isOnline && (
                <View
                  style={[
                    styles.offerOverlayCard,
                    {
                      backgroundColor: isDarkMode
                        ? "rgba(20, 28, 24, 0.94)"
                        : "rgba(255, 255, 255, 0.96)",
                      borderColor: isDarkMode
                        ? "rgba(108, 248, 187, 0.3)"
                        : "rgba(0, 108, 73, 0.18)",
                    },
                  ]}
                >
                  <View style={styles.offerHeaderRow}>
                    <View
                      style={[
                        styles.offerBadgePill,
                        {
                          backgroundColor: isDarkMode
                            ? "rgba(108, 248, 187, 0.15)"
                            : "rgba(16, 185, 129, 0.15)",
                        },
                      ]}
                    >
                      <Zap
                        size={13}
                        color={isDarkMode ? "#6CF8BB" : "#10B981"}
                      />
                      <Text
                        style={[
                          styles.offerBadgeText,
                          { color: isDarkMode ? "#6CF8BB" : "#006C49" },
                        ]}
                      >
                        New Job Offer
                      </Text>
                    </View>

                    <View style={styles.timerPill}>
                      <Clock size={12} color="#EF4444" />
                      <Text style={styles.timerText}>{offerCountdown}s</Text>
                    </View>
                  </View>

                  <View style={styles.offerPayoutRow}>
                    <Text
                      style={[
                        styles.offerCustomer,
                        { color: isDarkMode ? "#F9F9FF" : "#003527" },
                      ]}
                    >
                      {customerName}
                    </Text>
                    <Text
                      style={[
                        styles.offerPrice,
                        { color: isDarkMode ? "#6CF8BB" : "#006C49" },
                      ]}
                    >
                      GH₵ {Number(activeJob?.fare || activeOrder?.price || 38).toFixed(2)}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.offerMetaText,
                      { color: isDarkMode ? "#8E9A94" : "#718096" },
                    ]}
                  >
                    {pickupAddr} · {activeJob?.waste_type || "Household"} ({activeJob?.bags_count || 1} bags)
                  </Text>

                  {/* Accept / Decline Buttons */}
                  <View style={styles.offerActionBtnsRow}>
                    <TouchableOpacity
                      style={[
                        styles.declineBtn,
                        {
                          borderColor: isDarkMode
                            ? "rgba(255, 255, 255, 0.15)"
                            : "#E2E8F0",
                          backgroundColor: isDarkMode
                            ? "rgba(255, 255, 255, 0.05)"
                            : "#F8FAFC",
                        },
                      ]}
                      onPress={handleDeclineJob}
                    >
                      <X size={16} color={isDarkMode ? "#F9F9FF" : "#4A5568"} />
                      <Text
                        style={[
                          styles.declineBtnText,
                          { color: isDarkMode ? "#F9F9FF" : "#4A5568" },
                        ]}
                      >
                        Decline
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.acceptBtn,
                        {
                          backgroundColor: isDarkMode ? "#6CF8BB" : "#006C49",
                        },
                      ]}
                      onPress={handleAcceptJob}
                      activeOpacity={0.88}
                    >
                      <CheckCircle
                        size={16}
                        color={isDarkMode ? "#003527" : "#FFFFFF"}
                      />
                      <Text
                        style={[
                          styles.acceptBtnText,
                          { color: isDarkMode ? "#003527" : "#FFFFFF" },
                        ]}
                      >
                        Accept & Navigate
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Navigating to Customer View */}
              {activeJobState === "navigating" && (
                <View
                  style={[
                    styles.offerOverlayCard,
                    {
                      backgroundColor: isDarkMode
                        ? "rgba(20, 28, 24, 0.94)"
                        : "rgba(255, 255, 255, 0.96)",
                      borderColor: isDarkMode
                        ? "rgba(59, 130, 246, 0.3)"
                        : "rgba(59, 130, 246, 0.2)",
                    },
                  ]}
                >
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
                        Navigation In Progress
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => router.push("/chat" as any)}
                      style={[
                        styles.callBtnSmall,
                        {
                          backgroundColor: isDarkMode
                            ? "rgba(108, 248, 187, 0.12)"
                            : "rgba(0, 108, 73, 0.1)",
                        },
                      ]}
                    >
                      <PhoneCall
                        size={15}
                        color={isDarkMode ? "#6CF8BB" : "#006C49"}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text
                    style={[
                      styles.offerCustomer,
                      { color: isDarkMode ? "#F9F9FF" : "#003527" },
                    ]}
                  >
                    {customerName} · {pickupAddr.split(",")[0]}
                  </Text>
                  <Text
                    style={[
                      styles.offerMetaText,
                      { color: isDarkMode ? "#8E9A94" : "#718096" },
                    ]}
                  >
                    {(distanceMeters(driverCoords.latitude, driverCoords.longitude, pickupLat, pickupLng) / 1000).toFixed(1)} km to pickup point · ETA {Math.max(1, Math.round((distanceMeters(driverCoords.latitude, driverCoords.longitude, pickupLat, pickupLng) / 1000) * 2.5))} mins
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.acceptBtn,
                      {
                        backgroundColor: isDarkMode ? "#6CF8BB" : "#006C49",
                        marginTop: 10,
                      },
                    ]}
                    onPress={handleArrivedAtCustomer}
                  >
                    <MapPin
                      size={16}
                      color={isDarkMode ? "#003527" : "#FFFFFF"}
                    />
                    <Text
                      style={[
                        styles.acceptBtnText,
                        { color: isDarkMode ? "#003527" : "#FFFFFF" },
                      ]}
                    >
                      Arrived at Customer
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Mobile Money Payment Confirmation View */}
              {activeJobState === "payment_pending" && (
                <View
                  style={[
                    styles.offerOverlayCard,
                    {
                      backgroundColor: isDarkMode
                        ? "rgba(20, 28, 24, 0.94)"
                        : "rgba(255, 255, 255, 0.96)",
                      borderColor: "#10B981",
                    },
                  ]}
                >
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
                        {pickupStarted ? "Complete pickup" : waitSeconds > 0 ? `Waiting period · ${Math.ceil(waitSeconds / 60)} min` : "Ready to start pickup"}
                      </Text>
                    </View>
                    <ShieldCheck size={18} color="#10B981" />
                  </View>

                  <Text
                    style={[
                      styles.offerCustomer,
                      { color: isDarkMode ? "#F9F9FF" : "#003527" },
                    ]}
                  >
                    {pickupStarted ? "Complete Pickup" : "Customer arrival confirmed"}
                  </Text>

                  <View
                    style={[
                      styles.momoPillBox,
                      {
                        backgroundColor: isDarkMode ? "#141C18" : "#F0FDF4",
                        borderColor: "#10B981",
                      },
                    ]}
                  >
                    <CheckCircle2 size={16} color="#10B981" />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.momoTitle,
                          { color: isDarkMode ? "#F9F9FF" : "#003527" },
                        ]}
                      >
                        {pickupStarted ? "Finish collection" : "Four-minute wait is server-timed"}
                      </Text>
                      <Text
                        style={[
                          styles.momoRef,
                          { color: isDarkMode ? "#8E9A94" : "#718096" },
                        ]}
                      >
                        {pickupStarted ? "Mark this pickup complete when waste is loaded." : waitSeconds > 0 ? `${waitSeconds}s remaining` : "Waiting period complete — you can start pickup."}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.acceptBtn,
                      {
                        backgroundColor: isDarkMode ? "#6CF8BB" : "#006C49",
                        marginTop: 10,
                      },
                    ]}
                    onPress={handleConfirmMoMoPayment}
                  >
                    <CheckCircle
                      size={16}
                      color={isDarkMode ? "#003527" : "#FFFFFF"}
                    />
                    <Text
                      style={[
                        styles.acceptBtnText,
                        { color: isDarkMode ? "#003527" : "#FFFFFF" },
                      ]}
                    >
                        {pickupStarted ? "Complete Pickup" : "Start Pickup"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Idle State Waiting Pill */}
              {activeJobState === "idle" && (
                <View
                  style={[
                    styles.idlePillBox,
                    {
                      backgroundColor: isDarkMode
                        ? "rgba(20, 28, 24, 0.92)"
                        : "rgba(255, 255, 255, 0.92)",
                      borderColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.12)"
                        : "rgba(0, 0, 0, 0.08)",
                    },
                  ]}
                >
                  <Radio size={14} color={isOnline ? "#10B981" : "#6B7C77"} />
                  <Text
                    style={[
                      styles.idlePillText,
                      { color: isDarkMode ? "#F9F9FF" : "#003527" },
                    ]}
                  >
                    {isOnline
                      ? "Listening for nearby pickups in Osu / Accra..."
                      : "Go online to start receiving jobs"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Quick Action Grid */}
          <View style={styles.quickGridSection}>
            <TouchableOpacity
              style={[
                styles.quickGridCard,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(20, 28, 24, 0.85)"
                    : "rgba(255, 255, 255, 0.95)",
                  borderColor: isDarkMode
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 108, 73, 0.1)",
                },
              ]}
              onPress={() => {
                showAlert({
                  type: "info",
                  title: "Map Navigation",
                  message:
                    "Map centered on current GPS route & nearest waste recycling points.",
                });
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.quickGridIconWrap,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(108, 248, 187, 0.12)"
                      : "rgba(0, 108, 73, 0.08)",
                  },
                ]}
              >
                <Navigation
                  size={20}
                  color={isDarkMode ? "#6CF8BB" : "#006C49"}
                />
              </View>
              <Text
                style={[
                  styles.quickGridTitle,
                  { color: isDarkMode ? "#F9F9FF" : "#003527" },
                ]}
              >
                Map Navigation
              </Text>
              <Text
                style={[
                  styles.quickGridSub,
                  { color: isDarkMode ? "#8E9A94" : "#718096" },
                ]}
              >
                Focus live location
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickGridCard,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(20, 28, 24, 0.85)"
                    : "rgba(255, 255, 255, 0.95)",
                  borderColor: isDarkMode
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 108, 73, 0.1)",
                },
              ]}
              onPress={() => router.push("/(tabs-collector)/earnings" as any)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.quickGridIconWrap,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(182, 255, 60, 0.15)"
                      : "rgba(16, 185, 129, 0.1)",
                  },
                ]}
              >
                <DollarSign
                  size={20}
                  color={isDarkMode ? "#B6FF3C" : "#10B981"}
                />
              </View>
              <Text
                style={[
                  styles.quickGridTitle,
                  { color: isDarkMode ? "#F9F9FF" : "#003527" },
                ]}
              >
                Earnings
              </Text>
              <Text
                style={[
                  styles.quickGridSub,
                  { color: isDarkMode ? "#8E9A94" : "#718096" },
                ]}
              >
                Payout history
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  brandHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 12 : 6,
    paddingBottom: 14,
  },
  brandLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandLogoCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandTitle: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    letterSpacing: -0.3,
  },
  collectorBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  collectorBadgeText: {
    fontSize: 10,
    fontFamily: "Poppins-Bold",
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    marginTop: -2,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    position: "relative",
    padding: 2,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  avatarStatusBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  statusRowCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  onlineStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  pulseWrapper: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  pulseRing: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  pulseCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 13,
    fontFamily: "Poppins-Bold",
    letterSpacing: 0.4,
  },
  statusSubText: {
    fontSize: 10,
    fontFamily: "Poppins-Medium",
    marginTop: 1,
  },
  earningsSection: {
    marginBottom: 14,
  },
  earningsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    paddingTop: 18,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTopGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  earningsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  earningsLabel: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
  },
  earningsAmount: {
    fontSize: 26,
    fontFamily: "Poppins-Bold",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  growthBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  growthText: {
    fontSize: 12,
    fontFamily: "Poppins-Bold",
  },
  driverStatsRow: {
    flexDirection: "row",
    gap: 8,
  },
  driverStatBox: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 13,
    fontFamily: "Poppins-Bold",
    marginTop: 3,
  },
  statSub: {
    fontSize: 10,
    fontFamily: "Poppins-Medium",
  },
  mapSection: {
    height: 400,
    marginBottom: 14,
  },
  mapFrame: {
    flex: 1,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    position: "relative",
  },
  mapView: {
    width: "100%",
    height: "100%",
  },
  mapTopControls: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    gap: 8,
    zIndex: 10,
  },
  mapControlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  mapBottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    zIndex: 1,
  },
  offerOverlayCard: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    zIndex: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  offerHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  offerBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  offerBadgeText: {
    fontSize: 11,
    fontFamily: "Poppins-Bold",
  },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 11,
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
    fontSize: 15,
    fontFamily: "Poppins-Bold",
  },
  offerPrice: {
    fontSize: 17,
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
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  declineBtnText: {
    fontSize: 13,
    fontFamily: "Poppins-Bold",
  },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptBtnText: {
    fontSize: 13,
    fontFamily: "Poppins-Bold",
  },
  callBtnSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
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
  idlePillBox: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    zIndex: 5,
  },
  idlePillText: {
    fontSize: 11,
    fontFamily: "Poppins-Medium",
  },
  quickGridSection: {
    flexDirection: "row",
    gap: 12,
  },
  quickGridCard: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  quickGridIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickGridTitle: {
    fontSize: 13,
    fontFamily: "Poppins-Bold",
  },
  quickGridSub: {
    fontSize: 10,
    fontFamily: "Poppins-Medium",
    marginTop: 1,
  },
});
