import {
  TextInput,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

export interface InputProps extends TextInputProps {
  error?: boolean;
  style?: ViewStyle;
}

export function Input({ error, style, ...props }: InputProps) {
  return (
    <TextInput
      style={[styles.input, error && styles.error, style]}
      placeholderTextColor="#9ca3af"
      accessible
      accessibilityRole="text"
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#111827",
  },
  error: {
    borderColor: "#ef4444",
  },
});
