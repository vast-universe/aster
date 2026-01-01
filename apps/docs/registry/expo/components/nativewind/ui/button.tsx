import { Pressable, Text, ActivityIndicator, type PressableProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/aster-utils";

const buttonVariants = cva(
  "flex-row items-center justify-center rounded-lg active:opacity-80",
  {
    variants: {
      variant: {
        default: "bg-blue-500",
        secondary: "bg-gray-500",
        destructive: "bg-red-500",
        outline: "border border-gray-300 bg-transparent",
        ghost: "bg-transparent",
      },
      size: {
        sm: "h-9 px-3 gap-1.5",
        default: "h-11 px-4 gap-2",
        lg: "h-13 px-6 gap-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const buttonTextVariants = cva("font-medium", {
  variants: {
    variant: {
      default: "text-white",
      secondary: "text-white",
      destructive: "text-white",
      outline: "text-gray-900 dark:text-white",
      ghost: "text-gray-900 dark:text-white",
    },
    size: {
      sm: "text-sm",
      default: "text-base",
      lg: "text-lg",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ButtonProps
  extends PressableProps,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  loading?: boolean;
}

export function Button({
  children,
  variant,
  size,
  loading,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      className={cn(
        buttonVariants({ variant, size }),
        isDisabled && "opacity-50",
        className
      )}
      disabled={isDisabled}
      accessible
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" || variant === "ghost" ? "#111" : "#fff"}
        />
      ) : (
        <Text className={cn(buttonTextVariants({ variant, size }))}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}
