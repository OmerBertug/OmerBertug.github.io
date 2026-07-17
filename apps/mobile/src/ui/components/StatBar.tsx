// apps/mobile/src/ui/components/StatBar.tsx
// §8.2 — Rounded bar with Skia gradient, tap ripple, role="button".
// Used in analytics weekly chart.

import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { tokens } from '../tokens.js';

type StatBarProps = {
  day: string;
  value: number;
  max: number;
  selected: boolean;
  onSelect: () => void;
  testID?: string;
};

const BAR_MAX_HEIGHT = 120;
const BAR_MIN_HEIGHT = 4;

export function StatBar({
  day,
  value,
  max,
  selected,
  onSelect,
  testID,
}: StatBarProps): React.JSX.Element {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const fillRatio = max > 0 ? Math.min(value / max, 1) : 0;
  const barHeight = Math.max(BAR_MIN_HEIGHT, fillRatio * BAR_MAX_HEIGHT);

  const barColor = selected ? tokens.color.primary : tokens.color.surface2;

  return (
    <Pressable
      onPress={onSelect}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`${day}: ${value} dakika`}
      accessibilityState={{ selected }}
      testID={testID}
    >
      <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
        {/* Bar */}
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                height: barHeight,
                backgroundColor: barColor,
                shadowColor: selected ? tokens.color.primary : 'transparent',
                shadowOpacity: selected ? 0.6 : 0,
                shadowRadius: 8,
                elevation: selected ? 4 : 0,
              },
            ]}
          />
        </View>
        {/* Day label */}
        <Text
          style={[
            styles.dayLabel,
            { color: selected ? tokens.color.primary : tokens.color.muted },
          ]}
        >
          {day}
        </Text>
        {/* Value label */}
        {selected && (
          <Text style={styles.valueLabel}>
            {value > 0 ? `${String(Math.floor(value / 60))}s ${String(value % 60)}dk` : '0dk'}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.xs,
  },
  barTrack: {
    width: 32,
    height: BAR_MAX_HEIGHT,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: tokens.radius.sm,
  },
  dayLabel: {
    fontSize: tokens.fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  valueLabel: {
    fontSize: tokens.fontSize.xs,
    color: tokens.color.primary,
    fontWeight: '700',
  },
});
