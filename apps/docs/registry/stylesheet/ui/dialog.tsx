import { Modal, View, Text, Pressable, StyleSheet } from "react-native";

export interface DialogProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export interface DialogFooterProps {
  children: React.ReactNode;
}

export interface DialogButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "default" | "destructive";
}

export function Dialog({
  visible,
  onClose,
  title,
  description,
  children,
}: DialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          <View style={styles.content}>
            {title && <Text style={styles.title}>{title}</Text>}
            {description && <Text style={styles.description}>{description}</Text>}
          </View>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function DialogFooter({ children }: DialogFooterProps) {
  return <View style={styles.footer}>{children}</View>;
}

export function DialogButton({
  children,
  onPress,
  variant = "default",
}: DialogButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.button,
        variant === "destructive" ? styles.buttonDestructive : styles.buttonDefault,
      ]}
    >
      <Text style={styles.buttonText}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  dialog: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "100%",
    maxWidth: 320,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#6b7280",
  },
  footer: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDefault: {
    backgroundColor: "#3b82f6",
  },
  buttonDestructive: {
    backgroundColor: "#ef4444",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "500",
  },
});
