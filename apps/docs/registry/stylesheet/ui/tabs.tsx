import { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";

export interface Tab {
  key: string;
  label: string;
  content: React.ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  defaultKey?: string;
  onChange?: (key: string) => void;
}

export function Tabs({ tabs, defaultKey, onChange }: TabsProps) {
  const [activeKey, setActiveKey] = useState(defaultKey || tabs[0]?.key);

  const handleChange = (key: string) => {
    setActiveKey(key);
    onChange?.(key);
  };

  const activeTab = tabs.find((tab) => tab.key === activeKey);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
      >
        <View style={styles.tabList}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => handleChange(tab.key)}
              style={[
                styles.tab,
                activeKey === tab.key && styles.tabActive,
              ]}
              accessible
              accessibilityRole="tab"
              accessibilityState={{ selected: activeKey === tab.key }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeKey === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <View style={styles.content}>{activeTab?.content}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tabList: {
    flexDirection: "row",
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#3b82f6",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  tabTextActive: {
    color: "#3b82f6",
  },
  content: {
    flex: 1,
    padding: 16,
  },
});
