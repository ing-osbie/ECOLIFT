import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, StatusBar, Switch, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { GradientBackground } from '@/components/gradient-background';
import { GlassCard } from '@/components/glass-card';
import { Colors, getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/src/context/AuthContext';
import { CustomAlert, useCustomAlert } from '@/components/custom-alert';
import { 
  MapPin, 
  CreditCard, 
  Bell, 
  Globe, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  Wallet, 
  Plus, 
  User,
  Moon,
  Sun,
  Award,
  Recycle
} from 'lucide-react-native';

export default function Profile() {
  const router = useRouter();
  const { userName, userPhone, walletBalance, setIsLoggedIn, isDarkMode, toggleDarkMode } = useApp();
  const { signOut } = useAuth();

  const C = getColors(isDarkMode);
  const { showAlert, alertProps } = useCustomAlert();

  const menuItems = [
    {
      id: 'rewards',
      title: 'EcoPoints & Rewards',
      icon: <Award size={20} color={C.primary} />,
      onPress: () => router.push('/rewards' as any)
    },
    {
      id: 'recycling',
      title: 'Recycling Centres',
      icon: <Recycle size={20} color={C.primary} />,
      onPress: () => router.push('/recycling-centres' as any)
    },
    {
      id: 'addresses',
      title: 'Saved Addresses',
      icon: <MapPin size={20} color={C.primary} />,
      onPress: () => router.push('/save-address')
    },
    {
      id: 'payments',
      title: 'Payment Methods',
      icon: <CreditCard size={20} color={C.primary} />,
      onPress: () => router.push('/payment-methods')
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: <Bell size={20} color={C.primary} />,
      onPress: () => router.push('/notifications')
    },
    {
      id: 'language',
      title: 'Language',
      icon: <Globe size={20} color={C.primary} />,
      onPress: () => showAlert({ type: 'info', title: 'Language Settings', message: 'Currently English (EN). More languages coming soon — Twi, French, and Hausa.' })
    },
    {
      id: 'support',
      title: 'Support / FAQ',
      icon: <HelpCircle size={20} color={C.primary} />,
      onPress: () => router.push('/support')
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // Ignore errors on sign out
    }

    setIsLoggedIn(false);
    router.replace('/login');
  };

  const handleTopUp = () => {
    router.push('/top-up');
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Header/User Details */}
          <View style={styles.profileHeader}>
            <View style={[styles.avatarContainer, { shadowColor: C.shadow }]}>
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida/AP1WRLvvebFOZ6ynMsVwLT_RhMB47PIf8hxioUnplUngiLRck_uwziGuo8q9YO5aj1foVEUmhejlyafL2z2OHqEPi7FC8azbJoc-ziJbt6qsF5SMnw3GGseHcRNMOLhOvVO7v71vEGCzSy99We7_7rFyQI5Xzz2j4GcrsBMMWBjTRHPbwqUwGF-tolAZtlI0fp2FGa_-ATEKQMsHpKcZA_Q1cKK8GQq6hUUor6q0TpvsuD-ZBS35WmtkQvEqKtrn1A2MHmfBS2lh9XHmQQ",
                }}
                style={[styles.avatarImage, { borderColor: isDarkMode ? '#1C1C1E' : '#FFFFFF' }]}
              />
              <View style={[styles.activeDot, { borderColor: isDarkMode ? '#1C1C1E' : '#FFFFFF' }]} />
            </View>
            
            <Text style={[styles.userName, { color: C.text }]}>{userName}</Text>
            <Text style={[styles.userPhone, { color: C.greyText }]}>{userPhone || '+233 24 123 4567'}</Text>
          </View>

          {/* Wallet Card */}
          <GlassCard style={[styles.walletCard, { borderColor: C.border }]}>
            <View style={styles.walletInfo}>
              <View style={styles.walletHeader}>
                <Wallet size={20} color={C.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.walletTitle, { color: C.greyText }]}>Ecolift Wallet</Text>
              </View>
              <Text style={[styles.walletBalance, { color: isDarkMode ? '#FFFFFF' : Colors.primary }]}>GHS {walletBalance.toFixed(2)}</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.topUpBtn, { backgroundColor: C.primary, shadowColor: C.primary }]} 
              onPress={handleTopUp}
              activeOpacity={0.9}
            >
              <Plus size={16} color={isDarkMode ? '#000000' : '#FFFFFF'} strokeWidth={3} />
              <Text style={[styles.topUpText, { color: isDarkMode ? '#000000' : '#FFFFFF' }]}>Top Up</Text>
            </TouchableOpacity>
          </GlassCard>

          {/* Settings Menu Cards */}
          <View style={styles.menuContainer}>
            <GlassCard style={styles.menuCard}>
              {menuItems.map((item, index) => (
                <View key={item.id}>
                  <TouchableOpacity 
                    style={styles.menuRow} 
                    onPress={item.onPress}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuLeft}>
                      <View style={[styles.menuIconContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(11, 61, 46, 0.04)' }]}>
                        {item.icon}
                      </View>
                      <Text style={[styles.menuTitle, { color: C.text }]}>{item.title}</Text>
                    </View>
                    <ChevronRight size={18} color={C.greyText} />
                  </TouchableOpacity>
                  {index < menuItems.length - 1 && <View style={[styles.divider, { backgroundColor: C.border }]} />}
                </View>
              ))}

              {/* Dark Mode Toggle Row */}
              <View style={[styles.divider, { backgroundColor: C.border }]} />
              <View style={styles.menuRow}>
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIconContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(11, 61, 46, 0.04)' }]}>
                    {isDarkMode ? <Moon size={20} color={C.primary} /> : <Sun size={20} color={C.primary} />}
                  </View>
                  <Text style={[styles.menuTitle, { color: C.text }]}>Dark Mode</Text>
                </View>
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleDarkMode}
                  trackColor={{ false: isDarkMode ? '#3A3A3C' : '#E2ECE9', true: C.accent }}
                  thumbColor={isDarkMode ? '#FFFFFF' : '#FFFFFF'}
                />
              </View>
            </GlassCard>

            {/* Logout Button */}
            <GlassCard style={styles.logoutCard}>
              <TouchableOpacity 
                style={styles.logoutRow} 
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}>
                    <LogOut size={20} color={Colors.danger} />
                  </View>
                  <Text style={[styles.menuTitle, { color: Colors.danger }]}>Log Out</Text>
                </View>
                <ChevronRight size={18} color="rgba(239, 68, 68, 0.4)" />
              </TouchableOpacity>
            </GlassCard>
          </View>
          
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
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120, // Ensure bottom tab doesn't overlap
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.accent,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: Colors.textDark,
  },
  userPhone: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.greyText,
    marginTop: 2,
  },
  walletCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(11, 61, 46, 0.02)',
  },
  walletInfo: {
    flexDirection: 'column',
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  walletTitle: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    color: Colors.greyText,
  },
  walletBalance: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  topUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topUpText: {
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
    color: Colors.primary,
  },
  menuContainer: {
    gap: 16,
  },
  menuCard: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(11, 61, 46, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: Colors.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(11, 61, 46, 0.04)',
    marginHorizontal: 4,
  },
  logoutCard: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
});
