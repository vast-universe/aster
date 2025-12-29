import { useForm, type UseFormProps, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodSchema } from "zod";

/**
 * 带 Zod 验证的 useForm 封装
 */
export function useZodForm<T extends FieldValues>(
  schema: ZodSchema<T>,
  options?: Omit<UseFormProps<T>, "resolver">
) {
  return useForm<T>({
    resolver: zodResolver(schema),
    ...options,
  });
}

export { useForm } from "react-hook-form";
export { z } from "zod";
