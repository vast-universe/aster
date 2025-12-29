import { View, Text, Pressable } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/aster-utils";

const alertVariants = cva(
  "p-4 rounded-lg flex-row gap-3",
  {
    variants: {
      variant: {
        default: "bg-gray-100 dark:bg-gray-800",
        info: "bg-blue-50 dark:bg-blue-900/20",
        success: "bg-green-50 dark:bg-green-900/20",
        warning: "bg-yellow-50 dark:bg-yellow-900/20",
        error: "bg-red-50 dark:bg-red-900/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const alertIconMap = {
  default: "ℹ️",
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "❌",
};

const alertTextVariants = cva("text-sm", {
  variants: {
    variant: {
      default: "text-gray-700 dark:text-gray-300",
      info: "text-blue-700 dark:text-blue-300",
      success: "text-green-700 dark:text-green-300",
      warning: "text-yellow-700 dark:text-yellow-300",
      error: "text-red-700 dark:text-red-300",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface AlertProps extends VariantProps<typeof alertVariants> {
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({
  title,
  children,
  variant,
  onClose,
  className,
}: AlertProps) {
  return (
    <View
      className={cn(alertVariants({ variant }), className)}
      accessible
      accessibilityRole="alert"
    >
      <Text className="text-base">{alertIconMap[variant || "default"]}</Text>
      <View className="flex-1">
        {title && (
          <Text className={cn("font-semibold mb-1", alertTextVariants({ variant }))}>
            {title}
          </Text>
        )}
        <Text className={alertTextVariants({ variant })}>{children}</Text>
      </View>
      {onClose && (
        <Pressable onPress={onClose} className="p-1">
          <Text className="text-gray-400">✕</Text>
        </Pressable>
      )}
    </View>
  );
}
