import { View, Text, StyleSheet } from "react-native";

export interface DividerProps {
  orientation?: "horizontal" | "vertical";
  children?: React.ReactNode;
}

export function Divider({ orientation = "horizontal", children }: DividerProps) {
  if (orientation === "vertical") {
    return <View style={styles.vertical} />;
  }

  if (children) {
    return (
      <View style={styles.withText}>
        <View style={styles.line} />
        <Text style={styles.text}>{children}</Text>
        <View style={styles.line} />
      </View>
    );
  }

  return <View style={styles.horizontal} />;
}

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  vertical: {
    width: 1,
    backgroundColor: "#e5e7eb",
    alignSelf: "stretch",
  },
  withText: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  text: {
    fontSize: 14,
    color: "#6b7280",
  },
});
