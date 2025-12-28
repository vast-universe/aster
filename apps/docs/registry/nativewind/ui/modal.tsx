import { Modal as RNModal, View, Pressable, Text } from "react-native";
import { cn } from "@/lib/aster-utils";

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  className,
}: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-center items-center bg-black/50"
        onPress={onClose}
      >
        <Pressable
          className={cn(
            "bg-white dark:bg-gray-900 rounded-xl p-6 mx-4 w-full max-w-sm",
            className
          )}
          onPress={(e) => e.stopPropagation()}
        >
          {title && (
            <Text className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {title}
            </Text>
          )}
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
