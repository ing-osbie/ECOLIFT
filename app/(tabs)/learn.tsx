import { CustomAlert, useCustomAlert } from "@/components/custom-alert";
import { GlassCard } from "@/components/glass-card";
import { GradientBackground } from "@/components/gradient-background";
import { Colors, getColors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Leaf,
  Recycle,
  Search,
  Sparkles,
  Trash2,
  X,
  Zap,
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

interface GuideItem {
  id: string;
  title: string;
  subtitle?: string;
  tag?: string;
  image?: string;
  isQuiz?: boolean;
  content: string;
}

const GUIDES: GuideItem[] = [
  {
    id: "featured",
    title: "Mastering Your Blue Bin",
    subtitle: "The definitive guide to what actually goes in.",
    tag: "Featured",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD9Km2s-Adevwjp4geKjmcpdrXjy4bBYMEDilPJG1VxaprMlNALotppziVERoxaINKXSd87P-ktXfMn7uME7-vmguPCMxK2KWPMyGVhTJCeIztvAFreKxUsObtpStu9QlRmy8_RgCZSFkmjpFStuTh1MHzxKVm-7KVJ29iIgiZjiwE59LO0H6XkI4uxN82b05wQZMGdArTN1MCl7fA-TwhCMFmQg9vw3x5Z-46xe3qB0CMWD26SnQnK",
    content:
      "Recycling right starts with understanding your Blue Bin. Always clean and rinse food containers before binning to prevent contamination. Keep paper, clean cardboard, flattened plastic bottles (PET/HDPE), and tin/aluminium cans dry. Do NOT put greasy pizza boxes, plastic bags, or ceramic cups in the blue bin.",
  },
  {
    id: "compost",
    title: "Composting 101",
    subtitle: "Turn organic scraps into black gold.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCNtkFF8CsIN0VUzbUuARWMWtjG89vSb0W7tfY5A5y3OnP9sL9Wz7UpLgy5q4wbDHbmDnpWyN9RyB3_jeaLTGJafjVDK0wx5MyVH1VlsKJNO6zwdtjW9yyyw13op6PvEXmAnspZol0gh6hJgg2WCoREKlnJ0KAgyOgLkFbVnl79ChdH6rU2wgndxDfe7oJJZfwN0GRnujMiF5_qfvPiLuKSTlLpRao--LOMrpkxDbjAYldcPPMf4nds",
    content:
      "Over 50% of household waste is organic. Layer fruit and veggie peels (greens) with dried leaves or torn cardboard (browns) in a 1:2 ratio. Aerate weekly to produce rich garden compost in 4-8 weeks without unpleasant odors.",
  },
  {
    id: "ewaste",
    title: "E-Waste Guide",
    subtitle: "Safe disposal of electronics & batteries.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAN_NwkARZNqK09aKjh-vGhJlN088rAXJRpBCiXVxKdp7UF1VXdRZ1XZTpnyz6ew71H_12NCwwI8BX7xnabBtQDsgZ1E5NKWn6KTtRV-7CC1dls2YQa9eM1gCCCj4ucnTWbHMGPQEq3n29V7qeUGGDzIvBB-S4_A3MVhU_-ZP3V5951gg1f16HUTQ3wa_qkKyefxPsBbq-d2jbrgbBBbDt3PEARdUvw2dvA-AuhFRPO6Yl7bHUzl9YD",
    content:
      "Old phones, chargers, laptops, and lithium batteries contain heavy metals like lead and lithium. Never dump them in municipal bins. Use EcoLift's specialized e-waste pickups or certified collection points for safe mineral recovery.",
  },
  {
    id: "local_guidelines",
    title: "Local Guidelines",
    subtitle: "Rules for your specific area & schedule.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCSyffF_0rTNiLDejaIJc1RHwGyvrcMHZeRyXilrFD0Om2yP2pgN-TTu3Anv7V9fmfZ8EGd0coEA-DjnEWbglWLF6B46gtbMfR8_VgjWwIlCnnx9gAaONTQ_GPzjdZKp9r_jgtpjs4o9cFLTvSErXXQL6HEU18C_m3dUi7E2bkD_M_7zyDBM9va3PsPHhRG59gJanhN99fTjHEmqV0yZb6WKe_KOSiH-A8zPqKR3tO2yJNmY8k0yrYH",
    content:
      "Check municipal collection schedules for your neighborhood. Standard waste is picked up twice weekly, while scheduled recyclables and bulk items can be booked on-demand anytime using the EcoLift Schedule tab.",
  },
  {
    id: "plastics_myths",
    title: "Plastics Myths",
    subtitle: "Debunking common recycling misunderstandings.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCCejrsld42frvTfOGJaFkQblmjsLf834rTNdVJYQkHvuZrGpiXtTNGh0sIkfKMnZEuluERWS6_hHW1-aK-2p3P50BXjtgnxSMUfrEU4UNEeVxFdEg5ed0yJiF6T0QrWUuuV9Gi8L2ijGzCiu_09jHkMxUUvr9Z-pJwmSgr7Edm5uywNWMfNOtgY7ojJqOjY9N0mbTKJ9y_eKgezNwsWGBnuKzEeaRQLP9uWum1wLypjtYOynbTTZKn",
    content:
      "Myth: All plastic with a triangle is recyclable anywhere. Fact: The number (1-7) indicates the resin type. Types 1 (PET) and 2 (HDPE) are widely recyclable; types 3, 6, and 7 need specialized processing facilities.",
  },
  {
    id: "quiz",
    title: "Test Your Skills",
    subtitle: "Take the daily eco quiz & earn 50 Pts",
    isQuiz: true,
    content:
      "Ready to test your eco knowledge? Question: Which item should NEVER go into your blue recycling bin? A) Plastic Water Bottle  B) Greasy Pizza Box  C) Aluminium Can. (Answer: B! Greasy oils ruin paper fibers). You earned 50 Eco-Points!",
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function LearnScreen() {
  const router = useRouter();
  const { isDarkMode } = useApp();
  const C = getColors(isDarkMode);
  const { showAlert, alertProps } = useCustomAlert();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuide, setSelectedGuide] = useState<GuideItem | null>(null);

  const filteredGuides = GUIDES.filter(
    (g) =>
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.subtitle && g.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const featured = filteredGuides.find((g) => g.id === "featured");
  const gridItems = filteredGuides.filter((g) => g.id !== "featured");

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
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.bellBtn, { backgroundColor: isDarkMode ? '#1E2321' : '#FFFFFF', borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F8' }]}
              onPress={() => router.push('/notifications' as any)}
              activeOpacity={0.85}
            >
              <Bell size={18} color={isDarkMode ? '#95D3BA' : '#003527'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile' as any)}
              style={styles.avatarBtn}
              activeOpacity={0.8}
            >
              <Text style={[styles.headerProfileText, { color: C.greyText }]}>Profile</Text>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida/AP1WRLvvebFOZ6ynMsVwLT_RhMB47PIf8hxioUnplUngiLRck_uwziGuo8q9YO5aj1foVEUmhejlyafL2z2OHqEPi7FC8azbJoc-ziJbt6qsF5SMnw3GGseHcRNMOLhOvVO7v71vEGCzSy99We7_7rFyQI5Xzz2j4GcrsBMMWBjTRHPbwqUwGF-tolAZtlI0fp2FGa_-ATEKQMsHpKcZA_Q1cKK8GQq6hUUor6q0TpvsuD-ZBS35WmtkQvEqKtrn1A2MHmfBS2lh9XHmQQ' }}
                style={styles.avatarImage}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Search Bar */}
          <View style={styles.searchBarWrapper}>
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: isDarkMode ? "#1A211E" : "#E7EEFE",
                  borderColor: isDarkMode ? "#2B3530" : "#DCE2F3",
                },
              ]}
            >
              <Search size={18} color={C.greyText} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: C.text }]}
                placeholder="Search guides, tips & rules..."
                placeholderTextColor={isDarkMode ? "#707974" : "#8A9490"}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={16} color={C.greyText} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Featured Tile */}
          {featured && (
            <TouchableOpacity
              style={styles.featuredCard}
              onPress={() => setSelectedGuide(featured)}
              activeOpacity={0.92}
            >
              <Image source={{ uri: featured.image }} style={styles.featuredImage} />
              <View style={styles.featuredGradient} />

              <View style={styles.featuredContent}>
                <View style={styles.featuredTagPill}>
                  <Text style={styles.featuredTagText}>Featured</Text>
                </View>
                <Text style={styles.featuredTitle}>{featured.title}</Text>
                <Text style={styles.featuredSubtitle}>{featured.subtitle}</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Grid Tiles */}
          <View style={styles.gridContainer}>
            {gridItems.map((item) => {
              const isFullWidth = item.id === "local_guidelines";

              if (item.isQuiz) {
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.quizCard,
                      {
                        backgroundColor: isDarkMode ? "#1E2522" : "#E2E8F8",
                        borderColor: isDarkMode ? "#2B3530" : "#DCE2F3",
                      },
                    ]}
                    onPress={() => setSelectedGuide(item)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.quizIconCircle}>
                      <HelpCircle size={24} color="#00714D" />
                    </View>
                    <Text style={[styles.quizTitle, { color: C.text }]}>{item.title}</Text>
                    <Text style={[styles.quizSubtitle, { color: C.greyText }]}>
                      {item.subtitle}
                    </Text>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.gridCard,
                    isFullWidth ? styles.gridCardFull : styles.gridCardHalf,
                  ]}
                  onPress={() => setSelectedGuide(item)}
                  activeOpacity={0.9}
                >
                  <Image source={{ uri: item.image }} style={styles.gridCardImage} />
                  <View style={styles.gridCardGradient} />

                  <View style={styles.gridCardContent}>
                    <Text style={styles.gridCardTitle}>{item.title}</Text>
                    {isFullWidth && (
                      <View style={styles.fullWidthFooter}>
                        <Text style={styles.gridCardSubtitle}>{item.subtitle}</Text>
                        <ArrowRight size={18} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Article Reader Modal */}
        <Modal
          visible={!!selectedGuide}
          animationType="slide"
          transparent
          onRequestClose={() => setSelectedGuide(null)}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.modalCard,
                { backgroundColor: isDarkMode ? "#141A17" : "#FFFFFF" },
              ]}
            >
              {selectedGuide?.image && (
                <Image
                  source={{ uri: selectedGuide.image }}
                  style={styles.modalHeaderImage}
                />
              )}

              <View style={styles.modalBody}>
                <View style={styles.modalTopRow}>
                  <Text style={[styles.modalTitle, { color: C.text }]}>
                    {selectedGuide?.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSelectedGuide(null)}
                    style={styles.modalCloseBtn}
                  >
                    <X size={20} color={C.text} />
                  </TouchableOpacity>
                </View>

                {selectedGuide?.subtitle && (
                  <Text style={[styles.modalSubtitle, { color: "#006C49" }]}>
                    {selectedGuide.subtitle}
                  </Text>
                )}

                <ScrollView style={styles.modalContentScroll}>
                  <Text style={[styles.modalText, { color: C.text }]}>
                    {selectedGuide?.content}
                  </Text>
                </ScrollView>

                <TouchableOpacity
                  style={[styles.modalDoneBtn, { backgroundColor: "#003527" }]}
                  onPress={() => {
                    const isQuiz = selectedGuide?.isQuiz;
                    setSelectedGuide(null);
                    if (isQuiz) {
                      showAlert({
                        type: "success",
                        title: "Quiz Completed!",
                        message: "50 Eco-Points added to your balance!",
                      });
                    }
                  }}
                  activeOpacity={0.9}
                >
                  <Text style={styles.modalDoneBtnText}>
                    {selectedGuide?.isQuiz ? "Claim 50 Eco-Points" : "Got It"}
                  </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 110,
    gap: 16,
  },
  searchBarWrapper: {
    marginTop: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins-Medium",
  },
  featuredCard: {
    width: "100%",
    height: 220,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  featuredGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  featuredContent: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  featuredTagPill: {
    alignSelf: "flex-start",
    backgroundColor: "#006C49",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  featuredTagText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Poppins-Bold",
  },
  featuredTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    lineHeight: 26,
  },
  featuredSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  gridCard: {
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  gridCardHalf: {
    width: (SCREEN_WIDTH - 52) / 2,
    height: (SCREEN_WIDTH - 52) / 2,
  },
  gridCardFull: {
    width: "100%",
    height: 150,
  },
  gridCardImage: {
    width: "100%",
    height: "100%",
  },
  gridCardGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  gridCardContent: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
  },
  gridCardTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    lineHeight: 20,
  },
  gridCardSubtitle: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 11,
    fontFamily: "Poppins-Medium",
  },
  fullWidthFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  quizCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    height: (SCREEN_WIDTH - 52) / 2,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  quizIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6CF8BB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quizTitle: {
    fontSize: 14,
    fontFamily: "Poppins-Bold",
    textAlign: "center",
  },
  quizSubtitle: {
    fontSize: 10,
    fontFamily: "Poppins-Medium",
    textAlign: "center",
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "82%",
    overflow: "hidden",
  },
  modalHeaderImage: {
    width: "100%",
    height: 180,
  },
  modalBody: {
    padding: 20,
  },
  modalTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    flex: 1,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: "Poppins-SemiBold",
    marginTop: 4,
    marginBottom: 12,
  },
  modalContentScroll: {
    maxHeight: 180,
    marginBottom: 16,
  },
  modalText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    lineHeight: 22,
  },
  modalDoneBtn: {
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalDoneBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Poppins-Bold",
  },
});
