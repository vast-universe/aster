import { useState } from "react";
import { Pressable, View, Text, Modal, FlatList } from "react-native";
import { cn } from "@/lib/aster-utils";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "请选择",
  disabled,
  className,
}: SelectProps) {
  const [visible, setVisible] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <>
      <Pressable
        onPress={() => !disabled && setVisible(true)}
        disabled={disabled}
        className={cn(
          "h-11 px-3 flex-row items-center justify-between rounded-lg border",
          "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900",
          disabled && "opacity-50",
          className
        )}
        accessible
        accessibilityRole="combobox"
      >
        <Text
          className={cn(
            "text-base",
            selectedOption
              ? "text-gray-900 dark:text-white"
              : "text-gray-400"
          )}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <Text className="text-gray-400">▼</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setVisible(false)}
        >
          <View className="bg-white dark:bg-gray-900 rounded-t-xl max-h-[50%]">
            <View className="p-4 border-b border-gray-200 dark:border-gray-700">
              <Text className="text-lg font-semibold text-center text-gray-900 dark:text-white">
                {placeholder}
              </Text>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange?.(item.value);
                    setVisible(false);
                  }}
                  className={cn(
                    "px-4 py-3 border-b border-gray-100 dark:border-gray-800",
                    item.value === value && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                >
                  <Text
                    className={cn(
                      "text-base",
                      item.value === value
                        ? "text-blue-500 font-medium"
                        : "text-gray-900 dark:text-white"
                    )}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
