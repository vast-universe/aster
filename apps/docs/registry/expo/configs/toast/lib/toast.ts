import Toast, { type ToastShowParams } from "react-native-toast-message";

type ToastType = "success" | "error" | "info";

interface ShowToastOptions {
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export const toast = {
  show: ({ type = "info", title, message, duration = 3000 }: ShowToastOptions) => {
    Toast.show({
      type,
      text1: title,
      text2: message,
      visibilityTime: duration,
    });
  },

  success: (title: string, message?: string) => {
    toast.show({ type: "success", title, message });
  },

  error: (title: string, message?: string) => {
    toast.show({ type: "error", title, message });
  },

  info: (title: string, message?: string) => {
    toast.show({ type: "info", title, message });
  },

  hide: () => {
    Toast.hide();
  },
};

export default toast;
