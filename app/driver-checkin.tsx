import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors, getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { ScreenHeader } from '@/components/screen-header';
import { PrimaryButton } from '@/components/primary-button';
import {
  Camera,
  Check,
  ChevronDown,
  Truck,
  User,
} from 'lucide-react-native';

const VEHICLE_TYPES = ['Small Truck', 'Tricycle', 'Compactor', 'Electric Side-Loader'];

// Module-level cache — survives camera re-mount
let _cachedUri: string | null = null;
let _cachedScan: 'idle' | 'scanning' | 'verified' = 'idle';

export default function DriverCheckin() {
  const router = useRouter();
  const { isDarkMode, userName, setUserRole, setIsCollectorVerified } = useApp();
  const C = getColors(isDarkMode);

  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'verified'>(_cachedScan);
  const [capturedUri, setCapturedUri] = useState<string | null>(_cachedUri);
  const [vehicleType, setVehicleType] = useState(VEHICLE_TYPES[0]);
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [plateNumber, setPlateNumber] = useState('GRN-2024');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const verifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { _cachedUri = capturedUri; }, [capturedUri]);
  useEffect(() => { _cachedScan = scanState; }, [scanState]);

  const clearCache = () => {
    _cachedUri = null;
    _cachedScan = 'idle';
  };

  const handleCapture = async () => {
    if (scanState === 'verified') return;

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const uri = result.assets[0].uri;
        setCapturedUri(uri);
        _cachedUri = uri;
        setScanState('scanning');
        _cachedScan = 'scanning';
        verifyTimer.current = setTimeout(() => {
          setScanState('verified');
          _cachedScan = 'verified';
        }, 1800);
      }
    } catch (error) {
      console.warn('ImagePicker error:', error);
    }
  };

  const handleConfirm = () => {
    if (scanState !== 'verified') return;
    setIsSubmitting(true);
    setUserRole('collector');
    setIsCollectorVerified(true);
    clearCache();
    setTimeout(() => {
      setIsSubmitting(false);
      router.replace('/(tabs-collector)');
    }, 1200);
  };

  return (
    <View style={[styles.bg, { backgroundColor: C.screenBg }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Screen Header */}
        <ScreenHeader
          title="Driver Check-in"
          subtitle="Identity & Vehicle Verification"
          showNotificationBell
          onBack={() => router.replace('/upload-id' as any)}
        />

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Page Title */}
          <View style={styles.titleRow}>
            <View>
              <Text style={[styles.pageTitle, { color: C.text }]}>Verification</Text>
              <Text style={[styles.pageSub, { color: C.greyText }]}>Verify identity and vehicle assignment.</Text>
            </View>
            <View style={[styles.badgeIcon, { backgroundColor: isDarkMode ? 'rgba(182,255,60,0.15)' : 'rgba(11,61,46,0.1)' }]}>
              <User size={26} color={C.primary} />
            </View>
          </View>

          {/* Face Scan Card */}
          <View style={[styles.scanCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <TouchableOpacity
              style={styles.cameraArea}
              onPress={scanState === 'idle' ? handleCapture : undefined}
              activeOpacity={scanState === 'idle' ? 0.85 : 1}
            >
              <Image
                source={capturedUri
                  ? { uri: capturedUri }
                  : { uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQIX8B5FqRVHMlQI1DRlESChghrID2cfm8X4pKcWO11YCpJdwjXy5Z94kGrScdrJ_ldkvE4KNFf1E2LJLcu809MRe_DL-RZEaMWzJQgjMPIfBapDa5fEIbMGfZJRBrfvsgOzmnEQ46Q0lEj1f-QBwkthpT0dDjcmbyh9bQkfIYPr-GthPgndv40rBiaI8MSRJIFuxmZY5T35tXhfpHDHArxz4EEhiqEQFVJzoOUq1zlKbJOY4IPKJW' }
                }
                style={styles.cameraImage}
                resizeMode="cover"
              />
              <View style={[styles.cameraOverlay, capturedUri && { backgroundColor: 'rgba(0,0,0,0.15)' }]} />

              {scanState === 'idle' && (
                <View style={styles.tapHint}>
                  <Camera size={28} color="#fff" />
                  <Text style={styles.tapHintText}>Tap to open camera</Text>
                </View>
              )}

              {scanState === 'scanning' && (
                <View style={styles.scanningOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.scanningText}>Verifying...</Text>
                </View>
              )}

              {scanState === 'verified' && (
                <View style={styles.verifiedOverlay}>
                  <View style={styles.verifiedCheckCircle}>
                    <Check size={32} color="#fff" strokeWidth={3} />
                  </View>
                  <Text style={styles.verifiedOverlayText}>Identity Verified</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Status bar */}
            <View style={[styles.scanStatusBar, { backgroundColor: C.cardSecondary }]}>
              <View style={[styles.scanIconCircle, scanState === 'verified' && { backgroundColor: C.primary }]}>
                {scanState === 'scanning' ? (
                  <ActivityIndicator size="small" color={C.primary} />
                ) : scanState === 'verified' ? (
                  <Check size={18} color={isDarkMode ? '#0B3D2E' : '#fff'} strokeWidth={3} />
                ) : (
                  <Camera size={18} color={C.greyText} />
                )}
              </View>
              <View style={styles.scanStatusText}>
                <Text style={[styles.scanStatusTitle, { color: C.text }]}>
                  {scanState === 'idle' ? 'Ready to Scan' : scanState === 'scanning' ? 'Verifying...' : 'Identity Verified'}
                </Text>
                <Text style={[styles.scanStatusSub, { color: C.greyText }]}>
                  {scanState === 'idle' ? 'Position face within frame' : scanState === 'scanning' ? 'Please hold still' : `Match found: ${userName || 'Driver'}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Vehicle Details Card */}
          <View style={[styles.sectionCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={styles.sectionHeader}>
              <Truck size={20} color={C.primary} />
              <Text style={[styles.sectionTitle, { color: C.text }]}>Vehicle Details</Text>
            </View>

            {/* Vehicle Type Picker */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: C.greyText }]}>Vehicle Type</Text>
              <TouchableOpacity
                style={[styles.selectBox, { backgroundColor: C.cardSecondary, borderColor: C.border }]}
                onPress={() => setShowVehiclePicker(!showVehiclePicker)}
                activeOpacity={0.8}
              >
                <Text style={[styles.selectText, { color: C.text }]}>{vehicleType}</Text>
                <ChevronDown size={16} color={C.greyText} />
              </TouchableOpacity>
              {showVehiclePicker && (
                <View style={[styles.dropdownList, { backgroundColor: C.card, borderColor: C.border }]}>
                  {VEHICLE_TYPES.map((v) => (
                    <TouchableOpacity
                      key={v}
                      style={[styles.dropdownItem, { borderBottomColor: C.border }, vehicleType === v && { backgroundColor: isDarkMode ? 'rgba(182,255,60,0.1)' : 'rgba(11,61,46,0.05)' }]}
                      onPress={() => { setVehicleType(v); setShowVehiclePicker(false); }}
                    >
                      <Text style={[styles.dropdownItemText, { color: C.text }, vehicleType === v && { color: C.primary, fontFamily: 'Poppins-Bold' }]}>
                        {v}
                      </Text>
                      {vehicleType === v && <Check size={14} color={C.primary} strokeWidth={3} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* License Plate */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: C.greyText }]}>License Plate</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: C.cardSecondary, borderColor: C.border, color: C.text }]}
                value={plateNumber}
                onChangeText={setPlateNumber}
                placeholder="Enter Plate Number"
                placeholderTextColor={C.greyText}
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* Standardized Primary Button */}
          <PrimaryButton
            title="Verify & Go to Home"
            disabled={scanState !== 'verified' || isSubmitting}
            loading={isSubmitting}
            icon={<Check size={18} color={scanState === 'verified' ? (isDarkMode ? '#0B3D2E' : '#fff') : C.greyText} strokeWidth={3} />}
            onPress={handleConfirm}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 16 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: { fontSize: 24, fontFamily: 'Poppins-Bold' },
  pageSub: { fontSize: 13, fontFamily: 'Poppins-Medium', marginTop: 2 },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cameraArea: {
    height: 240,
    position: 'relative',
  },
  cameraImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  tapHint: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 5,
  },
  tapHintText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#fff',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 10,
  },
  scanningText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#fff',
  },
  verifiedOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(16,185,129,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 10,
  },
  verifiedCheckCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedOverlayText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#fff',
  },
  scanStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  scanIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanStatusText: { flex: 1 },
  scanStatusTitle: { fontSize: 14, fontFamily: 'Poppins-Bold' },
  scanStatusSub: { fontSize: 11, fontFamily: 'Poppins-Medium' },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontFamily: 'Poppins-Bold' },
  inputGroup: { marginBottom: 12 },
  inputLabel: {
    fontSize: 11,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectText: { fontSize: 14, fontFamily: 'Poppins-Medium' },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownItemText: { fontSize: 14, fontFamily: 'Poppins-Medium' },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
});
