import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { Colors, DarkColors, Shadows } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export const GlassCard: React.FC<ViewProps> = ({ children, style, ...props }) => {
  const { isDarkMode } = useApp();

  const cardStyle = {
    backgroundColor: isDarkMode ? DarkColors.cardBackground : Colors.cardBackground,
    borderWidth: 1,
    borderColor: isDarkMode ? DarkColors.borderLight : Colors.borderLight,
    ...Shadows.card(isDarkMode),
  };

  return (
    <View style={[styles.card, cardStyle, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
  },
});
