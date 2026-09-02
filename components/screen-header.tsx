import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell } from 'lucide-react-native';
import { Colors, getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showNotificationBell?: boolean;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  showNotificationBell = false,
  rightAction,
}: ScreenHeaderProps) {
  const router = useRouter();
  const { isDarkMode, userName } = useApp();
  const C = getColors(isDarkMode);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  const initials = userName ? userName.substring(0, 2).toUpperCase() : 'EL';

  return (
    <View style={[styles.header, { backgroundColor: isDarkMode ? '#151C27' : '#FFFFFF', borderBottomColor: C.border }]}>
      <View style={styles.leftGroup}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#F0F3FF', borderColor: C.border }]}
          onPress={handleBack}
          activeOpacity={0.8}
        >
          <ArrowLeft size={18} color={C.text} />
        </TouchableOpacity>

        <View>
          <Text style={[styles.title, { color: C.text }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: C.greyText }]}>{subtitle}</Text> : null}
        </View>
      </View>

      <View style={styles.rightGroup}>
        {rightAction}

        {showNotificationBell && (
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#F0F3FF' }]}
            onPress={() => router.push('/notifications')}
          >
            <Bell size={18} color={C.text} />
          </TouchableOpacity>
        )}

        <View style={[styles.avatarCircle, { backgroundColor: C.primary }]}>
          <Text style={[styles.avatarText, { color: isDarkMode ? '#0B3D2E' : '#FFFFFF' }]}>{initials}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    marginTop: -2,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
  },
});
