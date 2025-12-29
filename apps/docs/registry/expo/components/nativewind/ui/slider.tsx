import { View, Text, PanResponder, Animated } from "react-native";
import { useRef, useState } from "react";
import { cn } from "@/lib/aster-utils";

export interface SliderProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  showValue?: boolean;
  className?: string;
}

export function Slider({
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  disabled,
  showValue,
  className,
}: SliderProps) {
  const [width, setWidth] = useState(0);
  const pan = useRef(new Animated.Value(0)).current;

  const percentage = ((value - min) / (max - min)) * 100;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderMove: (_, gestureState) => {
        if (width === 0) return;
        const newPercentage = Math.max(0, Math.min(100, (gestureState.moveX / width) * 100));
        const newValue = min + (newPercentage / 100) * (max - min);
        const steppedValue = Math.round(newValue / step) * step;
        onChange?.(Math.max(min, Math.min(max, steppedValue)));
      },
    })
  ).current;

  return (
    <View className={cn("gap-2", className)}>
      <View
        className={cn(
          "h-6 justify-center",
          disabled && "opacity-50"
        )}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <View className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
          <View
            className="h-1 bg-blue-500 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </View>
        <View
          className="absolute w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow"
          style={{ left: `${percentage}%`, marginLeft: -10 }}
        />
      </View>
      {showValue && (
        <Text className="text-sm text-gray-600 dark:text-gray-400 text-center">
          {value}
        </Text>
      )}
    </View>
  );
}
