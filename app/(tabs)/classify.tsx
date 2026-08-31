import { CustomAlert, useCustomAlert } from "@/components/custom-alert";
import { GlassCard } from "@/components/glass-card";
import { GradientBackground } from "@/components/gradient-background";
import { Colors, getColors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Focus,
  History,
  Image as ImageIcon,
  Lightbulb,
  Recycle,
  RotateCcw,
  Sparkles,
  Zap,
  ZapOff,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ClassificationItem {
  name: string;
  category: string;
  binType: string;
  binColor: string;
  confidence: number;
  recyclable: boolean;
  tips: string[];
}

const DEFAULT_SAMPLE_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBl_Oit2XmgYy5LVWz4DdRu8kGddpmPr2JRWVNcsx39oC-WIXl4n2jA3paKJMwWqJWuy4birgLzsraIAAT1kUl327g3i_4SQsUr7GKgHEDfO6WHR-eKTDYwYCRnHX6zlfQ2EKm7wALV6rH_3dMNHJrFR6xQc57JAeTaYEaQ6iCaY5S1fz4cRL5oh0zkQ3yT_mZcVvJ9Jp0x7OvlIK_5BXFHYs-Knw7QmjX4puHrhLTT16Dk9554BOPr";

const SCAN_HISTORY = [
  {
    id: "h1",
    name: "Cardboard Packaging",
    bin: "Blue Bin",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDqwdaDcOxP0WK6k_JvCKOo1WZ0Z3jmZIFiy_5gnsTdkqrYpuoZ169faGah74H7pzgt37QEn_WUJ3_ImG4JBclSHqkPZAS4_msbO2DwAd0a5IC3jz6llwwjL7vK6QQ9X8QjyIXm7RQdschOgcSeoBbuKpiZ_yosUgZKI1lsq2zR--PRzgJQ7cBNQP7Q7bH54a5Cm606DTTQNHABm0s_xg4S0Ixx4-7kuMNXW9WpCZKoqxPs5VJ4xTfF",
  },
  {
    id: "h2",
    name: "Glass Jar with Metal Lid",
    bin: "Green Bin",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD375TRF74UGpO2Ktq02smHwCu00G7PmHOKupcr3fjc75zVBkPk-B4pGn2JWdHvs5vmAzdsgzoMfE5IRk4LYxAmbPlkp3CgzE9F9hYUuz6cXNiY4h7e6RzqRf0nmDp9Zogdzf3sewgFBXkDM-Hh-FWdSl6B9OT5IzEbQl5YA2A4S32qEOMvVnFnkiq-OcZYldlCvCWzgF50Cd3bty_Jp8d3f_PmzTGqIiF_bMJE-6rxdPWqYMwRtbDL",
  },
];

const MOCK_RESULTS: ClassificationItem[] = [
  {
    name: "PET Plastic Bottle",
    category: "Plastic",
    binType: "Recyclable (Blue Bin)",
    binColor: "#3B82F6",
    confidence: 92,
    recyclable: true,
    tips: [
      "Rinse out liquids before binning",
      "Crush bottle flat to save 50% bin space",
      "Keep bottle cap on for sorting machines",
    ],
  },
  {
    name: "Aluminium Drink Can",
    category: "Metal",
    binType: "Recyclable (Yellow Bin)",
    binColor: "#F59E0B",
    confidence: 95,
    recyclable: true,
    tips: [
      "100% endlessly recyclable",
      "Rinse food or soda residue",
      "Tab does not need to be removed",
    ],
  },
  {
    name: "Organic Banana Peel",
    category: "Compost",
    binType: "Organic (Brown Bin)",
    binColor: "#10B981",
    confidence: 98,
    recyclable: false,
    tips: [
      "Great for household garden compost",
      "Breaks down in 2–4 weeks into nutrient soil",
      "Do not mix with plastic wrappers",
    ],
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ClassifyScreen() {
  const router = useRouter();
  const { isDarkMode } = useApp();
  const C = getColors(isDarkMode);
  const { showAlert, alertProps } = useCustomAlert();

  const [activeImageUri, setActiveImageUri] = useState<string>(DEFAULT_SAMPLE_IMAGE);
  const [isFlashOn, setIsFlashOn] = useState<boolean>(false);
  const [scanStatus, setScanStatus] = useState<"scanning" | "identifying" | "matched">("matched");
  const [currentResult, setCurrentResult] = useState<ClassificationItem>(MOCK_RESULTS[0]);

  // Animations
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const boxOpacityAnim = useRef(new Animated.Value(1)).current;
  const resultCardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startScanningAnimation();
  }, []);

  const startScanningAnimation = () => {
    setScanStatus("scanning");
    resultCardAnim.setValue(0);
    boxOpacityAnim.setValue(1);

    // Loop scan line
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 160,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Progression of state
    setTimeout(() => {
      setScanStatus("identifying");
    }, 1200);

    setTimeout(() => {
      setScanStatus("matched");
      Animated.spring(resultCardAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 2400);
  };

  const handlePickImage = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      showAlert({
        type: "error",
        title: "Permission Required",
        message: fromCamera
          ? "Camera permission is required to scan items."
          : "Media library permission is required to pick an image.",
      });
      return;
    }

    const picked = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.8,
          allowsEditing: true,
          aspect: [4, 3],
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.8,
          allowsEditing: true,
          aspect: [4, 3],
        });

    if (!picked.canceled && picked.assets[0]) {
      setActiveImageUri(picked.assets[0].uri);
      const randomResult =
        MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)];
      setCurrentResult(randomResult);
      startScanningAnimation();
    }
  };

  const handleLogItem = () => {
    showAlert({
      type: "success",
      title: "Item Logged! +25 Eco-Points",
      message: `${currentResult.name} was added to your recycling log.`,
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
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile" as any)}
            style={styles.avatarBtn}
            activeOpacity={0.8}
          >
            <Text style={[styles.headerProfileText, { color: C.greyText }]}>Profile</Text>
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida/AP1WRLvvebFOZ6ynMsVwLT_RhMB47PIf8hxioUnplUngiLRck_uwziGuo8q9YO5aj1foVEUmhejlyafL2z2OHqEPi7FC8azbJoc-ziJbt6qsF5SMnw3GGseHcRNMOLhOvVO7v71vEGCzSy99We7_7rFyQI5Xzz2j4GcrsBMMWBjTRHPbwqUwGF-tolAZtlI0fp2FGa_-ATEKQMsHpKcZA_Q1cKK8GQq6hUUor6q0TpvsuD-ZBS35WmtkQvEqKtrn1A2MHmfBS2lh9XHmQQ",
              }}
              style={styles.avatarImage}
            />
          </TouchableOpacity>
        </View>

        {/* Viewfinder Main View */}
        <View style={styles.viewfinderContainer}>
          {/* Background Camera / Captured Image */}
          <Image
            source={{ uri: activeImageUri }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />

          {/* Dark Vignette Overlay */}
          <View style={styles.vignetteOverlay} pointerEvents="none" />

          {/* Top Controls Overlay */}
          <View style={styles.topControlsRow}>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(18, 23, 21, 0.88)"
                    : "rgba(255, 255, 255, 0.9)",
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      scanStatus === "scanning"
                        ? "#006C49"
                        : scanStatus === "identifying"
                        ? "#F59E0B"
                        : "#10B981",
                  },
                ]}
              />
              <Text style={[styles.statusText, { color: C.text }]}>
                {scanStatus === "scanning"
                  ? "AI Scanning..."
                  : scanStatus === "identifying"
                  ? "Identifying..."
                  : "Match Found"}
              </Text>
            </View>

            <View style={styles.topRightActions}>
              <TouchableOpacity
                style={[
                  styles.iconCircleButton,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(18, 23, 21, 0.88)"
                      : "rgba(255, 255, 255, 0.9)",
                  },
                ]}
                onPress={() => setIsFlashOn(!isFlashOn)}
              >
                {isFlashOn ? (
                  <Zap size={18} color="#F59E0B" />
                ) : (
                  <ZapOff size={18} color={C.text} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.iconCircleButton,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(18, 23, 21, 0.88)"
                      : "rgba(255, 255, 255, 0.9)",
                  },
                ]}
                onPress={() => handlePickImage(false)}
              >
                <ImageIcon size={18} color={C.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Center Reticle & Animated Bounding Box */}
          <View style={styles.centerReticleContainer} pointerEvents="none">
            {/* Center Focus Icon */}
            <Focus size={46} color="rgba(255, 255, 255, 0.4)" strokeWidth={1.5} />

            {/* Bounding Box with Corner Accents */}
            <Animated.View
              style={[
                styles.boundingBox,
                {
                  opacity: boxOpacityAnim,
                  borderColor: "#6CF8BB",
                },
              ]}
            >
              {/* Top Left Corner */}
              <View style={[styles.cornerBracket, styles.topLeftBracket]} />
              {/* Top Right Corner */}
              <View style={[styles.cornerBracket, styles.topRightBracket]} />
              {/* Bottom Left Corner */}
              <View style={[styles.cornerBracket, styles.bottomLeftBracket]} />
              {/* Bottom Right Corner */}
              <View style={[styles.cornerBracket, styles.bottomRightBracket]} />

              {/* Scanning Laser Line */}
              {scanStatus !== "matched" && (
                <Animated.View
                  style={[
                    styles.scanLaserLine,
                    { transform: [{ translateY: scanLineAnim }] },
                  ]}
                />
              )}
            </Animated.View>
          </View>

          {/* Bottom Interactive Area */}
          <View style={styles.bottomOverlayArea}>
            {/* Slide-Up Result Card */}
            {scanStatus === "matched" && (
              <Animated.View
                style={[
                  styles.resultCard,
                  {
                    backgroundColor: isDarkMode ? "#1A211E" : "#F0F3FF",
                    borderColor: isDarkMode ? "#2B3530" : "#DCE2F3",
                    opacity: resultCardAnim,
                    transform: [
                      {
                        translateY: resultCardAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [60, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.resultHeaderRow}>
                  <View style={styles.resultTitleGroup}>
                    <Text style={[styles.resultTitle, { color: C.text }]}>
                      {currentResult.name}
                    </Text>
                    <Text style={[styles.resultSubtitle, { color: C.greyText }]}>
                      {currentResult.binType}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.recycleBadgeCircle,
                      { backgroundColor: "rgba(108, 248, 187, 0.25)" },
                    ]}
                  >
                    <Recycle size={22} color="#006C49" />
                  </View>
                </View>

                {/* Confidence Bar */}
                <View style={styles.confidenceBarTrack}>
                  <View
                    style={[
                      styles.confidenceBarFill,
                      { width: `${currentResult.confidence}%` },
                    ]}
                  />
                </View>
                <Text style={[styles.confidenceText, { color: C.greyText }]}>
                  {currentResult.confidence}% Confidence Match
                </Text>

                {/* Action Buttons */}
                <View style={styles.resultActionsRow}>
                  <TouchableOpacity
                    style={[styles.primaryLogBtn, { backgroundColor: "#003527" }]}
                    onPress={handleLogItem}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.primaryLogBtnText}>Log Item</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.outlineRescanBtn, { borderColor: "#003527" }]}
                    onPress={() => startScanningAnimation()}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.outlineRescanBtnText, { color: isDarkMode ? "#95D3BA" : "#003527" }]}>
                      Rescan
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* Quick Actions & History Thumbnails Bar */}
            <View style={styles.quickBarRow}>
              {/* Scan History Thumbnails */}
              <View style={styles.historyThumbnailsRow}>
                {SCAN_HISTORY.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.historyThumbWrapper}
                    onPress={() => {
                      setActiveImageUri(item.image);
                      startScanningAnimation();
                    }}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: item.image }} style={styles.thumbImage} />
                    <View style={styles.thumbCheckDot}>
                      <Check size={9} color="#006C49" strokeWidth={3} />
                    </View>
                  </TouchableOpacity>
                ))}

                {/* Camera Trigger Button */}
                <TouchableOpacity
                  style={[
                    styles.historyThumbWrapper,
                    {
                      backgroundColor: isDarkMode ? "#252E2B" : "#E2E8F8",
                      borderStyle: "dashed",
                      borderWidth: 1.5,
                      borderColor: "#006C49",
                    },
                  ]}
                  onPress={() => handlePickImage(true)}
                  activeOpacity={0.8}
                >
                  <Camera size={18} color={isDarkMode ? "#95D3BA" : "#003527"} />
                </TouchableOpacity>
              </View>

              {/* Tips Button */}
              <TouchableOpacity
                style={[
                  styles.tipsPillButton,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(18, 23, 21, 0.9)"
                      : "rgba(255, 255, 255, 0.92)",
                  },
                ]}
                onPress={() => router.push("/(tabs)/learn" as any)}
                activeOpacity={0.8}
              >
                <Lightbulb size={16} color="#006C49" />
                <Text style={[styles.tipsPillText, { color: isDarkMode ? "#95D3BA" : "#003527" }]}>
                  Tips
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  },
  brandTitle: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    letterSpacing: -0.5,
  },
  avatarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerProfileText: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#95D3BA",
  },
  viewfinderContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 90,
    borderRadius: 26,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#000000",
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  topControlsRow: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Poppins-SemiBold",
  },
  topRightActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconCircleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  centerReticleContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  boundingBox: {
    position: "absolute",
    width: SCREEN_WIDTH * 0.58,
    height: 190,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#6CF8BB",
    alignItems: "center",
  },
  cornerBracket: {
    position: "absolute",
    width: 12,
    height: 12,
    borderColor: "#6CF8BB",
  },
  topLeftBracket: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRightBracket: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeftBracket: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRightBracket: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanLaserLine: {
    width: "90%",
    height: 2,
    backgroundColor: "#6CF8BB",
    shadowColor: "#6CF8BB",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  bottomOverlayArea: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
    gap: 12,
    zIndex: 10,
  },
  resultCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  resultHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  resultTitleGroup: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
  },
  resultSubtitle: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    marginTop: 2,
  },
  recycleBadgeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  confidenceBarTrack: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    backgroundColor: "#DCE2F3",
    overflow: "hidden",
    marginBottom: 4,
  },
  confidenceBarFill: {
    height: "100%",
    backgroundColor: "#006C49",
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 11,
    fontFamily: "Poppins-Medium",
    marginBottom: 12,
  },
  resultActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryLogBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryLogBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Poppins-Bold",
  },
  outlineRescanBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineRescanBtnText: {
    fontSize: 12,
    fontFamily: "Poppins-Bold",
  },
  quickBarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyThumbnailsRow: {
    flexDirection: "row",
    gap: 8,
  },
  historyThumbWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbCheckDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#6CF8BB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  tipsPillButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  tipsPillText: {
    fontSize: 12,
    fontFamily: "Poppins-Bold",
  },
});
