import { Pressable, Animated, StyleSheet, type ViewStyle } from "react-native";
import { useRef, useEffect } from "react";

export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Switch({
  checked = false,
  onCheckedChange,
  disabled = false,
  style,
}: SwitchProps) {
  const translateX = useRef(new Animated.Value(checked ? 20 : 0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: checked ? 20 : 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [checked, translateX]);

  return (
    <Pressable
      onPress={() => onCheckedChange?.(!checked)}
      disabled={disabled}
      style={[
        styles.track,
        checked && styles.trackChecked,
        disabled && styles.disabled,
        style,
      ]}
      accessible
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
    >
      <Animated.View
        style={[styles.thumb, { transform: [{ translateX }] }]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 28,
    width: 48,
    borderRadius: 14,
    padding: 2,
    backgroundColor: "#d1d5db",
  },
  trackChecked: {
    backgroundColor: "#3b82f6",
  },
  disabled: {
    opacity: 0.5,
  },
  thumb: {
    height: 24,
    width: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
