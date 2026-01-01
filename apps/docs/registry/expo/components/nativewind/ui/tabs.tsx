import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { cn } from "@/lib/aster-utils";

export interface Tab {
  key: string;
  label: string;
  content: React.ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  defaultKey?: string;
  onChange?: (key: string) => void;
  className?: string;
}

export function Tabs({ tabs, defaultKey, onChange, className }: TabsProps) {
  const [activeKey, setActiveKey] = useState(defaultKey || tabs[0]?.key);

  const handleChange = (key: string) => {
    setActiveKey(key);
    onChange?.(key);
  };

  const activeTab = tabs.find((tab) => tab.key === activeKey);

  return (
    <View className={cn("flex-1", className)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="border-b border-gray-200 dark:border-gray-700"
      >
        <View className="flex-row">
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => handleChange(tab.key)}
              className={cn(
                "px-4 py-3 border-b-2",
                activeKey === tab.key
                  ? "border-blue-500"
                  : "border-transparent"
              )}
              accessible
              accessibilityRole="tab"
              accessibilityState={{ selected: activeKey === tab.key }}
            >
              <Text
                className={cn(
                  "text-sm font-medium",
                  activeKey === tab.key
                    ? "text-blue-500"
                    : "text-gray-600 dark:text-gray-400"
                )}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <View className="flex-1 p-4">{activeTab?.content}</View>
    </View>
  );
}
