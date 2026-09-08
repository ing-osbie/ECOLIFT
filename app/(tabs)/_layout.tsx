import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Home, ClipboardList, BookOpen, User, Scan, CalendarClock } from 'lucide-react-native';
import { Colors, getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/src/context/AuthContext';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { isDarkMode } = useApp();
  const C = getColors(isDarkMode);

  const tabBarStyle = {
    backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.90)',
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.6)',
    shadowColor: C.shadow,
  };

  return (
    <View style={styles.container}>
      <View style={[styles.tabBar, tabBarStyle]}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.title !== undefined ? options.title : route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const getIcon = (color: string, size: number) => {
            switch (route.name) {
              case 'index': return <Home size={size} color={color} fill={isFocused ? color : 'none'} />;
              case 'schedule': return <CalendarClock size={size} color={color} />;
              case 'classify': return <Scan size={size} color={color} />;
              case 'orders': return <ClipboardList size={size} color={color} fill={isFocused ? color : 'none'} />;
              case 'learn': return <BookOpen size={size} color={color} fill={isFocused ? color : 'none'} />;
              case 'profile': return <User size={size} color={color} fill={isFocused ? color : 'none'} />;
              default: return <Home size={size} color={color} />;
            }
          };

          const iconColor = isFocused
            ? (isDarkMode ? '#000000' : '#FFFFFF')
            : C.greyText;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[
                styles.tabButton,
                isFocused ? [styles.tabButtonActive, { backgroundColor: C.primary }] : styles.tabButtonInactive
              ]}
              activeOpacity={0.9}
            >
              {getIcon(iconColor, 20)}
              {isFocused && (
                <Text style={[styles.tabLabel, { color: isDarkMode ? '#000000' : '#FFFFFF' }]} numberOfLines={1}>
                  {label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (user.role === 'collector') {
      router.replace('/(tabs-collector)');
    }
  }, [user, loading, router]);

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="schedule" options={{ title: 'Schedule' }} />
      <Tabs.Screen name="classify" options={{ title: 'Classify' }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
      <Tabs.Screen name="learn" options={{ title: 'Learn' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 20,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 100,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
        shadowColor: Colors.shadowColor,
      },
      web: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      }
    }),
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 12,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
    flex: 1.8,
    gap: 8,
  },
  tabButtonInactive: {
    flex: 1,
  },
  tabLabel: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    letterSpacing: -0.2,
  },
});
