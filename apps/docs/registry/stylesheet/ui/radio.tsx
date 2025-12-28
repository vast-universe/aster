import { Pressable, View, Text, StyleSheet } from "react-native";

export interface RadioOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export function RadioGroup({
  options,
  value,
  onChange,
  disabled,
}: RadioGroupProps) {
  return (
    <View style={styles.container}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => !disabled && !option.disabled && onChange?.(option.value)}
          disabled={disabled || option.disabled}
          style={[
            styles.option,
            (disabled || option.disabled) && styles.disabled,
          ]}
          accessible
          accessibilityRole="radio"
          accessibilityState={{ checked: value === option.value }}
        >
          <View
            style={[
              styles.radio,
              value === option.value && styles.radioSelected,
            ]}
          >
            {value === option.value && <View style={styles.radioDot} />}
          </View>
          <Text style={styles.label}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: "#3b82f6",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3b82f6",
  },
  label: {
    fontSize: 16,
    color: "#111827",
  },
});
