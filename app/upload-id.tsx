import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { GradientBackground } from '@/components/gradient-background';
import { GlassCard } from '@/components/glass-card';
import { Colors, getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { EcoliftLogo } from '@/components/ecolift-logo';
import { ArrowLeft, Camera, Check } from 'lucide-react-native';

export default function UploadId() {
  const router = useRouter();
  const { 
    frontIdUploaded, 
    setFrontIdUploaded, 
    backIdUploaded, 
    setBackIdUploaded, 
    setIsCollectorVerified,
    setIsLoggedIn,
    isDarkMode
  } = useApp();
  const C = getColors(isDarkMode);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);

  const handleFrontUpload = () => {
    setFrontIdUploaded(true);
    // Visual feedback handled by check state in UI
  };

  const handleBackUpload = () => {
    setBackIdUploaded(true);
    // Visual feedback handled by check state in UI
  };

  const handleSubmit = () => {
    if (!frontIdUploaded || !backIdUploaded) return;

    setIsSubmitting(true);
    // Simulate approval delay
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmissionComplete(true);
      
      // Instantly approve for smooth demo flow
      setIsCollectorVerified(true);
      setIsLoggedIn(true);
      
      setTimeout(() => {
        router.replace('/(tabs-collector)' as any);
      }, 1500);
    }, 2000);
  };

  const canSubmit = frontIdUploaded && backIdUploaded;

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Navigation Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/login')} style={styles.backBtn} activeOpacity={0.8}>
            <ArrowLeft size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.text }]}>Verification</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Logo Header */}
        <View style={styles.logoHeader}>
          <EcoliftLogo size={36} showText textColor={C.text} textSize={22} />
        </View>

        <View style={styles.content}>
          <GlassCard style={styles.card}>
            <Text style={[styles.cardTitle, { color: C.text }]}>Identity Verification</Text>
            <Text style={[styles.cardSubtitle, { color: C.greyText }]}>Ghana Card verification required for collectors</Text>

            {/* Dashboard Upload Slots */}
            <View style={styles.uploadRow}>
              {/* Front Slot */}
              <TouchableOpacity 
                style={[
                  styles.uploadSlot,
                  { 
                    borderColor: isDarkMode ? '#3A3A3C' : '#D1D5DB', 
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F9FAFB' 
                  },
                  frontIdUploaded && [styles.uploadSlotActive, { borderColor: C.primary, backgroundColor: isDarkMode ? 'rgba(182, 255, 60, 0.08)' : 'rgba(182, 255, 60, 0.04)' }]
                ]} 
                onPress={handleFrontUpload}
                activeOpacity={0.7}
              >
                {frontIdUploaded ? (
                  <View style={styles.slotCompleted}>
                    <Check size={28} color={isDarkMode ? '#B6FF3C' : Colors.primary} strokeWidth={3} />
                    <Text style={[styles.slotLabel, { color: C.text }]}>Front Uploaded</Text>
                  </View>
                ) : (
                  <View style={styles.slotEmpty}>
                    <Camera size={28} color={C.greyText} />
                    <Text style={[styles.slotLabel, { color: C.greyText }]}>Ghana Card Front</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Back Slot */}
              <TouchableOpacity 
                style={[
                  styles.uploadSlot,
                  { 
                    borderColor: isDarkMode ? '#3A3A3C' : '#D1D5DB', 
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F9FAFB' 
                  },
                  backIdUploaded && [styles.uploadSlotActive, { borderColor: C.primary, backgroundColor: isDarkMode ? 'rgba(182, 255, 60, 0.08)' : 'rgba(182, 255, 60, 0.04)' }]
                ]} 
                onPress={handleBackUpload}
                activeOpacity={0.7}
              >
                {backIdUploaded ? (
                  <View style={styles.slotCompleted}>
                    <Check size={28} color={isDarkMode ? '#B6FF3C' : Colors.primary} strokeWidth={3} />
                    <Text style={[styles.slotLabel, { color: C.text }]}>Back Uploaded</Text>
                  </View>
                ) : (
                  <View style={styles.slotEmpty}>
                    <Camera size={28} color={C.greyText} />
                    <Text style={[styles.slotLabel, { color: C.greyText }]}>Ghana Card Back</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Checklist items below */}
            <View style={styles.checklist}>
              <Text style={[styles.checklistTitle, { color: C.text }]}>Verification Steps</Text>
              
              {/* Step 1 */}
              <View style={styles.checkRow}>
                <View style={[
                  styles.checkDot, 
                  { backgroundColor: isDarkMode ? '#2C2C2E' : '#E5E7EB' }, 
                  canSubmit && { backgroundColor: C.primary }
                ]}>
                  {canSubmit && <Check size={12} color={isDarkMode ? '#000000' : '#FFFFFF'} strokeWidth={3} />}
                </View>
                <Text style={[
                  styles.checkText, 
                  { color: C.greyText }, 
                  canSubmit && [styles.checkTextDone, { color: C.text }]
                ]}>
                  ID Cards Uploaded
                </Text>
              </View>

              {/* Step 2 */}
              <View style={styles.checkRow}>
                <View style={[
                  styles.checkDot, 
                  { backgroundColor: isDarkMode ? '#2C2C2E' : '#E5E7EB' }, 
                  isSubmitting && styles.checkDotPending, 
                  submissionComplete && { backgroundColor: C.primary }
                ]}>
                  {submissionComplete && <Check size={12} color={isDarkMode ? '#000000' : '#FFFFFF'} strokeWidth={3} />}
                </View>
                <Text style={[
                  styles.checkText, 
                  { color: C.greyText }, 
                  submissionComplete && [styles.checkTextDone, { color: C.text }]
                ]}>
                  Under Review
                </Text>
              </View>

              {/* Step 3 */}
              <View style={styles.checkRow}>
                <View style={[
                  styles.checkDot, 
                  { backgroundColor: isDarkMode ? '#2C2C2E' : '#E5E7EB' }, 
                  submissionComplete && { backgroundColor: C.primary }
                ]}>
                  {submissionComplete && <Check size={12} color={isDarkMode ? '#000000' : '#FFFFFF'} strokeWidth={3} />}
                </View>
                <Text style={[
                  styles.checkText, 
                  { color: C.greyText }, 
                  submissionComplete && [styles.checkTextDone, { color: C.text }]
                ]}>
                  Approved & Verified
                </Text>
              </View>
            </View>

            {/* Bottom button */}
            <TouchableOpacity 
              style={[
                styles.primaryBtn,
                { backgroundColor: C.primary, shadowColor: C.primary },
                (!canSubmit || isSubmitting) && { backgroundColor: isDarkMode ? '#2C2C2E' : '#E0E5E2', shadowOpacity: 0, elevation: 0 }
              ]} 
              onPress={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              activeOpacity={0.9}
            >
              <Text style={[
                styles.btnText,
                { color: isDarkMode ? '#000000' : '#FFFFFF' },
                (!canSubmit || isSubmitting) && { color: isDarkMode ? '#5E5E62' : '#9EAEAA' }
              ]}>
                {isSubmitting ? 'Verifying Cards...' : 
                 submissionComplete ? 'Approved! Entering App...' : 
                 'Submit for Review'}
              </Text>
            </TouchableOpacity>
          </GlassCard>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.textDark,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.textDark,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.greyText,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 28,
  },
  uploadRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  uploadSlot: {
    flex: 1,
    height: 140,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  uploadSlotActive: {
    borderColor: Colors.primary,
    borderStyle: 'solid',
    backgroundColor: 'rgba(182, 255, 60, 0.04)',
  },
  slotEmpty: {
    alignItems: 'center',
    gap: 8,
  },
  slotCompleted: {
    alignItems: 'center',
    gap: 8,
  },
  slotLabel: {
    fontSize: 11,
    fontFamily: 'Poppins-Bold',
    color: Colors.textDark,
    textAlign: 'center',
  },
  checklist: {
    marginBottom: 32,
    gap: 12,
  },
  checklistTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: Colors.textDark,
    marginBottom: 4,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDotDone: {
    backgroundColor: Colors.primary,
  },
  checkDotPending: {
    backgroundColor: Colors.warning,
  },
  checkText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.greyText,
  },
  checkTextDone: {
    color: Colors.textDark,
    fontFamily: 'Poppins-Bold',
  },
  primaryBtn: {
    width: '100%',
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  btnText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  logoHeader: {
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 24,
  },
});
