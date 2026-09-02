import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function PrimaryButton({
  title,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon,
  style,
  textStyle,
  onPress,
  ...props
}: PrimaryButtonProps) {
  const { isDarkMode } = useApp();
  const C = getColors(isDarkMode);

  const getVariantStyles = (): { btn: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'secondary':
        return {
          btn: {
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#E7EEFE',
            borderWidth: 1,
            borderColor: C.border,
          },
          text: {
            color: C.text,
          },
        };
      case 'danger':
        return {
          btn: {
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            borderWidth: 1,
            borderColor: 'rgba(239, 68, 68, 0.4)',
          },
          text: {
            color: Colors.danger,
          },
        };
      case 'ghost':
        return {
          btn: {
            backgroundColor: 'transparent',
          },
          text: {
            color: C.primary,
          },
        };
      case 'primary':
      default:
        return {
          btn: {
            backgroundColor: C.primary,
          },
          text: {
            color: isDarkMode ? '#0B3D2E' : '#FFFFFF',
          },
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <TouchableOpacity
      style={[
        styles.base,
        vStyles.btn,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={vStyles.text.color} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, vStyles.text, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  disabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.2,
  },
});
