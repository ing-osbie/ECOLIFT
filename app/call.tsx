import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { GradientBackground } from '@/components/gradient-background';
import { getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { PhoneOff, Volume2, MicOff, ShieldCheck, User } from 'lucide-react-native';

export default function Call() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string }>();
  const { isDarkMode, selectedCollector } = useApp();
  const C = getColors(isDarkMode);

  const collectorName = params.name || selectedCollector?.name || 'Kwame Mensah';

  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Call Info Section */}
        <View style={styles.infoSection}>
          <View style={[styles.avatarCircle, { backgroundColor: C.primary }]}>
            <User size={64} color="#000000" />
          </View>
          
          <Text style={[styles.name, { color: C.text }]}>{collectorName}</Text>
          <Text style={[styles.status, { color: C.greyText }]}>EcoLift Voice Line</Text>
          
          <Text style={[styles.timer, { color: C.primary }]}>{formatTime(seconds)}</Text>
        </View>

        {/* Action Panel */}
        <View style={styles.actionPanel}>
          <View style={styles.row}>
            {/* Mute button */}
            <TouchableOpacity 
              style={[
                styles.actionBtn, 
                { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF', borderColor: C.border },
                muted && { backgroundColor: C.primary }
              ]}
              onPress={() => setMuted(!muted)}
            >
              <MicOff size={22} color={muted ? (isDarkMode ? '#000000' : '#FFFFFF') : C.text} />
              <Text style={[styles.btnLabel, { color: C.greyText }]}>Mute</Text>
            </TouchableOpacity>

            {/* Speaker button */}
            <TouchableOpacity 
              style={[
                styles.actionBtn, 
                { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF', borderColor: C.border },
                speaker && { backgroundColor: C.primary }
              ]}
              onPress={() => setSpeaker(!speaker)}
            >
              <Volume2 size={22} color={speaker ? (isDarkMode ? '#000000' : '#FFFFFF') : C.text} />
              <Text style={[styles.btnLabel, { color: C.greyText }]}>Speaker</Text>
            </TouchableOpacity>
          </View>

          {/* Secure Call Notification */}
          <View style={[styles.secureBanner, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(11,61,46,0.03)' }]}>
            <ShieldCheck size={16} color={C.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.secureText, { color: C.greyText }]}>End-to-end encrypted call via Moolre</Text>
          </View>

          {/* Hang Up CTA */}
          <TouchableOpacity 
            style={[styles.hangUpBtn, { backgroundColor: '#EF4444' }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <PhoneOff size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

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
    justifyContent: 'space-between',
  },
  infoSection: {
    alignItems: 'center',
    marginTop: 80,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  name: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    marginBottom: 4,
  },
  status: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    marginBottom: 20,
  },
  timer: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    letterSpacing: 1,
  },
  actionPanel: {
    alignItems: 'center',
    paddingBottom: 60,
    width: '100%',
    paddingHorizontal: 40,
  },
  row: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 30,
  },
  actionBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 6,
  },
  btnLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    marginTop: 2,
  },
  secureBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 40,
  },
  secureText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
  },
  hangUpBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
});
