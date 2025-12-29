import { View, Text, Image, StyleSheet, type ViewStyle } from "react-native";
import { useState } from "react";

export interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "default" | "lg";
  style?: ViewStyle;
}

export function Avatar({
  src,
  alt,
  fallback,
  size = "default",
  style,
}: AvatarProps) {
  const [error, setError] = useState(false);
  const showFallback = !src || error;

  return (
    <View
      style={[styles.container, styles[`size_${size}`], style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={alt || fallback}
    >
      {showFallback ? (
        <Text style={[styles.fallback, styles[`fallbackSize_${size}`]]}>
          {fallback?.charAt(0).toUpperCase() || "?"}
        </Text>
      ) : (
        <Image
          source={{ uri: src }}
          style={styles.image}
          onError={() => setError(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 9999,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  size_sm: {
    height: 32,
    width: 32,
  },
  size_default: {
    height: 40,
    width: 40,
  },
  size_lg: {
    height: 56,
    width: 56,
  },
  image: {
    height: "100%",
    width: "100%",
  },
  fallback: {
    fontWeight: "500",
    color: "#4b5563",
  },
  fallbackSize_sm: {
    fontSize: 12,
  },
  fallbackSize_default: {
    fontSize: 14,
  },
  fallbackSize_lg: {
    fontSize: 18,
  },
});
