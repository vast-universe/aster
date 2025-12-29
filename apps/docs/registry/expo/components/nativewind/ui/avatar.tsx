import { View, Text, Image } from "react-native";
import { useState } from "react";
import { cn } from "@/lib/aster-utils";

export interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  default: "h-10 w-10",
  lg: "h-14 w-14",
};

const textSizeClasses = {
  sm: "text-xs",
  default: "text-sm",
  lg: "text-lg",
};

export function Avatar({
  src,
  alt,
  fallback,
  size = "default",
  className,
}: AvatarProps) {
  const [error, setError] = useState(false);

  const showFallback = !src || error;

  return (
    <View
      className={cn(
        "rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 items-center justify-center",
        sizeClasses[size],
        className
      )}
      accessible
      accessibilityRole="image"
      accessibilityLabel={alt || fallback}
    >
      {showFallback ? (
        <Text
          className={cn(
            "font-medium text-gray-600 dark:text-gray-300",
            textSizeClasses[size]
          )}
        >
          {fallback?.charAt(0).toUpperCase() || "?"}
        </Text>
      ) : (
        <Image
          source={{ uri: src }}
          className="h-full w-full"
          onError={() => setError(true)}
        />
      )}
    </View>
  );
}
