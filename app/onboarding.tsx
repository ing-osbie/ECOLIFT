import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { GradientBackground } from '@/components/gradient-background';
import { Colors, getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { EcoliftLogo } from '@/components/ecolift-logo';
import { Smartphone, MapPin, Trash2, Truck, Route, Hash, ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function Onboarding() {
  const router = useRouter();
  const { setIsOnboarded, isDarkMode } = useApp();
  const C = getColors(isDarkMode);
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: 'Request a pickup in seconds',
      description: 'Pin your location, specify your bags, and request a prompt pickup with just a tap.',
      illustration: (
        <View style={styles.illContainer}>
          <View style={styles.illBgCircle} />
          {/* Phone outline */}
          <View style={[styles.phoneFrame, { transform: [{ rotate: '-12deg' }] }]}>
            <Smartphone size={64} color={Colors.primary} strokeWidth={1.5} />
            <View style={styles.phonePinContainer}>
              <MapPin size={18} color={Colors.accent} fill={Colors.accent} />
            </View>
          </View>
          {/* Waste bag */}
          <View style={styles.wasteBagOverlay}>
            <Trash2 size={36} color={Colors.accent} strokeWidth={2} />
          </View>
        </View>
      ),
    },
    {
      title: 'Get matched with a verified collector',
      description: 'Reliable, local collectors with verified vehicles are ready to handle your waste responsibly.',
      illustration: (
        <View style={styles.illContainer}>
          <View style={[styles.illBgCircle, { backgroundColor: 'rgba(11, 61, 46, 0.05)' }]} />
          {/* Route path */}
          <View style={styles.routeContainer}>
            <Route size={100} color="rgba(11, 61, 46, 0.15)" strokeWidth={1} />
          </View>
          {/* Truck */}
          <View style={styles.truckContainer}>
            <Truck size={56} color={Colors.primary} strokeWidth={1.5} />
          </View>
          {/* Map pin */}
          <View style={[styles.phonePinContainer, { top: 40, right: 60, position: 'absolute' }]}>
            <MapPin size={22} color={Colors.accent} fill={Colors.accent} />
          </View>
        </View>
      ),
    },
    {
      title: 'Pay however works for you — even by USSD',
      description: 'Integrated with Moolre Mobile Money, Cards, or dial offline USSD codes directly from your dialer.',
      illustration: (
        <View style={styles.illContainer}>
          <View style={styles.illBgCircle} />
          {/* Phone displaying prompt */}
          <View style={styles.phoneFrame}>
            <Smartphone size={72} color={Colors.primary} strokeWidth={1.5} />
            <View style={styles.ussdModal}>
              <Text style={styles.ussdText}>Dial: *920*33#</Text>
              <View style={styles.ussdBtn}>
                <Text style={styles.ussdBtnText}>Pay GHS 25</Text>
              </View>
            </View>
          </View>
          <View style={styles.ussdOverlayCard}>
            <Hash size={24} color={Colors.accent} />
          </View>
        </View>
      ),
    },
  ];

  const handleNext = () => {
    if (activeSlide < slides.length - 1) {
      setActiveSlide(activeSlide + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    setIsOnboarded(true);
    router.replace('/login');
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <EcoliftLogo size={32} showText textColor={isDarkMode ? C.textDark : Colors.primary} textSize={18} />
          <TouchableOpacity onPress={handleFinish}>
            <Text style={[styles.skipText, { color: C.greyText }]}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Carousel Content */}
        <View style={styles.carouselContainer}>
          {slides[activeSlide].illustration}
          
          <View style={styles.textContainer}>
            <Text style={[styles.headline, { color: C.text }]}>{slides[activeSlide].title}</Text>
            <Text style={[styles.subtext, { color: C.greyText }]}>{slides[activeSlide].description}</Text>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.footer}>
          {/* Pagination Dots */}
          <View style={styles.pagination}>
            {slides.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  idx === activeSlide 
                    ? { backgroundColor: Colors.accent, width: 24 } 
                    : { backgroundColor: '#E2ECE9' }
                ]}
              />
            ))}
          </View>

          {/* Primary CTA Button */}
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleNext}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>
              {activeSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <ChevronRight size={20} color={Colors.accent} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  logoMark: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: Colors.primary,
    letterSpacing: -1,
  },
  skipText: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.greyText,
  },
  carouselContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  illContainer: {
    width: width * 0.8,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  illBgCircle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(182, 255, 60, 0.15)',
  },
  phoneFrame: {
    width: 90,
    height: 150,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  phonePinContainer: {
    position: 'absolute',
    top: 24,
    backgroundColor: Colors.primary,
    padding: 4,
    borderRadius: 50,
  },
  wasteBagOverlay: {
    position: 'absolute',
    bottom: 20,
    right: width * 0.18,
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  routeContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  truckContainer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    backgroundColor: Colors.white,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  ussdModal: {
    position: 'absolute',
    width: 72,
    backgroundColor: 'rgba(11, 61, 46, 0.05)',
    padding: 5,
    borderRadius: 6,
    alignItems: 'center',
    gap: 3,
  },
  ussdText: {
    fontSize: 8,
    fontFamily: 'Poppins-Bold',
    color: Colors.primary,
  },
  ussdBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  ussdBtnText: {
    fontSize: 6,
    fontFamily: 'Poppins-Bold',
    color: Colors.accent,
  },
  ussdOverlayCard: {
    position: 'absolute',
    bottom: 30,
    right: 50,
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  headline: {
    fontSize: 26,
    fontFamily: 'Poppins-Bold',
    color: Colors.textDark,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtext: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.greyText,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 20,
  },
  pagination: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
});
