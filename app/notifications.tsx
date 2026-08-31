import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GradientBackground } from '@/components/gradient-background';
import { GlassCard } from '@/components/glass-card';
import { Colors, getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/src/context/AuthContext';
import { getNotifications, markAllNotificationsRead, clearNotifications } from '@/src/services/notifications';
import { Bell, CreditCard, CheckCircle2, Info, ArrowLeft, Trash2, Package } from 'lucide-react-native';

interface NotifItem {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function Notifications() {
  const router = useRouter();
  const { isDarkMode } = useApp();
  const { user } = useAuth();
  const C = getColors(isDarkMode);

  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    const data = await getNotifications(user.id);
    setNotifications(data as NotifItem[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const handleClear = async () => {
    if (!user?.id) return;
    await clearNotifications(user.id);
    setNotifications([]);
  };

  const getIcon = (type: string) => {
    const size = 18;
    if (type === 'payment') return <View style={[styles.iconCircle, { backgroundColor: 'rgba(182,255,60,0.15)' }]}><CreditCard size={size} color={C.primary} /></View>;
    if (type === 'order') return <View style={[styles.iconCircle, { backgroundColor: 'rgba(16,185,129,0.12)' }]}><Package size={size} color="#10B981" /></View>;
    if (type === 'match') return <View style={[styles.iconCircle, { backgroundColor: 'rgba(11,61,46,0.1)' }]}><CheckCircle2 size={size} color={C.primary} /></View>;
    return <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#2C2C2E' : '#F3F4F6' }]}><Info size={size} color={C.greyText} /></View>;
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString([], { dateStyle: 'medium' });
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF' }]}>
            <ArrowLeft size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.text }]}>Notifications</Text>
          {notifications.length > 0 ? (
            <TouchableOpacity onPress={handleClear} style={[styles.headerBtn, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF' }]}>
              <Trash2 size={20} color={Colors.danger} />
            </TouchableOpacity>
          ) : <View style={{ width: 40 }} />}
        </View>

        {loading ? (
          <View style={styles.centered}><ActivityIndicator color={C.primary} /></View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onRefresh={load}
            refreshing={loading}
            renderItem={({ item }) => (
              <GlassCard style={[styles.card, !item.is_read && { borderLeftWidth: 3, borderLeftColor: C.primary }]}>
                <View style={styles.row}>
                  {getIcon(item.type)}
                  <View style={styles.textWrap}>
                    <Text style={[styles.title, { color: C.text }]}>{item.title}</Text>
                    <Text style={[styles.body, { color: C.greyText }]}>{item.body}</Text>
                    <Text style={[styles.time, { color: C.greyText }]}>{formatTime(item.created_at)}</Text>
                  </View>
                  {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: C.primary }]} />}
                </View>
              </GlassCard>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Bell size={48} color={C.greyText} />
                <Text style={[styles.emptyTitle, { color: C.text }]}>All caught up!</Text>
                <Text style={[styles.emptySub, { color: C.greyText }]}>No notifications yet.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  headerTitle: { fontSize: 20, fontFamily: 'Poppins-Bold' },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },
  card: { paddingVertical: 14, paddingHorizontal: 14, borderRadius: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1 },
  title: { fontSize: 14, fontFamily: 'Poppins-Bold' },
  body: { fontSize: 12, fontFamily: 'Poppins-Medium', marginTop: 2, lineHeight: 17 },
  time: { fontSize: 10, fontFamily: 'Poppins-Medium', marginTop: 5 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100, gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: 'Poppins-Bold' },
  emptySub: { fontSize: 13, fontFamily: 'Poppins-Medium' },
});
