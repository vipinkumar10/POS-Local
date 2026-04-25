import { create } from 'zustand';

export const usePrinterStore = create((set) => ({
  isConnected: false,
  deviceName: null,
  setConnection: (isConnected, deviceName = null) => set({ isConnected, deviceName }),
}));
