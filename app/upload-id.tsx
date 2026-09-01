import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Check, FileText, ShieldCheck, Truck } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

type SlotState = 'idle' | 'verifying' | 'done';

export default function UploadId() {
  const router = useRouter();
  const { setIsCollectorVerified, setIsLoggedIn } = useApp();

  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [backUri, setBackUri] = useState<string | null>(null);
  const [frontState, setFrontState] = useState<SlotState>('idle');
  const [backState, setBackState] = useState<SlotState>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);

  const capturePhoto = async (side: 'front' | 'back') => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]?.uri) return;

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
    <View style={styles.bg}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.cardHeaderDecor} />

            {/* Header row */}
            <View style={styles.brandRow}>
              <TouchableOpacity onPress={() => router.replace('/login')} style={styles.backBtn}>
                <ArrowLeft size={18} color={Colors.primary} />
              </TouchableOpacity>
              <View style={styles.brandCenter}>
                <View style={styles.logoCircle}>
                  <Image
                    source={{ uri: 'https://lh3.googleusercontent.com/aida/AEtjO1XcXV5fbdHGNsqeCGly0UlSej52rtC_mjiNz-wgtk0IBvm41436Cn7_bH9IuDiDvPj1XQSSO44Hr7AyapNiRtQB5kBbalFGbLkan0qIhiWUqxd8wsp5doOx5bEsgKli46jrIB_MALi29-JIacOn2bNGMtxgtTwDyKeQcm2blObJA3fmUpgrt2IV1okVTRPF8nMFwl28EpQTFJGxSZp_CpCW8WoJpcSQKvN-XoqbMu_XpGLQPiuWQgR6DJaPWS5IlNcQiXDOgKPOvw' }}
                    style={styles.logoImg}
                  />
                </View>
                <Text style={styles.brandName}>EcoLift</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>

            <Text style={styles.title}>Driver Verification</Text>
            <Text style={styles.subtitle}>Ghana Card verification required to start collecting</Text>

            <View style={styles.roleBadge}>
              <Truck size={14} color={Colors.primary} />
              <Text style={styles.roleBadgeText}>Driver / Collector Account</Text>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Upload your ID</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Upload Slots */}
            <View style={styles.uploadRow}>
              <IdSlot
                label="Front Side"
                uri={frontUri}
                state={frontState}
                onCapture={() => capturePhoto('front')}
              />
              <IdSlot
                label="Back Side"
                uri={backUri}
                state={backState}
                onCapture={() => capturePhoto('back')}
              />
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Verification steps</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Checklist */}
            <View style={styles.checklist}>
              {[
                { label: 'ID Cards Uploaded', done: canSubmit, Icon: FileText },
                { label: 'Under Review', done: submissionComplete, Icon: ShieldCheck, pending: isSubmitting },
                { label: 'Approved & Verified', done: submissionComplete, Icon: Check },
              ].map(({ label, done, Icon, pending }, i) => (
                <View key={i} style={styles.checkRow}>
                  <View style={[styles.checkDot, done && styles.checkDotDone, pending && styles.checkDotPending]}>
                    {done ? <Check size={11} color="#fff" strokeWidth={3} /> : null}
                  </View>
                  <View style={styles.checkLineWrap}>
                    <Icon size={14} color={done ? Colors.primary : '#9CA3AF'} />
                    <Text style={[styles.checkText, done && styles.checkTextDone]}>{label}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.primaryBtn, (!canSubmit || isSubmitting) && styles.primaryBtnDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              activeOpacity={0.9}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[styles.primaryBtnText, (!canSubmit || isSubmitting) && styles.primaryBtnTextDisabled]}>
                  {submissionComplete ? 'Approved! Entering App...' : 'Submit for Review'}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.termsText}>
              Your ID is encrypted and only used for verification.{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── ID Slot component ─────────────────────────────────────────────────────────
function IdSlot({
  label,
  uri,
  state,
  onCapture,
}: {
  label: string;
  uri: string | null;
  state: SlotState;
  onCapture: () => void;
}) {
  const isDone = state === 'done';
  const isVerifying = state === 'verifying';

  return (
    <TouchableOpacity
      style={[styles.uploadSlot, isDone && styles.uploadSlotDone]}
      onPress={onCapture}
      activeOpacity={0.85}
      disabled={isVerifying}
    >
      {/* Photo preview */}
      {uri ? (
        <Image source={{ uri }} style={styles.slotPhoto} resizeMode="cover" />
      ) : null}

      {/* Overlay content */}
      <View style={[styles.slotOverlay, uri && { backgroundColor: 'rgba(0,0,0,0.35)' }]}>
        {isVerifying ? (
          <>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.slotVerifyText}>Verifying...</Text>
          </>
        ) : isDone ? (
          <>
            <View style={styles.uploadCheckCircle}>
              <Check size={20} color="#fff" strokeWidth={3} />
            </View>
            <Text style={styles.uploadLabelDone}>✓ Verified</Text>
            <Text style={styles.slotSideLabel}>{label}</Text>
          </>
        ) : (
          <>
            <View style={styles.uploadIconBox}>
              <Camera size={24} color={uri ? '#fff' : '#9CA3AF'} />
            </View>
            <Text style={[styles.uploadLabel, uri && { color: '#fff' }]}>Ghana Card</Text>
            <Text style={[styles.uploadSub, uri && { color: 'rgba(255,255,255,0.8)' }]}>{label}</Text>
            {uri && <Text style={styles.retakeText}>Tap to retake</Text>}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#f0fdf4' },
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingVertical: 24, alignItems: 'center' },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#dcfce7',
    paddingBottom: 28,
  },
  cardHeaderDecor: { height: 80, backgroundColor: 'rgba(167,243,208,0.4)', marginBottom: -40 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    zIndex: 1,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  brandCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoCircle: {
    width: 32, height: 32, borderRadius: 16, overflow: 'hidden',
    backgroundColor: '#fff', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  logoImg: { width: '100%', height: '100%' },
  brandName: { fontSize: 20, fontFamily: 'Poppins-Bold', color: Colors.primary, letterSpacing: -0.5 },
  title: { fontSize: 20, fontFamily: 'Poppins-Bold', color: '#111827', textAlign: 'center', paddingHorizontal: 20, marginBottom: 4 },
  subtitle: { fontSize: 12, fontFamily: 'Poppins-Medium', color: '#6B7280', textAlign: 'center', paddingHorizontal: 20, marginBottom: 16 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center',
    backgroundColor: 'rgba(6,78,59,0.08)', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, marginBottom: 20,
  },
  roleBadgeText: { fontSize: 12, fontFamily: 'Poppins-SemiBold', color: Colors.primary },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, paddingHorizontal: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { fontSize: 11, fontFamily: 'Poppins-Medium', color: '#9CA3AF' },

  // Upload slots
  uploadRow: { flexDirection: 'row', gap: 12, marginBottom: 20, paddingHorizontal: 20 },
  uploadSlot: {
    flex: 1, height: 150, borderRadius: 16,
    borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed',
    backgroundColor: '#F9FAFB', overflow: 'hidden',
  },
  uploadSlotDone: { borderColor: Colors.primary, borderStyle: 'solid', backgroundColor: 'rgba(6,78,59,0.05)' },
  slotPhoto: { ...StyleSheet.absoluteFillObject as any, width: '100%', height: '100%' },
  slotOverlay: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8,
  },
  slotVerifyText: { fontSize: 11, fontFamily: 'Poppins-Bold', color: '#fff' },
  slotSideLabel: { fontSize: 10, fontFamily: 'Poppins-Medium', color: 'rgba(255,255,255,0.85)' },
  uploadIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  uploadCheckCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  uploadLabel: { fontSize: 12, fontFamily: 'Poppins-Bold', color: '#374151', textAlign: 'center' },
  uploadSub: { fontSize: 10, fontFamily: 'Poppins-Medium', color: '#9CA3AF', textAlign: 'center' },
  uploadLabelDone: { fontSize: 12, fontFamily: 'Poppins-Bold', color: '#fff', textAlign: 'center' },
  retakeText: { fontSize: 9, fontFamily: 'Poppins-Medium', color: 'rgba(255,255,255,0.7)', textAlign: 'center' },

  // Checklist
  checklist: { gap: 14, marginBottom: 24, paddingHorizontal: 20 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  checkDotDone: { backgroundColor: Colors.primary },
  checkDotPending: { backgroundColor: '#F59E0B' },
  checkLineWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkText: { fontSize: 13, fontFamily: 'Poppins-Medium', color: '#9CA3AF' },
  checkTextDone: { fontFamily: 'Poppins-Bold', color: '#111827' },

  // Submit
  primaryBtn: {
    marginHorizontal: 20, height: 52, borderRadius: 14,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 14, elevation: 4, marginBottom: 14,
  },
  primaryBtnDisabled: { backgroundColor: '#E5E7EB', shadowOpacity: 0, elevation: 0 },
  primaryBtnText: { fontSize: 15, fontFamily: 'Poppins-Bold', color: '#FFFFFF' },
  primaryBtnTextDisabled: { color: '#9CA3AF' },
  termsText: { fontSize: 11, fontFamily: 'Poppins-Medium', color: '#6B7280', textAlign: 'center', paddingHorizontal: 28, lineHeight: 16 },
  termsLink: { fontFamily: 'Poppins-SemiBold', color: Colors.primary },
});
