import { EcoliftLogo } from "@/components/ecolift-logo";
import { GlassCard } from "@/components/glass-card";
import { GoogleIcon } from "@/components/google-icon";
import { GradientBackground } from "@/components/gradient-background";
import { Colors, getColors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "expo-router";
import {
  Check,
  ChevronDown,
  Search,
  Truck,
  User,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
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

interface CountryCode {
  id: string;
  flag: string;
  name: string;
  code: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { id: "1", flag: "🇬🇭", name: "Ghana", code: "+233" },
  { id: "2", flag: "🇳🇬", name: "Nigeria", code: "+234" },
  { id: "3", flag: "🇰🇪", name: "Kenya", code: "+254" },
  { id: "4", flag: "🇿🇦", name: "South Africa", code: "+27" },
  { id: "5", flag: "🇬🇧", name: "United Kingdom", code: "+44" },
  { id: "6", flag: "🇺🇸", name: "United States", code: "+1" },
  { id: "7", flag: "🇨🇦", name: "Canada", code: "+1" },
  { id: "8", flag: "🇨🇮", name: "Ivory Coast", code: "+225" },
  { id: "9", flag: "🇸🇳", name: "Senegal", code: "+221" },
];

export default function Login() {
  const router = useRouter();
  const { setIsLoggedIn, setUserPhone, setUserName, setUserRole, isDarkMode } =
    useApp();
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const C = getColors(isDarkMode);

  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [selectedRole, setSelectedRole] = useState<"customer" | "collector">(
    "customer",
  );
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    COUNTRY_CODES[0],
  );
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  const [phoneVal, setPhoneVal] = useState("");
  const [nameVal, setNameVal] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const filteredCountries = COUNTRY_CODES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.includes(countrySearch),
  );

  const handleSubmit = async () => {
    if (authMode === "signup" && nameVal.trim().length < 2) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (phoneVal.trim().length < 7) {
      setErrorMsg(
        `Please enter a valid phone number for ${selectedCountry.name}.`,
      );
      return;
    }
    setErrorMsg("");
    setIsLoading(true);

    const fullPhone = `${selectedCountry.code}${phoneVal.replace(/\D/g, "")}`;
    const email = `${phoneVal.replace(/\D/g, "")}@ecolift.app`;
    // Deterministic per-phone password so the same number can always
    // sign back in after sign-up. In production, use OTP/phone auth instead.
    const digits = phoneVal.replace(/\D/g, "");
    const password = `Eco${digits.slice(-4)}@2026`;
    // Legacy fallback for accounts created before the per-phone password
    // change. Allows existing users to still sign in.
    const legacyPassword = "Ecolift@2026";

    try {
      if (authMode === "signup") {
        // Try sign up; if user already exists, sign in instead
        try {
          await signUp(
            email,
            password,
            nameVal.trim(),
            fullPhone,
            selectedRole,
          );
        } catch (signUpErr: any) {
          const msg: string = signUpErr?.message || "";
          if (
            msg.includes("already registered") ||
            msg.includes("already exists") ||
            msg.includes("User already registered")
          ) {
            // Try the new per-phone password first, then the legacy one
            try {
              await signIn(email, password);
            } catch {
              await signIn(email, legacyPassword);
            }
          } else {
            throw signUpErr;
          }
        }
      } else {
        // Login mode: try the new password first, then the legacy one
        try {
          await signIn(email, password);
        } catch {
          await signIn(email, legacyPassword);
        }
      }

      setUserPhone(fullPhone);
      setUserName(nameVal.trim() || "Ecolift User");
      setUserRole(selectedRole);
      setIsLoggedIn(true);

      if (selectedRole === "collector") {
        router.replace("/upload-id" as any);
      } else {
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      const msg: string = err?.message || "";
      if (
        msg.includes("provider is not enabled") ||
        msg.includes("Unsupported provider")
      ) {
        setErrorMsg(
          "Authentication service is not configured. Please contact support.",
        );
      } else if (msg.includes("Invalid login credentials")) {
        setErrorMsg(
          authMode === "signup"
            ? "Could not create account. Check your details or try logging in if you already have an account."
            : "Incorrect phone number or account not found. Try signing up.",
        );
      } else if (msg.includes("Email not confirmed")) {
        setErrorMsg("Please confirm your email before logging in.");
      } else {
        setErrorMsg(msg || "Authentication failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg("");
    setIsLoading(true);
    try {
      const completed = await signInWithGoogle();
      if (!completed) {
        // User cancelled the Google OAuth flow — stay on the login screen.
        return;
      }
      // Google OAuth users are defaulted to the customer role by the DB
      // trigger; use the real name from the authenticated profile.
      setUserPhone("");
      setUserName(user?.full_name || "Google User");
      setUserRole("customer");
      setIsLoggedIn(true);
      router.replace("/(tabs)");
    } catch (err: any) {
      const msg = err?.message || "";
      if (
        msg.includes("provider is not enabled") ||
        msg.includes("Unsupported provider")
      ) {
        setErrorMsg(
          "Google sign-in is disabled in your Supabase project. Enable Google under Supabase Dashboard -> Authentication -> Providers -> Google.",
        );
      } else {
        setErrorMsg(msg || "Google sign-in failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardContainer}
        >
          <View style={styles.header} />

          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              isKeyboardVisible && { paddingBottom: 120 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.logoContainer}>
              <EcoliftLogo
                size={44}
                showText={true}
                textColor={C.text}
                textSize={26}
              />
            </View>

            <GlassCard style={styles.card}>
              {/* Auth Mode Toggle */}
              <View
                style={[
                  styles.tabSegmentContainer,
                  { backgroundColor: isDarkMode ? "#141716" : "#F0F4F2" },
                ]}
              >
                {(["signup", "login"] as const).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.tabSegmentBtn,
                      authMode === mode && [
                        styles.tabSegmentActive,
                        { backgroundColor: C.card },
                      ],
                    ]}
                    onPress={() => {
                      setAuthMode(mode);
                      setErrorMsg("");
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.tabSegmentText,
                        { color: authMode === mode ? C.text : C.greyText },
                        authMode === mode && { fontFamily: "Poppins-Bold" },
                      ]}
                    >
                      {mode === "signup" ? "Create Account" : "Log In"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionHeading, { color: C.text }]}>
                {authMode === "signup"
                  ? "Select your role on Ecolift"
                  : "Welcome back to Ecolift"}
              </Text>
              <Text style={[styles.cardSubtitle, { color: C.greyText }]}>
                {authMode === "signup"
                  ? "Choose how you want to use the platform today"
                  : "Select your account role to continue"}
              </Text>

              {/* Role Selection */}
              <View style={styles.rolesContainer}>
                {(
                  [
                    {
                      role: "customer" as const,
                      icon: (
                        <User
                          size={22}
                          color={
                            selectedRole === "customer"
                              ? isDarkMode
                                ? Colors.accent
                                : Colors.primary
                              : C.greyText
                          }
                        />
                      ),
                      title: "Customer / Household",
                      desc: "Schedule waste & recycling pickups, track drivers live, and earn eco-points.",
                    },
                    {
                      role: "collector" as const,
                      icon: (
                        <Truck
                          size={22}
                          color={
                            selectedRole === "collector"
                              ? isDarkMode
                                ? Colors.accent
                                : Colors.primary
                              : C.greyText
                          }
                        />
                      ),
                      title: "Driver / Collector",
                      desc: "Accept pickup requests, navigate optimized routes, and manage your daily earnings.",
                    },
                  ] as const
                ).map(({ role, icon, title, desc }) => {
                  const isActive = selectedRole === role;
                  return (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleCard,
                        {
                          backgroundColor: isDarkMode ? "#181C1A" : "#FAFCFA",
                          borderColor: isActive
                            ? isDarkMode
                              ? Colors.accent
                              : Colors.primary
                            : C.border,
                        },
                        isActive && styles.roleCardActive,
                      ]}
                      onPress={() => setSelectedRole(role)}
                      activeOpacity={0.9}
                    >
                      <View style={styles.roleCardHeader}>
                        <View
                          style={[
                            styles.roleIconWrapper,
                            {
                              backgroundColor: isActive
                                ? isDarkMode
                                  ? "rgba(182, 255, 60, 0.15)"
                                  : "rgba(11, 61, 46, 0.08)"
                                : isDarkMode
                                  ? "#242A28"
                                  : "#EFF4F1",
                            },
                          ]}
                        >
                          {icon}
                        </View>
                        <View style={styles.roleBadgeContainer}>
                          {isActive ? (
                            <View
                              style={[
                                styles.activeCheckBadge,
                                {
                                  backgroundColor: isDarkMode
                                    ? Colors.accent
                                    : Colors.primary,
                                },
                              ]}
                            >
                              <Check
                                size={14}
                                color={isDarkMode ? "#000000" : "#FFFFFF"}
                                strokeWidth={3}
                              />
                            </View>
                          ) : (
                            <View
                              style={[
                                styles.inactiveRadio,
                                { borderColor: C.border },
                              ]}
                            />
                          )}
                        </View>
                      </View>
                      <Text style={[styles.roleTitle, { color: C.text }]}>
                        {title}
                      </Text>
                      <Text style={[styles.roleDesc, { color: C.greyText }]}>
                        {desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Divider + Google Sign In */}
              <View style={styles.dividerContainer}>
                <View
                  style={[styles.dividerLine, { backgroundColor: C.border }]}
                />
                <Text style={[styles.dividerText, { color: C.greyText }]}>
                  or continue with
                </Text>
                <View
                  style={[styles.dividerLine, { backgroundColor: C.border }]}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.googleBtn,
                  {
                    borderColor: C.border,
                    backgroundColor: isDarkMode ? "#181C1A" : "#FFFFFF",
                  },
                ]}
                onPress={handleGoogleSignIn}
                activeOpacity={0.85}
                disabled={isLoading}
              >
                <GoogleIcon size={18} />
                <Text style={[styles.googleBtnText, { color: C.text }]}>
                  Continue with Google
                </Text>
              </TouchableOpacity>

              <View style={styles.orDividerContainer}>
                <View
                  style={[styles.orDividerLine, { backgroundColor: C.border }]}
                />
                <Text style={[styles.orDividerText, { color: C.greyText }]}>
                  or
                </Text>
                <View
                  style={[styles.orDividerLine, { backgroundColor: C.border }]}
                />
              </View>

              {errorMsg ? (
                <Text style={styles.errorText}>{errorMsg}</Text>
              ) : null}

              {/* Name Input (Sign Up only) */}
              {authMode === "signup" && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: C.text }]}>
                    Full Name
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        borderColor: C.border,
                        backgroundColor: isDarkMode ? "#181C1A" : "#F7FAF8",
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.textInput, { color: C.text }]}
                      placeholder="e.g. Kwame Mensah"
                      placeholderTextColor={
                        isDarkMode
                          ? "rgba(255, 255, 255, 0.4)"
                          : "rgba(11, 61, 46, 0.35)"
                      }
                      value={nameVal}
                      onChangeText={setNameVal}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              )}

              {/* Phone Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: C.text }]}>
                  Phone Number
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      borderColor: C.border,
                      backgroundColor: isDarkMode ? "#181C1A" : "#F7FAF8",
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.prefixContainer,
                      { borderRightColor: C.border },
                    ]}
                    onPress={() => setIsCountryModalVisible(true)}
                  >
                    <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
                    <Text style={[styles.prefixText, { color: C.text }]}>
                      {selectedCountry.code}
                    </Text>
                    <ChevronDown size={14} color={C.greyText} />
                  </TouchableOpacity>

                  <TextInput
                    style={[styles.textInput, { color: C.text }]}
                    placeholder="24 123 4567"
                    placeholderTextColor={
                      isDarkMode
                        ? "rgba(255, 255, 255, 0.4)"
                        : "rgba(11, 61, 46, 0.35)"
                    }
                    keyboardType="phone-pad"
                    value={phoneVal}
                    onChangeText={setPhoneVal}
                    maxLength={12}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor: isDarkMode
                      ? Colors.accent
                      : Colors.primary,
                    shadowColor: isDarkMode ? Colors.accent : Colors.primary,
                    opacity: isLoading ? 0.7 : 1,
                  },
                ]}
                onPress={handleSubmit}
                activeOpacity={0.9}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator
                    color={isDarkMode ? "#000000" : "#FFFFFF"}
                    size="small"
                  />
                ) : (
                  <Text
                    style={[
                      styles.btnText,
                      { color: isDarkMode ? "#000000" : "#FFFFFF" },
                    ]}
                  >
                    {authMode === "signup" ? "Create Account" : "Log In"}
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={[styles.termsText, { color: C.greyText }]}>
                By continuing, you agree to the Ecolift{" "}
                <Text
                  style={[
                    styles.termsLink,
                    { color: isDarkMode ? Colors.accent : Colors.primary },
                  ]}
                >
                  Terms of Service
                </Text>{" "}
                and{" "}
                <Text
                  style={[
                    styles.termsLink,
                    { color: isDarkMode ? Colors.accent : Colors.primary },
                  ]}
                >
                  Privacy Policy
                </Text>
                .
              </Text>
            </GlassCard>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Country Code Modal */}
        <Modal
          visible={isCountryModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsCountryModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalCard,
                { backgroundColor: isDarkMode ? "#1E2321" : "#FFFFFF" },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: C.text }]}>
                  Select Country Code
                </Text>
                <TouchableOpacity
                  onPress={() => setIsCountryModalVisible(false)}
                >
                  <X size={20} color={C.text} />
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.searchBoxInput,
                  {
                    borderColor: C.border,
                    backgroundColor: isDarkMode ? "#141716" : "#F7FAF8",
                  },
                ]}
              >
                <Search size={16} color={C.greyText} />
                <TextInput
                  style={[styles.searchInput, { color: C.text }]}
                  placeholder="Search country or dial code..."
                  placeholderTextColor={C.greyText}
                  value={countrySearch}
                  onChangeText={setCountrySearch}
                />
              </View>

              <FlatList
                data={filteredCountries}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.countryRow, { borderBottomColor: C.border }]}
                    onPress={() => {
                      setSelectedCountry(item);
                      setIsCountryModalVisible(false);
                      setCountrySearch("");
                    }}
                  >
                    <Text style={styles.countryFlag}>{item.flag}</Text>
                    <Text style={[styles.countryName, { color: C.text }]}>
                      {item.name}
                    </Text>
                    <Text
                      style={[styles.countryCodeText, { color: C.primary }]}
                    >
                      {item.code}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  keyboardContainer: { flex: 1 },
  header: { height: 20 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  card: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 16,
  },
  tabSegmentContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  tabSegmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  tabSegmentActive: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabSegmentText: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
  },
  sectionHeading: {
    fontSize: 17,
    fontFamily: "Poppins-Bold",
    textAlign: "center",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    textAlign: "center",
    marginBottom: 16,
  },
  rolesContainer: {
    gap: 10,
    marginBottom: 16,
  },
  roleCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
  },
  roleCardActive: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  roleCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  roleIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  roleBadgeContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  activeCheckBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  inactiveRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  roleTitle: {
    fontSize: 14,
    fontFamily: "Poppins-Bold",
    marginBottom: 2,
  },
  roleDesc: {
    fontSize: 11,
    fontFamily: "Poppins-Medium",
    lineHeight: 15,
  },
  inputGroup: { marginBottom: 14 },
  inputLabel: {
    fontSize: 12,
    fontFamily: "Poppins-SemiBold",
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  prefixContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRightWidth: 1.5,
    paddingRight: 8,
    marginRight: 8,
    gap: 4,
  },
  flagEmoji: { fontSize: 16 },
  prefixText: {
    fontSize: 14,
    fontFamily: "Poppins-Bold",
  },
  textInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    fontFamily: "Poppins-Bold",
  },
  primaryBtn: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
    marginTop: 4,
    marginBottom: 14,
  },
  btnText: {
    fontSize: 14,
    fontFamily: "Poppins-Bold",
  },
  termsText: {
    fontSize: 11,
    fontFamily: "Poppins-Medium",
    textAlign: "center",
    lineHeight: 15,
    paddingHorizontal: 10,
  },
  termsLink: {
    fontFamily: "Poppins-SemiBold",
    textDecorationLine: "underline",
  },
  errorText: {
    color: Colors.danger,
    fontFamily: "Poppins-Medium",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 12,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  googleBtnText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
  },
  orDividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
  },
  orDividerText: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: "75%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: "Poppins-Bold",
  },
  searchBoxInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 13,
    fontFamily: "Poppins-Medium",
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  countryFlag: { fontSize: 20 },
  countryName: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins-Medium",
  },
  countryCodeText: {
    fontSize: 14,
    fontFamily: "Poppins-Bold",
  },
});
