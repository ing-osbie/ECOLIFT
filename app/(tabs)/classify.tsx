import { CustomAlert, useCustomAlert } from "@/components/custom-alert";
import { getColors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/src/context/AuthContext";
import {
    ClassificationResult,
    classifyWasteImage,
    getGeminiApiKey,
    setGeminiApiKey,
} from "@/src/services/classification";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
    Bell,
    Camera,
    Check,
    CircleAlert,
    Focus,
    Image as ImageIcon,
    Leaf,
    Lightbulb,
    Recycle,
    RotateCcw,
    Scale,
    Sparkles,
    X,
    Zap,
    ZapOff,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Image,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ClassifyScreen() {
  const router = useRouter();
  const { isDarkMode, addEcoPoints } = useApp();
  const { user } = useAuth();
  const C = getColors(isDarkMode);
  const { showAlert, alertProps } = useCustomAlert();

  const [activeImageUri, setActiveImageUri] =
    useState<string>(DEFAULT_SAMPLE_IMAGE);
  const [isFlashOn, setIsFlashOn] = useState<boolean>(false);
  const [scanStatus, setScanStatus] = useState<
    | "idle"
    | "scanning"
    | "identifying"
    | "matched"
    | "uncertain"
    | "not_waste"
    | "offline"
    | "error"
  >("idle");
  const [currentResult, setCurrentResult] =
    useState<ClassificationResult | null>(null);
  const activeRequestIdRef = useRef<string>("");

  // Gemini API Key management modal
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [activeApiKey, setActiveApiKey] = useState<string>("");
  const [isKeySaving, setIsKeySaving] = useState<boolean>(false);

  // Animations
  const [scanLineAnim] = useState(() => new Animated.Value(0));
  const [boxOpacityAnim] = useState(() => new Animated.Value(1));
  const [resultCardAnim] = useState(() => new Animated.Value(1));

  // Load active Gemini key
  useEffect(() => {
    (async () => {
      const key = await getGeminiApiKey();
      setActiveApiKey(key);
      setApiKeyInput(key);
    })();
  }, []);

  // Save API key
  const handleSaveApiKey = async () => {
    try {
      setIsKeySaving(true);
      await setGeminiApiKey(apiKeyInput.trim());
      const updated = await getGeminiApiKey();
      setActiveApiKey(updated);
      setApiKeyModalVisible(false);
      showAlert({
        type: "success",
        title: "AI Key Configured",
        message: updated
          ? "Gemini 3.8 Flash Vision AI is active for high-precision detection."
          : "API key cleared. Configure Gemini before analyzing waste.",
      });
    } catch {
      showAlert({
        type: "error",
        title: "Save Failed",
        message: "Could not save API key to local storage.",
      });
    } finally {
      setIsKeySaving(false);
    }
  };

  /**
   * Starts precision classification pipeline on an image URI with request ID tracking
   */
  const performClassification = async (
    uri: string,
    rawBase64?: string | null,
    requestId?: string,
  ) => {
    const currentReqId =
      requestId ||
      `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    activeRequestIdRef.current = currentReqId;

    try {
      // 1. Clear previous result to prevent stale state (Requirement 3)
      setCurrentResult(null);
      setScanStatus("scanning");
      resultCardAnim.setValue(0);
      boxOpacityAnim.setValue(1);

      // Log immediately before classification (Requirement 1, 12)
      console.log(
        `[EcoLift Classification Start] ReqID=${currentReqId}, URI=${uri}`,
      );

      // Start scanning laser line animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 160,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1100,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Transition to identifying after initial scan
      const idTimer = setTimeout(() => {
        if (activeRequestIdRef.current === currentReqId) {
          setScanStatus("identifying");
        }
      }, 600);

      const startTime = Date.now();
      const result = await classifyWasteImage(uri, rawBase64 || undefined);
      clearTimeout(idTimer);

      // Race condition protection: discard if superseded (Requirement 3)
      if (activeRequestIdRef.current !== currentReqId) {
        console.log(
          `[EcoLift Classification] ReqID ${currentReqId} superseded by ${activeRequestIdRef.current}. Discarding stale result.`,
        );
        return;
      }

      // Guarantee minimum 600ms visual scanning feedback
      const elapsed = Date.now() - startTime;
      if (elapsed < 600) {
        await new Promise((resolve) => setTimeout(resolve, 600 - elapsed));
      }

      if (activeRequestIdRef.current !== currentReqId) return;

      setCurrentResult(result);

      if (result.errorCode === "MISSING_API_KEY") {
        setScanStatus("offline");
      } else if (result.errorCode || result.error) {
        setScanStatus("error");
      } else if (!result.isWaste || result.category === "non_waste") {
        setScanStatus("not_waste");
      } else if (
        result.confidenceLevel === "low" ||
        result.category === "unknown"
      ) {
        setScanStatus("uncertain");
      } else {
        setScanStatus("matched");
      }

      Animated.spring(resultCardAnim, {
        toValue: 1,
        tension: 55,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      if (__DEV__) console.warn("Classification pipeline error:", err);
      if (activeRequestIdRef.current === currentReqId) {
        setScanStatus("error");
      }
    }
  };

  const handlePickImage = async (fromCamera: boolean) => {
    try {
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

      // Capture full frame with base64 included for instant AI ingestion
      const picked = fromCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.85,
            allowsEditing: false, // Don't crop out labels or bottle necks
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.85,
            allowsEditing: false,
            base64: true,
          });

      if (!picked.canceled && picked.assets && picked.assets[0]) {
        const asset = picked.assets[0];
        const reqId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        activeRequestIdRef.current = reqId;

        // Log immediately after capture (Requirement 1, 12)
        console.log(
          `[EcoLift Camera Capture] URI=${asset.uri}, Width=${asset.width}, Height=${asset.height}, Base64Length=${asset.base64?.length || 0}`,
        );

        setActiveImageUri(asset.uri);
        await performClassification(asset.uri, asset.base64, reqId);
      }
    } catch (error) {
      if (__DEV__) console.warn("ImagePicker error:", error);
    }
  };

  const handleLogItem = () => {
    if (!currentResult) return;
    const pts = currentResult.ecoPoints || 25;
    addEcoPoints(pts);
    showAlert({
      type: "success",
      title: `Item Logged! +${pts} Eco-Points`,
      message: `${currentResult.name} was successfully added to your recycling ledger.`,
    });
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#0E1412" : "#F9F9FF" },
      ]}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Text
              style={[
                styles.brandTitle,
                { color: isDarkMode ? "#95D3BA" : "#003527" },
              ]}
            >
              EcoLift
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[
                styles.bellBtn,
                {
                  backgroundColor: isDarkMode ? "#1E2321" : "#FFFFFF",
                  borderColor: isDarkMode
                    ? "rgba(255,255,255,0.08)"
                    : "#E2E8F8",
                },
              ]}
              onPress={() => router.push("/notifications" as any)}
              activeOpacity={0.85}
            >
              <Bell size={18} color={isDarkMode ? "#95D3BA" : "#003527"} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/profile" as any)}
              style={styles.avatarBtn}
              activeOpacity={0.8}
            >
              <Text style={[styles.headerProfileText, { color: C.greyText }]}>
                Profile
              </Text>
              <Image
                source={{
                  uri:
                    user?.avatar_url ||
                    "https://lh3.googleusercontent.com/aida/AP1WRLvvebFOZ6ynMsVwLT_RhMB47PIf8hxioUnplUngiLRck_uwziGuo8q9YO5aj1foVEUmhejlyafL2z2OHqEPi7FC8azbJoc-ziJbt6qsF5SMnw3GGseHcRNMOLhOvVO7v71vEGCzSy99We7_7rFyQI5Xzz2j4GcrsBMMWBjTRHPbwqUwGF-tolAZtlI0fp2FGa_-ATEKQMsHpKcZA_Q1cKK8GQq6hUUor6q0TpvsuD-ZBS35WmtkQvEqKtrn1A2MHmfBS2lh9XHmQQ",
                }}
                style={styles.avatarImage}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Viewfinder Main View */}
        <View style={styles.viewfinderContainer}>
          {/* Background Camera / Captured Image */}
          <Image
            source={{ uri: activeImageUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />

          {/* Dark Vignette Overlay */}
          <View style={styles.vignetteOverlay} pointerEvents="none" />

          {/* Top Controls Overlay */}
          <View style={styles.topControlsRow}>
            {/* Status Pill */}
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(18, 23, 21, 0.9)"
                    : "rgba(255, 255, 255, 0.92)",
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
                          : scanStatus === "not_waste" || scanStatus === "error"
                            ? "#EF4444"
                            : scanStatus === "uncertain"
                              ? "#F59E0B"
                              : scanStatus === "offline"
                                ? "#6B7280"
                                : scanStatus === "matched"
                                  ? "#10B981"
                                  : "#10B981",
                  },
                ]}
              />
              <Text style={[styles.statusText, { color: C.text }]}>
                {scanStatus === "scanning"
                  ? "AI Scanning Frame..."
                  : scanStatus === "identifying"
                    ? "Analyzing your waste..."
                    : scanStatus === "not_waste"
                      ? "No Waste Detected"
                      : scanStatus === "uncertain"
                        ? "Low Confidence"
                        : scanStatus === "offline"
                          ? "AI Configuration Required"
                          : scanStatus === "error"
                            ? "AI Unavailable"
                            : scanStatus === "matched"
                              ? "Match Found"
                              : "Ready to Scan"}
              </Text>
            </View>

            {/* Top Right Action Buttons */}
            <View style={styles.topRightActions}>
              {/* AI Key & Settings Button */}
              <TouchableOpacity
                style={[
                  styles.iconCircleButton,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(18, 23, 21, 0.9)"
                      : "rgba(255, 255, 255, 0.92)",
                  },
                ]}
                onPress={() => setApiKeyModalVisible(true)}
                activeOpacity={0.8}
              >
                <Sparkles size={18} color={activeApiKey ? "#10B981" : C.text} />
                {Boolean(activeApiKey) && (
                  <View style={styles.activeKeyIndicatorDot} />
                )}
              </TouchableOpacity>

              {/* Flash Toggle */}
              <TouchableOpacity
                style={[
                  styles.iconCircleButton,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(18, 23, 21, 0.9)"
                      : "rgba(255, 255, 255, 0.92)",
                  },
                ]}
                onPress={() => setIsFlashOn(!isFlashOn)}
                activeOpacity={0.8}
              >
                {isFlashOn ? (
                  <Zap size={18} color="#F59E0B" />
                ) : (
                  <ZapOff size={18} color={C.text} />
                )}
              </TouchableOpacity>

              {/* Gallery Image Picker */}
              <TouchableOpacity
                style={[
                  styles.iconCircleButton,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(18, 23, 21, 0.9)"
                      : "rgba(255, 255, 255, 0.92)",
                  },
                ]}
                onPress={() => handlePickImage(false)}
                activeOpacity={0.8}
              >
                <ImageIcon size={18} color={C.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Center Reticle & Animated Bounding Box */}
          <View style={styles.centerReticleContainer} pointerEvents="none">
            {/* Center Focus Icon */}
            <Focus
              size={46}
              color="rgba(255, 255, 255, 0.4)"
              strokeWidth={1.5}
            />

            {/* Bounding Box with Corner Accents */}
            <Animated.View
              style={[
                styles.boundingBox,
                {
                  opacity: boxOpacityAnim,
                  borderColor:
                    scanStatus === "not_waste" ? "#F59E0B" : "#6CF8BB",
                },
              ]}
            >
              {/* Corner Brackets */}
              <View style={[styles.cornerBracket, styles.topLeftBracket]} />
              <View style={[styles.cornerBracket, styles.topRightBracket]} />
              <View style={[styles.cornerBracket, styles.bottomLeftBracket]} />
              <View style={[styles.cornerBracket, styles.bottomRightBracket]} />

              {/* Scanning Laser Line */}
              {(scanStatus === "scanning" || scanStatus === "identifying") && (
                <Animated.View
                  style={[
                    styles.scanLaserLine,
                    { transform: [{ translateY: scanLineAnim }] },
                  ]}
                />
              )}
            </Animated.View>
          </View>

          {/* Prominent Center Camera Shutter Trigger Button */}
          <View style={styles.shutterContainer}>
            <TouchableOpacity
              style={styles.shutterOuterRing}
              onPress={() => handlePickImage(true)}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.shutterInnerCircle,
                  {
                    backgroundColor:
                      scanStatus === "scanning" || scanStatus === "identifying"
                        ? "#F59E0B"
                        : "#006C49",
                  },
                ]}
              >
                {scanStatus === "scanning" || scanStatus === "identifying" ? (
                  <RotateCcw size={22} color="#FFFFFF" />
                ) : (
                  <Camera size={24} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Bottom Interactive Area */}
          <View style={styles.bottomOverlayArea}>
            {/* Slide-Up Result Card (Matched) */}
            {scanStatus === "matched" && currentResult && (
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
                {/* Header Row */}
                <View style={styles.resultHeaderRow}>
                  <View style={styles.resultTitleGroup}>
                    <Text style={[styles.resultTitle, { color: C.text }]}>
                      {currentResult.name}
                    </Text>
                    <Text
                      style={[styles.resultSubtitle, { color: C.greyText }]}
                    >
                      {currentResult.material}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.recycleBadgeCircle,
                      {
                        backgroundColor: currentResult.recyclable
                          ? "rgba(108, 248, 187, 0.25)"
                          : "rgba(239, 68, 68, 0.18)",
                      },
                    ]}
                  >
                    <Recycle
                      size={22}
                      color={currentResult.recyclable ? "#006C49" : "#DC2626"}
                    />
                  </View>
                </View>

                {currentResult.reason && (
                  <Text style={[styles.nonWasteNotice, { color: C.greyText }]}>
                    {currentResult.reason}
                  </Text>
                )}

                {/* Badges Row */}
                <View style={styles.badgesRow}>
                  <View
                    style={[
                      styles.binBadgePill,
                      { backgroundColor: currentResult.binColor || "#006C49" },
                    ]}
                  >
                    <Text style={styles.binBadgeText}>
                      {currentResult.binType}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadgePill,
                      {
                        backgroundColor: currentResult.recyclable
                          ? "rgba(16, 185, 129, 0.15)"
                          : "rgba(239, 68, 68, 0.15)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        {
                          color: currentResult.recyclable
                            ? "#10B981"
                            : "#EF4444",
                        },
                      ]}
                    >
                      {currentResult.category === "e_waste"
                        ? "E-Waste Depot"
                        : currentResult.recyclable
                          ? "100% Recyclable"
                          : "Non-Recyclable"}
                    </Text>
                  </View>
                </View>

                {/* Environmental Impact Row */}
                <View
                  style={[
                    styles.metricsRow,
                    {
                      backgroundColor: isDarkMode ? "#121715" : "#E2E8F8",
                    },
                  ]}
                >
                  <View style={styles.metricItem}>
                    <Scale size={13} color={C.greyText} />
                    <Text style={[styles.metricLabel, { color: C.greyText }]}>
                      ~{currentResult.estimatedWeightGrams}g
                    </Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <Leaf size={13} color="#10B981" />
                    <Text style={[styles.metricLabel, { color: C.text }]}>
                      Saves ~{currentResult.co2SavingsKg} kg CO2
                    </Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <Sparkles size={13} color="#F59E0B" />
                    <Text style={[styles.metricLabel, { color: C.text }]}>
                      +{currentResult.ecoPoints} pts
                    </Text>
                  </View>
                </View>

                {/* Disposal Guidance Box (Requirement 8, 14) */}
                {Boolean(currentResult.disposalRecommendation) && (
                  <View
                    style={[
                      styles.disposalBox,
                      { backgroundColor: isDarkMode ? "#121715" : "#E2E8F8" },
                    ]}
                  >
                    <Recycle
                      size={14}
                      color={isDarkMode ? "#95D3BA" : "#006C49"}
                      style={{ marginTop: 2 }}
                    />
                    <Text style={[styles.disposalText, { color: C.text }]}>
                      {currentResult.disposalRecommendation}
                    </Text>
                  </View>
                )}

                {/* Alternative Predictions (Requirement 6) */}
                {Array.isArray(currentResult.alternatives) &&
                  currentResult.alternatives.length > 0 && (
                    <View style={styles.alternativesBox}>
                      <Text
                        style={[
                          styles.alternativesTitle,
                          { color: C.greyText },
                        ]}
                      >
                        Alternatives:{" "}
                        <Text
                          style={{
                            color: C.text,
                            fontFamily: "Poppins-Regular",
                          }}
                        >
                          {currentResult.alternatives
                            .map((alt) => `${alt.label} (${alt.confidence}%)`)
                            .join(" • ")}
                        </Text>
                      </Text>
                    </View>
                  )}

                {/* Confidence Bar */}
                <View style={styles.confidenceBarTrack}>
                  <View
                    style={[
                      styles.confidenceBarFill,
                      {
                        width: `${currentResult.confidence}%`,
                        backgroundColor:
                          currentResult.confidenceLevel === "high"
                            ? "#006C49"
                            : "#D97706",
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.confidenceText, { color: C.greyText }]}>
                  {currentResult.confidence}% Match (
                  {currentResult.confidenceLevel.toUpperCase()} CONFIDENCE) •{" "}
                  {currentResult.aiModelUsed}
                </Text>

                {/* Preparation Tips */}
                <View style={styles.tipsList}>
                  {currentResult.tips.map((tip, idx) => (
                    <View key={idx} style={styles.tipRow}>
                      <View style={styles.tipCheckCircle}>
                        <Check size={10} color="#006C49" strokeWidth={3} />
                      </View>
                      <Text style={[styles.tipText, { color: C.text }]}>
                        {tip}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Action Buttons */}
                <View style={styles.resultActionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.primaryLogBtn,
                      { backgroundColor: "#003527" },
                    ]}
                    onPress={handleLogItem}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.primaryLogBtnText}>
                      Log Item (+{currentResult.ecoPoints} pts)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.outlineRescanBtn,
                      { borderColor: "#003527" },
                    ]}
                    onPress={() => handlePickImage(true)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.outlineRescanBtnText,
                        { color: isDarkMode ? "#95D3BA" : "#003527" },
                      ]}
                    >
                      Scan Another
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* Uncertain / Low Confidence Warning Card (Requirement 5, 16) */}
            {scanStatus === "uncertain" && currentResult && (
              <Animated.View
                style={[
                  styles.resultCard,
                  {
                    backgroundColor: isDarkMode ? "#1A211E" : "#F0F3FF",
                    borderColor: "#F59E0B",
                    opacity: resultCardAnim,
                  },
                ]}
              >
                <View style={styles.resultHeaderRow}>
                  <View style={styles.resultTitleGroup}>
                    <Text style={[styles.resultTitle, { color: C.text }]}>
                      {currentResult.name}
                    </Text>
                    <Text style={[styles.resultSubtitle, { color: "#F59E0B" }]}>
                      {currentResult.confidence > 0
                        ? `Low Confidence (${currentResult.confidence}%)`
                        : "Confidence Below Reliable Threshold (<75%)"}
                    </Text>
                  </View>
                  <CircleAlert size={28} color="#F59E0B" />
                </View>

                <Text style={[styles.nonWasteNotice, { color: C.greyText }]}>
                  {currentResult.disposalRecommendation ||
                    "The AI could not identify this item with sufficient confidence. Please retake the photo in brighter lighting or with a plain background."}
                </Text>

                <View style={styles.resultActionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.primaryLogBtn,
                      { backgroundColor: "#003527" },
                    ]}
                    onPress={() => handlePickImage(true)}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.primaryLogBtnText}>Retake Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.outlineRescanBtn,
                      { borderColor: "#003527" },
                    ]}
                    onPress={() => handlePickImage(false)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.outlineRescanBtnText,
                        { color: isDarkMode ? "#95D3BA" : "#003527" },
                      ]}
                    >
                      Choose from Photos
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* Online AI unavailable/configuration card */}
            {(scanStatus === "offline" || scanStatus === "error") &&
              currentResult && (
                <Animated.View
                  style={[
                    styles.resultCard,
                    {
                      backgroundColor: isDarkMode ? "#1A211E" : "#F0F3FF",
                      borderColor: "#6B7280",
                      opacity: resultCardAnim,
                    },
                  ]}
                >
                  <View style={styles.resultHeaderRow}>
                    <View style={styles.resultTitleGroup}>
                      <Text style={[styles.resultTitle, { color: C.text }]}>
                        {currentResult.errorCode === "MISSING_API_KEY"
                          ? "AI Configuration Required"
                          : currentResult.errorCode === "NO_INTERNET"
                            ? "Internet connection required"
                            : "AI identification unavailable"}
                      </Text>
                      <Text
                        style={[styles.resultSubtitle, { color: C.greyText }]}
                      >
                        {currentResult.errorCode === "MISSING_API_KEY"
                          ? "Configure Gemini to identify waste"
                          : "EcoLift AI identification requires an online Gemini connection"}
                      </Text>
                    </View>
                    <CircleAlert size={28} color="#6B7280" />
                  </View>

                  <Text style={[styles.nonWasteNotice, { color: C.greyText }]}>
                    {currentResult.errorCode === "MISSING_API_KEY"
                      ? "Connect EcoLift to a configured Gemini API key to identify waste."
                      : currentResult.errorCode === "NO_INTERNET"
                        ? "EcoLift's AI identification currently requires an internet connection."
                        : "Gemini could not complete the analysis. Please retry or retake the photo."}
                  </Text>

                  <View style={styles.resultActionsRow}>
                    <TouchableOpacity
                      style={[
                        styles.primaryLogBtn,
                        { backgroundColor: "#003527" },
                      ]}
                      onPress={() =>
                        currentResult.errorCode === "MISSING_API_KEY"
                          ? setApiKeyModalVisible(true)
                          : performClassification(activeImageUri)
                      }
                      activeOpacity={0.9}
                    >
                      <Text style={styles.primaryLogBtnText}>
                        {currentResult.errorCode === "MISSING_API_KEY"
                          ? "Configure AI"
                          : "Retry"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.outlineRescanBtn,
                        { borderColor: "#003527" },
                      ]}
                      onPress={() => handlePickImage(true)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.outlineRescanBtnText,
                          { color: isDarkMode ? "#95D3BA" : "#003527" },
                        ]}
                      >
                        Retake Photo
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}

            {/* Non-Waste Detected Warning Card */}
            {scanStatus === "not_waste" && currentResult && (
              <Animated.View
                style={[
                  styles.resultCard,
                  {
                    backgroundColor: isDarkMode ? "#1A211E" : "#F0F3FF",
                    borderColor: "#F59E0B",
                    opacity: resultCardAnim,
                  },
                ]}
              >
                <View style={styles.resultHeaderRow}>
                  <View style={styles.resultTitleGroup}>
                    <Text style={[styles.resultTitle, { color: C.text }]}>
                      No Waste Item Detected
                    </Text>
                    <Text style={[styles.resultSubtitle, { color: "#F59E0B" }]}>
                      Identified: {currentResult.name}
                    </Text>
                  </View>
                  <CircleAlert size={28} color="#F59E0B" />
                </View>

                <Text style={[styles.nonWasteNotice, { color: C.greyText }]}>
                  Please ensure the recyclable item, bottle, can, or container
                  is placed against a neutral background and centered inside the
                  reticle.
                </Text>

                <View style={styles.resultActionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.primaryLogBtn,
                      { backgroundColor: "#003527" },
                    ]}
                    onPress={() => handlePickImage(true)}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.primaryLogBtnText}>Retake Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.outlineRescanBtn,
                      { borderColor: "#003527" },
                    ]}
                    onPress={() => handlePickImage(false)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.outlineRescanBtnText,
                        { color: isDarkMode ? "#95D3BA" : "#003527" },
                      ]}
                    >
                      Choose from Photos
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* Idle Welcome State */}
            {scanStatus === "idle" && (
              <View
                style={[
                  styles.resultCard,
                  {
                    backgroundColor: isDarkMode ? "#1A211E" : "#F0F3FF",
                    borderColor: isDarkMode ? "#2B3530" : "#DCE2F3",
                  },
                ]}
              >
                <View style={styles.resultHeaderRow}>
                  <View style={styles.resultTitleGroup}>
                    <Text style={[styles.resultTitle, { color: C.text }]}>
                      Ready to Classify Waste
                    </Text>
                    <Text
                      style={[styles.resultSubtitle, { color: C.greyText }]}
                    >
                      Center any recyclable, e-waste, or material in frame
                    </Text>
                  </View>
                  <Focus size={24} color="#006C49" />
                </View>

                <View style={styles.resultActionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.primaryLogBtn,
                      { backgroundColor: "#003527" },
                    ]}
                    onPress={() => handlePickImage(true)}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.primaryLogBtnText}>Take Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.outlineRescanBtn,
                      { borderColor: "#003527" },
                    ]}
                    onPress={() => handlePickImage(false)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.outlineRescanBtnText,
                        { color: isDarkMode ? "#95D3BA" : "#003527" },
                      ]}
                    >
                      Choose from Photos
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
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
                      const reqId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
                      activeRequestIdRef.current = reqId;
                      setActiveImageUri(item.image);
                      performClassification(item.image, null, reqId);
                    }}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: item.image }}
                      style={styles.thumbImage}
                    />
                    <View style={styles.thumbCheckDot}>
                      <Check size={9} color="#006C49" strokeWidth={3} />
                    </View>
                  </TouchableOpacity>
                ))}

                {/* Quick Camera Trigger Button */}
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
                  <Camera
                    size={18}
                    color={isDarkMode ? "#95D3BA" : "#003527"}
                  />
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
                <Text
                  style={[
                    styles.tipsPillText,
                    { color: isDarkMode ? "#95D3BA" : "#003527" },
                  ]}
                >
                  Tips
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* AI Key Configuration Modal */}
        <Modal
          visible={apiKeyModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setApiKeyModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalCard,
                { backgroundColor: isDarkMode ? "#1B221F" : "#FFFFFF" },
              ]}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <Sparkles size={20} color="#10B981" />
                  <Text style={[styles.modalTitle, { color: C.text }]}>
                    AI Vision Settings
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setApiKeyModalVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <X size={20} color={C.greyText} />
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.modalEngineStatusBox,
                  {
                    backgroundColor: activeApiKey
                      ? "rgba(16, 185, 129, 0.12)"
                      : "rgba(245, 158, 11, 0.12)",
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: activeApiKey ? "#10B981" : "#F59E0B" },
                  ]}
                />
                <Text
                  style={[
                    styles.engineStatusText,
                    { color: activeApiKey ? "#10B981" : "#D97706" },
                  ]}
                >
                  {activeApiKey
                    ? "Connected: Gemini 3.8 Flash Vision"
                    : "Running: Offline Heuristics Engine"}
                </Text>
              </View>

              <Text style={[styles.modalDescription, { color: C.greyText }]}>
                To enable 99.8% precision material detection, enter your free
                Google Gemini API Key from Google AI Studio
                (aistudio.google.com).
              </Text>

              <TextInput
                style={[
                  styles.apiKeyTextInput,
                  {
                    color: C.text,
                    borderColor: isDarkMode ? "#34423C" : "#DCE2F3",
                    backgroundColor: isDarkMode ? "#121715" : "#F9F9FF",
                  },
                ]}
                placeholder="AIzaSy..."
                placeholderTextColor={C.greyText}
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={false}
              />

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={[styles.saveKeyBtn, { backgroundColor: "#003527" }]}
                  onPress={handleSaveApiKey}
                  disabled={isKeySaving}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveKeyBtnText}>
                    {isKeySaving ? "Saving..." : "Save Key"}
                  </Text>
                </TouchableOpacity>

                {Boolean(activeApiKey) && (
                  <TouchableOpacity
                    style={styles.clearKeyBtn}
                    onPress={() => {
                      setApiKeyInput("");
                      handleSaveApiKey();
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.clearKeyBtnText}>Clear Key</Text>
                  </TouchableOpacity>
                )}
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
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
    ...StyleSheet.absoluteFill,
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
    position: "relative",
  },
  activeKeyIndicatorDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#10B981",
  },
  centerReticleContainer: {
    ...StyleSheet.absoluteFill,
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
    alignItems: "center",
  },
  cornerBracket: {
    position: "absolute",
    width: 14,
    height: 14,
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
    height: 2.5,
    backgroundColor: "#6CF8BB",
    shadowColor: "#6CF8BB",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  shutterContainer: {
    position: "absolute",
    bottom: 120,
    alignSelf: "center",
    zIndex: 12,
  },
  shutterOuterRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  shutterInnerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
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
    marginBottom: 6,
  },
  resultTitleGroup: {
    flex: 1,
    paddingRight: 8,
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
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  binBadgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  binBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Poppins-Bold",
  },
  statusBadgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: "Poppins-Bold",
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 10,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metricDivider: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(150, 150, 150, 0.25)",
  },
  metricLabel: {
    fontSize: 11,
    fontFamily: "Poppins-SemiBold",
  },
  disposalBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    marginBottom: 10,
  },
  disposalText: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Poppins-Medium",
    lineHeight: 16,
  },
  alternativesBox: {
    paddingHorizontal: 2,
    marginBottom: 8,
  },
  alternativesTitle: {
    fontSize: 11,
    fontFamily: "Poppins-SemiBold",
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
    marginBottom: 10,
  },
  tipsList: {
    gap: 6,
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  tipCheckCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  tipText: {
    fontSize: 11,
    fontFamily: "Poppins-Regular",
    flex: 1,
    lineHeight: 16,
  },
  nonWasteNotice: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    lineHeight: 18,
    marginBottom: 14,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 22,
    padding: 22,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: "Poppins-Bold",
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalEngineStatusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  engineStatusText: {
    fontSize: 12,
    fontFamily: "Poppins-Bold",
  },
  modalDescription: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    lineHeight: 18,
    marginBottom: 14,
  },
  apiKeyTextInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    marginBottom: 16,
  },
  modalActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  saveKeyBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveKeyBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Poppins-Bold",
  },
  clearKeyBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  clearKeyBtnText: {
    color: "#EF4444",
    fontSize: 12,
    fontFamily: "Poppins-Bold",
  },
});
