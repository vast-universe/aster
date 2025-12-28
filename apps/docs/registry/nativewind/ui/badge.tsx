import { View, Text } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/aster-utils";

const badgeVariants = cva(
  "rounded-full px-2.5 py-0.5 items-center justify-center",
  {
    variants: {
      variant: {
        default: "bg-blue-500",
        secondary: "bg-gray-500",
        destructive: "bg-red-500",
        success: "bg-green-500",
        outline: "border border-gray-300 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const badgeTextVariants = cva("text-xs font-medium", {
  variants: {
    variant: {
      default: "text-white",
      secondary: "text-white",
      destructive: "text-white",
      success: "text-white",
      outline: "text-gray-900 dark:text-white",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, variant, className }: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)}>
      <Text className={cn(badgeTextVariants({ variant }))}>{children}</Text>
    </View>
  );
}
