import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Check, Clock, Truck, PackageCheck } from 'lucide-react-native';
import { Colors, getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export type PickupStep = 'pending' | 'assigned' | 'en_route' | 'completed';

interface PickupStatusStepperProps {
  currentStatus: PickupStep;
}

export function PickupStatusStepper({ currentStatus }: PickupStatusStepperProps) {
  const { isDarkMode } = useApp();
  const C = getColors(isDarkMode);

  const getStepIndex = (status: PickupStep) => {
    switch (status) {
      case 'pending': return 1;
      case 'assigned': return 2;
      case 'en_route': return 3;
      case 'completed': return 4;
      default: return 1;
    }
  };

  const stepNum = getStepIndex(currentStatus);

  const steps = [
    { label: 'Placed', icon: Clock },
    { label: 'Assigned', icon: Check },
    { label: 'En Route', icon: Truck },
    { label: 'Collected', icon: PackageCheck },
  ];

  return (
    <View style={styles.container}>
      {steps.map((step, idx) => {
        const stepIdx = idx + 1;
        const isDone = stepNum >= stepIdx;
        const isCurrent = stepNum === stepIdx;
        const StepIcon = step.icon;

        return (
          <React.Fragment key={step.label}>
            {/* Step node */}
            <View style={styles.stepNode}>
              <View
                style={[
                  styles.circle,
                  isDone && styles.circleDone,
                  isCurrent && styles.circleCurrent,
                ]}
              >
                <StepIcon
                  size={14}
                  color={isDone ? '#fff' : '#9CA3AF'}
                  strokeWidth={2.5}
                />
              </View>
              <Text
                style={[
                  styles.label,
                  isDone && styles.labelDone,
                  isCurrent && styles.labelCurrent,
                ]}
              >
                {step.label}
              </Text>
            </View>

            {/* Connecting line */}
            {idx < steps.length - 1 && (
              <View
                style={[
                  styles.line,
                  stepNum > stepIdx && styles.lineDone,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f8',
  },
  stepNode: {
    alignItems: 'center',
    gap: 4,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f8',
  },
  circleDone: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  circleCurrent: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  line: {
    flex: 1,
    height: 3,
    backgroundColor: '#e2e8f8',
    marginBottom: 16,
    marginHorizontal: 4,
    borderRadius: 2,
  },
  lineDone: {
    backgroundColor: Colors.primary,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    color: '#9CA3AF',
  },
  labelDone: {
    color: '#151c27',
    fontFamily: 'Poppins-SemiBold',
  },
  labelCurrent: {
    color: Colors.primary,
    fontFamily: 'Poppins-Bold',
  },
});
