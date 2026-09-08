import { CollectorHeader } from '@/components/collector-header';
import { CustomAlert, useCustomAlert } from '@/components/custom-alert';
import { getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';
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
  { id: '1', title: 'Job #4092',      sub: 'Today, 2:30 PM', amount: '+GH₵ 45.00',  icon: 'cart',   muted: false },
  { id: '2', title: 'Weekly Bonus',   sub: 'Yesterday',      amount: '+GH₵ 20.00',  icon: 'star',   muted: false },
  { id: '3', title: 'Payout to Momo', sub: 'Oct 12',         amount: '-GH₵ 300.00', icon: 'wallet', muted: true  },
];

export default function Earnings() {
  const router = useRouter();
  const { collectorEarningsToday, collectorEarningsWeek, isDarkMode, walletBalance, debitWallet } = useApp();
  const C = getColors(isDarkMode);
  const { showAlert, alertProps } = useCustomAlert();

  const currentBal = walletBalance > 0 ? walletBalance : 428.5;
  const balanceDisplay = `GH₵ ${currentBal.toFixed(2)}`;
  const today = collectorEarningsToday > 0 ? `GH₵ ${collectorEarningsToday.toFixed(2)}` : 'GH₵ 85.00';
  const week  = collectorEarningsWeek  > 0 ? `GH₵ ${collectorEarningsWeek.toFixed(2)}`  : 'GH₵ 340.00';

  const handleRequestPayout = () => {
    if (currentBal <= 0) {
      showAlert({
        type: 'warning',
        title: 'Zero Balance',
        message: 'You have no available balance to request a payout.',
      });
      return;
    }

    showAlert({
      type: 'info',
      title: 'Request Payout',
      message: `Transfer GH₵ ${currentBal.toFixed(2)} to your registered Mobile Money (MTN Momo ...4392)?`,
      actions: [
        {
          label: 'Confirm Transfer',
          variant: 'primary',
          onPress: async () => {
            if (walletBalance > 0) {
              await debitWallet(walletBalance, 'Payout to MTN Momo');
            }
            showAlert({
              type: 'success',
              title: 'Payout Initiated',
              message: `GH₵ ${currentBal.toFixed(2)} has been sent to your Mobile Money account. Funds will reflect within minutes.`,
            });
          },
        },
        {
          label: 'Cancel',
          variant: 'secondary',
          onPress: () => {},
        },
      ],
    });
  };

  const iconColor = isDarkMode ? '#B6FF3C' : '#003527';

  function TxIcon({ name }: { name: string }) {
    const size = 20;
    if (name === 'star')   return <Star size={size} color={iconColor} fill={iconColor} />;
    if (name === 'wallet') return <Wallet size={size} color={C.greyText} />;
    return <ShoppingCart size={size} color={iconColor} />;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.screenBg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <CollectorHeader title="Earnings" subtitle="Your financial summary" unread={3} />

        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: isDarkMode ? '#0f1f18' : '#003527' }]}>
          <View style={styles.balanceDecorTR} />
          <View style={styles.balanceDecorBL} />
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>{balanceDisplay}</Text>
          <TouchableOpacity
            style={[styles.payoutBtn, { backgroundColor: isDarkMode ? '#B6FF3C' : '#6cf8bb' }]}
            onPress={handleRequestPayout}
            activeOpacity={0.8}
          >
            <Text style={[styles.payoutBtnText, { color: isDarkMode ? '#0B3D2E' : '#003527' }]}>Request Payout</Text>
          </TouchableOpacity>
        </View>

        {/* Today / Week mini cards */}
        <View style={styles.miniRow}>
          {[{ label: 'Today', value: today }, { label: 'This Week', value: week }].map((m) => (
            <View key={m.label} style={[styles.miniCard, { backgroundColor: C.cardSecondary }]}>
              <Text style={[styles.miniLabel, { color: C.greyText }]}>{m.label}</Text>
              <Text style={[styles.miniValue, { color: C.text }]}>{m.value}</Text>
            </View>
          ))}
        </View>

        {/* Bar Chart */}
        <View style={[styles.chartCard, { backgroundColor: C.cardSecondary }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: C.text }]}>Weekly Earnings</Text>
            <Text style={[styles.chartSub, { color: C.iconPrimary }]}>Last 7 Days</Text>
          </View>
          <View style={styles.chartBars}>
            {BAR_DATA.map((b) => (
              <View key={b.day} style={styles.barCol}>
                <View style={styles.barTrack}>
                  {b.peak && b.label && (
                    <View style={[styles.barTooltip, { backgroundColor: C.card }]}>
                      <Text style={[styles.barTooltipText, { color: C.text }]}>{b.label}</Text>
                    </View>
                  )}
                  <View style={[
                    styles.barFill,
                    { height: `${b.pct}%`, backgroundColor: isDarkMode ? 'rgba(182,255,60,0.15)' : 'rgba(0,53,39,0.15)' },
                    b.peak && { backgroundColor: C.iconPrimary },
                  ]} />
                </View>
                <Text style={[styles.barLabel, { color: C.greyText }, b.peak && { color: C.text, fontFamily: 'Poppins-Bold' }]}>{b.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Transactions */}
        <Text style={[styles.sectionTitle, { color: C.text }]}>Recent Transactions</Text>
        <View style={styles.txList}>
          {TRANSACTIONS.map((tx) => (
            <View key={tx.id} style={[styles.txRow, { backgroundColor: C.cardSecondary }, tx.muted && styles.txRowMuted]}>
              <View style={[styles.txIconCircle, { backgroundColor: isDarkMode ? 'rgba(182,255,60,0.12)' : '#b0f0d6' }]}>
                <TxIcon name={tx.icon} />
              </View>
              <View style={styles.txMeta}>
                <Text style={[styles.txTitle, { color: C.text }]}>{tx.title}</Text>
                <Text style={[styles.txSub, { color: C.greyText }]}>{tx.sub}</Text>
              </View>
              <View style={styles.txRight}>
                <Text style={[styles.txAmount, { color: tx.muted ? C.greyText : C.iconPrimary }]}>{tx.amount}</Text>
                <View style={[styles.txBadge, { backgroundColor: isDarkMode ? 'rgba(182,255,60,0.1)' : 'rgba(0,53,39,0.1)' }]}>
                  <Text style={[styles.txBadgeText, { color: C.iconPrimary }]}>Completed</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Payout Method */}
        <View style={[styles.payoutMethodRow, { backgroundColor: C.cardSecondary }]}>
          <View style={[styles.payoutMethodIcon, { backgroundColor: C.card }]}>
            <Wallet size={20} color={C.iconPrimary} />
          </View>
          <View style={styles.payoutMethodMeta}>
            <Text style={[styles.payoutMethodLabel, { color: C.greyText }]}>Payout Method</Text>
            <Text style={[styles.payoutMethodValue, { color: C.text }]}>MTN Momo (...4392)</Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push('/payment-methods' as any)}
            activeOpacity={0.8}
          >
            <Text style={[styles.editBtnText, { color: C.iconPrimary }]}>Edit</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
      <CustomAlert {...alertProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120, gap: 14 },

  balanceCard: { borderRadius: 16, padding: 20, overflow: 'hidden', gap: 4 },
  balanceDecorTR: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(149,211,186,0.15)', top: -30, right: -30 },
  balanceDecorBL: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(111,251,190,0.08)', bottom: -20, left: -20 },
  balanceLabel: { fontSize: 12, fontFamily: 'Poppins-Medium', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 0.6 },
  balanceAmount: { fontSize: 40, fontFamily: 'Poppins-Bold', color: '#fff', letterSpacing: -1, marginTop: 4 },
  payoutBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  payoutBtnText: { fontSize: 14, fontFamily: 'Poppins-Bold' },

  miniRow: { flexDirection: 'row', gap: 10 },
  miniCard: { flex: 1, borderRadius: 12, padding: 14, gap: 4 },
  miniLabel: { fontSize: 11, fontFamily: 'Poppins-Medium' },
  miniValue: { fontSize: 18, fontFamily: 'Poppins-Bold' },

  chartCard: { borderRadius: 14, padding: 16, gap: 12 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chartTitle: { fontSize: 16, fontFamily: 'Poppins-Bold' },
  chartSub: { fontSize: 11, fontFamily: 'Poppins-Medium' },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 6 },
  barCol: { flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end', position: 'relative' },
  barTooltip: { position: 'absolute', top: -22, left: '50%', transform: [{ translateX: -20 }], paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, zIndex: 1 },
  barTooltipText: { fontSize: 9, fontFamily: 'Poppins-Bold' } as any,
  barFill: { width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  barLabel: { fontSize: 10, fontFamily: 'Poppins-Medium' },

  sectionTitle: { fontSize: 17, fontFamily: 'Poppins-Bold' },
  txList: { gap: 10 },
  txRow: { borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  txRowMuted: { opacity: 0.6 },
  txIconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  txMeta: { flex: 1 },
  txTitle: { fontSize: 14, fontFamily: 'Poppins-SemiBold' },
  txSub: { fontSize: 11, fontFamily: 'Poppins-Medium', marginTop: 1 },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmount: { fontSize: 15, fontFamily: 'Poppins-Bold' },
  txBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  txBadgeText: { fontSize: 10, fontFamily: 'Poppins-Bold' },

  payoutMethodRow: { borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  payoutMethodIcon: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  payoutMethodMeta: { flex: 1 },
  payoutMethodLabel: { fontSize: 11, fontFamily: 'Poppins-Medium' },
  payoutMethodValue: { fontSize: 14, fontFamily: 'Poppins-SemiBold' },
  editBtn: { padding: 8 },
  editBtnText: { fontSize: 13, fontFamily: 'Poppins-Bold' },
});
