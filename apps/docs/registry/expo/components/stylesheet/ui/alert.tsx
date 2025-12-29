import { View, Text, Pressable, StyleSheet } from "react-native";

type AlertVariant = "default" | "info" | "success" | "warning" | "error";

const variantStyles = {
  default: { bg: "#f3f4f6", text: "#374151" },
  info: { bg: "#eff6ff", text: "#1d4ed8" },
  success: { bg: "#f0fdf4", text: "#15803d" },
  warning: { bg: "#fefce8", text: "#a16207" },
  error: { bg: "#fef2f2", text: "#b91c1c" },
};

const iconMap = {
  default: "ℹ️",
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "❌",
};

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export function Alert({
  variant = "default",
  title,
  children,
  onClose,
}: AlertProps) {
  const colors = variantStyles[variant];

  return (
    <View
      style={[styles.container, { backgroundColor: colors.bg }]}
      accessible
      accessibilityRole="alert"
    >
      <Text style={styles.icon}>{iconMap[variant]}</Text>
      <View style={styles.content}>
        {title && (
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        )}
        <Text style={[styles.message, { color: colors.text }]}>{children}</Text>
      </View>
      {onClose && (
        <Pressable onPress={onClose} style={styles.close}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    flexDirection: "row",
    gap: 12,
  },
  icon: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: "600",
    marginBottom: 4,
    fontSize: 14,
  },
  message: {
    fontSize: 14,
  },
  close: {
    padding: 4,
  },
  closeText: {
    color: "#9ca3af",
  },
});
