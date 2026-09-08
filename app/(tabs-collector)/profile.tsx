import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, StatusBar, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { GradientBackground } from '@/components/gradient-background';
import { GlassCard } from '@/components/glass-card';
import { Colors, getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/src/context/AuthContext';
import { CustomAlert, useCustomAlert } from '@/components/custom-alert';
import { 
  User, 
  MapPin, 
  CreditCard, 
  FileText, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  Truck,
  Check,
  Moon,
  Sun,
  Award
} from 'lucide-react-native';

export default function CollectorProfile() {
  const router = useRouter();
  const { userName, userPhone, isCollectorVerified, setIsLoggedIn, isDarkMode, toggleDarkMode } = useApp();
  const { signOut } = useAuth();
  const C = getColors(isDarkMode);
  const { showAlert, alertProps } = useCustomAlert();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // Ignore errors on sign out
    }

    setIsLoggedIn(false);
    router.replace('/login');
  };

  const menuRows = [
    {
      id: 'vehicle',
      title: 'Vehicle / Cart Type',
      subtitle: 'Tricycle Pro (GT-4921-26)',
      icon: <Truck size={20} color={C.primary} />,
      onPress: () => router.push('/vehicle-type')
    },
    {
      id: 'area',
      title: 'Service Area',
      subtitle: 'Airport Residential • 5km radius',
      icon: <MapPin size={20} color={C.primary} />,
      onPress: () => showAlert({ type: 'info', title: 'Service Area', message: 'Current Zone: Airport Residential, Accra. Radius: 5km. Contact support to update your service zone.' })
    },
    {
      id: 'payout',
      title: 'Payout Method',
      subtitle: 'Linked Momo: ' + (userPhone || '+233 24 123 4567'),
      icon: <CreditCard size={20} color={C.primary} />,
      onPress: () => showAlert({ type: 'success', title: 'Payout Method', message: `Your Moolre MoMo account (${userPhone || '+233 24 123 4567'}) is linked and verified for weekly disbursements.` })
    },
    {
      id: 'documents',
      title: 'Verification Documents',
      subtitle: 'Ghana Card front & back verified',
      icon: <FileText size={20} color={C.primary} />,
      onPress: () => router.push('/upload-id' as any)
    },
    {
      id: 'support',
      title: 'Support / FAQ',
      subtitle: 'Collector knowledgebase & hotlines',
      icon: <HelpCircle size={20} color={C.primary} />,
      onPress: () => router.push('/support')
    },
  ];

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Header section */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarCircle}>
                <User size={36} color="#FFFFFF" strokeWidth={2} />
              </View>
              {isCollectorVerified && (
                <View style={[styles.verifyBadge, { backgroundColor: C.primary }]}>
                  <Check size={10} color={isDarkMode ? '#000000' : '#FFFFFF'} strokeWidth={4} />
                </View>
              )}
            </View>

            <View style={styles.userMeta}>
              <Text style={[styles.userName, { color: C.text }]}>{userName}</Text>
              <View style={styles.verifiedRow}>
                <Award size={14} color={C.primary} />
                <Text style={[styles.verifiedText, { color: C.primary }]}>Verified Ecolift Collector</Text>
              </View>
            </View>
          </View>

          {/* Menu Items Card */}
          <View style={styles.menuContainer}>
            <GlassCard style={styles.menuCard}>
              {menuRows.map((item, index) => (
                <View key={item.id}>
                  <TouchableOpacity 
                    style={styles.menuRow} 
                    onPress={item.onPress}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuLeft}>
                      <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(11, 61, 46, 0.04)' }]}>
                        {item.icon}
                      </View>
                      <View>
                        <Text style={[styles.menuTitle, { color: C.text }]}>{item.title}</Text>
                        <Text style={[styles.menuSubtitle, { color: C.greyText }]}>{item.subtitle}</Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color={C.greyText} />
                  </TouchableOpacity>
                  {index < menuRows.length - 1 && <View style={[styles.divider, { backgroundColor: C.border }]} />}
                </View>
              ))}

              {/* Dark Mode Toggle Row */}
              <View style={[styles.divider, { backgroundColor: C.border }]} />
              <View style={styles.menuRow}>
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(11, 61, 46, 0.04)' }]}>
                    {isDarkMode ? <Moon size={20} color={C.primary} /> : <Sun size={20} color={C.primary} />}
                  </View>
                  <View>
                    <Text style={[styles.menuTitle, { color: C.text }]}>Dark Mode</Text>
                    <Text style={[styles.menuSubtitle, { color: C.greyText }]}>Switch app appearance</Text>
                  </View>
                </View>
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleDarkMode}
                  trackColor={{ false: isDarkMode ? '#3A3A3C' : '#E2ECE9', true: C.accent }}
                  thumbColor={isDarkMode ? '#FFFFFF' : '#FFFFFF'}
                />
              </View>
            </GlassCard>

            {/* Logout Card */}
            <GlassCard style={styles.logoutCard}>
              <TouchableOpacity 
                style={styles.logoutRow} 
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}>
                    <LogOut size={20} color={Colors.danger} />
                  </View>
                  <View>
                    <Text style={[styles.menuTitle, { color: Colors.danger }]}>Log Out</Text>
                    <Text style={[styles.menuSubtitle, { color: Colors.danger, opacity: 0.7 }]}>Sign out from this device</Text>
                  </View>
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
    paddingBottom: 120, // Tab offsets
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 28,
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 4,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  verifyBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMeta: {
    justifyContent: 'center',
  },
  userName: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: Colors.textDark,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 12,
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
    flex: 0.95,
  },
  menuIconBox: {
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
  menuSubtitle: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    color: Colors.greyText,
    marginTop: 1,
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
