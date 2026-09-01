import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { ShoppingCart, Star, Wallet } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BAR_DATA = [
  { day: 'Mon', pct: 40 },
  { day: 'Tue', pct: 65 },
  { day: 'Wed', pct: 30 },
  { day: 'Thu', pct: 80, peak: true, label: 'GH₵ 110' },
  { day: 'Fri', pct: 55 },
  { day: 'Sat', pct: 90 },
  { day: 'Sun', pct: 20 },
];

const TRANSACTIONS = [
  { id: '1', title: 'Job #4092',       sub: 'Today, 2:30 PM', amount: '+GH₵ 45.00',   color: '#003527', iconBg: '#b0f0d6', icon: 'cart',   status: 'Completed' },
  { id: '2', title: 'Weekly Bonus',    sub: 'Yesterday',      amount: '+GH₵ 20.00',   color: '#006c49', iconBg: '#6cf8bb', icon: 'star',   status: 'Completed' },
  { id: '3', title: 'Payout to Momo',  sub: 'Oct 12',         amount: '-GH₵ 300.00',  color: '#404944', iconBg: '#dce2f3', icon: 'wallet', status: 'Completed', muted: true },
];

function TxIcon({ name }: { name: string }) {
  const size = 20;
  const color = '#003527';
  if (name === 'star') return <Star size={size} color={color} fill={color} />;
  if (name === 'wallet') return <Wallet size={size} color="#404944" />;
  return <ShoppingCart size={size} color={color} />;
}

export default function Earnings() {
  const { collectorEarningsToday, collectorEarningsWeek } = useApp();

  const today = collectorEarningsToday > 0 ? `GH₵ ${collectorEarningsToday.toFixed(2)}` : 'GH₵ 85.00';
  const week  = collectorEarningsWeek  > 0 ? `GH₵ ${collectorEarningsWeek.toFixed(2)}`  : 'GH₵ 340.00';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceDecorTR} />
          <View style={styles.balanceDecorBL} />
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>GH₵ 428.50</Text>
          <TouchableOpacity style={styles.payoutBtn}>
            <Text style={styles.payoutBtnText}>Request Payout</Text>
          </TouchableOpacity>
        </View>

        {/* Today / Week mini cards */}
        <View style={styles.miniRow}>
          <View style={styles.miniCard}>
            <Text style={styles.miniLabel}>Today</Text>
            <Text style={styles.miniValue}>{today}</Text>
          </View>
          <View style={styles.miniCard}>
            <Text style={styles.miniLabel}>This Week</Text>
            <Text style={styles.miniValue}>{week}</Text>
          </View>
        </View>

        {/* Weekly Earnings Bar Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Weekly Earnings</Text>
            <Text style={styles.chartSub}>Last 7 Days</Text>
          </View>
          <View style={styles.chartBars}>
            {BAR_DATA.map((b) => (
              <View key={b.day} style={styles.barCol}>
                <View style={styles.barTrack}>
                  {b.peak && b.label && (
                    <View style={styles.barTooltip}>
                      <Text style={styles.barTooltipText}>{b.label}</Text>
                    </View>
                  )}
                  <View style={[
                    styles.barFill,
                    { height: `${b.pct}%` },
                    b.peak && styles.barFillPeak,
                  ]} />
                </View>
                <Text style={[styles.barLabel, b.peak && styles.barLabelPeak]}>{b.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Transactions */}
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <View style={styles.txList}>
          {TRANSACTIONS.map((tx) => (
            <View key={tx.id} style={[styles.txRow, tx.muted && styles.txRowMuted]}>
              <View style={[styles.txIconCircle, { backgroundColor: tx.iconBg }]}>
                <TxIcon name={tx.icon} />
              </View>
              <View style={styles.txMeta}>
                <Text style={styles.txTitle}>{tx.title}</Text>
                <Text style={styles.txSub}>{tx.sub}</Text>
              </View>
              <View style={styles.txRight}>
                <Text style={[styles.txAmount, { color: tx.color }]}>{tx.amount}</Text>
                <View style={[styles.txBadge, tx.muted && styles.txBadgeMuted]}>
                  <Text style={[styles.txBadgeText, tx.muted && styles.txBadgeTextMuted]}>{tx.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Payout Method */}
        <View style={styles.payoutMethodRow}>
          <View style={styles.payoutMethodIcon}>
            <Wallet size={20} color="#003527" />
          </View>
          <View style={styles.payoutMethodMeta}>
            <Text style={styles.payoutMethodLabel}>Payout Method</Text>
            <Text style={styles.payoutMethodValue}>MTN Momo (...4392)</Text>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9f9ff' },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120, gap: 14 },

  // Balance card
  balanceCard: {
    backgroundColor: '#003527', borderRadius: 16, padding: 20,
    overflow: 'hidden', gap: 4,
    shadowColor: '#003527', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6,
  },
  balanceDecorTR: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(149,211,186,0.15)', top: -30, right: -30 },
  balanceDecorBL: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(111,251,190,0.08)', bottom: -20, left: -20 },
  balanceLabel: { fontSize: 12, fontFamily: 'Poppins-Medium', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 0.6 },
  balanceAmount: { fontSize: 40, fontFamily: 'Poppins-Bold', color: '#fff', letterSpacing: -1, marginTop: 4 },
  payoutBtn: { backgroundColor: '#6cf8bb', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  payoutBtnText: { fontSize: 14, fontFamily: 'Poppins-Bold', color: '#003527' },

  // Mini cards
  miniRow: { flexDirection: 'row', gap: 10 },
  miniCard: { flex: 1, backgroundColor: '#e7eefe', borderRadius: 12, padding: 14, gap: 4 },
  miniLabel: { fontSize: 11, fontFamily: 'Poppins-Medium', color: '#404944' },
  miniValue: { fontSize: 18, fontFamily: 'Poppins-Bold', color: '#151c27' },

  // Chart
  chartCard: { backgroundColor: '#e7eefe', borderRadius: 14, padding: 16, gap: 12 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chartTitle: { fontSize: 16, fontFamily: 'Poppins-Bold', color: '#151c27' },
  chartSub: { fontSize: 11, fontFamily: 'Poppins-Medium', color: '#003527' },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 6 },
  barCol: { flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end', position: 'relative' },
  barTooltip: { position: 'absolute', top: -22, left: '50%', transform: [{ translateX: -20 }], backgroundColor: '#fff', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1, zIndex: 1 },
  barTooltipText: { fontSize: 9, fontFamily: 'Poppins-Bold', color: '#151c27', whiteSpace: 'nowrap' } as any,
  barFill: { width: '100%', backgroundColor: 'rgba(0,53,39,0.15)', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  barFillPeak: { backgroundColor: '#003527' },
  barLabel: { fontSize: 10, fontFamily: 'Poppins-Medium', color: '#404944' },
  barLabelPeak: { fontFamily: 'Poppins-Bold', color: '#151c27' },

  // Transactions
  sectionTitle: { fontSize: 17, fontFamily: 'Poppins-Bold', color: '#151c27' },
  txList: { gap: 10 },
  txRow: { backgroundColor: '#e7eefe', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  txRowMuted: { opacity: 0.7 },
  txIconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  txMeta: { flex: 1 },
  txTitle: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#151c27' },
  txSub: { fontSize: 11, fontFamily: 'Poppins-Medium', color: '#404944', marginTop: 1 },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmount: { fontSize: 15, fontFamily: 'Poppins-Bold' },
  txBadge: { backgroundColor: 'rgba(0,53,39,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  txBadgeMuted: { backgroundColor: '#dce2f3' },
  txBadgeText: { fontSize: 10, fontFamily: 'Poppins-Bold', color: '#003527' },
  txBadgeTextMuted: { color: '#404944' },

  // Payout method
  payoutMethodRow: { backgroundColor: '#e7eefe', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  payoutMethodIcon: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  payoutMethodMeta: { flex: 1 },
  payoutMethodLabel: { fontSize: 11, fontFamily: 'Poppins-Medium', color: '#404944' },
  payoutMethodValue: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#151c27' },
  editBtn: { padding: 8 },
  editBtnText: { fontSize: 13, fontFamily: 'Poppins-Bold', color: '#003527' },
});
