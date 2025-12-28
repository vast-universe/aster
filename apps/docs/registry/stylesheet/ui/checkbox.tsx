import { Pressable, View, StyleSheet, type ViewStyle } from "react-native";

export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Checkbox({
  checked = false,
  onCheckedChange,
  disabled = false,
  style,
}: CheckboxProps) {
  return (
    <Pressable
      onPress={() => onCheckedChange?.(!checked)}
      disabled={disabled}
      style={[
        styles.checkbox,
        checked && styles.checked,
        disabled && styles.disabled,
        style,
      ]}
      accessible
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
    >
      {checked && <View style={styles.indicator} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    height: 20,
    width: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checked: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  disabled: {
    opacity: 0.5,
  },
  indicator: {
    height: 10,
    width: 10,
    backgroundColor: "#fff",
    borderRadius: 2,
  },
});
