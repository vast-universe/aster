import { TextInput, type TextInputProps } from "react-native";
import { cn } from "@/lib/aster-utils";

export interface TextareaProps extends TextInputProps {
  error?: boolean;
}

export function Textarea({ error, className, ...props }: TextareaProps) {
  return (
    <TextInput
      multiline
      textAlignVertical="top"
      className={cn(
        "min-h-[100px] px-3 py-2 rounded-lg border bg-white dark:bg-gray-900",
        "text-base text-gray-900 dark:text-white placeholder:text-gray-400",
        error
          ? "border-red-500"
          : "border-gray-300 dark:border-gray-600",
        className
      )}
      accessible
      accessibilityRole="text"
      {...props}
    />
  );
}
