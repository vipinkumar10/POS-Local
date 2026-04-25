/**
 * Bluetooth Service — uses native Web Bluetooth API.
 * Works in Chromium-based browsers (Chrome, Edge) that support navigator.bluetooth.
 */
import { usePrinterStore } from '../store/printerStore';

class BluetoothService {
  constructor() {
    this.device = null;
  }

  async connect() {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth not supported in this browser. Use Chrome or Edge.');
    }

    try {
      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
          '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
        ],
      });

      this.device.addEventListener('gattserverdisconnected', () => {
        usePrinterStore.getState().setConnection(false, null);
      });

      await this.device.gatt.connect();
      usePrinterStore.getState().setConnection(true, this.device.name || 'Unknown Printer');
      return true;
    } catch (err) {
      usePrinterStore.getState().setConnection(false, null);
      throw err;
    }
  }

  async disconnect() {
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    usePrinterStore.getState().setConnection(false, null);
  }

  async printReceipt(bytes) {
    if (!usePrinterStore.getState().isConnected) {
      throw new Error('Printer not connected');
    }
    // Fallback: use browser print dialog
    window.print();
  }

  isBluetoothSupported() {
    return !!navigator.bluetooth;
  }
}

export const bluetoothService = new BluetoothService();
