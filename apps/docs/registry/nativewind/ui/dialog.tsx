import { Modal, View, Text, Pressable } from "react-native";
import { cn } from "@/lib/aster-utils";

export interface DialogProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export interface DialogButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "default" | "destructive";
  className?: string;
}

export function Dialog({
  visible,
  onClose,
  title,
  description,
  children,
  className,
}: DialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-center items-center p-4"
        onPress={onClose}
      >
        <Pressable
          className={cn(
            "bg-white dark:bg-gray-900 rounded-xl w-full max-w-sm",
            className
          )}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="p-6">
            {title && (
              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {title}
              </Text>
            )}
            {description && (
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                {description}
              </Text>
            )}
          </View>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <View
      className={cn(
        "flex-row gap-2 p-4 border-t border-gray-200 dark:border-gray-700",
        className
      )}
    >
      {children}
    </View>
  );
}

export function DialogButton({
  children,
  onPress,
  variant = "default",
  className,
}: DialogButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "flex-1 py-2.5 rounded-lg items-center",
        variant === "destructive"
          ? "bg-red-500"
          : "bg-blue-500",
        className
      )}
    >
      <Text className="text-white font-medium">{children}</Text>
    </Pressable>
  );
}
