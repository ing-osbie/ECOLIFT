import { GlassCard } from "@/components/glass-card";
import { GradientBackground } from "@/components/gradient-background";
import { Colors, getColors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { CustomAlert, useCustomAlert } from "@/components/custom-alert";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Gift,
  Leaf,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TIERS = [
  { name: "Bronze", min: 0, max: 499, color: "#CD7F32", icon: "🥉" },
  { name: "Silver", min: 500, max: 1499, color: "#9CA3AF", icon: "🥈" },
  { name: "Gold", min: 1500, max: 3999, color: "#F59E0B", icon: "🥇" },
  { name: "Platinum", min: 4000, max: 9999, color: "#8B5CF6", icon: "💎" },
];

const HISTORY = [
  { id: "h1", label: "Plastic & Metal Pickup", points: +45, date: "Jul 09, 2026", type: "earn" },
  { id: "h2", label: "Recyclables Pickup", points: +30, date: "Jul 02, 2026", type: "earn" },
  { id: "h3", label: "Redeemed — Wallet Credit", points: -100, date: "Jun 28, 2026", type: "redeem" },
  { id: "h4", label: "Organic Waste Pickup", points: +20, date: "Jun 25, 2026", type: "earn" },
  { id: "h5", label: "Bulk E-Waste Pickup", points: +80, date: "Jun 18, 2026", type: "earn" },
  { id: "h6", label: "Referral Bonus", points: +50, date: "Jun 10, 2026", type: "earn" },
];

const REWARDS = [
  { id: "r1", label: "GHS 5 Wallet Credit", cost: 100, icon: "💵" },
  { id: "r2", label: "GHS 10 Wallet Credit", cost: 200, icon: "💵" },
  { id: "r3", label: "Free Pickup (Tricycle)", cost: 300, icon: "🛺" },
  { id: "r4", label: "Plant a Tree (Donation)", cost: 150, icon: "🌳" },
  { id: "r5", label: "10% Off Next Pickup", cost: 80, icon: "🎟️" },
];

export default function RewardsScreen() {
  const router = useRouter();
  const { isDarkMode, ecoPoints, setEcoPoints, topUpWallet } = useApp();
  const C = getColors(isDarkMode);
  const { showAlert, alertProps } = useCustomAlert();

  const points = ecoPoints;

  const currentTier =
    TIERS.find((t) => points >= t.min && points <= t.max) ?? TIERS[0];
  const nextTier = TIERS[TIERS.indexOf(currentTier) + 1] ?? null;
  const progress = nextTier
    ? (points - currentTier.min) / (nextTier.min - currentTier.min)
    : 1;

  const handleRedeem = async (reward: (typeof REWARDS)[0]) => {
    if (points < reward.cost) {
      showAlert({
        type: "error",
        title: "Insufficient Points",
        message: `You need ${reward.cost - points} more EcoPoints to redeem this reward.`,
      });
      return;
    }
    setEcoPoints(points - reward.cost);

    if (reward.id === "r1") {
      await topUpWallet(5, "EcoPoints Reward: GHS 5 Credit");
    } else if (reward.id === "r2") {
      await topUpWallet(10, "EcoPoints Reward: GHS 10 Credit");
    }

    showAlert({
      type: "success",
      title: "Reward Redeemed!",
      message: `${reward.icon} ${reward.label} has been applied to your account.`,
    });
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.backBtn,
              { backgroundColor: isDarkMode ? "#1E2321" : "#FFFFFF", borderColor: C.border },
            ]}
          >
            <ArrowLeft size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: C.text }]}>EcoPoints & Rewards</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Points Hero Card */}
          <GlassCard style={[styles.heroCard, { borderColor: currentTier.color + "50" }]}>
            <View style={styles.heroTop}>
              <View>
                <Text style={[styles.heroLabel, { color: C.greyText }]}>
                  Your EcoPoints
                </Text>
                <Text style={[styles.heroPoints, { color: isDarkMode ? Colors.accent : Colors.primary }]}>
                  {points.toLocaleString()}
                </Text>
              </View>
              <View style={[styles.tierBadge, { backgroundColor: currentTier.color + "20" }]}>
                <Text style={styles.tierEmoji}>{currentTier.icon}</Text>
                <Text style={[styles.tierName, { color: currentTier.color }]}>
                  {currentTier.name}
                </Text>
              </View>
            </View>

            {/* Progress to next tier */}
            {nextTier && (
              <View style={styles.progressSection}>
                <View style={styles.progressLabelRow}>
                  <Text style={[styles.progressLabel, { color: C.greyText }]}>
                    Progress to {nextTier.name}
                  </Text>
                  <Text style={[styles.progressLabel, { color: C.greyText }]}>
                    {nextTier.min - points} pts to go
                  </Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: C.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.round(progress * 100)}%`,
                        backgroundColor: isDarkMode ? Colors.accent : Colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            )}
          </GlassCard>

          {/* Tier Overview */}
          <View style={styles.tiersRow}>
            {TIERS.map((tier) => {
              const isActive = tier.name === currentTier.name;
              return (
                <View
                  key={tier.name}
                  style={[
                    styles.tierCard,
                    {
                      backgroundColor: isActive ? tier.color + "20" : C.card,
                      borderColor: isActive ? tier.color : C.border,
                      borderWidth: isActive ? 1.5 : 1,
                    },
                  ]}
                >
                  <Text style={styles.tierCardEmoji}>{tier.icon}</Text>
                  <Text style={[styles.tierCardName, { color: C.text }]}>
                    {tier.name}
                  </Text>
                  <Text style={[styles.tierCardMin, { color: C.greyText }]}>
                    {tier.min}+ pts
                  </Text>
                </View>
              );
            })}
          </View>

          {/* How to Earn */}
          <GlassCard style={styles.earnCard}>
            <View style={styles.sectionTitleRow}>
              <TrendingUp size={16} color={C.primary} />
              <Text style={[styles.sectionTitle, { color: C.text }]}>
                How to Earn Points
              </Text>
            </View>
            {[
              { label: "Schedule a pickup", pts: "+20–80 pts", icon: "🗓️" },
              { label: "Recycle plastic or metal", pts: "+30–50 pts", icon: "♻️" },
              { label: "E-waste disposal", pts: "+80 pts", icon: "📱" },
              { label: "Refer a friend", pts: "+50 pts", icon: "👥" },
              { label: "Complete your profile", pts: "+25 pts", icon: "✅" },
            ].map((item, i) => (
              <View key={i} style={styles.earnRow}>
                <Text style={styles.earnEmoji}>{item.icon}</Text>
                <Text style={[styles.earnLabel, { color: C.text }]}>
                  {item.label}
                </Text>
                <Text style={[styles.earnPts, { color: isDarkMode ? Colors.accent : Colors.primary }]}>
                  {item.pts}
                </Text>
              </View>
            ))}
          </GlassCard>

          {/* Redeem Rewards */}
          <View style={styles.sectionTitleRow}>
            <Gift size={16} color={C.primary} />
            <Text style={[styles.sectionTitle, { color: C.text }]}>
              Redeem Rewards
            </Text>
          </View>
          {REWARDS.map((reward) => {
            const canAfford = points >= reward.cost;
            return (
              <GlassCard key={reward.id} style={styles.rewardCard}>
                <View style={styles.rewardRow}>
                  <Text style={styles.rewardEmoji}>{reward.icon}</Text>
                  <View style={styles.rewardMeta}>
                    <Text style={[styles.rewardLabel, { color: C.text }]}>
                      {reward.label}
                    </Text>
                    <View style={styles.rewardCostRow}>
                      <Zap size={11} color={isDarkMode ? Colors.accent : Colors.primary} />
                      <Text style={[styles.rewardCost, { color: isDarkMode ? Colors.accent : Colors.primary }]}>
                        {reward.cost} EcoPoints
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.redeemBtn,
                      {
                        backgroundColor: canAfford
                          ? isDarkMode ? Colors.accent : Colors.primary
                          : C.border,
                      },
                    ]}
                    onPress={() => handleRedeem(reward)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.redeemBtnText,
                        {
                          color: canAfford
                            ? isDarkMode ? "#000000" : "#FFFFFF"
                            : C.greyText,
                        },
                      ]}
                    >
                      Redeem
                    </Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            );
          })}

          {/* Points History */}
          <View style={[styles.sectionTitleRow, { marginTop: 8 }]}>
            <Star size={16} color={C.primary} />
            <Text style={[styles.sectionTitle, { color: C.text }]}>
              Points History
            </Text>
          </View>
          <GlassCard style={styles.historyCard}>
            {HISTORY.map((item, i) => (
              <View key={item.id}>
                <View style={styles.historyRow}>
                  <View
                    style={[
                      styles.historyIconBox,
                      {
                        backgroundColor:
                          item.type === "earn"
                            ? "rgba(16,185,129,0.12)"
                            : "rgba(239,68,68,0.1)",
                      },
                    ]}
                  >
                    {item.type === "earn" ? (
                      <Leaf size={14} color="#10B981" />
                    ) : (
                      <CheckCircle2 size={14} color="#EF4444" />
                    )}
                  </View>
                  <View style={styles.historyMeta}>
                    <Text style={[styles.historyLabel, { color: C.text }]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.historyDate, { color: C.greyText }]}>
                      {item.date}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.historyPoints,
                      {
                        color:
                          item.points > 0 ? "#10B981" : "#EF4444",
                      },
                    ]}
                  >
                    {item.points > 0 ? "+" : ""}
                    {item.points}
                  </Text>
                </View>
                {i < HISTORY.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: C.border }]} />
                )}
              </View>
            ))}
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
      <CustomAlert {...alertProps} />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 12 : 24,
    paddingBottom: 14,
    gap: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, fontFamily: "Poppins-Bold" },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  heroCard: { marginBottom: 14, borderWidth: 1.5 },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  heroLabel: { fontSize: 12, fontFamily: "Poppins-Medium", marginBottom: 4 },
  heroPoints: { fontSize: 36, fontFamily: "Poppins-Bold", lineHeight: 40 },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tierEmoji: { fontSize: 18 },
  tierName: { fontSize: 13, fontFamily: "Poppins-Bold" },
  progressSection: {},
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: { fontSize: 11, fontFamily: "Poppins-Medium" },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4 },
  tiersRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tierCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  tierCardEmoji: { fontSize: 18, marginBottom: 2 },
  tierCardName: { fontSize: 11, fontFamily: "Poppins-Bold" },
  tierCardMin: { fontSize: 9, fontFamily: "Poppins-Medium" },
  earnCard: { marginBottom: 16 },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontFamily: "Poppins-Bold" },
  earnRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 10,
  },
  earnEmoji: { fontSize: 16, width: 24, textAlign: "center" },
  earnLabel: { flex: 1, fontSize: 12, fontFamily: "Poppins-Medium" },
  earnPts: { fontSize: 12, fontFamily: "Poppins-Bold" },
  rewardCard: { marginBottom: 10, padding: 12 },
  rewardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  rewardEmoji: { fontSize: 22 },
  rewardMeta: { flex: 1 },
  rewardLabel: { fontSize: 13, fontFamily: "Poppins-Bold", marginBottom: 2 },
  rewardCostRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  rewardCost: { fontSize: 11, fontFamily: "Poppins-Bold" },
  redeemBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  redeemBtnText: { fontSize: 12, fontFamily: "Poppins-Bold" },
  historyCard: { padding: 14 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  historyIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  historyMeta: { flex: 1 },
  historyLabel: { fontSize: 12, fontFamily: "Poppins-Bold" },
  historyDate: { fontSize: 10, fontFamily: "Poppins-Medium" },
  historyPoints: { fontSize: 13, fontFamily: "Poppins-Bold" },
  divider: { height: 1, marginHorizontal: 4 },
});
