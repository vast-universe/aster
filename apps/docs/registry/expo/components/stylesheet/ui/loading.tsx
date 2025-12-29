import { View, ActivityIndicator, Text, StyleSheet, type ViewStyle } from "react-native";

export interface LoadingProps {
  size?: "small" | "large";
  color?: string;
  text?: string;
  fullscreen?: boolean;
  style?: ViewStyle;
}

export function Loading({
  size = "large",
  color = "#3b82f6",
  text,
  fullscreen = false,
  style,
}: LoadingProps) {
  const content = (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );

  if (fullscreen) {
    return <View style={styles.fullscreen}>{content}</View>;
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fullscreen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    zIndex: 50,
  },
  text: {
    color: "#6b7280",
    fontSize: 14,
  },
});
