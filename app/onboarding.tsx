import { Colors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { useRouter } from "expo-router";
import { ArrowRight, Hash, Smartphone } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

const { width } = Dimensions.get("window");

// ── Slide 2: animated circular progress ──────────────────────────────────────
const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function CircleProgress() {
  const [count, setCount] = useState(0);
  const [offset, setOffset] = useState(CIRCUMFERENCE);

  useEffect(() => {
    const TARGET = 142;
    const DURATION = 1500;
    const FRAMES = 60;
    const interval = DURATION / FRAMES;
    let frame = 0;
    setTimeout(() => {
      const timer = setInterval(() => {
        frame++;
        const t = Math.min(frame / FRAMES, 1);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        setCount(Math.floor(eased * TARGET));
        setOffset(CIRCUMFERENCE * (1 - eased * 0.75));
        if (frame >= FRAMES) clearInterval(timer);
      }, interval);
    }, 300);
  }, []);

  return (
    <View style={s2.container}>
      <View style={s2.circleWrapper}>
        <Svg width={200} height={200} viewBox="0 0 100 100" style={s2.svg}>
          <Circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#e2e8f8" strokeWidth="8" />
          <Circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke="#003527"
            strokeWidth="8"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
            rotation="-90"
            origin="50, 50"
          />
        </Svg>
        <View style={s2.circleInner}>
          <Text style={s2.ecoIcon}>🌿</Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 2 }}>
            <Text style={s2.kgCount}>{count}</Text>
            <Text style={s2.kgUnit}>kg</Text>
          </View>
          <Text style={s2.kgLabel}>CO₂ Saved</Text>
        </View>
        <View style={[s2.floatBadge, s2.floatTopRight]}>
          <Text style={{ fontSize: 16 }}>🌳</Text>
        </View>
        <View style={[s2.floatBadge, s2.floatBottomLeft]}>
          <Text style={{ fontSize: 14 }}>♻️</Text>
        </View>
      </View>

      <View style={s2.statsRow}>
        <View style={s2.statCard}>
          <Text style={{ fontSize: 20 }}>🌱</Text>
          <Text style={s2.statValue}>1,250</Text>
          <Text style={s2.statLabel}>Eco-Points Earned</Text>
        </View>
        <View style={s2.statCard}>
          <Text style={{ fontSize: 20 }}>🌲</Text>
          <Text style={s2.statValue}>12</Text>
          <Text style={s2.statLabel}>Trees Equivalent</Text>
        </View>
      </View>
    </View>
  );
}

// ── Illustration shared styles (must be before SLIDES) ─────────────────────
const ill = StyleSheet.create({
  wrapper: { width: width * 0.7, height: 220, alignItems: "center", justifyContent: "center" },
  truckImg: { width: "100%", height: "100%" },
  calBadge: { position: "absolute", top: -10, right: -10, width: 48, height: 48, backgroundColor: "#6cf8bb", borderRadius: 24, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  phoneFrame: { width: 90, height: 150, borderRadius: 16, backgroundColor: "#fff", borderWidth: 2.5, borderColor: Colors.primary, alignItems: "center", justifyContent: "center", shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  ussdModal: { position: "absolute", width: 72, backgroundColor: "rgba(11,61,46,0.05)", padding: 5, borderRadius: 6, alignItems: "center", gap: 3 },
  ussdText: { fontSize: 8, fontFamily: "Poppins-Bold", color: Colors.primary },
  ussdBtn: { backgroundColor: Colors.primary, paddingVertical: 2, paddingHorizontal: 4, borderRadius: 3 },
  ussdBtnText: { fontSize: 6, fontFamily: "Poppins-Bold", color: Colors.accent },
  hashBadge: { position: "absolute", bottom: 30, right: 30, backgroundColor: Colors.primary, padding: 10, borderRadius: 14 },
});

// ── Slide data (render functions, not static JSX — avoids NavigationContainer crash) ──
const SLIDES = [
  {
    key: "schedule",
    badge: "Step 1 of 3",
    title: "Easy Scheduling",
    description: "Select your waste types and pick a time slot that works perfectly for your routine.",
    renderIllustration: () => (
      <View style={ill.wrapper}>
        <Image
          source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBJyE4W2R0EljaO80GpUz-5i_D5hQ2Z388mAIze4rjwY8z_5XfVsx-P5Oel7qAlqIVpPuM59XyINzNtjx2eYHp7KpNQ-9XqQ9KV0-rINUMkTzQA53gUjIXRUPWlIuDcLtH8gUiUycGO4MzO5mIVkhpmgx2UYkE9aZIgSC2myY1PaoYADTeVm5T_-GrZ0_EZApw15J0_QcEyHU5LbJDhD64QUHu-QAYMOb0UNXxbSdHqEkuubW5BzQQt" }}
          style={ill.truckImg}
          resizeMode="contain"
        />
        <View style={ill.calBadge}>
          <Text style={{ fontSize: 20 }}>📅</Text>
        </View>
      </View>
    ),
  },
  {
    key: "contribution",
    badge: "Step 2 of 3",
    title: "See Your Contribution",
    description: "Monitor your environmental footprint and earn Eco-Points for every pickup.",
    renderIllustration: () => <CircleProgress />,
  },
  {
    key: "payment",
    badge: "Step 3 of 3",
    title: "Pay however works for you",
    description: "Integrated with Mobile Money, Cards, or dial offline USSD codes directly from your dialer.",
    renderIllustration: () => (
      <View style={ill.wrapper}>
        <View style={ill.phoneFrame}>
          <Smartphone size={72} color={Colors.primary} strokeWidth={1.5} />
          <View style={ill.ussdModal}>
            <Text style={ill.ussdText}>Dial: *920*33#</Text>
            <View style={ill.ussdBtn}>
              <Text style={ill.ussdBtnText}>Pay GHS 25</Text>
            </View>
          </View>
        </View>
        <View style={ill.hashBadge}>
          <Hash size={22} color={Colors.accent} />
        </View>
      </View>
    ),
  },
];

// ── Main component ────────────────────────────────────────────────────────────
export default function Onboarding() {
  const router = useRouter();
  const { setIsOnboarded } = useApp();
  const [slide, setSlide] = useState(0);
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 3000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(floatAnim, { toValue: 0, duration: 3000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    ).start();
  }, []);

  const handleNext = () => {
    if (slide < SLIDES.length - 1) {
      setSlide(slide + 1);
    } else {
      setIsOnboarded(true);
      router.replace("/login");
    }
  };

  const handleSkip = () => {
    setIsOnboarded(true);
    router.replace("/login");
  };

  const current = SLIDES[slide];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Skip */}
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Illustration — no float on slide 2 (has internal animation) */}
      <View style={styles.illArea}>
        {slide === 1 ? (
          current.renderIllustration()
        ) : (
          <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
            {current.renderIllustration()}
          </Animated.View>
        )}
      </View>

      {/* Text */}
      <View style={styles.textArea}>
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>🌿  {current.badge}</Text>
        </View>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.description}>{current.description}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === slide ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.9}>
          <Text style={styles.nextBtnText}>{slide === SLIDES.length - 1 ? "Get Started" : "Next"}</Text>
          <ArrowRight size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  safe: { flex: 1, backgroundColor: "#f9f9ff", justifyContent: "space-between" },
  skipBtn: { alignSelf: "flex-end", paddingHorizontal: 20, paddingTop: 12 },
  skipText: { fontSize: 14, fontFamily: "Poppins-SemiBold", color: "#707974" },
  illArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  textArea: { paddingHorizontal: 24, alignItems: "center", gap: 10 },
  badgePill: { backgroundColor: "rgba(0,53,39,0.08)", paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontSize: 12, fontFamily: "Poppins-SemiBold", color: "#003527", letterSpacing: 0.5 },
  title: { fontSize: 26, fontFamily: "Poppins-Bold", color: "#151c27", textAlign: "center", lineHeight: 34 },
  description: { fontSize: 14, fontFamily: "Poppins-Medium", color: "#404944", textAlign: "center", lineHeight: 22, paddingHorizontal: 8 },
  footer: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 24, gap: 20, alignItems: "center" },
  dots: { flexDirection: "row", gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 28, backgroundColor: "#003527" },
  dotInactive: { width: 8, backgroundColor: "#dce2f3" },
  nextBtn: { width: "100%", height: 54, backgroundColor: "#003527", borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, shadowColor: "#003527", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 5 },
  nextBtnText: { fontSize: 16, fontFamily: "Poppins-Bold", color: "#fff" },
});

// Slide 2 styles
const s2 = StyleSheet.create({
  container: { alignItems: "center", gap: 20 },
  circleWrapper: { width: 200, height: 200, alignItems: "center", justifyContent: "center", position: "relative" },
  svg: { position: "absolute" },
  circleInner: { alignItems: "center", gap: 2 },
  ecoIcon: { fontSize: 32 },
  kgCount: { fontSize: 40, fontFamily: "Poppins-Bold", color: "#003527" },
  kgUnit: { fontSize: 18, fontFamily: "Poppins-SemiBold", color: "#003527", opacity: 0.8 },
  kgLabel: { fontSize: 11, fontFamily: "Poppins-Medium", color: "#404944", letterSpacing: 0.8, textTransform: "uppercase" },
  floatBadge: { position: "absolute", width: 40, height: 40, backgroundColor: "#6cf8bb", borderRadius: 20, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  floatTopRight: { top: -10, right: -10 },
  floatBottomLeft: { bottom: 20, left: -8, width: 34, height: 34, borderRadius: 17, backgroundColor: "#b0f0d6" },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: { backgroundColor: "#e7eefe", borderRadius: 12, padding: 14, alignItems: "center", gap: 4, minWidth: 120 },
  statValue: { fontSize: 20, fontFamily: "Poppins-Bold", color: "#151c27" },
  statLabel: { fontSize: 11, fontFamily: "Poppins-Medium", color: "#404944", textAlign: "center" },
});
