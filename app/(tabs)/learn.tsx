import { GlassCard } from "@/components/glass-card";
import { GradientBackground } from "@/components/gradient-background";
import { Colors, getColors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Leaf,
  Recycle,
  Trash2,
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

interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  tag: string;
  tagColor: string;
  icon: React.ReactNode;
  readTime: string;
}

const ARTICLES = (C: ReturnType<typeof getColors>): Article[] => [
  {
    id: "a1",
    title: "Why Waste Segregation Matters",
    summary:
      "Separating waste at source is the single most impactful step households can take.",
    content:
      "Waste segregation means sorting your rubbish into categories — organic, recyclable, and general waste — before disposal. When waste is mixed together, recyclable materials become contaminated and end up in landfill. Segregating at source reduces landfill pressure, lowers greenhouse gas emissions, and makes recycling economically viable. In Ghana, the average household generates about 0.5 kg of waste per day. If every household segregated correctly, over 60% of that waste could be diverted from landfill through composting and recycling.",
    tag: "Basics",
    tagColor: "#10B981",
    icon: <Trash2 size={20} color="#10B981" />,
    readTime: "2 min read",
  },
  {
    id: "a2",
    title: "Plastic Recycling: What You Need to Know",
    summary:
      "Not all plastics are equal. Learn which numbers are recyclable and which are not.",
    content:
      "Plastics are labelled with a resin identification code (1–7) found on the bottom of containers. Types 1 (PET) and 2 (HDPE) — used in water bottles and milk jugs — are the most widely recycled. Type 5 (PP) is increasingly accepted. Types 3, 6, and 7 are rarely recyclable and should be minimised. Before recycling, always rinse containers to remove food residue, as contamination is the leading cause of recyclable plastic being rejected at sorting facilities. Ghana currently recycles less than 5% of its plastic waste — your actions make a measurable difference.",
    tag: "Plastic",
    tagColor: "#3B82F6",
    icon: <Recycle size={20} color="#3B82F6" />,
    readTime: "3 min read",
  },
  {
    id: "a3",
    title: "Composting Organic Waste at Home",
    summary:
      "Turn food scraps into rich compost for your garden in just a few weeks.",
    content:
      "Organic waste — fruit peels, vegetable scraps, coffee grounds, and garden clippings — makes up roughly 50% of household waste in West Africa. Instead of sending it to landfill where it produces methane, you can compost it at home. A simple compost bin can be made from a wooden crate or plastic container. Layer 'greens' (food scraps, grass) with 'browns' (dry leaves, cardboard) in a 1:2 ratio. Keep it moist and turn it every week. In 4–8 weeks you will have rich compost to improve your garden soil. Composting reduces your household carbon footprint and eliminates the need for chemical fertilisers.",
    tag: "Organic",
    tagColor: "#84CC16",
    icon: <Leaf size={20} color="#84CC16" />,
    readTime: "3 min read",
  },
  {
    id: "a4",
    title: "The Dangers of E-Waste",
    summary:
      "Old phones and electronics contain toxic materials that harm people and the environment.",
    content:
      "Electronic waste (e-waste) is the fastest-growing waste stream globally. Devices like mobile phones, laptops, and batteries contain lead, mercury, cadmium, and arsenic. When dumped in open landfills — as happens at Agbogbloshie in Accra — these toxins leach into soil and groundwater, causing serious health problems for nearby communities. Never dispose of electronics in regular bins. Instead, take them to certified e-waste collection points. Remove personal data before disposal. Many manufacturers and retailers offer take-back programmes. Repairing and extending the life of devices is always the best option.",
    tag: "E-Waste",
    tagColor: "#EF4444",
    icon: <Zap size={20} color="#EF4444" />,
    readTime: "4 min read",
  },
  {
    id: "a5",
    title: "Understanding the Waste Hierarchy",
    summary:
      "Reduce, Reuse, Recycle — in that order. Here is why the order matters.",
    content:
      "The waste hierarchy is a framework that ranks waste management strategies by their environmental benefit. At the top is Prevention — not generating waste in the first place. Next is Reuse — using items multiple times before discarding. Then comes Recycling — processing materials into new products. Below that is Recovery — extracting energy from waste. At the bottom is Disposal — landfill or incineration. Most public messaging focuses on recycling, but prevention and reuse have far greater environmental impact. Choosing products with less packaging, buying second-hand, and repairing items before replacing them are the most powerful actions you can take.",
    tag: "Education",
    tagColor: "#8B5CF6",
    icon: <BookOpen size={20} color="#8B5CF6" />,
    readTime: "3 min read",
  },
  {
    id: "a6",
    title: "How EcoLift Rewards Responsible Disposal",
    summary:
      "Every pickup you schedule earns you EcoPoints redeemable for real rewards.",
    content:
      "EcoLift's reward system is designed to make responsible waste disposal financially beneficial. Every time you schedule a verified pickup, you earn EcoPoints based on the weight and type of waste collected. Recyclable materials earn more points than general waste. Points accumulate in your EcoLift account and can be redeemed for wallet credits, discounts on future pickups, or donated to environmental causes. The more consistently you use EcoLift, the higher your tier — Bronze, Silver, Gold, or Platinum — and the better the rewards. Check your points balance and history in the Rewards section of your profile.",
    tag: "Rewards",
    tagColor: "#F59E0B",
    icon: <Leaf size={20} color="#F59E0B" />,
    readTime: "2 min read",
  },
];

export default function LearnScreen() {
  const { isDarkMode } = useApp();
  const C = getColors(isDarkMode);
  const articles = ARTICLES(C);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string>("All");

  const tags = ["All", "Basics", "Plastic", "Organic", "E-Waste", "Education", "Rewards"];

  const filtered =
    activeTag === "All"
      ? articles
      : articles.filter((a) => a.tag === activeTag);

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: C.text }]}>
              Environmental Education
            </Text>
            <Text style={[styles.subtitle, { color: C.greyText }]}>
              Learn about waste management & recycling
            </Text>
          </View>

          {/* Stats Banner */}
          <GlassCard style={styles.statsBanner}>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: isDarkMode ? Colors.accent : Colors.primary }]}>
                6
              </Text>
              <Text style={[styles.statLabel, { color: C.greyText }]}>Articles</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: C.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: isDarkMode ? Colors.accent : Colors.primary }]}>
                17
              </Text>
              <Text style={[styles.statLabel, { color: C.greyText }]}>Min Total</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: C.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: isDarkMode ? Colors.accent : Colors.primary }]}>
                6
              </Text>
              <Text style={[styles.statLabel, { color: C.greyText }]}>Topics</Text>
            </View>
          </GlassCard>

          {/* Tag Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagRow}
          >
            {tags.map((tag) => {
              const isActive = activeTag === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagChip,
                    isActive
                      ? {
                          backgroundColor: isDarkMode
                            ? Colors.accent
                            : Colors.primary,
                        }
                      : {
                          backgroundColor: C.card,
                          borderColor: C.border,
                          borderWidth: 1,
                        },
                  ]}
                  onPress={() => setActiveTag(tag)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tagText,
                      {
                        color: isActive
                          ? isDarkMode
                            ? "#000000"
                            : "#FFFFFF"
                          : C.greyText,
                      },
                      isActive && { fontFamily: "Poppins-Bold" },
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Articles */}
          {filtered.map((article) => {
            const isExpanded = expandedId === article.id;
            return (
              <GlassCard key={article.id} style={styles.articleCard}>
                <TouchableOpacity
                  onPress={() =>
                    setExpandedId(isExpanded ? null : article.id)
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.articleHeader}>
                    <View
                      style={[
                        styles.articleIconBox,
                        { backgroundColor: article.tagColor + "18" },
                      ]}
                    >
                      {article.icon}
                    </View>
                    <View style={styles.articleMeta}>
                      <View style={styles.articleTopRow}>
                        <View
                          style={[
                            styles.tagPill,
                            { backgroundColor: article.tagColor + "20" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.tagPillText,
                              { color: article.tagColor },
                            ]}
                          >
                            {article.tag}
                          </Text>
                        </View>
                        <Text
                          style={[styles.readTime, { color: C.greyText }]}
                        >
                          {article.readTime}
                        </Text>
                      </View>
                      <Text style={[styles.articleTitle, { color: C.text }]}>
                        {article.title}
                      </Text>
                      <Text
                        style={[styles.articleSummary, { color: C.greyText }]}
                        numberOfLines={isExpanded ? undefined : 2}
                      >
                        {article.summary}
                      </Text>
                    </View>
                    <View style={styles.chevronBox}>
                      {isExpanded ? (
                        <ChevronUp size={18} color={C.greyText} />
                      ) : (
                        <ChevronDown size={18} color={C.greyText} />
                      )}
                    </View>
                  </View>

                  {isExpanded && (
                    <View
                      style={[
                        styles.articleBody,
                        {
                          borderTopColor: C.border,
                          borderTopWidth: 1,
                          marginTop: 12,
                          paddingTop: 12,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.articleContent, { color: C.greyText }]}
                      >
                        {article.content}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </GlassCard>
            );
          })}
        </ScrollView>
      </SafeAreaView>
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
  header: { marginBottom: 18 },
  title: { fontSize: 22, fontFamily: "Poppins-Bold" },
  subtitle: { fontSize: 12, fontFamily: "Poppins-Medium", marginTop: 2 },
  statsBanner: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 14,
    marginBottom: 16,
  },
  statItem: { alignItems: "center" },
  statNum: { fontSize: 20, fontFamily: "Poppins-Bold" },
  statLabel: { fontSize: 11, fontFamily: "Poppins-Medium" },
  statDivider: { width: 1, height: 30 },
  tagRow: { gap: 8, paddingBottom: 16 },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  tagText: { fontSize: 12, fontFamily: "Poppins-Medium" },
  articleCard: { marginBottom: 12, padding: 14 },
  articleHeader: { flexDirection: "row", gap: 12 },
  articleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  articleMeta: { flex: 1 },
  articleTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagPillText: { fontSize: 10, fontFamily: "Poppins-Bold" },
  readTime: { fontSize: 10, fontFamily: "Poppins-Medium" },
  articleTitle: {
    fontSize: 13,
    fontFamily: "Poppins-Bold",
    marginBottom: 4,
    lineHeight: 18,
  },
  articleSummary: {
    fontSize: 11,
    fontFamily: "Poppins-Medium",
    lineHeight: 16,
  },
  chevronBox: { justifyContent: "flex-start", paddingTop: 2 },
  articleBody: {},
  articleContent: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    lineHeight: 20,
  },
});
