import { Modal, View, Text, Pressable, StyleSheet } from "react-native";

export interface ActionSheetOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

export interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  options: ActionSheetOption[];
  cancelText?: string;
}

export function ActionSheet({
  visible,
  onClose,
  title,
  message,
  options,
  cancelText = "取消",
}: ActionSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          <View style={styles.sheet}>
            {(title || message) && (
              <View style={styles.header}>
                {title && <Text style={styles.title}>{title}</Text>}
                {message && <Text style={styles.message}>{message}</Text>}
              </View>
            )}
            {options.map((option, index) => (
              <Pressable
                key={index}
                onPress={() => {
                  option.onPress();
                  onClose();
                }}
                style={[
                  styles.option,
                  index < options.length - 1 && styles.optionBorder,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    option.destructive && styles.destructive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={styles.cancelText}>{cancelText}</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#f3f4f6",
    padding: 8,
  },
  sheet: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    color: "#111827",
  },
  message: {
    fontSize: 12,
    textAlign: "center",
    color: "#6b7280",
    marginTop: 4,
  },
  option: {
    paddingVertical: 16,
    alignItems: "center",
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  optionText: {
    fontSize: 18,
    color: "#3b82f6",
  },
  destructive: {
    color: "#ef4444",
  },
  cancel: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#3b82f6",
  },
});
