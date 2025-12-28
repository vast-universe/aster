import { View, ActivityIndicator, Text } from "react-native";
import { cn } from "@/lib/aster-utils";

export interface LoadingProps {
  size?: "small" | "large";
  color?: string;
  text?: string;
  fullscreen?: boolean;
  className?: string;
}

export function Loading({
  size = "large",
  color = "#3b82f6",
  text,
  fullscreen = false,
  className,
}: LoadingProps) {
  const content = (
    <View className={cn("items-center justify-center gap-2", className)}>
      <ActivityIndicator size={size} color={color} />
      {text && (
        <Text className="text-gray-500 dark:text-gray-400 text-sm">{text}</Text>
      )}
    </View>
  );

  if (fullscreen) {
    return (
      <View className="absolute inset-0 items-center justify-center bg-white/80 dark:bg-gray-900/80 z-50">
        {content}
      </View>
    );
  }

  return content;
}
