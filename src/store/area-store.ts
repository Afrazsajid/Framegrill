import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DeliveryArea = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  latitude: number | null;
  longitude: number | null;
  radiusKm: number;
};

export type OrderType = 'delivery' | 'pickup';

type AreaState = {
  selectedArea: DeliveryArea | null;
  orderType: OrderType;
  hasSelected: boolean; // true once user has completed the full flow
  isModalOpen: boolean;
  setArea: (area: DeliveryArea) => void;
  setOrderType: (type: OrderType) => void;
  completeSelection: (area: DeliveryArea, type: OrderType) => void;
  clearArea: () => void;
  openModal: () => void;
  closeModal: () => void;
};

export const useAreaStore = create<AreaState>()(
  persist(
    (set) => ({
      selectedArea: null,
      orderType: 'delivery' as OrderType,
      hasSelected: false,
      isModalOpen: false,

      setArea: (area) => set({ selectedArea: area }),

      setOrderType: (type) => set({ orderType: type }),

      completeSelection: (area, type) =>
        set({ selectedArea: area, orderType: type, hasSelected: true, isModalOpen: false }),

      clearArea: () =>
        set({ selectedArea: null, hasSelected: false, orderType: 'delivery' }),

      openModal: () => set({ isModalOpen: true }),

      closeModal: () => set({ isModalOpen: false }),
    }),
    {
      name: 'flamegrill-area',
      partialize: (state) => ({
        selectedArea: state.selectedArea,
        orderType: state.orderType,
        hasSelected: state.hasSelected,
      }),
    }
  )
);