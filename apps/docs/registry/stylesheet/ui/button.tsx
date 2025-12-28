import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  type PressableProps,
  type ViewStyle,
  type TextStyle,
} from "react-native";

type ButtonVariant = "default" | "secondary" | "destructive" | "outline" | "ghost";
type ButtonSize = "sm" | "default" | "lg";

export interface ButtonProps extends PressableProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  children,
  variant = "default",
  size = "default",
  loading,
  disabled,
  style,
  textStyle,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        styles[`variant_${variant}`],
        styles[`size_${size}`],
        isDisabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
      disabled={isDisabled}
      accessible
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" || variant === "ghost" ? "#111" : "#fff"}
        />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`text_${variant}`],
            styles[`textSize_${size}`],
            textStyle,
          ]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  // Variants
  variant_default: {
    backgroundColor: "#3b82f6",
  },
  variant_secondary: {
    backgroundColor: "#6b7280",
  },
  variant_destructive: {
    backgroundColor: "#ef4444",
  },
  variant_outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  variant_ghost: {
    backgroundColor: "transparent",
  },
  // Sizes
  size_sm: {
    height: 36,
    paddingHorizontal: 12,
    gap: 6,
  },
  size_default: {
    height: 44,
    paddingHorizontal: 16,
    gap: 8,
  },
  size_lg: {
    height: 52,
    paddingHorizontal: 24,
    gap: 10,
  },
  // Text
  text: {
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
  text_outline: {
    color: "#111827",
  },
  text_ghost: {
    color: "#111827",
  },
  textSize_sm: {
    fontSize: 14,
  },
  textSize_default: {
    fontSize: 16,
  },
  textSize_lg: {
    fontSize: 18,
  },
});
