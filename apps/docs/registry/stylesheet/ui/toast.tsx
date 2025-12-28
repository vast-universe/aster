import {
  View,
  Text,
  Animated,
  Pressable,
  StyleSheet,
} from "react-native";
import { useEffect, useRef, useState, createContext, useContext } from "react";

type ToastType = "default" | "success" | "error" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

const typeColors = {
  default: "#1f2937",
  success: "#22c55e",
  error: "#ef4444",
  warning: "#eab308",
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: true }),
      ]).start(() => onRemove());
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [opacity, translateY, toast.duration, onRemove]);

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: typeColors[toast.type], opacity, transform: [{ translateY }] },
      ]}
    >
      <Pressable onPress={onRemove}>
        <Text style={styles.toastText}>{toast.message}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (message: string, type: ToastType = "default", duration = 3000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <View style={styles.container}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  toast: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  toastText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "500",
  },
});
