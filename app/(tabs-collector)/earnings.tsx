import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/gradient-background';
import { GlassCard } from '@/components/glass-card';
import { Colors, getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { Wallet, TrendingUp } from 'lucide-react-native';

type TimeSegment = 'today' | 'week' | 'month';

export default function Earnings() {
  const { 
    collectorEarningsToday, 
    collectorEarningsWeek, 
    collectorEarningsMonth,
    collectorJobs,
    isDarkMode
  } = useApp();
  const C = getColors(isDarkMode);

  const [segment, setSegment] = useState<TimeSegment>('today');

  const getEarningTotal = () => {
    if (segment === 'week') return collectorEarningsWeek;
    if (segment === 'month') return collectorEarningsMonth;
    return collectorEarningsToday;
  };

  const getFilteredJobs = () => {
    // Filter collector jobs matching time criteria (simulated)
    const completedOnly = collectorJobs.filter(j => j.status === 'Completed');
    if (segment === 'today') {
      return completedOnly.filter(j => j.date.includes('Today') || j.date.includes('now'));
    }
    return completedOnly; // Show all for week/month in demo
  };

  const renderJobRow = ({ item }: { item: any }) => {
    // Get initials
    const initials = item.customerName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase();

    // Default status pill
    const isPaid = true; // In demo, completed jobs are instantly paid via Moolre

    return (
      <GlassCard style={styles.jobCard}>
        <View style={styles.cardRow}>
          <View style={[styles.avatarMini, { backgroundColor: isDarkMode ? 'rgba(182,255,60,0.15)' : 'rgba(182,255,60,0.2)' }]}>
            <Text style={[styles.avatarMiniText, { color: C.primary }]}>{initials}</Text>
          </View>

          <View style={styles.detailsCol}>
            <Text style={[styles.customerName, { color: C.text }]}>{item.customerName}</Text>
            <Text style={[styles.jobDate, { color: C.greyText }]}>{item.date} • {item.wasteType}</Text>
          </View>

          <View style={styles.priceCol}>
            <Text style={[styles.priceText, { color: C.text }]}>{item.fare}</Text>
            <View style={[
              styles.statusPill,
              isPaid ? { backgroundColor: isDarkMode ? 'rgba(182,255,60,0.2)' : Colors.accent } : { backgroundColor: isDarkMode ? '#2C2C2E' : '#E5E7EB' }
            ]}>
              <Text style={[styles.statusText, { color: isPaid ? C.primary : C.greyText }]}>{isPaid ? 'Paid' : 'Pending'}</Text>
            </View>
          </View>
        </View>
      </GlassCard>
    );
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: C.text }]}>Earnings</Text>
          <Text style={[styles.headerSubtitle, { color: C.greyText }]}>Track your payouts and revenue metrics</Text>
        </View>

        {/* Summary Card with Segmented Toggle */}
        <GlassCard style={styles.summaryCard}>
          <View style={styles.toggleRow}>
            {(['today', 'week', 'month'] as TimeSegment[]).map((seg) => {
              const isActive = segment === seg;
              return (
                <TouchableOpacity
                  key={seg}
                  style={[
                    styles.toggleChip,
                    isActive ? { backgroundColor: isDarkMode ? 'rgba(182,255,60,0.2)' : Colors.accent, borderColor: C.primary } : { backgroundColor: isDarkMode ? '#2C2C2E' : C.card, borderColor: C.border }
                  ]}
                  onPress={() => setSegment(seg)}
                  activeOpacity={0.9}
                >
                  <Text style={[
                    styles.toggleChipText,
                    isActive ? { color: C.primary } : { color: C.greyText }
                  ]}>
                    {seg.charAt(0).toUpperCase() + seg.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.earningsContent}>
            <Wallet size={24} color={C.primary} style={{ marginBottom: 6 }} />
            <Text style={[styles.earningsTitle, { color: C.greyText }]}>Total Revenue</Text>
            <Text style={[styles.earningsValue, { color: C.primary }]}>GHS {getEarningTotal().toFixed(2)}</Text>
            <Text style={[styles.earningsSubtitle, { color: C.greyText }]}>Disbursed instantly to linked MoMo</Text>
          </View>
        </GlassCard>

        {/* Transactions List */}
        <Text style={[styles.listHeaderTitle, { color: C.text }]}>Recent Disbursements</Text>
        <FlatList
          data={getFilteredJobs()}
          keyExtractor={(item) => item.id}
          renderItem={renderJobRow}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <TrendingUp size={44} color={C.greyText} style={{ marginBottom: 10 }} />
              <Text style={[styles.emptyTitle, { color: C.text }]}>No earnings recorded</Text>
              <Text style={[styles.emptySubtitle, { color: C.greyText }]}>Go online and accept jobs to view payout history.</Text>
            </View>
          }
        />

      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: Colors.textDark,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.greyText,
    marginTop: 2,
  },
  summaryCard: {
    marginHorizontal: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(11, 61, 46, 0.02)',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  toggleChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  toggleChipText: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
  },
  earningsContent: {
    alignItems: 'center',
  },
  earningsTitle: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    color: Colors.greyText,
  },
  earningsValue: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: Colors.primary,
    letterSpacing: -1,
    marginVertical: 4,
  },
  earningsSubtitle: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    color: Colors.greyText,
  },
  listHeaderTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: Colors.textDark,
    marginHorizontal: 24,
    marginBottom: 12,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 110,
    gap: 12,
  },
  jobCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarMini: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(11, 61, 46, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarMiniText: {
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
    color: Colors.primary,
  },
  detailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  customerName: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: Colors.textDark,
  },
  jobDate: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    color: Colors.greyText,
    marginTop: 2,
  },
  priceCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  priceText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: Colors.primary,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontFamily: 'Poppins-Bold',
    color: Colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: Colors.textDark,
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: Colors.greyText,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
