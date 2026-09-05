import { ScreenHeader } from '@/components/screen-header';
import { PrimaryButton } from '@/components/primary-button';
import { CustomAlert, useCustomAlert } from '@/components/custom-alert';
import { getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/src/context/AuthContext';
import { updateProfile, uploadAvatar } from '@/src/services/profile';
import * as ImagePicker from 'expo-image-picker';
import { Camera, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const router = useRouter();
  const { isDarkMode, userName, setUserName, userPhone, setUserPhone } = useApp();
  const { user } = useAuth();
  const C = getColors(isDarkMode);
  const { showAlert, alertProps } = useCustomAlert();

  const [name, setName] = useState(userName || '');
  const [phone, setPhone] = useState(userPhone || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        showAlert({
          type: 'error',
          title: 'Permission Required',
          message: 'Media library permission is required to pick an image.',
        });
        return;
      }

      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!picked.canceled && picked.assets && picked.assets[0]) {
        setAvatarUri(picked.assets[0].uri);
      }
    } catch (error) {
      console.warn('ImagePicker error:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      let finalAvatarUrl = null;
      if (avatarUri) {
        finalAvatarUrl = await uploadAvatar(avatarUri);
      }

      await updateProfile({
        full_name: name,
        phone: phone,
        ...(finalAvatarUrl ? { avatar_url: finalAvatarUrl } : {}),
      });
      
      setUserName(name);
      setUserPhone(phone);

      showAlert({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile has been saved successfully.',
      });

      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Something went wrong.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const displayAvatar = avatarUri || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRcEQLQqFVq_Z9EQQxI7B6x63AgOG1CAiF9cV3iLrj7KVbslnRnsCyHSCnNyG2NkiUAuozmOuBzK5VTH5fpegCY9EAmAjvdnG6KO3-KzrWbFXNizfuhFXeFy-gWmEeGOWPmj-G-NOwQiDr4tsXl2-L78ESpEsbPKmrE5slJs9_lAsEY35rJGTk41-UEGdwDxxiWoZhlSJw1PAonyDAn8olrapgZV7s93vqBqTeQ6uO2h7pwfOCBYM_';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: C.screenBg }]}>
      <ScreenHeader title="Edit Profile" />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8} style={styles.avatarContainer}>
              <Image source={{ uri: displayAvatar }} style={[styles.avatar, { borderColor: C.primary }]} />
              <View style={[styles.cameraIconContainer, { backgroundColor: C.primary, borderColor: C.screenBg }]}>
                <Camera size={18} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={[styles.formContainer, { backgroundColor: C.cardSecondary }]}>
            
            {/* Email (Read Only) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: C.greyText }]}>Email Address</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: C.card, color: C.greyText, borderColor: C.border }]}
                value={user?.email || ''}
                editable={false}
              />
            </View>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: C.text }]}>Full Name</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: C.card, color: C.text, borderColor: C.border }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={C.greyText}
              />
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: C.text }]}>Phone Number</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: C.card, color: C.text, borderColor: C.border }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor={C.greyText}
                keyboardType="phone-pad"
              />
            </View>

          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.bottomContainer, { borderTopColor: C.border }]}>
          {isSaving ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={C.primary} />
            </View>
          ) : (
            <PrimaryButton title="Save Changes" onPress={handleSave} />
          )}
        </View>

      </KeyboardAvoidingView>
      <CustomAlert {...alertProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  textInput: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
  },
  bottomContainer: {
    padding: 20,
    borderTopWidth: 1,
  },
  loadingContainer: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
