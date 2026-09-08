import { CustomAlert, useCustomAlert } from "@/components/custom-alert";
import { GlassCard } from "@/components/glass-card";
import { GradientBackground } from "@/components/gradient-background";
import { Colors, getColors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "expo-router";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Gift,
  HelpCircle,
  Leaf,
  LogOut,
  MapPin,
  Moon,
  Sparkles,
  Sun,
  Truck,
  User,
} from "lucide-react-native";
import React from "react";
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const router = useRouter();
  const {
    userName,
    userPhone,
    walletBalance,
    ecoPoints,
    setIsLoggedIn,
    isDarkMode,
    toggleDarkMode,
  } = useApp();
  const { signOut, user } = useAuth();
  const C = getColors(isDarkMode);
  const { showAlert, alertProps } = useCustomAlert();

  const handleSwitchToDriver = async () => {
    showAlert({
      type: "info",
      title: "Collector Access",
      message: "Collector accounts must be approved by EcoLift before access is granted.",
    });
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // Ignore
    }
    setIsLoggedIn(false);
    router.replace("/login");
  };

  const handleReferEarn = () => {
    showAlert({
      type: "success",
      title: "Referral Code: ECOLIFT2026",
      message: "Share this code with friends and neighbors to earn 500 Eco-Points on their first pickup!",
    });
  };

  const avatarSource = {
    uri:
      user?.avatar_url ||
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBRcEQLQqFVq_Z9EQQxI7B6x63AgOG1CAiF9cV3iLrj7KVbslnRnsCyHSCnNyG2NkiUAuozmOuBzK5VTH5fpegCY9EAmAjvdnG6KO3-KzrWbFXNizfuhFXeFy-gWmEeGOWPmj-G-NOwQiDr4tsXl2-L78ESpEsbPKmrE5slJs9_lAsEY35rJGTk41-UEGdwDxxiWoZhlSJw1PAonyDAn8olrapgZV7s93vqBqTeQ6uO2h7pwfOCBYM_",
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
            <Text style={[styles.headerDivider, { color: C.greyText }]}>|</Text>
            <Text style={[styles.headerSubTitle, { color: C.text }]}>Profile</Text>
          </View>
          <TouchableOpacity
            style={styles.headerAvatarWrapper}
            onPress={() => router.push("/edit-profile" as any)}
            activeOpacity={0.8}
          >
            <Image
              source={avatarSource}
              style={styles.headerAvatar}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header Card */}
          <View style={styles.profileHeaderCard}>
            {/* Ambient Background Glows */}
            <View style={styles.glowTopRight} />
            <View style={styles.glowBottomLeft} />

            {/* Avatar with Gradient Ring & Verified Badge */}
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={() => router.push("/edit-profile" as any)}
              activeOpacity={0.8}
            >
              <Image
                source={avatarSource}
                style={styles.avatarImage}
              />
              <View style={styles.verifiedDot}>
                <CheckCircle2 size={13} color="#006C49" />
              </View>
            </TouchableOpacity>

            {/* User Name & Membership */}
            <View style={styles.userNameBlock}>
              <Text style={styles.profileNameText}>
                {user?.full_name || userName || "Maya Rodriguez"}
              </Text>
              <Text style={styles.profileRoleText}>Eco-Citizen Member</Text>
            </View>

            {/* Eco Points Balance Card */}
            <TouchableOpacity
              style={styles.ecoPointsCard}
              onPress={() => router.push("/rewards" as any)}
              activeOpacity={0.88}
            >
              <View style={styles.ecoPointsIconCircle}>
                <Leaf size={20} color="#FFFFFF" />
              </View>
              <View style={styles.ecoPointsInfo}>
                <Text style={styles.ecoPointsLabel}>Available Balance</Text>
                <Text style={styles.ecoPointsValue}>{ecoPoints.toLocaleString()} Eco-Points</Text>
              </View>
              <ChevronRight size={18} color="#95D3BA" />
            </TouchableOpacity>
          </View>

          {/* Promo Card: Refer & Earn */}
          <TouchableOpacity
            style={styles.promoCard}
            onPress={handleReferEarn}
            activeOpacity={0.88}
          >
            <View style={styles.promoIconCircle}>
              <Gift size={22} color="#00714D" />
            </View>
            <View style={styles.promoTextBlock}>
              <Text style={styles.promoTitle}>Refer & Earn 500 Pts</Text>
              <Text style={styles.promoSubtitle}>Invite neighbors to EcoLift.</Text>
            </View>
            <ChevronRight size={22} color="#00714D" />
          </TouchableOpacity>

          {/* Switch to Driver Mode Card */}
          <TouchableOpacity
            style={[
              styles.driverModeCard,
              {
                backgroundColor: isDarkMode ? "#13231B" : "#E8F5E9",
                borderColor: isDarkMode ? "#1B4D36" : "#A5D6A7",
              },
            ]}
            onPress={handleSwitchToDriver}
            activeOpacity={0.88}
          >
            <View
              style={[
                styles.driverModeIconCircle,
                { backgroundColor: isDarkMode ? "#1B4D36" : "#2E7D32" },
              ]}
            >
              <Truck size={22} color="#FFFFFF" />
            </View>
            <View style={styles.driverModeTextBlock}>
              <View style={styles.driverModeHeaderRow}>
                <Text
                  style={[
                    styles.driverModeTitle,
                    { color: isDarkMode ? "#A7F3D0" : "#1B5E20" },
                  ]}
                >
                  Driver / Collector Mode
                </Text>
                <View
                  style={[
                    styles.driverModeBadge,
                    { backgroundColor: isDarkMode ? "#064E3B" : "#2E7D32" },
                  ]}
                >
                  <Text style={styles.driverModeBadgeText}>SWITCH</Text>
                </View>
              </View>
              <Text
                style={[
                  styles.driverModeSubtitle,
                  { color: isDarkMode ? "#95D3BA" : "#388E3C" },
                ]}
              >
                Accept pickup jobs, view live routes & driver earnings
              </Text>
            </View>
            <ChevronRight size={22} color={isDarkMode ? "#A7F3D0" : "#2E7D32"} />
          </TouchableOpacity>

          {/* Account Settings List Card */}
          <View
            style={[
              styles.settingsCard,
              {
                backgroundColor: isDarkMode ? "#1A211E" : "#FFFFFF",
                borderColor: isDarkMode ? "#2B3530" : "#E7EEFE",
              },
            ]}
          >
            <Text style={[styles.settingsSectionTitle, { color: C.greyText }]}>
              ACCOUNT SETTINGS
            </Text>

            {/* Edit Profile */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => router.push("/edit-profile" as any)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.settingIconCircle,
                  { backgroundColor: isDarkMode ? "#252E2B" : "#E7EEFE" },
                ]}
              >
                <User size={18} color={isDarkMode ? "#95D3BA" : "#003527"} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: C.text }]}>
                  Edit Profile
                </Text>
                <Text style={[styles.settingSubtitle, { color: C.greyText }]}>
                  Update your personal info
                </Text>
              </View>
              <ChevronRight size={18} color={C.greyText} />
            </TouchableOpacity>

            <View style={[styles.settingDivider, { backgroundColor: isDarkMode ? "#2B3530" : "#E7EEFE" }]} />

            {/* Notifications */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => router.push("/notifications" as any)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.settingIconCircle,
                  { backgroundColor: isDarkMode ? "#252E2B" : "#E7EEFE" },
                ]}
              >
                <Bell size={18} color={isDarkMode ? "#95D3BA" : "#003527"} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: C.text }]}>
                  Notifications
                </Text>
                <Text style={[styles.settingSubtitle, { color: C.greyText }]}>
                  Manage alerts & reminders
                </Text>
              </View>
              <ChevronRight size={18} color={C.greyText} />
            </TouchableOpacity>

            <View style={[styles.settingDivider, { backgroundColor: isDarkMode ? "#2B3530" : "#E7EEFE" }]} />

            {/* Payment Methods */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => router.push("/payment-methods" as any)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.settingIconCircle,
                  { backgroundColor: isDarkMode ? "#252E2B" : "#E7EEFE" },
                ]}
              >
                <CreditCard size={18} color={isDarkMode ? "#95D3BA" : "#003527"} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: C.text }]}>
                  Payment Methods
                </Text>
                <Text style={[styles.settingSubtitle, { color: C.greyText }]}>
                  Linked cards & billing (GHS {walletBalance.toFixed(2)})
                </Text>
              </View>
              <ChevronRight size={18} color={C.greyText} />
            </TouchableOpacity>

            <View style={[styles.settingDivider, { backgroundColor: isDarkMode ? "#2B3530" : "#E7EEFE" }]} />

            {/* Saved Addresses */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => router.push("/save-address" as any)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.settingIconCircle,
                  { backgroundColor: isDarkMode ? "#252E2B" : "#E7EEFE" },
                ]}
              >
                <MapPin size={18} color={isDarkMode ? "#95D3BA" : "#003527"} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: C.text }]}>
                  Saved Addresses
                </Text>
                <Text style={[styles.settingSubtitle, { color: C.greyText }]}>
                  Pickup locations
                </Text>
              </View>
              <ChevronRight size={18} color={C.greyText} />
            </TouchableOpacity>

            <View style={[styles.settingDivider, { backgroundColor: isDarkMode ? "#2B3530" : "#E7EEFE" }]} />

            {/* Help & Support */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => router.push("/support" as any)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.settingIconCircle,
                  { backgroundColor: isDarkMode ? "#252E2B" : "#E7EEFE" },
                ]}
              >
                <HelpCircle size={18} color={isDarkMode ? "#95D3BA" : "#003527"} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: C.text }]}>
                  Help & Support
                </Text>
                <Text style={[styles.settingSubtitle, { color: C.greyText }]}>
                  FAQ & Contact Us
                </Text>
              </View>
              <ChevronRight size={18} color={C.greyText} />
            </TouchableOpacity>

            <View style={[styles.settingDivider, { backgroundColor: isDarkMode ? "#2B3530" : "#E7EEFE" }]} />

            {/* Dark Mode Switch */}
            <View style={styles.settingRow}>
              <View
                style={[
                  styles.settingIconCircle,
                  { backgroundColor: isDarkMode ? "#252E2B" : "#E7EEFE" },
                ]}
              >
                {isDarkMode ? (
                  <Moon size={18} color="#95D3BA" />
                ) : (
                  <Sun size={18} color="#003527" />
                )}
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: C.text }]}>
                  Dark Mode
                </Text>
                <Text style={[styles.settingSubtitle, { color: C.greyText }]}>
                  {isDarkMode ? "On" : "Off"}
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: "#E2ECE9", true: "#006C49" }}
                thumbColor={isDarkMode ? "#6CF8BB" : "#FFFFFF"}
              />
            </View>
          </View>

          {/* Log Out Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <LogOut size={18} color="#BA1A1A" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
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
    gap: 6,
  },
  brandTitle: {
    fontSize: 22,
    fontFamily: "Poppins-Bold",
    letterSpacing: -0.5,
  },
  headerDivider: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
  },
  headerSubTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
  },
  headerAvatarWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#95D3BA",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 110,
    gap: 16,
  },
  profileHeaderCard: {
    backgroundColor: "#003527",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    gap: 12,
  },
  glowTopRight: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(0, 108, 73, 0.4)",
  },
  glowBottomLeft: {
    position: "absolute",
    bottom: -30,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(176, 240, 214, 0.15)",
  },
  avatarWrapper: {
    position: "relative",
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 3,
    backgroundColor: "#6CF8BB",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 44,
  },
  verifiedDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  userNameBlock: {
    alignItems: "center",
  },
  profileNameText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "Poppins-Bold",
  },
  profileRoleText: {
    color: "#95D3BA",
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    marginTop: 2,
  },
  ecoPointsCard: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  ecoPointsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#006C49",
    alignItems: "center",
    justifyContent: "center",
  },
  ecoPointsInfo: {
    flex: 1,
  },
  ecoPointsLabel: {
    color: "#B0F0D6",
    fontSize: 11,
    fontFamily: "Poppins-Medium",
  },
  ecoPointsValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins-Bold",
  },
  promoCard: {
    backgroundColor: "#6CF8BB",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  promoIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  promoTextBlock: {
    flex: 1,
  },
  promoTitle: {
    color: "#00714D",
    fontSize: 16,
    fontFamily: "Poppins-Bold",
  },
  promoSubtitle: {
    color: "#00714D",
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    opacity: 0.9,
  },
  settingsCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  settingsSectionTitle: {
    fontSize: 11,
    fontFamily: "Poppins-Bold",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  settingIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontFamily: "Poppins-SemiBold",
  },
  settingSubtitle: {
    fontSize: 11,
    fontFamily: "Poppins-Medium",
    marginTop: 1,
  },
  settingDivider: {
    height: 1,
    width: "100%",
  },
  logoutButton: {
    backgroundColor: "#FFDAD6",
    borderRadius: 16,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  logoutText: {
    color: "#BA1A1A",
    fontSize: 14,
    fontFamily: "Poppins-Bold",
  },
  driverModeCard: {
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    gap: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  driverModeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  driverModeTextBlock: {
    flex: 1,
  },
  driverModeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  driverModeTitle: {
    fontSize: 15,
    fontFamily: "Poppins-Bold",
  },
  driverModeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  driverModeBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "Poppins-Bold",
    letterSpacing: 0.5,
  },
  driverModeSubtitle: {
    fontSize: 11,
    fontFamily: "Poppins-Medium",
    marginTop: 2,
    lineHeight: 15,
  },
});
