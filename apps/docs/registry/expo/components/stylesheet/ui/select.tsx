import { useState } from "react";
import { Pressable, View, Text, Modal, FlatList, StyleSheet } from "react-native";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "请选择",
  disabled,
}: SelectProps) {
  const [visible, setVisible] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <>
      <Pressable
        onPress={() => !disabled && setVisible(true)}
        disabled={disabled}
        style={[styles.trigger, disabled && styles.disabled]}
        accessible
        accessibilityRole="combobox"
      >
        <Text style={[styles.triggerText, !selectedOption && styles.placeholder]}>
          {selectedOption?.label || placeholder}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.headerText}>{placeholder}</Text>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange?.(item.value);
                    setVisible(false);
                  }}
                  style={[
                    styles.option,
                    item.value === value && styles.optionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.value === value && styles.optionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    height: 44,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  disabled: {
    opacity: 0.5,
  },
  triggerText: {
    fontSize: 16,
    color: "#111827",
  },
  placeholder: {
    color: "#9ca3af",
  },
  arrow: {
    color: "#9ca3af",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: "50%",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    color: "#111827",
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  optionSelected: {
    backgroundColor: "#eff6ff",
  },
  optionText: {
    fontSize: 16,
    color: "#111827",
  },
  optionTextSelected: {
    color: "#3b82f6",
    fontWeight: "500",
  },
});
