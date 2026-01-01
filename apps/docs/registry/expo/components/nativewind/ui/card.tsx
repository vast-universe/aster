import { View, Text } from "react-native";
import { cn } from "@/lib/aster-utils";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <View
      className={cn(
        "rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm",
        "border border-gray-200 dark:border-gray-700",
        className
      )}
    >
      {children}
    </View>
  );
}

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return <View className={cn("mb-3", className)}>{children}</View>;
}

export interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <Text
      className={cn(
        "text-lg font-semibold text-gray-900 dark:text-white",
        className
      )}
    >
      {children}
    </Text>
  );
}

export interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <Text className={cn("text-sm text-gray-500 dark:text-gray-400", className)}>
      {children}
    </Text>
  );
}

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <View className={cn(className)}>{children}</View>;
}

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <View className={cn("mt-4 flex-row items-center", className)}>
      {children}
    </View>
  );
}
