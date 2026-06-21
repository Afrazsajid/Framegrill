import { create } from 'zustand';

type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
};

type UIState = {
  toasts: Toast[];
  isAddingToCart: string | null;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  setAddingToCart: (itemId: string | null) => void;
};

export const useUIStore = create<UIState>()((set) => ({
  toasts: [],
  isAddingToCart: null,

  addToast: (message, type) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  setAddingToCart: (itemId) => set({ isAddingToCart: itemId }),
}));