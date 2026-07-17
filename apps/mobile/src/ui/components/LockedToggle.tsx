// apps/mobile/src/ui/components/LockedToggle.tsx
// §8.2 — Switch with amber ring + lock icon overlay when locked.
// Emits onAttemptWhileLocked for toast display.
// All lock checks are driven by domain invariants, never UI state alone (§7 T15).

import React, { useCallback } from 'react';
import {
  View,
  Switch,
  Pressable,
  StyleSheet,
  Animated,
  AccessibilityInfo,
  type ViewStyle,
} from 'react-native';
import { tokens } from '../tokens.js';

type LockedToggleProps = {
  value: boolean;
  onValueChange: (newValue: boolean) => void;
  locked: boolean;
  onAttemptWhileLocked?: () => void;
  disabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
};

export function LockedToggle({
  value,
  onValueChange,
  locked,
  onAttemptWhileLocked,
  disabled = false,
  testID,
  accessibilityLabel,
}: LockedToggleProps): React.JSX.Element {
  const shakeAnim = React.useRef(new Animated.Value(0)).current;

  const triggerShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 4, duration: tokens.motion.fast / 4, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4, duration: tokens.motion.fast / 4, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: tokens.motion.fast / 4, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: tokens.motion.fast / 4, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handlePress = useCallback(() => {
    if (locked) {
      triggerShake();
      onAttemptWhileLocked?.();
      AccessibilityInfo.announceForAccessibility('Kilitli — bakım penceresi dışında değiştirilemez');
      return;
    }
    if (!disabled) onValueChange(!value);
  }, [locked, disabled, value, onValueChange, onAttemptWhileLocked, triggerShake]);

  const containerStyle: ViewStyle = {
    borderWidth: locked ? 2 : 0,
    borderColor: locked ? tokens.color.warning : 'transparent',
    borderRadius: tokens.radius.sm,
    padding: 2,
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: locked || disabled }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <Animated.View style={[containerStyle, { transform: [{ translateX: shakeAnim }] }]}>
        <View style={styles.row}>
          <Switch
            value={value}
            onValueChange={locked || disabled ? undefined : onValueChange}
            disabled={locked || disabled}
            trackColor={{
              false: tokens.color.surface2,
              true: locked ? tokens.color.warning : tokens.color.primary,
            }}
            thumbColor={value ? '#ffffff' : tokens.color.muted}
            ios_backgroundColor={tokens.color.surface2}
          />
          {locked && (
            <View style={styles.lockBadge}>
              {/* Lock icon — using Unicode for zero-dependency icon */}
              {/* TODO(ui): Replace with react-native-vector-icons or Expo icons */}
              <Animated.Text style={styles.lockIcon}>🔒</Animated.Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lockBadge: {
    marginLeft: 4,
  },
  lockIcon: {
    fontSize: 14,
  },
});
