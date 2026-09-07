import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, Check, FileText, ShieldCheck, Truck } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { ScreenHeader } from '@/components/screen-header';
import { PrimaryButton } from '@/components/primary-button';

type SlotState = 'idle' | 'verifying' | 'done';

export default function UploadId() {
  const router = useRouter();
  const { isDarkMode, setIsCollectorVerified, setIsLoggedIn } = useApp();
  const C = getColors(isDarkMode);

  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [backUri, setBackUri] = useState<string | null>(null);
  const [frontState, setFrontState] = useState<SlotState>('idle');
  const [backState, setBackState] = useState<SlotState>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);

  const capturePhoto = async (side: 'front' | 'back') => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: Platform.OS !== 'web',
        aspect: [16, 10],
        quality: 0.85,
      });

      if (result.canceled || !result.assets || !result.assets[0]?.uri) return;

      const uri = result.assets[0].uri;

      if (side === 'front') {
        setFrontUri(uri);
        setFrontState('verifying');
        setTimeout(() => setFrontState('done'), 1800);
      } else {
        setBackUri(uri);
        setBackState('verifying');
        setTimeout(() => setBackState('done'), 1800);
      }
    } catch (error) {
      console.warn('ImagePicker error:', error);
    }
  };

  const canSubmit = frontState === 'done' && backState === 'done';

  const handleSubmit = () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmissionComplete(true);
      setIsCollectorVerified(true);
      setIsLoggedIn(true);
      setTimeout(() => router.replace('/driver-checkin' as any), 1500);
    }, 2000);
  };

  return (
    <View style={[styles.bg, { backgroundColor: C.screenBg }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader
          title="ID Verification"
          subtitle="Ghana Card Verification"
          onBack={() => router.replace('/login')}
        />

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={[styles.cardHeaderDecor, { backgroundColor: C.primary }]} />

            <View style={styles.titleGroup}>
              <Text style={[styles.title, { color: C.text }]}>Driver Verification</Text>
              <Text style={[styles.subtitle, { color: C.greyText }]}>Ghana Card verification required to start collecting</Text>
            </View>

            <View style={[styles.roleBadge, { backgroundColor: isDarkMode ? 'rgba(182,255,60,0.15)' : 'rgba(11,61,46,0.08)' }]}>
              <Truck size={14} color={C.primary} />
              <Text style={[styles.roleBadgeText, { color: C.primary }]}>Driver / Collector Account</Text>
            </View>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: C.border }]} />
              <Text style={[styles.dividerText, { color: C.greyText }]}>Upload your ID</Text>
              <View style={[styles.dividerLine, { backgroundColor: C.border }]} />
            </View>

            {/* Upload Slots */}
            <View style={styles.uploadRow}>
              <IdSlot
                label="FRONT SIDE"
                subLabel="Photo & Details"
                uri={frontUri}
                state={frontState}
                onPress={() => capturePhoto('front')}
                C={C}
              />

              <IdSlot
                label="BACK SIDE"
                subLabel="Barcode & Address"
                uri={backUri}
                state={backState}
                onPress={() => capturePhoto('back')}
                C={C}
              />
            </View>

            {/* Instructions */}
            <View style={[styles.instBox, { backgroundColor: C.cardSecondary }]}>
              <View style={styles.instItem}>
                <View style={[styles.instDot, { backgroundColor: C.primary }]} />
                <Text style={[styles.instText, { color: C.text }]}>Position Ghana Card inside the frame</Text>
              </View>
              <View style={styles.instItem}>
                <View style={[styles.instDot, { backgroundColor: C.primary }]} />
                <Text style={[styles.instText, { color: C.text }]}>Ensure clear lighting & no glare</Text>
              </View>
              <View style={styles.instItem}>
                <View style={[styles.instDot, { backgroundColor: C.primary }]} />
                <Text style={[styles.instText, { color: C.text }]}>Automatic AI verification in 2 seconds</Text>
              </View>
            </View>

            {/* Primary Submit Button */}
            <PrimaryButton
              title={submissionComplete ? 'Verified! Redirecting...' : 'Submit ID for Verification'}
              disabled={!canSubmit || isSubmitting || submissionComplete}
              loading={isSubmitting}
              icon={submissionComplete ? <ShieldCheck size={18} color="#fff" /> : <FileText size={18} color="#fff" />}
              onPress={handleSubmit}
              style={{ marginTop: 10 }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function IdSlot({
  label,
  subLabel,
  uri,
  state,
  onPress,
  C,
}: {
  label: string;
  subLabel: string;
  uri: string | null;
  state: SlotState;
  onPress: () => void;
  C: any;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.slot,
        { backgroundColor: C.cardSecondary, borderColor: C.border },
        state === 'verifying' && styles.slotVerifying,
        state === 'done' && styles.slotDone,
      ]}
      onPress={onPress}
      disabled={state === 'verifying'}
      activeOpacity={0.8}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.slotImage} resizeMode="cover" />
      ) : (
        <View style={styles.slotPlaceholder}>
          <View style={[styles.cameraIconWrap, { backgroundColor: C.card }]}>
            <Camera size={20} color={C.primary} />
          </View>
          <Text style={[styles.slotLabel, { color: C.text }]}>{label}</Text>
          <Text style={[styles.slotSub, { color: C.greyText }]}>{subLabel}</Text>
        </View>
      )}

      {state === 'verifying' && (
        <View style={styles.overlay}>
          <ActivityIndicator color="#fff" size="small" />
          <Text style={styles.overlayText}>Verifying...</Text>
        </View>
      )}

      {state === 'done' && (
        <View style={styles.doneBadge}>
          <Check size={12} color="#fff" strokeWidth={3} />
          <Text style={styles.doneText}>Verified</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    gap: 16,
  },
  cardHeaderDecor: {
    height: 4,
    marginHorizontal: -20,
    marginTop: -20,
  },
  titleGroup: { alignItems: 'center', gap: 4 },
  title: { fontSize: 22, fontFamily: 'Poppins-Bold' },
  subtitle: { fontSize: 13, fontFamily: 'Poppins-Medium', textAlign: 'center' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
  },
  roleBadgeText: { fontSize: 12, fontFamily: 'Poppins-Bold' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontFamily: 'Poppins-SemiBold' },
  uploadRow: { flexDirection: 'row', gap: 12 },
  slot: {
    flex: 1,
    height: 150,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    overflow: 'hidden',
    position: 'relative',
  },
  slotVerifying: { borderColor: Colors.warning, borderStyle: 'solid' },
  slotDone: { borderColor: Colors.success, borderStyle: 'solid' },
  slotImage: { width: '100%', height: '100%' },
  slotPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12, gap: 4 },
  cameraIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  slotLabel: { fontSize: 11, fontFamily: 'Poppins-Bold', marginTop: 4 },
  slotSub: { fontSize: 10, fontFamily: 'Poppins-Medium' },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  overlayText: { color: '#fff', fontSize: 11, fontFamily: 'Poppins-Bold' },
  doneBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  doneText: { color: '#fff', fontSize: 10, fontFamily: 'Poppins-Bold' },
  instBox: { borderRadius: 12, padding: 14, gap: 8 },
  instItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  instDot: { width: 6, height: 6, borderRadius: 3 },
  instText: { fontSize: 12, fontFamily: 'Poppins-Medium' },
});
