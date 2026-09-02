import { CustomAlert, useCustomAlert } from '@/components/custom-alert';
import { getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'expo-router';
import {
  Camera,
  ChevronRight,
  FileText,
  HelpCircle,
  LogOut,
  Map,
  Moon,
  Star,
  Sun,
  Truck,
  User,
} from 'lucide-react-native';
import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AVATAR_URI = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBra7RcuLU2ybITetkUUVNf-6GLKKzsC7-R4XTOw-6T4vtoV02gANtANXs5d2XLcTCT4l68LN5OBzh3dUHZ42rEbApL5gu98LL2fUdcWp7AWbr8GcNVL0jkKXaA-ekMWUgt8EncOpJgyxS-vIKZBVzB7qqqE31I11XN4DfNYDvmn4Ynvdw9ylnbiWeQPg_jifhOU3i8kFt76ptvdpnpRszNySObiXAZv3rgiJIEcneeQD-b6m4wRO74';

export default function CollectorProfile() {
  const router = useRouter();
  const { userName, setIsLoggedIn, isDarkMode, toggleDarkMode } = useApp();
  const { signOut } = useAuth();
  const { showAlert, alertProps } = useCustomAlert();
  const C = getColors(isDarkMode);

  const handleLogout = async () => {
    try { await signOut(); } catch {}
    setIsLoggedIn(false);
    router.replace('/login');
  };

  const menuItems = [
    {
      id: 'edit-profile',
      title: 'Edit Profile',
      sub: 'Update your personal info',
      iconBg: isDarkMode ? '#1e2e24' : '#d9e6dd',
      iconColor: isDarkMode ? '#95d3ba' : '#003527',
      icon: User,
      onPress: () => router.push('/edit-profile' as any),
    },
    {
      id: 'vehicle',
      title: 'Vehicle / Cart Type',
      sub: 'Tricycle Pro (EV)',
      iconBg: isDarkMode ? '#1a3d2e' : '#6cf8bb',
      iconColor: isDarkMode ? '#6cf8bb' : '#003527',
      icon: Truck,
      onPress: () => router.push('/vehicle-type' as any),
    },
    {
      id: 'area',
      title: 'Service Area',
      sub: 'Airport Residential, Cantonments',
      iconBg: isDarkMode ? '#1e2e24' : '#d9e6dd',
      iconColor: isDarkMode ? '#95d3ba' : '#003527',
      icon: Map,
      onPress: () => showAlert({ type: 'info', title: 'Service Area', message: 'Current Zone: Airport Residential, Accra. Contact support to update.' }),
    },
    {
      id: 'payout',
      title: 'Payout Method',
      sub: 'MTN Mobile Money (***4920)',
      iconBg: isDarkMode ? '#1a3530' : '#b0f0d6',
      iconColor: isDarkMode ? '#4edea3' : '#003527',
      icon: FileText,
      onPress: () => showAlert({ type: 'success', title: 'Payout Method', message: 'MoMo account linked and verified for weekly disbursements.' }),
    },
    {
      id: 'docs',
      title: 'Verification Documents',
      sub: 'Status: Verified & Up to Date',
      subColor: isDarkMode ? '#4edea3' : '#006c49',
      iconBg: isDarkMode ? '#1e2535' : '#dce2f3',
      iconColor: isDarkMode ? '#a0aec0' : '#404944',
      icon: FileText,
      verified: true,
      onPress: () => router.push('/upload-id' as any),
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.screenBg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Decorative header bg */}
        <View style={[styles.headerDecor, { backgroundColor: isDarkMode ? 'rgba(182,255,60,0.04)' : 'rgba(0,53,39,0.06)' }]} />

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarGlow, { backgroundColor: isDarkMode ? '#B6FF3C' : '#6cf8bb' }]} />
            <Image source={{ uri: AVATAR_URI }} style={[styles.avatar, { borderColor: C.card }]} />
            <TouchableOpacity style={[styles.cameraBtn, { backgroundColor: C.iconPrimary }]}>
              <Camera size={18} color={isDarkMode ? '#0B3D2E' : '#fff'} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.userName, { color: C.text }]}>{userName || 'Osborn Mensah'}</Text>
          <View style={[styles.verifiedBadge, { backgroundColor: isDarkMode ? '#1a3d2e' : '#064e3b' }]}>
            <Text style={[styles.verifiedBadgeText, { color: isDarkMode ? '#6cf8bb' : '#80bea6' }]}>✓  Verified Ecolift Collector</Text>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: C.cardSecondary }]}>
              <Text style={[styles.statValue, { color: C.iconPrimary }]}>4.9</Text>
              <View style={styles.starsRow}>
                {[1,2,3,4].map(i => <Star key={i} size={11} color={isDarkMode ? '#B6FF3C' : '#006c49'} fill={isDarkMode ? '#B6FF3C' : '#006c49'} />)}
                <Star size={11} color={isDarkMode ? '#B6FF3C' : '#006c49'} />
              </View>
              <Text style={[styles.statLabel, { color: C.greyText }]}>142 Reviews</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: C.cardSecondary }]}>
              <Text style={[styles.statValue, { color: C.iconPrimary }]}>850</Text>
              <Text style={[styles.statLabel, { color: C.greyText }]}>Pickups Completed</Text>
            </View>
          </View>
        </View>

        {/* Account Settings */}
        <Text style={[styles.sectionTitle, { color: C.text }]}>Account Settings</Text>
        <View style={styles.menuList}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuRow, { backgroundColor: C.cardSecondary, borderColor: C.border }]}
              onPress={item.onPress}
              activeOpacity={0.85}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: item.iconBg }]}>
                <item.icon size={20} color={item.iconColor} />
                {item.verified && (
                  <View style={[styles.verifiedDot, { borderColor: C.cardSecondary }]}>
                    <Text style={{ fontSize: 7, color: '#fff', fontFamily: 'Poppins-Bold' }}>✓</Text>
                  </View>
                )}
              </View>
              <View style={styles.menuMeta}>
                <Text style={[styles.menuTitle, { color: C.text }]}>{item.title}</Text>
                <Text style={[styles.menuSub, { color: item.subColor ?? C.greyText }]}>{item.sub}</Text>
              </View>
              <ChevronRight size={18} color={C.greyText} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Dark Mode Toggle */}
        <Text style={[styles.sectionTitle, { color: C.text }]}>Preferences</Text>
        <View style={[styles.darkModeRow, { backgroundColor: C.cardSecondary, borderColor: C.border }]}>
          <View style={[styles.menuIconCircle, { backgroundColor: isDarkMode ? '#2a2a1a' : '#fef9c3' }]}>
            {isDarkMode
              ? <Moon size={20} color="#B6FF3C" />
              : <Sun size={20} color="#d97706" />}
          </View>
          <View style={styles.menuMeta}>
            <Text style={[styles.menuTitle, { color: C.text }]}>Dark Mode</Text>
            <Text style={[styles.menuSub, { color: C.greyText }]}>{isDarkMode ? 'Dark theme active' : 'Light theme active'}</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#dce2f3', true: isDarkMode ? '#B6FF3C' : '#003527' }}
            thumbColor={isDarkMode ? '#0B3D2E' : '#f9f9ff'}
          />
        </View>

        {/* Support */}
        <TouchableOpacity
          style={[styles.utilRow, { backgroundColor: C.card, borderColor: C.border }]}
          onPress={() => router.push('/support' as any)}
          activeOpacity={0.85}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: isDarkMode ? '#2d1a1a' : '#ffdad6' }]}>
            <HelpCircle size={20} color={isDarkMode ? '#ff8a80' : '#93000a'} />
          </View>
          <View style={styles.menuMeta}>
            <Text style={[styles.menuTitle, { color: C.text }]}>Contact Support</Text>
          </View>
          <ChevronRight size={18} color={C.greyText} />
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.utilRow, { backgroundColor: C.card, borderColor: C.border }]}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: isDarkMode ? '#2d1a1a' : '#ffdad6' }]}>
            <LogOut size={20} color="#ba1a1a" />
          </View>
          <View style={styles.menuMeta}>
            <Text style={[styles.menuTitle, { color: '#ba1a1a' }]}>Log Out</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
      <CustomAlert {...alertProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 120 },

  headerDecor: { position: 'absolute', top: 0, left: 0, right: 0, height: 180 },

  avatarSection: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, paddingHorizontal: 20 },
  avatarWrapper: { position: 'relative', marginBottom: 14 },
  avatarGlow: { position: 'absolute', width: 140, height: 140, borderRadius: 70, opacity: 0.35, top: -6, left: -6 },
  avatar: { width: 128, height: 128, borderRadius: 64, borderWidth: 4 },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  userName: { fontSize: 24, fontFamily: 'Poppins-Bold', marginBottom: 8 },
  verifiedBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  verifiedBadgeText: { fontSize: 12, fontFamily: 'Poppins-SemiBold', letterSpacing: 0.3 },

  statsRow: { flexDirection: 'row', gap: 12, width: '100%' },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontFamily: 'Poppins-Bold' },
  starsRow: { flexDirection: 'row', gap: 2 },
  statLabel: { fontSize: 11, fontFamily: 'Poppins-Medium', textAlign: 'center' },

  sectionTitle: { fontSize: 17, fontFamily: 'Poppins-Bold', paddingHorizontal: 20, marginBottom: 10, marginTop: 4 },

  menuList: { paddingHorizontal: 20, gap: 10, marginBottom: 14 },
  menuRow: { borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1 },
  darkModeRow: { marginHorizontal: 20, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, marginBottom: 14 },
  utilRow: { marginHorizontal: 20, marginBottom: 10, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1 },

  menuIconCircle: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  verifiedDot: { position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#006c49', borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  menuMeta: { flex: 1 },
  menuTitle: { fontSize: 14, fontFamily: 'Poppins-SemiBold' },
  menuSub: { fontSize: 11, fontFamily: 'Poppins-Medium', marginTop: 1 },
});
