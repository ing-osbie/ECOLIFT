import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { GradientBackground } from '@/components/gradient-background';
import { GlassCard } from '@/components/glass-card';
import { getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { CustomAlert, useCustomAlert } from '@/components/custom-alert';
import { ArrowLeft, Check, Share2, Download } from 'lucide-react-native';

export default function Receipt() {
  const router = useRouter();
  const { isDarkMode, selectedWasteType, bagsCount, selectedCollector } = useApp();
  const C = getColors(isDarkMode);
  const { showAlert, alertProps } = useCustomAlert();

  const receiptNo = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
  const paymentMethod = 'Moolre Mobile Money';
  const dateString = new Date().toLocaleDateString([], { dateStyle: 'long' });

  const priceBase = selectedWasteType === 'Recyclables' ? 15 : selectedWasteType === 'Bulk/Construction' ? 75 : 25;
  const priceTotal = priceBase * (bagsCount <= 3 ? 1 : bagsCount <= 5 ? 1.5 : 2);

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={[styles.backBtn, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF', borderColor: C.border }]}>
            <ArrowLeft size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.text }]}>Transaction Receipt</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          <GlassCard style={styles.receiptCard}>
            
            {/* Success indicator */}
            <View style={styles.successHeader}>
              <View style={[styles.checkCircle, { backgroundColor: isDarkMode ? 'rgba(182,255,60,0.15)' : 'rgba(182,255,60,0.2)' }]}>
                <Check size={28} color={C.primary} strokeWidth={3.5} />
              </View>
              <Text style={[styles.successTitle, { color: C.text }]}>Payment Successful</Text>
              <Text style={[styles.successAmount, { color: C.primary }]}>GHS {priceTotal.toFixed(2)}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: C.border }]} />

            {/* Transaction metadata */}
            <View style={styles.metaList}>
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: C.greyText }]}>Transaction ID</Text>
                <Text style={[styles.metaValue, { color: C.text }]}>{receiptNo}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: C.greyText }]}>Date</Text>
                <Text style={[styles.metaValue, { color: C.text }]}>{dateString}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: C.greyText }]}>Payment Mode</Text>
                <Text style={[styles.metaValue, { color: C.text }]}>{paymentMethod}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: C.greyText }]}>Collector Matched</Text>
                <Text style={[styles.metaValue, { color: C.text }]}>{selectedCollector?.name || 'EcoLift Partner'}</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: C.border }]} />

            {/* Waste pickup breakdown */}
            <Text style={[styles.breakdownTitle, { color: C.text }]}>Pickup Details</Text>
            
            <View style={styles.metaList}>
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: C.greyText }]}>Waste Type</Text>
                <Text style={[styles.metaValue, { color: C.text }]}>{selectedWasteType || 'Household'}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: C.greyText }]}>Total Volume</Text>
                <Text style={[styles.metaValue, { color: C.text }]}>{bagsCount || 3} Bags</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: C.greyText }]}>Base Cost</Text>
                <Text style={[styles.metaValue, { color: C.text }]}>GHS {priceBase.toFixed(2)}</Text>
              </View>
            </View>

            <View style={[styles.dashedDivider, { borderColor: C.border }]} />

            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: C.text }]}>Total Charge</Text>
              <Text style={[styles.totalValueLarge, { color: C.primary }]}>GHS {priceTotal.toFixed(2)}</Text>
            </View>

          </GlassCard>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, { borderColor: C.border, borderWidth: 1, backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF' }]}
              onPress={() => showAlert({ type: 'success', title: 'PDF Downloaded', message: 'Your receipt PDF has been saved to your Downloads folder.' })}
            >
              <Download size={18} color={C.text} style={{ marginRight: 6 }} />
              <Text style={[styles.actionBtnText, { color: C.text }]}>Download</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, { borderColor: C.border, borderWidth: 1, backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF' }]}
              onPress={() => showAlert({ type: 'info', title: 'Share Receipt', message: 'Receipt sharing via WhatsApp, Email, or SMS is coming soon!' })}
            >
              <Share2 size={18} color={C.text} style={{ marginRight: 6 }} />
              <Text style={[styles.actionBtnText, { color: C.text }]}>Share</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.homeBtn, { backgroundColor: C.primary, shadowColor: C.primary }]}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={[styles.homeBtnText, { color: isDarkMode ? '#000000' : '#FFFFFF' }]}>
              Back to Dashboard
            </Text>
          </TouchableOpacity>

        </ScrollView>
        <CustomAlert {...alertProps} />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    letterSpacing: -0.5,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  receiptCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 20,
  },
  successHeader: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  successAmount: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 20,
  },
  dashedDivider: {
    height: 1,
    width: '100%',
    borderWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 20,
  },
  metaList: {
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
  },
  metaValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
  },
  breakdownTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
  },
  totalValueLarge: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
  },
  actionBtnText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  homeBtn: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  homeBtnText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
  },
});
