import { CustomAlert, useCustomAlert } from "@/components/custom-alert";
import { GlassCard } from "@/components/glass-card";
import { GradientBackground } from "@/components/gradient-background";
import { Colors, getColors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import * as ImagePicker from "expo-image-picker";
import {
  AlertCircle,
  BookOpen,
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  Leaf,
  RefreshCw,
  Zap,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ClassificationResult {
  category: string;
  confidence: number;
  color: string;
  icon: string;
  recyclable: boolean;
  tips: string[];
  binColor: string;
}

const WASTE_CATEGORIES: ClassificationResult[] = [
  {
    category: "Plastic",
    confidence: 94,
    color: "#3B82F6",
    icon: "🧴",
    recyclable: true,
    binColor: "Yellow Bin",
    tips: [
      "Rinse containers before recycling",
      "Check the recycling number (1–7) on the bottom",
      "Remove caps and lids separately",
      "Avoid single-use plastics where possible",
    ],
  },
  {
    category: "Glass",
    confidence: 91,
    color: "#8B5CF6",
    icon: "🍶",
    recyclable: true,
    binColor: "Green Bin",
    tips: [
      "Rinse glass bottles and jars thoroughly",
      "Remove metal lids before recycling",
      "Do not mix with ceramics or mirrors",
      "Broken glass should be wrapped safely",
    ],
  },
  {
    category: "Metal",
    confidence: 88,
    color: "#F59E0B",
    icon: "🥫",
    recyclable: true,
    binColor: "Yellow Bin",
    tips: [
      "Rinse cans to remove food residue",
      "Aluminium and steel cans are both recyclable",
      "Crush cans to save space",
      "Scrap metal can be taken to metal dealers",
    ],
  },
  {
    category: "Paper",
    confidence: 96,
    color: "#10B981",
    icon: "📄",
    recyclable: true,
    binColor: "Blue Bin",
    tips: [
      "Keep paper dry — wet paper cannot be recycled",
      "Remove staples and plastic windows from envelopes",
      "Cardboard boxes should be flattened",
      "Shredded paper can be composted",
    ],
  },
  {
    category: "Organic Waste",
    confidence: 89,
    color: "#84CC16",
    icon: "🍌",
    recyclable: false,
    binColor: "Brown / Compost Bin",
    tips: [
      "Compost food scraps to create natural fertiliser",
      "Avoid composting meat or dairy products",
      "Use organic waste for home garden compost",
      "Many councils offer organic waste collection",
    ],
  },
  {
    category: "Electronic Waste",
    confidence: 92,
    color: "#EF4444",
    icon: "📱",
    recyclable: true,
    binColor: "E-Waste Drop Point",
    tips: [
      "Never dispose of e-waste in regular bins",
      "Take to certified e-waste collection centres",
      "Remove personal data before disposal",
      "Batteries must be disposed of separately",
    ],
  },
];

export default function ClassifyScreen() {
  const { isDarkMode } = useApp();
  const C = getColors(isDarkMode);
  const { showAlert, alertProps } = useCustomAlert();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);

  const pickImage = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      showAlert({
        type: "error",
        title: "Permission Required",
        message: fromCamera
          ? "Camera access is needed to capture waste images."
          : "Photo library access is needed to select images.",
      });
      return;
    }

    const picked = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
        });

    if (!picked.canceled && picked.assets[0]) {
      setImageUri(picked.assets[0].uri);
      setResult(null);
      analyseImage();
    }
  };

  const analyseImage = () => {
    setIsAnalysing(true);
    // Simulate AI classification with a random result from the categories
    setTimeout(() => {
      const random =
        WASTE_CATEGORIES[Math.floor(Math.random() * WASTE_CATEGORIES.length)];
      setResult(random);
      setIsAnalysing(false);
    }, 2200);
  };

  const reset = () => {
    setImageUri(null);
    setResult(null);
    setIsAnalysing(false);
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: C.text }]}>
                AI Waste Classifier
              </Text>
              <Text style={[styles.subtitle, { color: C.greyText }]}>
                Snap or upload a waste image to classify it
              </Text>
            </View>
            <View
              style={[
                styles.aiBadge,
                { backgroundColor: isDarkMode ? "#1E2321" : "#EFF9E8" },
              ]}
            >
              <Zap size={14} color={isDarkMode ? Colors.accent : Colors.primary} />
              <Text
                style={[
                  styles.aiBadgeText,
                  { color: isDarkMode ? Colors.accent : Colors.primary },
                ]}
              >
                AI
              </Text>
            </View>
          </View>

          {/* Image Preview / Upload Zone */}
          {!imageUri ? (
            <GlassCard style={styles.uploadZone}>
              <View style={styles.uploadIconRing}>
                <ImageIcon size={36} color={C.greyText} />
              </View>
              <Text style={[styles.uploadTitle, { color: C.text }]}>
                Upload or Capture Waste Image
              </Text>
              <Text style={[styles.uploadSub, { color: C.greyText }]}>
                Supports plastic, glass, metal, paper, organic & e-waste
              </Text>

              <View style={styles.uploadBtnsRow}>
                <TouchableOpacity
                  style={[
                    styles.uploadBtn,
                    {
                      backgroundColor: isDarkMode
                        ? Colors.accent
                        : Colors.primary,
                    },
                  ]}
                  onPress={() => pickImage(true)}
                  activeOpacity={0.9}
                >
                  <Camera
                    size={18}
                    color={isDarkMode ? "#000000" : "#FFFFFF"}
                  />
                  <Text
                    style={[
                      styles.uploadBtnText,
                      { color: isDarkMode ? "#000000" : "#FFFFFF" },
                    ]}
                  >
                    Camera
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.uploadBtnOutline,
                    { borderColor: C.border, backgroundColor: C.card },
                  ]}
                  onPress={() => pickImage(false)}
                  activeOpacity={0.9}
                >
                  <ImageIcon size={18} color={C.primary} />
                  <Text style={[styles.uploadBtnOutlineText, { color: C.text }]}>
                    Gallery
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          ) : (
            <GlassCard style={styles.previewCard}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              {isAnalysing && (
                <View style={styles.analysingOverlay}>
                  <ActivityIndicator size="large" color={Colors.accent} />
                  <Text style={styles.analysingText}>Analysing image...</Text>
                </View>
              )}
              {!isAnalysing && (
                <TouchableOpacity
                  style={[
                    styles.retakeBtn,
                    { backgroundColor: isDarkMode ? "#1E2321" : "#FFFFFF" },
                  ]}
                  onPress={reset}
                >
                  <RefreshCw size={14} color={C.text} />
                  <Text style={[styles.retakeBtnText, { color: C.text }]}>
                    Try Another
                  </Text>
                </TouchableOpacity>
              )}
            </GlassCard>
          )}

          {/* Classification Result */}
          {result && !isAnalysing && (
            <>
              {/* Result Header Card */}
              <GlassCard
                style={[
                  styles.resultCard,
                  { borderColor: result.color + "40" },
                ]}
              >
                <View style={styles.resultTopRow}>
                  <View
                    style={[
                      styles.resultIconCircle,
                      { backgroundColor: result.color + "20" },
                    ]}
                  >
                    <Text style={styles.resultEmoji}>{result.icon}</Text>
                  </View>
                  <View style={styles.resultMeta}>
                    <Text style={[styles.resultCategory, { color: C.text }]}>
                      {result.category}
                    </Text>
                    <View style={styles.resultBadgeRow}>
                      <View
                        style={[
                          styles.confidenceBadge,
                          { backgroundColor: result.color + "20" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.confidenceText,
                            { color: result.color },
                          ]}
                        >
                          {result.confidence}% confidence
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.recycleBadge,
                          {
                            backgroundColor: result.recyclable
                              ? "rgba(16,185,129,0.15)"
                              : "rgba(239,68,68,0.12)",
                          },
                        ]}
                      >
                        {result.recyclable ? (
                          <CheckCircle2 size={11} color="#10B981" />
                        ) : (
                          <AlertCircle size={11} color="#EF4444" />
                        )}
                        <Text
                          style={[
                            styles.recycleBadgeText,
                            {
                              color: result.recyclable ? "#10B981" : "#EF4444",
                            },
                          ]}
                        >
                          {result.recyclable ? "Recyclable" : "Non-Recyclable"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View
                  style={[
                    styles.binRow,
                    {
                      backgroundColor: isDarkMode ? "#141716" : "#F7FAF8",
                      borderColor: C.border,
                    },
                  ]}
                >
                  <Leaf size={14} color={C.primary} />
                  <Text style={[styles.binText, { color: C.text }]}>
                    Dispose in:{" "}
                    <Text style={{ fontFamily: "Poppins-Bold" }}>
                      {result.binColor}
                    </Text>
                  </Text>
                </View>
              </GlassCard>

              {/* Recycling Tips */}
              <GlassCard style={styles.tipsCard}>
                <View style={styles.tipsTitleRow}>
                  <BookOpen size={16} color={C.primary} />
                  <Text style={[styles.tipsTitle, { color: C.text }]}>
                    Recycling & Disposal Tips
                  </Text>
                </View>
                {result.tips.map((tip, i) => (
                  <View key={i} style={styles.tipRow}>
                    <View
                      style={[
                        styles.tipDot,
                        { backgroundColor: result.color },
                      ]}
                    />
                    <Text style={[styles.tipText, { color: C.greyText }]}>
                      {tip}
                    </Text>
                  </View>
                ))}
              </GlassCard>

              {/* Classify Another */}
              <TouchableOpacity
                style={[
                  styles.classifyAnotherBtn,
                  {
                    backgroundColor: isDarkMode
                      ? Colors.accent
                      : Colors.primary,
                  },
                ]}
                onPress={reset}
                activeOpacity={0.9}
              >
                <RefreshCw
                  size={18}
                  color={isDarkMode ? "#000000" : "#FFFFFF"}
                />
                <Text
                  style={[
                    styles.classifyAnotherText,
                    { color: isDarkMode ? "#000000" : "#FFFFFF" },
                  ]}
                >
                  Classify Another Item
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Category Guide (shown when no image) */}
          {!imageUri && (
            <View style={styles.categoryGuide}>
              <Text style={[styles.guideTitle, { color: C.text }]}>
                Supported Waste Categories
              </Text>
              <View style={styles.categoryGrid}>
                {WASTE_CATEGORIES.map((cat) => (
                  <View
                    key={cat.category}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: cat.color + "18",
                        borderColor: cat.color + "40",
                      },
                    ]}
                  >
                    <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                    <Text style={[styles.categoryName, { color: C.text }]}>
                      {cat.category}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      <CustomAlert {...alertProps} />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 12 : 24,
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  title: { fontSize: 22, fontFamily: "Poppins-Bold" },
  subtitle: { fontSize: 12, fontFamily: "Poppins-Medium", marginTop: 2 },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  aiBadgeText: { fontSize: 12, fontFamily: "Poppins-Bold" },
  uploadZone: {
    alignItems: "center",
    paddingVertical: 32,
    marginBottom: 20,
  },
  uploadIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(11,61,46,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  uploadTitle: {
    fontSize: 15,
    fontFamily: "Poppins-Bold",
    textAlign: "center",
    marginBottom: 6,
  },
  uploadSub: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  uploadBtnsRow: { flexDirection: "row", gap: 10 },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  uploadBtnText: { fontSize: 14, fontFamily: "Poppins-Bold" },
  uploadBtnOutline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  uploadBtnOutlineText: { fontSize: 14, fontFamily: "Poppins-Bold" },
  previewCard: { padding: 0, overflow: "hidden", marginBottom: 16 },
  previewImage: { width: "100%", height: 240, borderRadius: 16 },
  analysingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  analysingText: {
    color: "#FFFFFF",
    fontFamily: "Poppins-Bold",
    fontSize: 14,
  },
  retakeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  retakeBtnText: { fontSize: 11, fontFamily: "Poppins-Bold" },
  resultCard: { marginBottom: 12, borderWidth: 1.5 },
  resultTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
  },
  resultIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  resultEmoji: { fontSize: 26 },
  resultMeta: { flex: 1 },
  resultCategory: { fontSize: 18, fontFamily: "Poppins-Bold", marginBottom: 6 },
  resultBadgeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  confidenceText: { fontSize: 11, fontFamily: "Poppins-Bold" },
  recycleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  recycleBadgeText: { fontSize: 11, fontFamily: "Poppins-Bold" },
  binRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  binText: { fontSize: 12, fontFamily: "Poppins-Medium" },
  tipsCard: { marginBottom: 14 },
  tipsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: { fontSize: 14, fontFamily: "Poppins-Bold" },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  tipDot: { width: 7, height: 7, borderRadius: 4, marginTop: 5 },
  tipText: { flex: 1, fontSize: 12, fontFamily: "Poppins-Medium", lineHeight: 18 },
  classifyAnotherBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 16,
    gap: 8,
    marginBottom: 20,
  },
  classifyAnotherText: { fontSize: 14, fontFamily: "Poppins-Bold" },
  categoryGuide: { marginTop: 4 },
  guideTitle: {
    fontSize: 15,
    fontFamily: "Poppins-Bold",
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryEmoji: { fontSize: 16 },
  categoryName: { fontSize: 12, fontFamily: "Poppins-Bold" },
});
