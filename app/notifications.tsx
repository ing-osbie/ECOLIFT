import { getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart2,
  Bell,
  Calendar,
  CheckCircle,
  Gift,
  Truck,
  Wallet,
} from 'lucide-react-native';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Collector notifications ────────────────────────────────────────────────
const COLLECTOR_NOTIFS = [
  {
    id: '1',
    icon: 'warning',
    iconBg: '#ffdad6',
    iconColor: '#ba1a1a',
    accentColor: '#ba1a1a',
    title: 'Vehicle Document Expiring Soon',
    body: 'Your vehicle registration for Truck #42 (Eco-Hauler XL) expires in 14 days. Please update your documents to avoid service interruption.',
    time: '2h ago',
    read: false,
    actions: [{ label: 'Update Docs', primary: true, color: '#ba1a1a', textColor: '#fff' }],
  },
  {
    id: '2',
    icon: 'truck',
    iconBg: '#6cf8bb',
    iconColor: '#00714d',
    accentColor: '#006c49',
    title: 'New High-Priority Job Nearby',
    body: 'A large commercial pickup request has been posted 2.4 miles away. Est. payout: GH₵ 120.',
    time: '4h ago',
    read: false,
    actions: [
      { label: 'Dismiss', primary: false, color: '#006c49', textColor: '#006c49' },
      { label: 'View Job', primary: true, color: '#006c49', textColor: '#fff' },
    ],
  },
  {
    id: '3',
    icon: 'wallet',
    iconBg: '#dce2f3',
    iconColor: '#404944',
    accentColor: null,
    title: 'Payout Successful',
    body: 'Your weekly earnings of GH₵ 845.50 have been successfully transferred to your linked MoMo account.',
    time: 'Yesterday',
    read: true,
    actions: [],
  },
  {
    id: '4',
    icon: 'chart',
    iconBg: '#b0f0d6',
    iconColor: '#002117',
    accentColor: null,
    title: 'Performance Weekly Summary',
    body: 'You completed 42 pickups last week and maintained a 4.9 star rating. Great job keeping the city clean!',
    time: 'Oct 12',
    read: true,
    actions: [{ label: 'View Stats', primary: false, color: '#003527', textColor: '#003527' }],
  },
];

// ─── Customer notifications ──────────────────────────────────────────────────
const CUSTOMER_NOTIFS = [
  {
    id: '1',
    icon: 'truck',
    iconBg: '#95d3ba',
    iconColor: '#002117',
    accentColor: null,
    title: 'Collector Nearby',
    body: 'Your EcoLift collector is 5 minutes away. Please ensure your bins are accessible.',
    time: 'Just now',
    read: false,
    actions: [{ label: 'Track Collector', primary: false, color: '#006c49', textColor: '#006c49' }],
  },
  {
    id: '2',
    icon: 'gift',
    iconBg: '#6cf8bb',
    iconColor: '#00714d',
    accentColor: null,
    title: 'Milestone Reached!',
    body: "Incredible! You've successfully recycled 50kg of plastic this year. You're making a real difference.",
    time: '2h ago',
    read: false,
    actions: [],
  },
  {
    id: '3',
    icon: 'calendar',
    iconBg: '#dce2f3',
    iconColor: '#404944',
    accentColor: '#bfc9c3',
    title: 'Pickup Scheduled',
    body: 'Your next mixed recycling pickup is confirmed for Thursday, Oct 12th between 8am and 12pm.',
    time: 'Yesterday',
    read: true,
    actions: [],
  },
  {
    id: '4',
    icon: 'gift',
    iconBg: '#003527',
    iconColor: '#b0f0d6',
    accentColor: null,
    title: 'Special Promotion',
    body: 'Refer a neighbor to EcoLift this week and you both get a free month of premium compost pickup.',
    time: 'Oct 9',
    read: true,
    cardBg: '#064e3b',
    titleColor: '#80bea6',
    bodyColor: 'rgba(176,240,214,0.9)',
    actions: [],
  },
  {
    id: '5',
    icon: 'check',
    iconBg: '#dce2f3',
    iconColor: '#404944',
    accentColor: null,
    title: 'Issue Resolved',
    body: 'The missed pickup ticket #4492 has been resolved. We apologize for the inconvenience.',
    time: 'Oct 5',
    read: true,
    actions: [],
  },
];

function NotifIcon({ icon, color }: { icon: string; color: string }) {
  const size = 22;
  if (icon === 'warning') return <AlertTriangle size={size} color={color} fill={color} />;
  if (icon === 'truck') return <Truck size={size} color={color} fill={color} />;
  if (icon === 'wallet') return <Wallet size={size} color={color} />;
  if (icon === 'chart') return <BarChart2 size={size} color={color} />;
  if (icon === 'gift') return <Gift size={size} color={color} />;
  if (icon === 'calendar') return <Calendar size={size} color={color} />;
  if (icon === 'check') return <CheckCircle size={size} color={color} />;
  return <Bell size={size} color={color} />;
}

type Notif = (typeof COLLECTOR_NOTIFS)[0] & {
  cardBg?: string;
  titleColor?: string;
  bodyColor?: string;
};

function NotifCard({ item, isDarkMode, C }: { item: Notif; isDarkMode: boolean; C: ReturnType<typeof getColors> }) {
  const cardBg = item.cardBg
    ? item.cardBg
    : item.read
      ? (isDarkMode ? C.cardSecondary : '#f0f3ff')
      : (isDarkMode ? C.card : '#e7eefe');
  const titleColor = item.titleColor ?? C.text;
  const bodyColor = item.bodyColor ?? C.greyText;

  return (
    <View style={[styles.card, { backgroundColor: cardBg }]}>
      {item.accentColor && (
        <View style={[styles.accentBar, { backgroundColor: item.accentColor }]} />
      )}
      {!item.read && <View style={styles.unreadDot} />}

      <View style={styles.cardInner}>
        <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
          <NotifIcon icon={item.icon} color={item.iconColor} />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={[styles.cardTitle, { color: titleColor }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.cardTime}>{item.time}</Text>
          </View>
          <Text style={[styles.cardBodyText, { color: bodyColor }]}>{item.body}</Text>

          {item.actions.length > 0 && (
            <View style={styles.actionsRow}>
              {item.actions.map((a, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.actionBtn,
                    a.primary && { backgroundColor: a.color },
                    !a.primary && { borderWidth: 1, borderColor: a.color },
                  ]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.actionBtnText, { color: a.textColor }]}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default function Notifications() {
  const router = useRouter();
  const { isDarkMode, notifications: appNotifs, clearNotifications } = useApp();
  const C = getColors(isDarkMode);
  const { role } = useLocalSearchParams<{ role?: string }>();
  const isCollector = role === 'collector';

  // Use live notifications from AppContext when available, otherwise fall back to static demo data
  const liveNotifs: Notif[] = appNotifs.length > 0
    ? appNotifs.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        time: n.time,
        icon: n.type === 'payment' ? 'wallet' : n.type === 'match' ? 'truck' : 'bell',
        color: n.type === 'payment' ? '#10B981' : n.type === 'match' ? '#0B3D2E' : '#F59E0B',
        category: n.type === 'payment' ? 'Payment' : n.type === 'match' ? 'Pickup' : 'System',
      }))
    : (isCollector ? COLLECTOR_NOTIFS : CUSTOMER_NOTIFS);

  const notifs: Notif[] = liveNotifs;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.screenBg }]}>
      <View style={[styles.header, { backgroundColor: C.screenBg, borderBottomColor: C.border }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: C.card, borderColor: C.border }]} onPress={() => router.back()}>
          <ArrowLeft size={20} color={C.iconPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>Notifications</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {notifs.map((item) => (
          <NotifCard key={item.id} item={item} isDarkMode={isDarkMode} C={C} />
        ))}
        <Text style={[styles.endLabel, { color: C.greyText }]}>End of notifications</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9f9ff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f8',
    backgroundColor: '#f9f9ff',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#e2e8f8',
  },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins-Bold', color: '#151c27' },

  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60, gap: 12 },

  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  unreadDot: {
    position: 'absolute', top: 14, right: 14,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#ba1a1a',
  },
  cardInner: { flexDirection: 'row', gap: 12, padding: 16, paddingLeft: 20 },
  iconCircle: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardBody: { flex: 1, gap: 4 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardTitle: { fontSize: 14, fontFamily: 'Poppins-SemiBold', flex: 1 },
  cardTime: { fontSize: 11, fontFamily: 'Poppins-Medium', color: '#707974', flexShrink: 0 },
  cardBodyText: { fontSize: 13, fontFamily: 'Poppins-Medium', lineHeight: 19 },

  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  actionBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnText: { fontSize: 12, fontFamily: 'Poppins-Bold' },

  endLabel: {
    textAlign: 'center', fontSize: 12,
    fontFamily: 'Poppins-Medium', color: '#bfc9c3', marginTop: 8,
  },
});
