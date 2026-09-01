import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, FileText, Shield, Truck } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { CustomAlert, useCustomAlert } from '@/components/custom-alert';

const VEHICLES = [
  { id: 'tricycle', name: 'Ecolift Tricycle Pro', limit: 'Up to 500kg',   desc: 'Best for narrow streets and standard residential pickups.' },
  { id: 'minitruck', name: 'Ecolift Mini-Truck',  limit: 'Up to 1.5 Tons', desc: 'Perfect for commercial areas and large-capacity bags.' },
  { id: 'compactor', name: 'Eco Compactor Truck', limit: 'Up to 5.0 Tons', desc: 'Reserved for construction rubble and heavy bulk loads.' },
];

type DocSlot = { uri: string | null; name: string | null; isPdf: boolean; verifying: boolean; done: boolean };

export default function VehicleType() {
  const router = useRouter();
  const { showAlert, alertProps } = useCustomAlert();

  const [selected, setSelected] = useState('tricycle');
  const [plate, setPlate]       = useState('');
  const [vin, setVin]           = useState('');
  const [insurance, setInsurance] = useState<DocSlot>({ uri: null, name: null, isPdf: false, verifying: false, done: false });
  const [roadworthy, setRoadworthy] = useState<DocSlot>({ uri: null, name: null, isPdf: false, verifying: false, done: false });
  const [submitting, setSubmitting] = useState(false);

  const pickDoc = async (slot: 'insurance' | 'roadworthy') => {
    const setter = slot === 'insurance' ? setInsurance : setRoadworthy;

    const fromCamera = async () => {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: false });
      if (result.canceled || !result.assets[0]?.uri) return;
      const uri = result.assets[0].uri;
      setter({ uri, name: null, isPdf: false, verifying: true, done: false });
      setTimeout(() => setter({ uri, name: null, isPdf: false, verifying: false, done: true }), 1800);
    };

    const fromPdf = async () => {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const { uri, name } = result.assets[0];
      setter({ uri, name: name ?? 'document.pdf', isPdf: true, verifying: true, done: false });
      setTimeout(() => setter({ uri, name: name ?? 'document.pdf', isPdf: true, verifying: false, done: true }), 1800);
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Upload PDF'], cancelButtonIndex: 0 },
        (i) => { if (i === 1) fromCamera(); else if (i === 2) fromPdf(); },
      );
    } else {
      Alert.alert('Upload Document', 'Choose an option', [
        { text: 'Take Photo', onPress: fromCamera },
        { text: 'Upload PDF', onPress: fromPdf },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const canSubmit = insurance.done && roadworthy.done && plate.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      showAlert({
        type: 'success',
        title: 'Submitted for Verification',
        message: 'Your vehicle details are under review. You\'ll be notified once approved.',
        actions: [{ label: 'OK', onPress: () => router.back() }],
      });
    }, 1800);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#003527" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vehicle Verification</Text>
          <View style={{ width: 36 }} />
        </View>

        <Text style={styles.subtitle}>
          Verify your vehicle details to start accepting larger pickups and increase your earning potential.
        </Text>

        {/* Vehicle Type Selection */}
        <Text style={styles.sectionTitle}>Select Vehicle Type</Text>
        <View style={styles.vehicleList}>
          {VEHICLES.map((v) => {
            const active = selected === v.id;
            return (
              <TouchableOpacity
                key={v.id}
                style={[styles.vehicleCard, active && styles.vehicleCardActive]}
                onPress={() => setSelected(v.id)}
                activeOpacity={0.85}
              >
                <View style={styles.vehicleIconBox}>
                  <Truck size={26} color={active ? '#003527' : '#707974'} />
                </View>
                <View style={styles.vehicleMeta}>
                  <View style={styles.vehicleTopRow}>
                    <Text style={[styles.vehicleName, active && styles.vehicleNameActive]}>{v.name}</Text>
                    <View style={styles.limitBadge}>
                      <Text style={styles.limitText}>{v.limit}</Text>
                    </View>
                  </View>
                  <Text style={styles.vehicleDesc}>{v.desc}</Text>
                </View>
                {active && (
                  <View style={styles.activeCheck}>
                    <Check size={14} color="#fff" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Registration Details */}
        <View style={styles.regCard}>
          <Text style={styles.sectionTitle}>Registration Details</Text>

          <Text style={styles.inputLabel}>License Plate Number</Text>
          <TextInput
            style={styles.input}
            value={plate}
            onChangeText={setPlate}
            placeholder="e.g. GT-4921-26"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="characters"
          />

          <Text style={styles.inputLabel}>Chassis / VIN Number</Text>
          <TextInput
            style={styles.input}
            value={vin}
            onChangeText={setVin}
            placeholder="17-character VIN"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="characters"
          />

          {/* Document Upload */}
          <Text style={[styles.inputLabel, { marginTop: 8 }]}>Required Documents</Text>
          <View style={styles.docRow}>
            <DocUploadSlot
              label="Vehicle Insurance"
              slot={insurance}
              onCapture={() => pickDoc('insurance')}
            />
            <DocUploadSlot
              label="Road Worthiness"
              slot={roadworthy}
              onCapture={() => pickDoc('roadworthy')}
            />
          </View>
        </View>

        {/* Trust badge */}
        <View style={styles.trustRow}>
          <Shield size={16} color="#006c49" />
          <Text style={styles.trustText}>All vehicles must be fully vetted and insured before approval.</Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
          activeOpacity={0.9}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={[styles.submitBtnText, !canSubmit && styles.submitBtnTextDisabled]}>
              Submit for Verification
            </Text>
          )}
        </TouchableOpacity>

      </ScrollView>
      <CustomAlert {...alertProps} />
    </SafeAreaView>
  );
}

function DocUploadSlot({ label, slot, onCapture }: { label: string; slot: DocSlot; onCapture: () => void }) {
  const hasBg = slot.uri && !slot.isPdf;
  return (
    <TouchableOpacity
      style={[styles.docSlot, slot.done && styles.docSlotDone]}
      onPress={onCapture}
      disabled={slot.verifying}
      activeOpacity={0.85}
    >
      {hasBg ? (
        <Image source={{ uri: slot.uri! }} style={StyleSheet.absoluteFillObject as any} resizeMode="cover" />
      ) : null}
      <View style={[styles.docOverlay, hasBg && { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
        {slot.verifying ? (
          <ActivityIndicator color={hasBg ? '#fff' : '#003527'} size="small" />
        ) : slot.done ? (
          <View style={styles.docCheck}>
            <Check size={16} color="#fff" strokeWidth={3} />
          </View>
        ) : (
          <FileText size={28} color="#6b7280" />
        )}
        {slot.done && slot.isPdf && slot.name ? (
          <Text style={styles.docPdfName} numberOfLines={2}>{slot.name}</Text>
        ) : null}
        <Text style={[styles.docLabel, hasBg && { color: '#fff' }]}>
          {slot.done ? '✓ Verified' : label}
        </Text>
        {!slot.done && !slot.verifying ? (
          <Text style={styles.docHint}>Photo or PDF</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9f9ff' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60, gap: 14 },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins-Bold', color: '#151c27' },
  subtitle: { fontSize: 13, fontFamily: 'Poppins-Medium', color: '#404944', lineHeight: 20 },

  sectionTitle: { fontSize: 16, fontFamily: 'Poppins-Bold', color: '#151c27', marginBottom: 10 },

  vehicleList: { gap: 10 },
  vehicleCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  vehicleCardActive: { borderColor: '#b0f0d6', backgroundColor: '#f0fdf4' },
  vehicleIconBox: { width: 46, height: 46, borderRadius: 10, backgroundColor: '#e7eefe', alignItems: 'center', justifyContent: 'center' },
  vehicleMeta: { flex: 1 },
  vehicleTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 },
  vehicleName: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#404944', flex: 1 },
  vehicleNameActive: { color: '#003527', fontFamily: 'Poppins-Bold' },
  limitBadge: { backgroundColor: '#6ffbbe', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  limitText: { fontSize: 10, fontFamily: 'Poppins-Bold', color: '#002113' },
  vehicleDesc: { fontSize: 12, fontFamily: 'Poppins-Medium', color: '#707974', lineHeight: 17 },
  activeCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#003527', alignItems: 'center', justifyContent: 'center' },

  regCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', gap: 6 },
  inputLabel: { fontSize: 13, fontFamily: 'Poppins-Medium', color: '#404944', marginBottom: 4 },
  input: { height: 48, backgroundColor: '#e7eefe', borderRadius: 10, paddingHorizontal: 14, fontSize: 14, fontFamily: 'Poppins-Medium', color: '#151c27', marginBottom: 10 },

  docRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  docSlot: { flex: 1, height: 110, borderRadius: 14, borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', backgroundColor: '#f0f3ff', overflow: 'hidden' },
  docSlotDone: { borderColor: '#003527', borderStyle: 'solid' },
  docOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8 },
  docCheck: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#003527', alignItems: 'center', justifyContent: 'center' },
  docLabel: { fontSize: 11, fontFamily: 'Poppins-SemiBold', color: '#404944', textAlign: 'center' },
  docPdfName: { fontSize: 10, fontFamily: 'Poppins-Medium', color: '#003527', textAlign: 'center', paddingHorizontal: 4 },
  docHint: { fontSize: 10, fontFamily: 'Poppins-Medium', color: '#9CA3AF', textAlign: 'center' },

  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e7eefe', padding: 12, borderRadius: 12 },
  trustText: { fontSize: 12, fontFamily: 'Poppins-Medium', color: '#404944', flex: 1 },

  submitBtn: { height: 54, borderRadius: 27, backgroundColor: '#006c49', alignItems: 'center', justifyContent: 'center', shadowColor: '#006c49', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 14, elevation: 5 },
  submitBtnDisabled: { backgroundColor: '#E5E7EB', shadowOpacity: 0, elevation: 0 },
  submitBtnText: { fontSize: 15, fontFamily: 'Poppins-Bold', color: '#fff' },
  submitBtnTextDisabled: { color: '#9CA3AF' },
});
