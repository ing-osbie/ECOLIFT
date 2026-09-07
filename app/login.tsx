import { GoogleIcon } from "@/components/google-icon";
import { Colors } from "@/constants/theme";
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
  Image,
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
  const { setIsLoggedIn, setUserPhone, setUserName, setUserRole } = useApp();
  const { user, signIn, signUp, signInWithGoogle } = useAuth();

  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [selectedRole, setSelectedRole] = useState<"customer" | "collector">("customer");
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [phoneVal, setPhoneVal] = useState("");
  const [nameVal, setNameVal] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const filteredCountries = COUNTRY_CODES.filter(
    (c) => c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.includes(countrySearch),
  );

  const handleSubmit = async () => {
    if (authMode === "signup" && nameVal.trim().length < 2) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (phoneVal.trim().length < 7) {
      setErrorMsg(`Please enter a valid phone number.`);
      return;
    }
    setErrorMsg("");
    setIsLoading(true);

    const fullPhone = `${selectedCountry.code}${phoneVal.replace(/\D/g, "")}`;
    const email = `${phoneVal.replace(/\D/g, "")}@ecolift.app`;
    const digits = phoneVal.replace(/\D/g, "");
    const password = `Eco${digits.slice(-4)}@2026`;
    const legacyPassword = "Ecolift@2026";

    try {
      if (authMode === "signup") {
        try {
          await signUp(email, password, nameVal.trim(), fullPhone, selectedRole);
        } catch (signUpErr: any) {
          const msg: string = signUpErr?.message || "";
          if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("User already registered")) {
            try { await signIn(email, password); } catch { await signIn(email, legacyPassword); }
          } else { throw signUpErr; }
        }
      } else {
        try { await signIn(email, password); } catch { await signIn(email, legacyPassword); }
      }

      setUserPhone(fullPhone);
      setUserName(nameVal.trim() || "Ecolift User");
      setUserRole(selectedRole);
      setIsLoggedIn(true);

      if (selectedRole === "collector") {
        router.replace("/(tabs-collector)");
      } else {
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      const msg: string = err?.message || "";
      if (msg.includes("provider is not enabled") || msg.includes("Unsupported provider")) {
        setErrorMsg("Authentication service is not configured. Please contact support.");
      } else if (msg.includes("Invalid login credentials")) {
        setErrorMsg(authMode === "signup"
          ? "Could not create account. Try logging in if you already have an account."
          : "Incorrect phone number or account not found. Try signing up.");
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
      if (!completed) return;
      setUserPhone("");
      setUserName(user?.full_name || "Google User");
      setUserRole(selectedRole);
      setIsLoggedIn(true);
      router.replace(selectedRole === "collector" ? "/(tabs-collector)" : "/(tabs)");
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("provider is not enabled") || msg.includes("Unsupported provider")) {
        setErrorMsg("Google sign-in is disabled. Enable it in Supabase Dashboard → Authentication → Providers.");
      } else {
        setErrorMsg(msg || "Google sign-in failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.bg}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={[styles.scroll, isKeyboardVisible && { paddingBottom: 120 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Card */}
            <View style={styles.card}>
              {/* Green gradient header decoration */}
              <View style={styles.cardHeaderDecor} />

              {/* Logo + Brand */}
              <View style={styles.brandRow}>
                <View style={styles.logoCircle}>
                  <Image
                    source={{ uri: "https://lh3.googleusercontent.com/aida/AEtjO1XcXV5fbdHGNsqeCGly0UlSej52rtC_mjiNz-wgtk0IBvm41436Cn7_bH9IuDiDvPj1XQSSO44Hr7AyapNiRtQB5kBbalFGbLkan0qIhiWUqxd8wsp5doOx5bEsgKli46jrIB_MALi29-JIacOn2bNGMtxgtTwDyKeQcm2blObJA3fmUpgrt2IV1okVTRPF8nMFwl28EpQTFJGxSZp_CpCW8WoJpcSQKvN-XoqbMu_XpGLQPiuWQgR6DJaPWS5IlNcQiXDOgKPOvw" }}
                    style={styles.logoImg}
                  />
                </View>
                <Text style={styles.brandName}>EcoLift</Text>
              </View>

              {/* Auth Toggle */}
              <View style={styles.toggleContainer}>
                {(["signup", "login"] as const).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.toggleBtn, authMode === mode && styles.toggleBtnActive]}
                    onPress={() => { setAuthMode(mode); setErrorMsg(""); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.toggleText, authMode === mode && styles.toggleTextActive]}>
                      {mode === "signup" ? "Create Account" : "Log In"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Role Section */}
              <Text style={styles.sectionTitle}>
                {authMode === "signup" ? "Select your role on Ecolift" : "Welcome back to Ecolift"}
              </Text>
              <Text style={styles.sectionSub}>
                {authMode === "signup" ? "Choose how you want to use the platform today" : "Select your account role to continue"}
              </Text>

              <View style={styles.rolesWrap}>
                {([
                  { role: "customer" as const, Icon: User, title: "Customer / Household", desc: "Schedule waste & recycling pickups, track drivers live, and earn eco-points." },
                  { role: "collector" as const, Icon: Truck, title: "Driver / Collector", desc: "Accept pickup requests, navigate optimized routes, and manage your daily earnings." },
                ]).map(({ role, Icon, title, desc }) => {
                  const active = selectedRole === role;
                  return (
                    <TouchableOpacity
                      key={role}
                      style={[styles.roleCard, active && styles.roleCardActive]}
                      onPress={() => setSelectedRole(role)}
                      activeOpacity={0.9}
                    >
                      <View style={styles.roleCardTop}>
                        <View style={[styles.roleIconBox, active && styles.roleIconBoxActive]}>
                          <Icon size={20} color={active ? Colors.primary : "#6B7280"} />
                        </View>
                        {active ? (
                          <View style={styles.checkCircle}>
                            <Check size={12} color="#fff" strokeWidth={3} />
                          </View>
                        ) : (
                          <View style={styles.emptyCircle} />
                        )}
                      </View>
                      <Text style={styles.roleTitle}>{title}</Text>
                      <Text style={styles.roleDesc}>{desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Divider + Google */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn} activeOpacity={0.85} disabled={isLoading}>
                <GoogleIcon size={18} />
                <Text style={styles.googleText}>Continue with Google</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

              {/* Name input (signup only) */}
              {authMode === "signup" && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Kwame Mensah"
                    placeholderTextColor="#9CA3AF"
                    value={nameVal}
                    onChangeText={setNameVal}
                    autoCapitalize="words"
                  />
                </View>
              )}

              {/* Phone input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.phoneRow}>
                  <TouchableOpacity style={styles.countryPicker} onPress={() => setIsCountryModalVisible(true)}>
                    <Text style={styles.flagText}>{selectedCountry.flag}</Text>
                    <Text style={styles.codeText}>{selectedCountry.code}</Text>
                    <ChevronDown size={12} color="#9CA3AF" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="24 123 4567"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={phoneVal}
                    onChangeText={setPhoneVal}
                    maxLength={12}
                  />
                </View>
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.primaryBtn, { opacity: isLoading ? 0.7 : 1 }]}
                onPress={handleSubmit}
                activeOpacity={0.9}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {authMode === "signup" ? "Create Account" : "Log In"}
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={styles.termsText}>
                By continuing you agree to the Ecolift{" "}
                <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Country Modal */}
        <Modal visible={isCountryModalVisible} animationType="slide" transparent onRequestClose={() => setIsCountryModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Country Code</Text>
                <TouchableOpacity onPress={() => setIsCountryModalVisible(false)}>
                  <X size={20} color="#374151" />
                </TouchableOpacity>
              </View>
              <View style={styles.searchBox}>
                <Search size={16} color="#9CA3AF" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search country or dial code..."
                  placeholderTextColor="#9CA3AF"
                  value={countrySearch}
                  onChangeText={setCountrySearch}
                />
              </View>
              <FlatList
                data={filteredCountries}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.countryRow}
                    onPress={() => { setSelectedCountry(item); setIsCountryModalVisible(false); setCountrySearch(""); }}
                  >
                    <Text style={styles.countryFlag}>{item.flag}</Text>
                    <Text style={styles.countryName}>{item.name}</Text>
                    <Text style={styles.countryCode}>{item.code}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: "#f0fdf4",
  },
  safeArea: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#dcfce7",
    paddingBottom: 28,
  },
  cardHeaderDecor: {
    height: 80,
    backgroundColor: "rgba(167,243,208,0.4)",
    marginBottom: -40,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 16,
    paddingBottom: 20,
    zIndex: 1,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  logoImg: { width: "100%", height: "100%" },
  brandName: {
    fontSize: 22,
    fontFamily: "Poppins-Bold",
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: "#6B7280",
  },
  toggleTextActive: {
    fontFamily: "Poppins-Bold",
    color: "#111827",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#111827",
    textAlign: "center",
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  rolesWrap: {
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  roleCard: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  roleCardActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  roleCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  roleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  roleIconBoxActive: {
    backgroundColor: "rgba(6,78,59,0.08)",
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
  },
  roleTitle: {
    fontSize: 14,
    fontFamily: "Poppins-Bold",
    color: "#111827",
    marginBottom: 2,
  },
  roleDesc: {
    fontSize: 11,
    fontFamily: "Poppins-Medium",
    color: "#6B7280",
    lineHeight: 16,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: { fontSize: 11, fontFamily: "Poppins-Medium", color: "#9CA3AF" },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 20,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    marginBottom: 14,
  },
  googleText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#111827",
  },
  errorText: {
    color: "#BA1A1A",
    fontFamily: "Poppins-Medium",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: "Poppins-Bold",
    color: "#111827",
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  phoneRow: {
    flexDirection: "row",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
    height: 50,
  },
  countryPicker: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 4,
    borderRightWidth: 1.5,
    borderRightColor: "#E5E7EB",
    backgroundColor: "#F3F4F6",
  },
  flagText: { fontSize: 16 },
  codeText: { fontSize: 13, fontFamily: "Poppins-Bold", color: "#111827" },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#111827",
  },
  primaryBtn: {
    marginHorizontal: 20,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 4,
    marginBottom: 14,
    marginTop: 4,
  },
  primaryBtnText: {
    fontSize: 15,
    fontFamily: "Poppins-Bold",
    color: "#FFFFFF",
  },
  termsText: {
    fontSize: 11,
    fontFamily: "Poppins-Medium",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 28,
  },
  termsLink: {
    fontFamily: "Poppins-SemiBold",
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
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
  modalTitle: { fontSize: 17, fontFamily: "Poppins-Bold", color: "#111827" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    marginBottom: 12,
    backgroundColor: "#F9FAFB",
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: "#111827",
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  countryFlag: { fontSize: 20 },
  countryName: { flex: 1, fontSize: 14, fontFamily: "Poppins-Medium", color: "#111827" },
  countryCode: { fontSize: 14, fontFamily: "Poppins-Bold", color: Colors.primary },
});
