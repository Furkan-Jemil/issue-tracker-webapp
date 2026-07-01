/**
 * Toast / snack bar system for the mobile app.
 *
 * Usage:
 *   // Anywhere in the component tree:
 *   const { showToast } = useToast();
 *   showToast({ message: 'Role updated!', type: 'success' });
 *
 *   // Mount the renderer once in App.tsx (inside ToastProvider):
 *   <ToastProvider><App /></ToastProvider>
 *   <ToastRenderer />
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (opts: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const COLORS: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: '#f0fdf4', border: '#86efac', text: '#15803d', icon: '#22c55e' },
  error:   { bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c', icon: '#ef4444' },
  info:    { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8', icon: '#3b82f6' },
};

const DARK_COLORS: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: '#052e16', border: '#166534', text: '#86efac', icon: '#22c55e' },
  error:   { bg: '#450a0a', border: '#7f1d1d', text: '#fca5a5', icon: '#ef4444' },
  info:    { bg: '#0c1a40', border: '#1e40af', text: '#93c5fd', icon: '#3b82f6' },
};

function ToastItem({
  toast,
  onDismiss,
  isDark,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
  isDark: boolean;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const palette = isDark ? DARK_COLORS[toast.type] : COLORS[toast.type];

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(opacity, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 250, useNativeDriver: true }),
      ]).start(() => onDismiss(toast.id));
    }, toast.duration ?? 3500);

    return () => clearTimeout(timer);
  }, []);

  const Icon =
    toast.type === 'success' ? CheckCircle2 :
    toast.type === 'error'   ? AlertCircle  : Info;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity,
          transform: [{ translateY }],
        },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Icon size={16} color={palette.icon} />
      <Text style={[styles.message, { color: palette.text, flex: 1 }]}>{toast.message}</Text>
      <TouchableOpacity
        onPress={() => onDismiss(toast.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Dismiss"
        accessibilityRole="button"
      >
        <X size={14} color={palette.text} strokeWidth={2.5} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const insets = useSafeAreaInsets();

  const showToast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-2), { ...opts, id }]); // max 3 at a time

    // Haptics feedback
    if (opts.type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else if (opts.type === 'error') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Rendered above everything */}
      <View
        pointerEvents="box-none"
        style={[styles.container, { top: insets.top + 12 }]}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} isDark={false} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: width - 32,
  },
  message: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13.5,
    lineHeight: 18,
  },
});
