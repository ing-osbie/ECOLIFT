import { useRouter } from 'expo-router';
import { MapPin, Navigation } from 'lucide-react-native';
import React, { useState } from 'react';
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

const PICKUPS = [
  {
    id: '1',
    filter: 'Active' as Filter,
    name: 'Sarah Jenkins',
    address: '123 Eco Way, Apt 4B',
    type: 'Plastic',
    weight: '15 kg',
    slot: '09:00 - 10:30',
    mapUri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6SXyMnw7zoABp42rKDwnhBlpoRIw495UZZP3P45rBdM6gyKFQb-GiMfCYPLpeQ6rRrWtaNRZftWPgZY-5bVSAJ7EjaI7GOTm3k9xpqA_ovuwS8sqA6izHSuZkKozgkpgoQO-WVIWVAYCYbCmnCTD7szpASCWRZtPSnGQrJmYRheXEZHhOXwiq4_ceW2PZcVVsxlzsEfiEGvAxSNWoqsoRZy4vCTyy8rmmh7vC0TxaCloZn8nNUCzq',
    accentColor: '#003527',
  },
  {
    id: '2',
    filter: 'Active' as Filter,
    name: 'Marcus Reed',
    address: '456 Green Blvd, Suite 2',
    type: 'Mixed Metals',
    weight: '42 kg',
    slot: '11:00 - 12:30',
    mapUri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCD0maMjXAeqE7tv88lia5dobGYGXtiBEtBlU0mzoOk1rWEZ2mHos5VB7ItLBY2s4IQ3lALSbbm15vJFXP71S-yDLu3VmphbvmmSJDRiNKxxAD_h4J1L89zTop0kF5nQLtB_M16jdBYL-Ylogyd6bgRd3CDm6q3nZi6ui6Ca2-Agpp5zFoAuqzfTux7VDGX_7bU3PHczpR1JFWZ_Wa2wwjKqeu--NO96A7h8yUbmaLBJGlPbKF8gAGS',
    accentColor: '#4edea3',
  },
  {
    id: '3',
    filter: 'Scheduled' as Filter,
    name: 'Abena Serwaa',
    address: 'Osu RE, Ring Road',
    type: 'Cardboard',
    weight: '28 kg',
    slot: '14:00 - 15:30',
    mapUri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6SXyMnw7zoABp42rKDwnhBlpoRIw495UZZP3P45rBdM6gyKFQb-GiMfCYPLpeQ6rRrWtaNRZftWPgZY-5bVSAJ7EjaI7GOTm3k9xpqA_ovuwS8sqA6izHSuZkKozgkpgoQO-WVIWVAYCYbCmnCTD7szpASCWRZtPSnGQrJmYRheXEZHhOXwiq4_ceW2PZcVVsxlzsEfiEGvAxSNWoqsoRZy4vCTyy8rmmh7vC0TxaCloZn8nNUCzq',
    accentColor: '#003527',
  },
  {
    id: '4',
    filter: 'Completed' as Filter,
    name: 'Kwame Asante',
    address: 'East Legon, Accra',
    type: 'Mixed',
    weight: '35 kg',
    slot: '08:00 - 09:30',
    mapUri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCD0maMjXAeqE7tv88lia5dobGYGXtiBEtBlU0mzoOk1rWEZ2mHos5VB7ItLBY2s4IQ3lALSbbm15vJFXP71S-yDLu3VmphbvmmSJDRiNKxxAD_h4J1L89zTop0kF5nQLtB_M16jdBYL-Ylogyd6bgRd3CDm6q3nZi6ui6Ca2-Agpp5zFoAuqzfTux7VDGX_7bU3PHczpR1JFWZ_Wa2wwjKqeu--NO96A7h8yUbmaLBJGlPbKF8gAGS',
    accentColor: '#4edea3',
  },
];

const FILTERS: Filter[] = ['Active', 'Scheduled', 'Completed'];

export default function PickupDashboard() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('Active');

  const visible = PICKUPS.filter(p => p.filter === filter);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Route summary */}
        <View style={styles.routeCard}>
          <Text style={styles.routeTitle}>Today's Route</Text>
          <View style={styles.routeMeta}>
            <Text style={styles.routeMetaText}>🕐  3 Active  ·  12 Scheduled</Text>
          </View>
        </View>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.85}
            >
              <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Pickup cards */}
        <View style={styles.cardList}>
          {visible.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No {filter.toLowerCase()} pickups</Text>
            </View>
          )}
          {visible.map((p, i) => (
            <View key={p.id} style={styles.pickupCard}>
              {/* Accent top bar */}
              <View style={[styles.accentBar, { backgroundColor: p.accentColor }]} />

              {/* Map thumbnail */}
              <Image source={{ uri: p.mapUri }} style={styles.mapThumb} resizeMode="cover" />

              <View style={styles.cardBody}>
                {/* Name + type badge */}
                <View style={styles.cardTopRow}>
                  <View>
                    <Text style={styles.customerName}>{p.name}</Text>
                    <View style={styles.addressRow}>
                      <MapPin size={12} color="#404944" />
                      <Text style={styles.addressText}>{p.address}</Text>
                    </View>
                  </View>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{p.type}</Text>
                  </View>
                </View>

                {/* Weight + slot */}
                <View style={styles.statsRow}>
                  <View>
                    <Text style={styles.statLabel}>EST. WEIGHT</Text>
                    <Text style={styles.statValue}>{p.weight}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.statLabel}>TIME SLOT</Text>
                    <Text style={[styles.statValue, { color: '#006c49' }]}>{p.slot}</Text>
                  </View>
                </View>

                {/* Action buttons */}
                {filter === 'Active' ? (
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.mapBtn}>
                      <Navigation size={16} color="#404944" />
                      <Text style={styles.mapBtnText}>Map</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.startBtn}>
                      <Text style={styles.startBtnText}>Start Pickup →</Text>
                    </TouchableOpacity>
                  </View>
                ) : filter === 'Scheduled' ? (
                  <TouchableOpacity style={styles.detailsBtn}>
                    <Text style={styles.detailsBtnText}>View Details</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedBadgeText}>✓ Completed</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9f9ff' },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120, gap: 14 },

  routeCard: { backgroundColor: '#f0f3ff', borderRadius: 14, padding: 16, gap: 6 },
  routeTitle: { fontSize: 22, fontFamily: 'Poppins-Bold', color: '#151c27' },
  routeMeta: { flexDirection: 'row', alignItems: 'center' },
  routeMetaText: { fontSize: 13, fontFamily: 'Poppins-Medium', color: '#404944' },

  filterScroll: { flexGrow: 0 },
  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e7eefe' },
  filterChipActive: { backgroundColor: '#003527' },
  filterChipText: { fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#404944' },
  filterChipTextActive: { color: '#fff' },

  cardList: { gap: 14 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, fontFamily: 'Poppins-Medium', color: '#707974' },

  pickupCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  accentBar: { height: 4, width: '100%' },
  mapThumb: { width: '100%', height: 120 },
  cardBody: { padding: 14, gap: 12 },

  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  customerName: { fontSize: 16, fontFamily: 'Poppins-Bold', color: '#151c27' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  addressText: { fontSize: 12, fontFamily: 'Poppins-Medium', color: '#404944' },
  typeBadge: { backgroundColor: 'rgba(0,53,39,0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText: { fontSize: 11, fontFamily: 'Poppins-Bold', color: '#003527' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e7eefe' },
  statLabel: { fontSize: 10, fontFamily: 'Poppins-Bold', color: '#707974', letterSpacing: 0.5 },
  statValue: { fontSize: 16, fontFamily: 'Poppins-Bold', color: '#151c27', marginTop: 2 },

  actionRow: { flexDirection: 'row', gap: 10 },
  mapBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#e7eefe', borderRadius: 10, paddingVertical: 12 },
  mapBtnText: { fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#404944' },
  startBtn: { flex: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#003527', borderRadius: 10, paddingVertical: 12 },
  startBtnText: { fontSize: 13, fontFamily: 'Poppins-Bold', color: '#fff' },

  detailsBtn: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#e7eefe', borderRadius: 10, paddingVertical: 12 },
  detailsBtnText: { fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#404944' },

  completedBadge: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,53,39,0.08)', borderRadius: 10, paddingVertical: 10 },
  completedBadgeText: { fontSize: 13, fontFamily: 'Poppins-Bold', color: '#003527' },
});
