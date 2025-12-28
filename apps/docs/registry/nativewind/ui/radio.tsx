import { Pressable, View, Text } from "react-native";
import { cn } from "@/lib/aster-utils";

export interface RadioOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function RadioGroup({
  options,
  value,
  onChange,
  className,
  disabled,
}: RadioGroupProps) {
  return (
    <View className={cn("gap-3", className)}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => !disabled && !option.disabled && onChange?.(option.value)}
          disabled={disabled || option.disabled}
          className={cn(
            "flex-row items-center gap-3",
            (disabled || option.disabled) && "opacity-50"
          )}
          accessible
          accessibilityRole="radio"
          accessibilityState={{ checked: value === option.value }}
        >
          <View
            className={cn(
              "w-5 h-5 rounded-full border-2 items-center justify-center",
              value === option.value
                ? "border-blue-500"
                : "border-gray-300 dark:border-gray-600"
            )}
          >
            {value === option.value && (
              <View className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            )}
          </View>
          <Text className="text-base text-gray-900 dark:text-white">
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
