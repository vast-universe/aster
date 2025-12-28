import { View, Text } from "react-native";
import { cn } from "@/lib/aster-utils";

export interface DividerProps {
  orientation?: "horizontal" | "vertical";
  children?: React.ReactNode;
  className?: string;
}

export function Divider({
  orientation = "horizontal",
  children,
  className,
}: DividerProps) {
  if (orientation === "vertical") {
    return (
      <View
        className={cn("w-px bg-gray-200 dark:bg-gray-700 self-stretch", className)}
      />
    );
  }

  if (children) {
    return (
      <View className={cn("flex-row items-center gap-3", className)}>
        <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <Text className="text-sm text-gray-500 dark:text-gray-400">
          {children}
        </Text>
        <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </View>
    );
  }

  return (
    <View
      className={cn("h-px bg-gray-200 dark:bg-gray-700", className)}
    />
  );
}
