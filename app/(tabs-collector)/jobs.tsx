import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/gradient-background';
import { GlassCard } from '@/components/glass-card';
import { Colors, getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { Star, Home, Trash2, Construction, Recycle } from 'lucide-react-native';

type JobFilter = 'all' | 'completed' | 'failed';

export default function JobHistory() {
  const { collectorJobs, isDarkMode } = useApp();
  const C = getColors(isDarkMode);
  const [filter, setFilter] = useState<JobFilter>('all');

  const filteredJobs = collectorJobs.filter(j => {
    if (filter === 'completed') return j.status === 'Completed';
    if (filter === 'failed') return j.status === 'Cancelled' || j.status === 'Missed';
    return true;
  });

  const getWasteIcon = (type: string) => {
    const size = 18;
    const color = C.primary;
    switch (type.toLowerCase()) {
      case 'household':
        return <Home size={size} color={color} />;
      case 'commercial':
        return <Trash2 size={size} color={color} />;
      case 'bulk/construction':
        return <Construction size={size} color={color} />;
      case 'recyclables':
        return <Recycle size={size} color={color} />;
      default:
        return <Trash2 size={size} color={color} />;
    }
  };

  const renderJobItem = ({ item }: { item: any }) => {
    const isCompleted = item.status === 'Completed';
    const isCancelled = item.status === 'Cancelled';
    
    // Status color mapping
    const getPillStyle = () => {
      if (isCompleted) return { backgroundColor: isDarkMode ? 'rgba(182,255,60,0.2)' : Colors.accent };
      if (isCancelled) return { borderWidth: 1, borderColor: Colors.danger };
      return { borderWidth: 1, borderColor: C.border }; // Missed
    };

    const getTextColor = () => {
      if (isCompleted) return C.primary;
      if (isCancelled) return Colors.danger;
      return C.greyText;
    };

    return (
      <GlassCard style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.leftRow}>
            <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(11,61,46,0.05)' }]}>
              {getWasteIcon(item.wasteType)}
            </View>
            <View>
              <Text style={[styles.titleText, { color: C.text }]}>{item.wasteType}</Text>
              <Text style={[styles.dateText, { color: C.greyText }]}>{item.date}</Text>
            </View>
          </View>

          <View style={styles.rightCol}>
            <Text style={[styles.priceText, { color: C.text }]}>{item.fare}</Text>
            <View style={[styles.statusPill, getPillStyle()]}>
              <Text style={[styles.statusText, { color: getTextColor() }]}>
                {item.status}
              </Text>
            </View>
          </View>
        </View>

        {isCompleted && item.rating > 0 && (
          <View style={styles.ratingRow}>
            <View style={[styles.divider, { backgroundColor: C.border }]} />
            <View style={styles.ratingDetails}>
              <Text style={[styles.customerText, { color: C.greyText }]}>Customer: {item.customerName}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star 
                    key={s} 
                    size={11} 
                    color={s <= item.rating ? (isDarkMode ? '#B6FF3C' : Colors.accent) : (isDarkMode ? '#3A3A3C' : '#D1D5DB')} 
                    fill={s <= item.rating ? (isDarkMode ? '#B6FF3C' : Colors.accent) : 'none'} 
                  />
                ))}
              </View>
            </View>
          </View>
        )}
      </GlassCard>
    );
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: C.text }]}>Job History</Text>
          <Text style={[styles.headerSubtitle, { color: C.greyText }]}>View all your past garbage pickups</Text>
        </View>

        {/* Filter Row */}
        <View style={styles.filterRow}>
          {(['all', 'completed', 'failed'] as JobFilter[]).map((f) => {
            const isActive = filter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterChip,
                  isActive 
                    ? { backgroundColor: C.primary } 
                    : { backgroundColor: isDarkMode ? '#2C2C2E' : Colors.white, borderColor: C.border, borderWidth: 1 }
                ]}
                onPress={() => setFilter(f)}
                activeOpacity={0.9}
              >
                <Text style={[
                  styles.filterChipText,
                  isActive ? { color: isDarkMode ? '#000000' : '#FFFFFF' } : { color: C.greyText }
                ]}>
                  {f === 'failed' ? 'Failed / Missed' : f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* FlatList */}
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => item.id}
          renderItem={renderJobItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Trash2 size={44} color={C.greyText} style={{ marginBottom: 10 }} />
              <Text style={[styles.emptyTitle, { color: C.text }]}>No Jobs Logged</Text>
              <Text style={[styles.emptySubtitle, { color: C.greyText }]}>No records match your filter checklist.</Text>
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(11, 61, 46, 0.05)',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 110,
    gap: 12,
  },
  card: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(11, 61, 46, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: Colors.textDark,
  },
  dateText: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    color: Colors.greyText,
    marginTop: 2,
  },
  rightCol: {
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
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontFamily: 'Poppins-Bold',
  },
  ratingRow: {
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(11, 61, 46, 0.04)',
    marginBottom: 8,
  },
  ratingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerText: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    color: Colors.greyText,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: Colors.textDark,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.greyText,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
