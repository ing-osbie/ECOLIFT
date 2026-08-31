import React from 'react';
import { Image, View, Text, StyleSheet, ViewStyle } from 'react-native';

const logo = require('@/assets/images/ecolift-logo.png');

interface EcoliftLogoProps {
  size?: number;           // Image size (width = height)
  showText?: boolean;      // Show "ecolift" text beside it
  textColor?: string;      // Override text colour
  style?: ViewStyle;
  textSize?: number;
}

export const EcoliftLogo: React.FC<EcoliftLogoProps> = ({
  size = 40,
  showText = true,
  textColor = '#FFFFFF',
  style,
  textSize = 26,
}) => {
  return (
    <View style={[styles.wrapper, style]}>
      <Image
        source={logo}
        style={{ width: size, height: size, resizeMode: 'contain' }}
      />
      {showText && (
        <Text style={[styles.logoText, { color: textColor, fontSize: textSize }]}>
          <Text style={[styles.ecoSpan, { color: textColor, opacity: 0.75 }]}>Eco</Text>
          <Text style={{ color: textColor }}>Lift</Text>
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontFamily: 'Poppins-Bold',
    letterSpacing: -0.5,
  },
  ecoSpan: {
    fontFamily: 'Poppins-Bold',
  },
});
