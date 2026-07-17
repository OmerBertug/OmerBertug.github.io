// apps/mobile/src/ui/components/TimeWindowPicker.tsx
// §8.2 — Two wheel pickers: start (editable) + end (derived = start+10, read-only).
// Locked state disables editing. T14: zero-minute windows rejected by Zod.

import React, { useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, type ViewStyle } from 'react-native';
import type { TimeWindow } from '@aegis/schemas';
import { tokens } from '../tokens.js';
import { t } from '../../i18n/index.js';

type TimeWindowPickerProps = {
  window: TimeWindow;
  onChange: (window: TimeWindow) => void;
  locked: boolean;
  testID?: string;
};

// Format minute-of-day as HH:mm
function minuteToHhmm(minute: number): string {
  const h = Math.floor(minute / 60) % 24;
  const m = minute % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Generate all selectable minutes (0-1439, step 1)
const ALL_MINUTES = Array.from({ length: 1440 }, (_, i) => i);

export function TimeWindowPicker({
  window: tw,
  onChange,
  locked,
  testID,
}: TimeWindowPickerProps): React.JSX.Element {
  // End is always start + 10 (mod 1440)
  const derivedEnd = useMemo(() => (tw.startMinuteOfDay + 10) % 1440, [tw.startMinuteOfDay]);

  const handleStartChange = useCallback(
    (newStart: number) => {
      if (locked) return;
      const newEnd = (newStart + 10) % 1440;
      onChange({ startMinuteOfDay: newStart, endMinuteOfDay: newEnd });
    },
    [locked, onChange],
  );

  const containerStyle: ViewStyle = {
    opacity: locked ? 0.5 : 1,
  };

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {/* Start picker */}
      <View style={styles.pickerGroup}>
        <Text style={styles.label}>Başlangıç</Text>
        <MinuteWheel
          selectedMinute={tw.startMinuteOfDay}
          onSelect={handleStartChange}
          disabled={locked}
          testID={testID ? `${testID}-start` : undefined}
        />
        <Text style={styles.value}>{minuteToHhmm(tw.startMinuteOfDay)}</Text>
      </View>

      <View style={styles.separator}>
        <Text style={styles.separatorText}>→</Text>
      </View>

      {/* End picker — derived, read-only */}
      <View style={styles.pickerGroup}>
        <Text style={styles.label}>Bitiş</Text>
        <View style={styles.readOnlyPicker}>
          <Text style={styles.readOnlyValue}>{minuteToHhmm(derivedEnd)}</Text>
          <Text style={styles.mutedLabel}>{t('protection.windowSuffix')}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── MinuteWheel ──────────────────────────────────────────────────────────────
// Simplified scroll-based picker (hour granularity for UX; minute fine-tune via stepper).
// TODO(ui): Replace with @react-native-community/datetimepicker or Picker for native feel.

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;

type MinuteWheelProps = {
  selectedMinute: number;
  onSelect: (minute: number) => void;
  disabled: boolean;
  testID?: string;
};

function MinuteWheel({ selectedMinute, onSelect, disabled, testID }: MinuteWheelProps): React.JSX.Element {
  // Show every 5 minutes for UX
  const options = useMemo(() => ALL_MINUTES.filter((m) => m % 5 === 0), []);

  const selectedIdx = options.findIndex((m) => m === Math.round(selectedMinute / 5) * 5);

  return (
    <View
      style={[styles.wheel, { height: ITEM_HEIGHT * VISIBLE_ITEMS }]}
      testID={testID}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        scrollEnabled={!disabled}
        contentOffset={{ x: 0, y: Math.max(0, selectedIdx) * ITEM_HEIGHT }}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
          const selected = options[idx];
          if (selected !== undefined) onSelect(selected);
        }}
      >
        {options.map((minute) => (
          <View key={minute} style={[styles.wheelItem, { height: ITEM_HEIGHT }]}>
            <Text
              style={[
                styles.wheelItemText,
                minute === Math.round(selectedMinute / 5) * 5 && styles.wheelItemSelected,
              ]}
            >
              {minuteToHhmm(minute)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    padding: tokens.spacing.sm,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
  },
  pickerGroup: {
    flex: 1,
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  label: {
    color: tokens.color.muted,
    fontSize: tokens.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    color: tokens.color.text,
    fontSize: tokens.fontSize.base,
    fontWeight: '600',
  },
  separator: {
    paddingHorizontal: tokens.spacing.sm,
  },
  separatorText: {
    color: tokens.color.muted,
    fontSize: tokens.fontSize.lg,
  },
  readOnlyPicker: {
    alignItems: 'center',
    gap: 2,
  },
  readOnlyValue: {
    color: tokens.color.muted,
    fontSize: tokens.fontSize.lg,
    fontWeight: '600',
  },
  mutedLabel: {
    color: tokens.color.muted,
    fontSize: tokens.fontSize.xs,
  },
  wheel: {
    width: 90,
    overflow: 'hidden',
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.surface2,
  },
  wheelItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelItemText: {
    color: tokens.color.muted,
    fontSize: tokens.fontSize.sm,
  },
  wheelItemSelected: {
    color: tokens.color.primary,
    fontSize: tokens.fontSize.base,
    fontWeight: '700',
  },
});
