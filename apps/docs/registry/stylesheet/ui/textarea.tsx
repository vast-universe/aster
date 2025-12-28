import { TextInput, StyleSheet, type TextInputProps } from "react-native";

export interface TextareaProps extends TextInputProps {
  error?: boolean;
}

export function Textarea({ error, style, ...props }: TextareaProps) {
  return (
    <TextInput
      multiline
      textAlignVertical="top"
      style={[styles.textarea, error && styles.error, style]}
      placeholderTextColor="#9ca3af"
      accessible
      accessibilityRole="text"
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  textarea: {
    minHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
