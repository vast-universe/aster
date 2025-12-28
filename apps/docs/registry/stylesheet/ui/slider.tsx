import { View, Text, PanResponder, StyleSheet } from "react-native";
import { useRef, useState } from "react";

export interface SliderProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  showValue?: boolean;
}

export function Slider({
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  disabled,
  showValue,
}: SliderProps) {
  const [width, setWidth] = useState(0);
  const percentage = ((value - min) / (max - min)) * 100;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderMove: (_, gestureState) => {
        if (width === 0) return;
        const newPercentage = Math.max(0, Math.min(100, (gestureState.moveX / width) * 100));
        const newValue = min + (newPercentage / 100) * (max - min);
        const steppedValue = Math.round(newValue / step) * step;
        onChange?.(Math.max(min, Math.min(max, steppedValue)));
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <View
        style={[styles.track, disabled && styles.disabled]}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <View style={styles.trackBg}>
          <View style={[styles.trackFill, { width: `${percentage}%` }]} />
        </View>
        <View style={[styles.thumb, { left: `${percentage}%` }]} />
      </View>
      {showValue && <Text style={styles.value}>{value}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  track: {
    height: 24,
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  trackBg: {
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
  },
  trackFill: {
    height: 4,
    backgroundColor: "#3b82f6",
    borderRadius: 2,
  },
  thumb: {
    position: "absolute",
    width: 20,
    height: 20,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#3b82f6",
    borderRadius: 10,
    marginLeft: -10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  value: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
});
