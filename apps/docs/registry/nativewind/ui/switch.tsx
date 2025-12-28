import { Pressable, Animated } from "react-native";
import { useRef, useEffect } from "react";
import { cn } from "@/lib/aster-utils";

export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({
  checked = false,
  onCheckedChange,
  disabled = false,
  className,
}: SwitchProps) {
  const translateX = useRef(new Animated.Value(checked ? 20 : 0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: checked ? 20 : 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [checked, translateX]);

  return (
    <Pressable
      onPress={() => onCheckedChange?.(!checked)}
      disabled={disabled}
      className={cn(
        "h-7 w-12 rounded-full p-0.5",
        checked ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600",
        disabled && "opacity-50",
        className
      )}
      accessible
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
    >
      <Animated.View
        style={{ transform: [{ translateX }] }}
        className="h-6 w-6 rounded-full bg-white shadow"
      />
    </Pressable>
  );
}
