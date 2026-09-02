import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Check, FileText, Shield, Truck } from 'lucide-react-native';
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
import { Colors, getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { ScreenHeader } from '@/components/screen-header';
import { PrimaryButton } from '@/components/primary-button';
import { CustomAlert, useCustomAlert } from '@/components/custom-alert';

const VEHICLES = [
  { id: 'tricycle', name: 'Ecolift Tricycle Pro', limit: 'Up to 500kg', desc: 'Best for narrow streets and standard residential pickups.' },
  { id: 'minitruck', name: 'Ecolift Mini-Truck', limit: 'Up to 1.5 Tons', desc: 'Perfect for commercial areas and large-capacity bags.' },
  { id: 'compactor', name: 'Eco Compactor Truck', limit: 'Up to 5.0 Tons', desc: 'Reserved for construction rubble and heavy bulk loads.' },
];

type DocSlot = { uri: string | null; name: string | null; isPdf: boolean; verifying: boolean; done: boolean };

export default function VehicleType() {
  const router = useRouter();
  const { isDarkMode } = useApp();
  const C = getColors(isDarkMode);
  const { showAlert, alertProps } = useCustomAlert();

  const [selected, setSelected] = useState('tricycle');
  const [plate, setPlate] = useState('');
  const [vin, setVin] = useState('');
  const [insurance, setInsurance] = useState<DocSlot>({ uri: null, name: null, isPdf: false, verifying: false, done: false });
  const [roadworthy, setRoadworthy] = useState<DocSlot>({ uri: null, name: null, isPdf: false, verifying: false, done: false });
  const [submitting, setSubmitting] = useState(false);

  const pickDoc = async (slot: 'insurance' | 'roadworthy') => {
    const setter = slot === 'insurance' ? setInsurance : setRoadworthy;

    const fromCamera = async () => {
      try {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return;
        const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: false });
        if (result.canceled || !result.assets || !result.assets[0]?.uri) return;
        const uri = result.assets[0].uri;
        setter({ uri, name: null, isPdf: false, verifying: true, done: false });
        setTimeout(() => setter({ uri, name: null, isPdf: false, verifying: false, done: true }), 1800);
      } catch (error) {
        console.warn('ImagePicker error:', error);
      }
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
    <View style={[styles.bg, { backgroundColor: C.screenBg }]}>
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title="Vehicle Type & Permit"
          subtitle="Collector Equipment Registration"
        />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Card */}
          <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={[styles.cardHeaderDecor, { backgroundColor: C.primary }]} />

            <View style={styles.titleGroup}>
              <Text style={[styles.title, { color: C.text }]}>Vehicle Registration</Text>
              <Text style={[styles.subtitle, { color: C.greyText }]}>Select vehicle type and attach required permits</Text>
            </View>

            {/* Vehicle options */}
            <View style={styles.vehicleList}>
              {VEHICLES.map((v) => {
                const active = selected === v.id;
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[
                      styles.vehicleCard,
                      { backgroundColor: C.cardSecondary, borderColor: C.border },
                      active && { borderColor: C.primary, backgroundColor: isDarkMode ? 'rgba(182,255,60,0.1)' : 'rgba(11,61,46,0.05)' },
                    ]}
                    onPress={() => setSelected(v.id)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.vehicleHeader}>
                      <View style={styles.vehicleTitleRow}>
                        <Truck size={18} color={active ? C.primary : C.greyText} />
                        <Text style={[styles.vehicleName, { color: C.text }]}>{v.name}</Text>
                      </View>
                      <View style={[styles.limitBadge, { backgroundColor: active ? C.primary : C.border }]}>
                        <Text style={[styles.limitText, { color: active ? (isDarkMode ? '#0B3D2E' : '#FFFFFF') : C.greyText }]}>{v.limit}</Text>
                      </View>
                    </View>
                    <Text style={[styles.vehicleDesc, { color: C.greyText }]}>{v.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* License plate input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: C.greyText }]}>License Plate Number *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: C.cardSecondary, borderColor: C.border, color: C.text }]}
                placeholder="e.g. GRN-2024-GH"
                placeholderTextColor={C.greyText}
                value={plate}
                onChangeText={setPlate}
                autoCapitalize="characters"
              />
            </View>

            {/* VIN optional */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: C.greyText }]}>Chassis / VIN Number (Optional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: C.cardSecondary, borderColor: C.border, color: C.text }]}
                placeholder="e.g. 1HGCR2F83HA000000"
                placeholderTextColor={C.greyText}
                value={vin}
                onChangeText={setVin}
                autoCapitalize="characters"
              />
            </View>

            {/* Permit document uploads */}
            <Text style={[styles.sectionHeading, { color: C.text }]}>Required Permits & Documents</Text>

            <View style={styles.docGrid}>
              <DocTile
                title="Vehicle Insurance"
                slot={insurance}
                onPress={() => pickDoc('insurance')}
                C={C}
              />
              <DocTile
                title="Roadworthy Cert."
                slot={roadworthy}
                onPress={() => pickDoc('roadworthy')}
                C={C}
              />
            </View>

            {/* Submit button */}
            <PrimaryButton
              title="Submit Vehicle for Inspection"
              disabled={!canSubmit || submitting}
              loading={submitting}
              icon={<Shield size={18} color="#fff" />}
              onPress={handleSubmit}
              style={{ marginTop: 10 }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
      <CustomAlert {...alertProps} />
    </View>
  );
}

function DocTile({ title, slot, onPress, C }: { title: string; slot: DocSlot; onPress: () => void; C: any }) {
  return (
    <TouchableOpacity
      style={[
        styles.docTile,
        { backgroundColor: C.cardSecondary, borderColor: C.border },
        slot.done && { borderColor: Colors.success },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.docTileHeader}>
        <Text style={[styles.docTileTitle, { color: C.text }]}>{title}</Text>
        {slot.done && (
          <View style={styles.checkIcon}>
            <Check size={12} color="#fff" strokeWidth={3} />
          </View>
        )}
      </View>

      {slot.verifying ? (
        <ActivityIndicator size="small" color={C.primary} style={{ marginTop: 8 }} />
      ) : slot.done ? (
        <Text style={[styles.docDoneText, { color: Colors.success }]} numberOfLines={1}>
          {slot.isPdf ? slot.name : '✓ Image Uploaded'}
        </Text>
      ) : (
        <View style={styles.docPlaceholder}>
          <FileText size={16} color={C.greyText} />
          <Text style={[styles.docUploadLabel, { color: C.greyText }]}>Tap to Upload</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
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
  titleGroup: { gap: 4 },
  title: { fontSize: 22, fontFamily: 'Poppins-Bold' },
  subtitle: { fontSize: 13, fontFamily: 'Poppins-Medium' },
  vehicleList: { gap: 10 },
  vehicleCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    gap: 4,
  },
  vehicleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vehicleTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vehicleName: { fontSize: 14, fontFamily: 'Poppins-Bold' },
  limitBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  limitText: { fontSize: 10, fontFamily: 'Poppins-Bold' },
  vehicleDesc: { fontSize: 12, fontFamily: 'Poppins-Medium' },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 11, fontFamily: 'Poppins-SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  sectionHeading: { fontSize: 15, fontFamily: 'Poppins-Bold', marginTop: 4 },
  docGrid: { flexDirection: 'row', gap: 12 },
  docTile: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    minHeight: 80,
    justifyContent: 'space-between',
  },
  docTileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  docTileTitle: { fontSize: 12, fontFamily: 'Poppins-Bold' },
  checkIcon: { width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center' },
  docDoneText: { fontSize: 11, fontFamily: 'Poppins-Bold', marginTop: 6 },
  docPlaceholder: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  docUploadLabel: { fontSize: 11, fontFamily: 'Poppins-Medium' },
});
