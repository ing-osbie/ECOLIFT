import { CollectorHeader } from '@/components/collector-header';
import { CustomAlert, useCustomAlert } from '@/components/custom-alert';
import { GlassCard } from '@/components/glass-card';
import { PickupStatusStepper } from '@/components/pickup-status-stepper';
import { Colors, getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { MapPin, Navigation, PackageCheck, Phone, MessageSquare, Truck } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Filter = 'Active' | 'Scheduled' | 'Completed';

interface UiPickup {
  id: string;
  filter: Filter;
  name: string;
  phone?: string;
  address: string;
  type: string;
  weight: string;
  slot: string;
  mapUri: string;
  isLive?: boolean;
}

const STATIC_PICKUPS: UiPickup[] = [
  {
    id: '1',
    filter: 'Active',
    name: 'Sarah Jenkins',
    phone: '+233 24 123 4567',
    address: '123 Eco Way, Apt 4B',
    type: 'Plastic',
    weight: '15 kg',
    slot: '09:00 - 10:30',
    mapUri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6SXyMnw7zoABp42rKDwnhBlpoRIw495UZZP3P45rBdM6gyKFQb-GiMfCYPLpeQ6rRrWtaNRZftWPgZY-5bVSAJ7EjaI7GOTm3k9xpqA_ovuwS8sqA6izHSuZkKozgkpgoQO-WVIWVAYCYbCmnCTD7szpASCWRZtPSnGQrJmYRheXEZHhOXwiq4_ceW2PZcVVsxlzsEfiEGvAxSNWoqsoRZy4vCTyy8rmmh7vC0TxaCloZn8nNUCzq',
  },
  {
    id: '2',
    filter: 'Active',
    name: 'Marcus Reed',
    phone: '+233 20 987 6543',
    address: '456 Green Blvd, Suite 2',
    type: 'Mixed Metals',
    weight: '42 kg',
    slot: '11:00 - 12:30',
    mapUri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCD0maMjXAeqE7tv88lia5dobGYGXtiBEtBlU0mzoOk1rWEZ2mHos5VB7ItLBY2s4IQ3lALSbbm15vJFXP71S-yDLu3VmphbvmmSJDRiNKxxAD_h4J1L89zTop0kF5nQLtB_M16jdBYL-Ylogyd6bgRd3CDm6q3nZi6ui6Ca2-Agpp5zFoAuqzfTux7VDGX_7bU3PHczpR1JFWZ_Wa2wwjKqeu--NO96A7h8yUbmaLBJGlPbKF8gAGS',
  },
  {
    id: '3',
    filter: 'Scheduled',
    name: 'Abena Serwaa',
    phone: '+233 55 456 7890',
    address: 'Osu RE, Ring Road',
    type: 'Cardboard',
    weight: '28 kg',
    slot: '14:00 - 15:30',
    mapUri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6SXyMnw7zoABp42rKDwnhBlpoRIw495UZZP3P45rBdM6gyKFQb-GiMfCYPLpeQ6rRrWtaNRZftWPgZY-5bVSAJ7EjaI7GOTm3k9xpqA_ovuwS8sqA6izHSuZkKozgkpgoQO-WVIWVAYCYbCmnCTD7szpASCWRZtPSnGQrJmYRheXEZHhOXwiq4_ceW2PZcVVsxlzsEfiEGvAxSNWoqsoRZy4vCTyy8rmmh7vC0TxaCloZn8nNUCzq',
  },
  {
    id: '4',
    filter: 'Completed',
    name: 'Kwame Asante',
    phone: '+233 27 345 6789',
    address: 'East Legon, Accra',
    type: 'Mixed',
    weight: '35 kg',
    slot: '08:00 - 09:30',
    mapUri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCD0maMjXAeqE7tv88lia5dobGYGXtiBEtBlU0mzoOk1rWEZ2mHos5VB7ItLBY2s4IQ3lALSbbm15vJFXP71S-yDLu3VmphbvmmSJDRiNKxxAD_h4J1L89zTop0kF5nQLtB_M16jdBYL-Ylogyd6bgRd3CDm6q3nZi6ui6Ca2-Agpp5zFoAuqzfTux7VDGX_7bU3PHczpR1JFWZ_Wa2wwjKqeu--NO96A7h8yUbmaLBJGlPbKF8gAGS',
  },
];

const FILTERS: Filter[] = ['Active', 'Scheduled', 'Completed'];

export default function PickupDashboard() {
  const router = useRouter();
  const { isDarkMode, collectorJobs } = useApp();
  const C = getColors(isDarkMode);
  const { showAlert, alertProps } = useCustomAlert();
  const [filter, setFilter] = useState<Filter>('Active');

  const allPickups = useMemo(() => {
    const liveItems: UiPickup[] = (collectorJobs || []).map((job) => {
      let f: Filter = 'Active';
      if (job.status === 'Completed') f = 'Completed';
      else if (job.status === 'Cancelled' || job.status === 'Missed') f = 'Scheduled';
      return {
        id: job.id,
        filter: f,
        name: job.customerName || 'Customer',
        address: job.address || 'Pickup Location',
        type: job.wasteType || 'General Waste',
        weight: '25 kg',
        slot: job.date || 'Today (Flexible)',
        mapUri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6SXyMnw7zoABp42rKDwnhBlpoRIw495UZZP3P45rBdM6gyKFQb-GiMfCYPLpeQ6rRrWtaNRZftWPgZY-5bVSAJ7EjaI7GOTm3k9xpqA_ovuwS8sqA6izHSuZkKozgkpgoQO-WVIWVAYCYbCmnCTD7szpASCWRZtPSnGQrJmYRheXEZHhOXwiq4_ceW2PZcVVsxlzsEfiEGvAxSNWoqsoRZy4vCTyy8rmmh7vC0TxaCloZn8nNUCzq',
        isLive: true,
      };
    });

    return [...liveItems, ...STATIC_PICKUPS];
  }, [collectorJobs]);

  const activeCount = allPickups.filter((p) => p.filter === 'Active').length;
  const scheduledCount = allPickups.filter((p) => p.filter === 'Scheduled').length;
  const visible = allPickups.filter((p) => p.filter === filter);

  const handleStartPickup = (pickup: UiPickup) => {
    showAlert({
      type: 'info',
      title: `Pickup: ${pickup.name}`,
      message: `Address: ${pickup.address}\nWaste: ${pickup.type} (${pickup.weight})\n\nSelect an action:`,
      actions: [
        {
          label: 'Navigate to Map',
          variant: 'primary',
          onPress: () => router.push('/(tabs-collector)' as any),
        },
        {
          label: 'Call Customer',
          onPress: () => router.push({ pathname: '/call', params: { name: pickup.name } } as any),
        },
        {
          label: 'Chat Customer',
          onPress: () => router.push({ pathname: '/chat', params: { name: pickup.name } } as any),
        },
      ],
    });
  };

  const handleViewDetails = (pickup: UiPickup) => {
    showAlert({
      type: 'info',
      title: 'Scheduled Pickup Details',
      message: `Customer: ${pickup.name}\nAddress: ${pickup.address}\nTime Slot: ${pickup.slot}\nWaste Category: ${pickup.type}`,
      actions: [
        {
          label: 'Contact Customer',
          onPress: () => router.push({ pathname: '/chat', params: { name: pickup.name } } as any),
        },
        {
          label: 'Close',
          variant: 'secondary',
          onPress: () => {},
        },
      ],
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.screenBg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <CollectorHeader title="Pickups" subtitle="Manage your route" unread={3} />

        {/* Route summary */}
        <View style={[styles.routeCard, { backgroundColor: C.cardSecondary, borderColor: C.border }]}>
          <Text style={[styles.routeTitle, { color: C.text }]}>Today's Route</Text>
          <View style={styles.routeMeta}>
            <Text style={[styles.routeMetaText, { color: C.greyText }]}>
              🕐 {activeCount} Active · {scheduledCount} Scheduled
            </Text>
          </View>
        </View>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                { backgroundColor: C.chipBg },
                filter === f && { backgroundColor: C.primary },
              ]}
              onPress={() => setFilter(f)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: C.greyText },
                  filter === f && { color: isDarkMode ? '#0B3D2E' : '#FFFFFF', fontFamily: 'Poppins-Bold' },
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Pickup cards */}
        <View style={styles.cardList}>
          {visible.length === 0 && (
            <GlassCard style={styles.emptyCard}>
              <PackageCheck size={36} color={C.primary} />
              <Text style={[styles.emptyTitle, { color: C.text }]}>No {filter.toLowerCase()} pickups</Text>
              <Text style={[styles.emptySub, { color: C.greyText }]}>
                Check other tabs or wait for new dispatch offers in your area.
              </Text>
            </GlassCard>
          )}

          {visible.map((p) => (
            <View key={p.id} style={[styles.pickupCard, { backgroundColor: C.card, borderColor: C.border }]}>
              {/* Accent top bar */}
              <View style={[styles.accentBar, { backgroundColor: C.primary }]} />

              {/* Map thumbnail */}
              <Image source={{ uri: p.mapUri }} style={styles.mapThumb} resizeMode="cover" />

              <View style={styles.cardBody}>
                {/* Name + type badge */}
                <View style={styles.cardTopRow}>
                  <View>
                    <Text style={[styles.customerName, { color: C.text }]}>{p.name}</Text>
                    <View style={styles.addressRow}>
                      <MapPin size={12} color={C.greyText} />
                      <Text style={[styles.addressText, { color: C.greyText }]}>{p.address}</Text>
                    </View>
                  </View>
                  <View style={[styles.typeBadge, { backgroundColor: isDarkMode ? 'rgba(182,255,60,0.15)' : 'rgba(11,61,46,0.08)' }]}>
                    <Text style={[styles.typeBadgeText, { color: C.primary }]}>{p.type}</Text>
                  </View>
                </View>

                {/* Status Stepper */}
                <PickupStatusStepper
                  currentStatus={filter === 'Active' ? 'en_route' : filter === 'Completed' ? 'completed' : 'assigned'}
                />

                {/* Weight + slot */}
                <View style={[styles.statsRow, { borderTopColor: C.border }]}>
                  <View>
                    <Text style={[styles.statLabel, { color: C.greyText }]}>EST. WEIGHT</Text>
                    <Text style={[styles.statValue, { color: C.text }]}>{p.weight}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.statLabel, { color: C.greyText }]}>TIME SLOT</Text>
                    <Text style={[styles.statValue, { color: C.primary }]}>{p.slot}</Text>
                  </View>
                </View>

                {/* Action buttons */}
                {filter === 'Active' ? (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.mapBtn, { backgroundColor: C.cardSecondary }]}
                      onPress={() => router.push('/(tabs-collector)' as any)}
                      activeOpacity={0.8}
                    >
                      <Navigation size={16} color={C.text} />
                      <Text style={[styles.mapBtnText, { color: C.text }]}>Map</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.startBtn, { backgroundColor: C.primary }]}
                      onPress={() => handleStartPickup(p)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.startBtnText, { color: isDarkMode ? '#0B3D2E' : '#FFFFFF' }]}>
                        Start Pickup →
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : filter === 'Scheduled' ? (
                  <TouchableOpacity
                    style={[styles.detailsBtn, { backgroundColor: C.cardSecondary }]}
                    onPress={() => handleViewDetails(p)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.detailsBtnText, { color: C.text }]}>View Details</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.completedBadge, { backgroundColor: isDarkMode ? 'rgba(182,255,60,0.15)' : 'rgba(11,61,46,0.08)' }]}>
                    <Text style={[styles.completedBadgeText, { color: C.primary }]}>✓ Completed</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
      <CustomAlert {...alertProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120, gap: 14 },

  routeCard: { borderRadius: 14, padding: 16, gap: 6, borderWidth: 1 },
  routeTitle: { fontSize: 22, fontFamily: 'Poppins-Bold' },
  routeMeta: { flexDirection: 'row', alignItems: 'center' },
  routeMetaText: { fontSize: 13, fontFamily: 'Poppins-Medium' },

  filterScroll: { flexGrow: 0 },
  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  filterChipText: { fontSize: 13, fontFamily: 'Poppins-SemiBold' },

  cardList: { gap: 14 },
  emptyCard: { alignItems: 'center', paddingVertical: 32, gap: 8, borderRadius: 16 },
  emptyTitle: { fontSize: 16, fontFamily: 'Poppins-Bold' },
  emptySub: { fontSize: 12, fontFamily: 'Poppins-Medium', textAlign: 'center', maxWidth: 260 },

  pickupCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  accentBar: { height: 4, width: '100%' },
  mapThumb: { width: '100%', height: 120 },
  cardBody: { padding: 14, gap: 12 },

  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  customerName: { fontSize: 16, fontFamily: 'Poppins-Bold' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  addressText: { fontSize: 12, fontFamily: 'Poppins-Medium' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText: { fontSize: 11, fontFamily: 'Poppins-Bold' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1 },
  statLabel: { fontSize: 10, fontFamily: 'Poppins-Bold', letterSpacing: 0.5 },
  statValue: { fontSize: 16, fontFamily: 'Poppins-Bold', marginTop: 2 },

  actionRow: { flexDirection: 'row', gap: 10 },
  mapBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, paddingVertical: 12 },
  mapBtnText: { fontSize: 13, fontFamily: 'Poppins-SemiBold' },
  startBtn: { flex: 2, alignItems: 'center', justifyContent: 'center', borderRadius: 10, paddingVertical: 12 },
  startBtnText: { fontSize: 13, fontFamily: 'Poppins-Bold' },

  detailsBtn: { alignItems: 'center', justifyContent: 'center', borderRadius: 10, paddingVertical: 12 },
  detailsBtnText: { fontSize: 13, fontFamily: 'Poppins-SemiBold' },

  completedBadge: { alignItems: 'center', justifyContent: 'center', borderRadius: 10, paddingVertical: 10 },
  completedBadgeText: { fontSize: 13, fontFamily: 'Poppins-Bold' },
});
