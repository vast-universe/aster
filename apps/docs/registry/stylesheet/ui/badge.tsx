import { View, Text, StyleSheet, type ViewStyle } from "react-native";

type BadgeVariant = "default" | "secondary" | "destructive" | "success" | "outline";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ children, variant = "default", style }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[`variant_${variant}`], style]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  variant_default: {
    backgroundColor: "#3b82f6",
  },
  variant_secondary: {
    backgroundColor: "#6b7280",
  },
  variant_destructive: {
    backgroundColor: "#ef4444",
  },
  variant_success: {
    backgroundColor: "#22c55e",
  },
  variant_outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
  },
  text_default: {
    color: "#fff",
  },
  text_secondary: {
    color: "#fff",
  },
  text_destructive: {
    color: "#fff",
  },
  text_success: {
    color: "#fff",
  },
  text_outline: {
    color: "#111827",
  },
});
