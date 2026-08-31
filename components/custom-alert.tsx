import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
} from 'react-native';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react-native';
import { getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface CustomAlertProps {
  visible: boolean;
  type?: AlertType;
  title: string;
  message: string;
  actions?: AlertAction[];
  onDismiss?: () => void;
}

const TYPE_CONFIG: Record<AlertType, { icon: any; bg: string; darkBg: string; border: string; darkBorder: string }> = {
  success: {
    icon: CheckCircle2,
    bg: 'rgba(182, 255, 60, 0.12)',
    darkBg: 'rgba(182, 255, 60, 0.15)',
    border: 'rgba(182, 255, 60, 0.4)',
    darkBorder: 'rgba(182, 255, 60, 0.35)',
  },
  error: {
    icon: XCircle,
    bg: 'rgba(239, 68, 68, 0.1)',
    darkBg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.35)',
    darkBorder: 'rgba(239, 68, 68, 0.4)',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'rgba(245, 158, 11, 0.1)',
    darkBg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.35)',
    darkBorder: 'rgba(245, 158, 11, 0.4)',
  },
  info: {
    icon: Info,
    bg: 'rgba(59, 130, 246, 0.1)',
    darkBg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.35)',
    darkBorder: 'rgba(59, 130, 246, 0.4)',
  },
};

const ICON_COLOR: Record<AlertType, string> = {
  success: '#7DD94A',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
};

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  type = 'info',
  title,
  message,
  actions,
  onDismiss,
}) => {
  const { isDarkMode } = useApp();
  const C = getColors(isDarkMode);

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0.85, duration: 150, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, opacityAnim, scaleAnim]);


  const config = TYPE_CONFIG[type];
  const IconComponent = config.icon;
  const iconColor = ICON_COLOR[type];

  const cardBg = isDarkMode ? '#1E1E22' : '#FFFFFF';
  const badgeBg = isDarkMode ? config.darkBg : config.bg;
  const badgeBorder = isDarkMode ? config.darkBorder : config.border;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Pressable
        style={styles.backdrop}
        onPress={onDismiss}
      >
        <Animated.View
          style={[styles.cardWrapper, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}
        >
          <Pressable>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>

              {/* Close button */}
              {onDismiss && (
                <TouchableOpacity style={[styles.closeBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]} onPress={onDismiss}>
                  <X size={14} color={C.greyText} strokeWidth={2.5} />
                </TouchableOpacity>
              )}

              {/* Icon badge */}
              <View style={[styles.iconBadge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
                <IconComponent size={28} color={iconColor} strokeWidth={2} />
              </View>

              {/* Title */}
              <Text style={[styles.title, { color: C.text }]}>{title}</Text>

              {/* Message */}
              <Text style={[styles.message, { color: C.greyText }]}>{message}</Text>

              {/* Divider */}
              <View style={[styles.divider, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />

              {/* Actions */}
              <View style={styles.actionsRow}>
                {(actions && actions.length > 0) ? (
                  actions.map((action, idx) => {
                    const isPrimary = action.variant === 'primary' || (!action.variant && idx === actions.length - 1);
                    const isDanger = action.variant === 'danger';
                    const bgColor = isDanger
                      ? 'rgba(239,68,68,0.1)'
                      : isPrimary
                      ? iconColor
                      : isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                    const textColor = isDanger
                      ? '#EF4444'
                      : isPrimary
                      ? (type === 'success' ? '#000000' : '#FFFFFF')
                      : C.greyText;

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.actionBtn, { backgroundColor: bgColor, borderColor: isDanger ? 'rgba(239,68,68,0.3)' : isPrimary ? 'transparent' : isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
                        onPress={action.onPress}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.actionBtnText, { color: textColor }]}>{action.label}</Text>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: iconColor, flex: 1 }]}
                    onPress={onDismiss}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.actionBtnText, { color: type === 'success' ? '#000000' : '#FFFFFF' }]}>Got it</Text>
                  </TouchableOpacity>
                )}
              </View>

            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

// ─── Hook for easy use ───────────────────────────────────────────────────────

interface AlertState {
  visible: boolean;
  type: AlertType;
  title: string;
  message: string;
  actions?: AlertAction[];
}

export const useCustomAlert = () => {
  const [alertState, setAlertState] = React.useState<AlertState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showAlert = (config: Omit<AlertState, 'visible'>) => {
    setAlertState({ ...config, visible: true });
  };

  const hideAlert = () => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  };

  const alertProps: CustomAlertProps = {
    ...alertState,
    onDismiss: hideAlert,
  };

  return { showAlert, hideAlert, alertProps };
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 340,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },
  divider: {
    width: '100%',
    height: 1,
    marginBottom: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionBtnText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
