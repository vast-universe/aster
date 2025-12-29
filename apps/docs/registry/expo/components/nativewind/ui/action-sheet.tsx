import { Modal, View, Text, Pressable } from "react-native";
import { cn } from "@/lib/aster-utils";

export interface ActionSheetOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

export interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  options: ActionSheetOption[];
  cancelText?: string;
  className?: string;
}

export function ActionSheet({
  visible,
  onClose,
  title,
  message,
  options,
  cancelText = "取消",
  className,
}: ActionSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-end"
        onPress={onClose}
      >
        <View className={cn("bg-gray-100 dark:bg-gray-800 p-2", className)}>
          <View className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden mb-2">
            {(title || message) && (
              <View className="p-4 border-b border-gray-200 dark:border-gray-700">
                {title && (
                  <Text className="text-sm font-semibold text-center text-gray-900 dark:text-white">
                    {title}
                  </Text>
                )}
                {message && (
                  <Text className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">
                    {message}
                  </Text>
                )}
              </View>
            )}
            {options.map((option, index) => (
              <Pressable
                key={index}
                onPress={() => {
                  option.onPress();
                  onClose();
                }}
                className={cn(
                  "py-4 items-center",
                  index < options.length - 1 &&
                    "border-b border-gray-200 dark:border-gray-700"
                )}
              >
                <Text
                  className={cn(
                    "text-lg",
                    option.destructive
                      ? "text-red-500"
                      : "text-blue-500"
                  )}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={onClose}
            className="bg-white dark:bg-gray-900 rounded-xl py-4 items-center"
          >
            <Text className="text-lg font-semibold text-blue-500">
              {cancelText}
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
