import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/src/context/AuthContext';
import { CustomAlert, useCustomAlert } from '@/components/custom-alert';
import { useRouter } from 'expo-router';
import {
  Camera,
  ChevronRight,
  FileText,
  HelpCircle,
  LogOut,
  Map,
  Star,
  Truck,
} from 'lucide-react-native';
import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LOGO_URI = 'https://lh3.googleusercontent.com/aida/AEtjO1XcXV5fbdHGNsqeCGly0UlSej52rtC_mjiNz-wgtk0IBvm41436Cn7_bH9IuDiDvPj1XQSSO44Hr7AyapNiRtQB5kBbalFGbLkan0qIhiWUqxd8wsp5doOx5bEsgKli46jrIB_MALi29-JIacOn2bNGMtxgtTwDyKeQcm2blObJA3fmUpgrt2IV1okVTRPF8nMFwl28EpQTFJGxSZp_CpCW8WoJpcSQKvN-XoqbMu_XpGLQPiuWQgR6DJaPWS5IlNcQiXDOgKPOvw';
const AVATAR_URI = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBra7RcuLU2ybITetkUUVNf-6GLKKzsC7-R4XTOw-6T4vtoV02gANtANXs5d2XLcTCT4l68LN5OBzh3dUHZ42rEbApL5gu98LL2fUdcWp7AWbr8GcNVL0jkKXaA-ekMWUgt8EncOpJgyxS-vIKZBVzB7qqqE31I11XN4DfNYDvmn4Ynvdw9ylnbiWeQPg_jifhOU3i8kFt76ptvdpnpRszNySObiXAZv3rgiJIEcneeQD-b6m4wRO74';

export default function CollectorProfile() {
  const router = useRouter();
  const { userName, userPhone, setIsLoggedIn } = useApp();
  const { signOut } = useAuth();
  const { showAlert, alertProps } = useCustomAlert();

  const handleLogout = async () => {
    try { await signOut(); } catch {}
    setIsLoggedIn(false);
    router.replace('/login');
  };

  const menuItems = [
    {
      id: 'vehicle',
      title: 'Vehicle / Cart Type',
      sub: 'Tricycle Pro (EV)',
      iconBg: '#6cf8bb',
      icon: <Truck size={20} color="#003527" />,
      onPress: () => router.push('/vehicle-type' as any),
    },
    {
      id: 'area',
      title: 'Service Area',
      sub: 'Airport Residential, Cantonments',
      iconBg: '#d9e6dd',
      icon: <Map size={20} color="#003527" />,
      onPress: () => showAlert({ type: 'info', title: 'Service Area', message: 'Current Zone: Airport Residential, Accra. Contact support to update.' }),
    },
    {
      id: 'payout',
      title: 'Payout Method',
      sub: `MTN Mobile Money (***4920)`,
      iconBg: '#b0f0d6',
      icon: <FileText size={20} color="#003527" />,
      onPress: () => showAlert({ type: 'success', title: 'Payout Method', message: `MoMo account linked and verified for weekly disbursements.` }),
    },
    {
      id: 'docs',
      title: 'Verification Documents',
      sub: 'Status: Verified & Up to Date',
      subColor: '#006c49',
      iconBg: '#dce2f3',
      icon: <FileText size={20} color="#404944" />,
      verified: true,
      onPress: () => router.push('/upload-id' as any),
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Decorative header bg */}
        <View style={styles.headerDecor} />

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarGlow} />
            <Image source={{ uri: AVATAR_URI }} style={styles.avatar} />
            <TouchableOpacity style={styles.cameraBtn}>
              <Camera size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{userName || 'Osborn Mensah'}</Text>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedBadgeText}>✓  Verified Ecolift Collector</Text>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>4.9</Text>
              <View style={styles.starsRow}>
                {[1,2,3,4].map(i => <Star key={i} size={11} color="#006c49" fill="#006c49" />)}
                <Star size={11} color="#006c49" />
              </View>
              <Text style={styles.statLabel}>142 Reviews</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>850</Text>
              <Text style={styles.statLabel}>Pickups Completed</Text>
            </View>
          </View>
        </View>

        {/* Account Settings */}
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <View style={styles.menuList}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuRow} onPress={item.onPress} activeOpacity={0.85}>
              <View style={[styles.menuIconCircle, { backgroundColor: item.iconBg }]}>
                {item.icon}
                {item.verified && (
                  <View style={styles.verifiedDot}>
                    <Text style={{ fontSize: 7, color: '#fff', fontFamily: 'Poppins-Bold' }}>✓</Text>
                  </View>
                )}
              </View>
              <View style={styles.menuMeta}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={[styles.menuSub, item.subColor ? { color: item.subColor } : {}]}>{item.sub}</Text>
              </View>
              <ChevronRight size={18} color="#707974" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Support */}
        <TouchableOpacity style={styles.supportRow} onPress={() => router.push('/support' as any)} activeOpacity={0.85}>
          <View style={[styles.menuIconCircle, { backgroundColor: '#ffdad6' }]}>
            <HelpCircle size={20} color="#93000a" />
          </View>
          <View style={styles.menuMeta}>
            <Text style={styles.menuTitle}>Contact Support</Text>
          </View>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} activeOpacity={0.85}>
          <View style={[styles.menuIconCircle, { backgroundColor: '#ffdad6' }]}>
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
  safe: { flex: 1, backgroundColor: '#f9f9ff' },
  scroll: { paddingBottom: 120 },

  headerDecor: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 180,
    backgroundColor: 'rgba(0,53,39,0.06)',
  },

  avatarSection: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, paddingHorizontal: 20 },
  avatarWrapper: { position: 'relative', marginBottom: 14 },
  avatarGlow: { position: 'absolute', inset: -6, borderRadius: 70, backgroundColor: '#6cf8bb', opacity: 0.35, width: 140, height: 140, top: -6, left: -6 },
  avatar: { width: 128, height: 128, borderRadius: 64, borderWidth: 4, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 5 },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 38, height: 38, borderRadius: 19, backgroundColor: '#003527', alignItems: 'center', justifyContent: 'center', shadowColor: '#003527', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  userName: { fontSize: 24, fontFamily: 'Poppins-Bold', color: '#151c27', marginBottom: 8 },
  verifiedBadge: { backgroundColor: '#064e3b', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  verifiedBadgeText: { fontSize: 12, fontFamily: 'Poppins-SemiBold', color: '#80bea6', letterSpacing: 0.3 },

  statsRow: { flexDirection: 'row', gap: 12, width: '100%' },
  statCard: { flex: 1, backgroundColor: '#e2e8f8', borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontFamily: 'Poppins-Bold', color: '#003527' },
  starsRow: { flexDirection: 'row', gap: 2 },
  statLabel: { fontSize: 11, fontFamily: 'Poppins-Medium', color: '#404944', textAlign: 'center' },

  sectionTitle: { fontSize: 17, fontFamily: 'Poppins-Bold', color: '#151c27', paddingHorizontal: 20, marginBottom: 10 },

  menuList: { paddingHorizontal: 20, gap: 10, marginBottom: 10 },
  menuRow: { backgroundColor: '#e7eefe', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
  supportRow: { marginHorizontal: 20, marginBottom: 10, backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  logoutRow: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },

  menuIconCircle: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  verifiedDot: { position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#006c49', borderWidth: 2, borderColor: '#e7eefe', alignItems: 'center', justifyContent: 'center' },
  menuMeta: { flex: 1 },
  menuTitle: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#151c27' },
  menuSub: { fontSize: 11, fontFamily: 'Poppins-Medium', color: '#404944', marginTop: 1 },
});
