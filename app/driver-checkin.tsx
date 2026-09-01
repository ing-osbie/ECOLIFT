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
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import {
  Bell,
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
  const { userName } = useApp();

  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'verified'>(_cachedScan);
  const [capturedUri, setCapturedUri] = useState<string | null>(_cachedUri);
  const [vehicleType, setVehicleType] = useState(VEHICLE_TYPES[0]);
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [plateNumber, setPlateNumber] = useState('GRN-2024');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const verifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state changes to module cache
  useEffect(() => { _cachedUri = capturedUri; }, [capturedUri]);
  useEffect(() => { _cachedScan = scanState; }, [scanState]);

  // Clear cache when navigating away to collector home
  const clearCache = () => {
    _cachedUri = null;
    _cachedScan = 'idle';
  };

  const handleCapture = async () => {
    // Don't re-open camera if already verified
    if (scanState === 'verified') return;

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
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
  };

  const handleConfirm = () => {
    if (scanState !== 'verified') return;
    setIsSubmitting(true);
    clearCache();
    setTimeout(() => {
      setIsSubmitting(false);
      router.replace('/(tabs-collector)');
    }, 1200);
  };

  const initials = userName ? userName.substring(0, 2).toUpperCase() : 'KM';

  return (
    <View style={styles.bg}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/upload-id' as any)} activeOpacity={0.8}>
              <Text style={styles.backArrow}>{'‹'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerBrand}>EcoLift</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Bell size={20} color="#151c27" />
            </TouchableOpacity>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Page Title */}
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.pageTitle}>Driver Check-in</Text>
              <Text style={styles.pageSub}>Verify identity and vehicle assignment.</Text>
            </View>
            <View style={styles.badgeIcon}>
              <User size={28} color={Colors.primary} />
            </View>
          </View>

          {/* Face Scan Card */}
          <View style={styles.scanCard}>
            {/* Camera preview area */}
            <TouchableOpacity
              style={styles.cameraArea}
              onPress={scanState === 'idle' ? handleCapture : undefined}
              activeOpacity={scanState === 'idle' ? 0.85 : 1}
            >
              {/* Show captured photo or placeholder */}
              <Image
                source={capturedUri
                  ? { uri: capturedUri }
                  : { uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQIX8B5FqRVHMlQI1DRlESChghrID2cfm8X4pKcWO11YCpJdwjXy5Z94kGrScdrJ_ldkvE4KNFf1E2LJLcu809MRe_DL-RZEaMWzJQgjMPIfBapDa5fEIbMGfZJRBrfvsgOzmnEQ46Q0lEj1f-QBwkthpT0dDjcmbyh9bQkfIYPr-GthPgndv40rBiaI8MSRJIFuxmZY5T35tXhfpHDHArxz4EEhiqEQFVJzoOUq1zlKbJOY4IPKJW' }
                }
                style={styles.cameraImage}
                resizeMode="cover"
              />
              {/* Dark overlay — lighter when photo captured */}
              <View style={[styles.cameraOverlay, capturedUri && { backgroundColor: 'rgba(0,0,0,0.15)' }]} />

              {/* Tap to open camera hint when idle */}
              {scanState === 'idle' && (
                <View style={styles.tapHint}>
                  <Camera size={28} color="#fff" />
                  <Text style={styles.tapHintText}>Tap to open camera</Text>
                </View>
              )}

              {/* Scanning spinner overlay */}
              {scanState === 'scanning' && (
                <View style={styles.scanningOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.scanningText}>Verifying...</Text>
                </View>
              )}

              {/* Verified checkmark overlay */}
              {scanState === 'verified' && (
                <View style={styles.verifiedOverlay}>
                  <View style={styles.verifiedCheckCircle}>
                    <Check size={32} color="#fff" strokeWidth={3} />
                  </View>
                  <Text style={styles.verifiedOverlayText}>Identity Verified</Text>
                </View>
              )}

              {/* Face frame ring */}
              <View style={styles.faceFrameWrap}>
                <View style={styles.faceFrameOuter}>
                  <View style={[
                    styles.faceFrameInner,
                    scanState === 'verified' && styles.faceFrameVerified,
                  ]} />
                </View>
              </View>
            </TouchableOpacity>

            {/* Status bar */}
            <View style={styles.scanStatusBar}>
              <View style={[
                styles.scanIconCircle,
                scanState === 'verified' && styles.scanIconCircleVerified,
              ]}>
                {scanState === 'scanning' ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : scanState === 'verified' ? (
                  <Check size={18} color="#fff" strokeWidth={3} />
                ) : (
                  <Camera size={18} color="#6B7280" />
                )}
              </View>
              <View style={styles.scanStatusText}>
                <Text style={styles.scanStatusTitle}>
                  {scanState === 'idle' ? 'Ready to Scan' : scanState === 'scanning' ? 'Verifying...' : 'Identity Verified'}
                </Text>
                <Text style={styles.scanStatusSub}>
                  {scanState === 'idle' ? 'Position face within frame' : scanState === 'scanning' ? 'Please hold still' : `Match found: ${userName || 'Driver'}`}
                </Text>
              </View>
              {scanState === 'idle' ? (
                <TouchableOpacity
                  style={styles.captureBtn}
                  onPress={handleCapture}
                  activeOpacity={0.85}
                >
                  <Camera size={20} color="#fff" />
                </TouchableOpacity>
              ) : scanState === 'scanning' ? (
                <View style={[styles.captureBtn, styles.captureBtnDisabled]}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.captureBtn, styles.captureBtnRetake]}
                  onPress={() => { setScanState('idle'); setCapturedUri(null); _cachedUri = null; _cachedScan = 'idle'; }}
                  activeOpacity={0.85}
                >
                  <Camera size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Vehicle Details Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Truck size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Vehicle Details</Text>
            </View>

            {/* Vehicle Type Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vehicle Type</Text>
              <TouchableOpacity
                style={styles.selectBox}
                onPress={() => setShowVehiclePicker(!showVehiclePicker)}
                activeOpacity={0.8}
              >
                <Text style={styles.selectText}>{vehicleType}</Text>
                <ChevronDown size={16} color="#6B7280" />
              </TouchableOpacity>
              {showVehiclePicker && (
                <View style={styles.dropdownList}>
                  {VEHICLE_TYPES.map((v) => (
                    <TouchableOpacity
                      key={v}
                      style={[styles.dropdownItem, vehicleType === v && styles.dropdownItemActive]}
                      onPress={() => { setVehicleType(v); setShowVehiclePicker(false); }}
                    >
                      <Text style={[styles.dropdownItemText, vehicleType === v && styles.dropdownItemTextActive]}>
                        {v}
                      </Text>
                      {vehicleType === v && <Check size={14} color={Colors.primary} strokeWidth={3} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* License Plate */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>License Plate</Text>
              <TextInput
                style={styles.textInput}
                value={plateNumber}
                onChangeText={setPlateNumber}
                placeholder="Enter Plate Number"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            style={[styles.confirmBtn, (scanState !== 'verified' || isSubmitting) && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={scanState !== 'verified' || isSubmitting}
            activeOpacity={0.9}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Check size={20} color={scanState === 'verified' ? '#fff' : '#9CA3AF'} strokeWidth={3} />
                <Text style={[styles.confirmBtnText, (scanState !== 'verified') && styles.confirmBtnTextDisabled]}>
                  Verify &amp; Go to Home
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#f9f9ff' },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(176,240,214,0.6)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(176,240,214,0.4)',
  },
  headerBrand: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backArrow: {
    fontSize: 22,
    color: Colors.primary,
    lineHeight: 26,
    fontFamily: 'Poppins-Bold',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontFamily: 'Poppins-Bold', color: '#fff' },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, gap: 16 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: { fontSize: 24, fontFamily: 'Poppins-Bold', color: '#151c27' },
  pageSub: { fontSize: 14, fontFamily: 'Poppins-Medium', color: '#404944', marginTop: 2 },
  badgeIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(149,211,186,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e2e8f8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cameraArea: {
    height: 280,
    position: 'relative',
  },
  cameraImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  faceFrameWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceFrameOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(176,240,214,0.9)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceFrameInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: 'rgba(176,240,214,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceFrameVerified: {
    borderColor: '#10B981',
  },
  tapHint: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 5,
  },
  tapHintText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#fff',
    opacity: 0.9,
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16,185,129,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 10,
  },
  verifiedCheckCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  verifiedOverlayText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#fff',
  },
  captureBtnRetake: {
    backgroundColor: '#6B7280',
    shadowOpacity: 0,
    elevation: 0,
  },
  scanStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: 'rgba(249,249,255,0.95)',
  },
  scanIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e7eefe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanIconCircleVerified: {
    backgroundColor: Colors.primary,
  },
  scanStatusText: { flex: 1 },
  scanStatusTitle: { fontSize: 14, fontFamily: 'Poppins-Bold', color: '#151c27' },
  scanStatusSub: { fontSize: 11, fontFamily: 'Poppins-Medium', color: '#404944' },
  captureBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  captureBtnDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  sectionCard: {
    backgroundColor: '#e7eefe',
    borderRadius: 16,
    padding: 16,
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
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontFamily: 'Poppins-Bold', color: '#151c27' },
  inputGroup: { marginBottom: 14 },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#404944',
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9ff',
    borderWidth: 1,
    borderColor: 'rgba(191,201,195,0.4)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectText: { fontSize: 15, fontFamily: 'Poppins-Medium', color: '#151c27' },
  dropdownList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemActive: { backgroundColor: 'rgba(6,78,59,0.05)' },
  dropdownItemText: { fontSize: 14, fontFamily: 'Poppins-Medium', color: '#374151' },
  dropdownItemTextActive: { fontFamily: 'Poppins-Bold', color: Colors.primary },
  textInput: {
    backgroundColor: '#f9f9ff',
    borderWidth: 1,
    borderColor: 'rgba(191,201,195,0.4)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: '#151c27',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 5,
  },
  confirmBtnDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmBtnText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#fff',
  },
  confirmBtnTextDisabled: { color: '#9CA3AF' },
});
