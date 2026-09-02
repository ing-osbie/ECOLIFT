import { useApp } from '@/context/AppContext';
import { getColors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  title: string;
  subtitle?: string;
  unread?: number;
}

export function CollectorHeader({ title, subtitle, unread = 0 }: Props) {
  const router = useRouter();
  const { isDarkMode } = useApp();
  const C = getColors(isDarkMode);

  return (
    <View style={styles.row}>
      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: C.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: C.greyText }]}>{subtitle}</Text> : null}
      </View>
      <TouchableOpacity
        style={[styles.bellBtn, { backgroundColor: C.card, borderColor: C.border }]}
        onPress={() => router.push('/notifications?role=collector' as any)}
        activeOpacity={0.85}
      >
        <Bell size={20} color={C.iconPrimary} />
        {unread > 0 && (
          <View style={[styles.badge, { borderColor: C.screenBg }]}>
            <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleBlock: { flex: 1 },
  title: { fontSize: 22, fontFamily: 'Poppins-Bold' },
  subtitle: { fontSize: 13, fontFamily: 'Poppins-Medium', marginTop: 1 },
  bellBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  badge: {
    position: 'absolute', top: 6, right: 6,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: '#ba1a1a',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3, borderWidth: 1.5,
  },
  badgeText: { fontSize: 8, fontFamily: 'Poppins-Bold', color: '#fff' },
});
