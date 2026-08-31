import { Platform } from 'react-native';

export const Colors = {
  primary: '#0B3D2E',         // Deep Forest Green
  accent: '#B6FF3C',          // Acid Lime
  bgGradientStart: '#8AD87D', // Soft pastel mint green matching original theme
  bgGradientEnd: '#FFFFFF',   // Pure White background fade
  white: '#FFFFFF',
  cardBackground: '#FFFFFF',  // Solid White crisp card background
  greyText: '#6B7C77',        // Soft neutral grey
  textDark: '#0B1C17',        // Very dark green-black for high contrast text
  borderLight: '#E5EDE8',     // Soft clean card border
  shadowColor: '#0B3D2E',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  
  // Expo defaults compatibility
  light: {
    text: '#0B1C17',
    background: '#8AD87D',
    tint: '#0B3D2E',
    icon: '#6B7C77',
    tabIconDefault: '#6B7C77',
    tabIconSelected: '#0B3D2E',
  },
  dark: {
    text: '#FFFFFF',
    background: '#121212',
    tint: '#B6FF3C',
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: '#B6FF3C',
  }
};

// Full dark-mode colour palette - Sleek Mid-Black theme (neutral charcoal/black, no green tint)
export const DarkColors = {
  primary: '#B6FF3C',                // Acid Lime remains a high-contrast futuristic accent
  accent: '#B6FF3C',
  bgGradientStart: '#1C1C1E',        // Charcoal/mid-black start
  bgGradientEnd: '#0A0A0C',          // Pure dark black end
  white: '#FFFFFF',
  cardBackground: '#1E2321',         // Premium dark solid/charcoal card
  greyText: '#8E8E93',               // Neutral grey
  textDark: '#FFFFFF',               // Clean white text
  borderLight: 'rgba(255, 255, 255, 0.08)',  // Subtle translucent white border
  shadowColor: '#000000',            // Pure black shadows
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  buttonPrimary: '#B6FF3C',          // Lime CTA background
};

// Call this in each screen: const C = getColors(isDarkMode);
export const getColors = (isDark: boolean) => isDark ? {
  ...DarkColors,
  text: DarkColors.textDark,
  card: DarkColors.cardBackground,
  border: DarkColors.borderLight,
  shadow: DarkColors.shadowColor,
  iconPrimary: DarkColors.primary,
} : {
  ...Colors,
  text: Colors.textDark,
  card: Colors.cardBackground,
  border: Colors.borderLight,
  shadow: Colors.shadowColor,
  iconPrimary: Colors.primary,
};

export const Fonts = {
  heading: 'Poppins-Bold',
  subheading: 'Poppins-SemiBold',
  body: 'Poppins-Medium',
  regular: 'Poppins-Regular',
};

export const Shadows = {
  card: (isDark: boolean) => ({
    shadowColor: isDark ? '#000000' : '#0B3D2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.25 : 0.03,
    shadowRadius: 10,
    elevation: isDark ? 4 : 1,
  }),
  glow: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  }
};
