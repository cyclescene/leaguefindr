import { toast } from 'sonner';

export type ToastType = 'default' | 'success' | 'error' | 'loading';

interface ToastOptions {
  duration?: number;
  description?: string;
}

/**
 * Hook to show toast notifications using Sonner
 * Provides convenient methods for different notification types
 */
export function useToast() {
  const showToast = (
    message: string,
    type: ToastType = 'default',
    options?: ToastOptions
  ) => {
    const defaultDuration = 3000;

    switch (type) {
      case 'success':
        return toast.success(message, {
          duration: options?.duration ?? defaultDuration,
          description: options?.description,
        });
      case 'error':
        return toast.error(message, {
          duration: options?.duration ?? defaultDuration,
          description: options?.description,
        });
      case 'loading':
        return toast.loading(message, {
          description: options?.description,
        });
      case 'default':
      default:
        return toast(message, {
          duration: options?.duration ?? defaultDuration,
          description: options?.description,
        });
    }
  };

  return {
    success: (message: string, options?: ToastOptions) =>
      showToast(message, 'success', options),
    error: (message: string, options?: ToastOptions) =>
      showToast(message, 'error', options),
    loading: (message: string, options?: ToastOptions) =>
      showToast(message, 'loading', options),
    info: (message: string, options?: ToastOptions) =>
      showToast(message, 'default', options),
    promise: <T,>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string;
        error: string;
      },
      options?: ToastOptions
    ) =>
      toast.promise(promise, {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      }),
  };
}
