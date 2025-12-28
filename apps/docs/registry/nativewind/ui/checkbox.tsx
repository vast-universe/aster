import { Pressable, View } from "react-native";
import { cn } from "@/lib/aster-utils";

export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  checked = false,
  onCheckedChange,
  disabled = false,
  className,
}: CheckboxProps) {
  return (
    <Pressable
      onPress={() => onCheckedChange?.(!checked)}
      disabled={disabled}
      className={cn(
        "h-5 w-5 rounded border-2 items-center justify-center",
        checked
          ? "bg-blue-500 border-blue-500"
          : "bg-transparent border-gray-300 dark:border-gray-600",
        disabled && "opacity-50",
        className
      )}
      accessible
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
    >
      {checked && (
        <View className="h-2.5 w-2.5 bg-white rounded-sm" />
      )}
    </Pressable>
  );
}
