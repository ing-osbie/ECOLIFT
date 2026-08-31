import React from 'react';
import { StyleSheet, ViewProps, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, DarkColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export const GradientBackground: React.FC<ViewProps> = ({ children, style, ...props }) => {
  const { isDarkMode } = useApp();
  const start = isDarkMode ? DarkColors.bgGradientStart : Colors.bgGradientStart;
  const end = isDarkMode ? DarkColors.bgGradientEnd : Colors.bgGradientEnd;

  return (
    <LinearGradient
      colors={[start, end]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.container, style]}
      {...props}
    >
      {!isDarkMode && (
        <>
          {/* Top-left sphere */}
          <View style={styles.topLeftSphere} />
          {/* Bottom-right sphere */}
          <View style={styles.bottomRightSphere} />
          {/* Overlapping wave bands */}
          <View style={styles.wave1} />
          <View style={styles.wave2} />
        </>
      )}

      {isDarkMode && (
        <>
          {/* Subtle neutral glowing dark spheres */}
          <View style={styles.topLeftDarkSphere} />
          <View style={styles.bottomRightDarkSphere} />
        </>
      )}

      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  topLeftSphere: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  bottomRightSphere: {
    position: 'absolute',
    bottom: -120,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(138, 216, 125, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  wave1: {
    position: 'absolute',
    top: '35%',
    left: '-60%',
    width: '220%',
    height: 500,
    borderRadius: 700,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    transform: [{ rotate: '-18deg' }],
  },
  wave2: {
    position: 'absolute',
    top: '55%',
    left: '-45%',
    width: '190%',
    height: 400,
    borderRadius: 600,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ rotate: '-12deg' }],
  },
  topLeftDarkSphere: {
    position: 'absolute',
    top: -150,
    left: -150,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  bottomRightDarkSphere: {
    position: 'absolute',
    bottom: -150,
    right: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
});
