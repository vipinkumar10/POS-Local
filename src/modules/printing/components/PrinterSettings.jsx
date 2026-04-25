import { useState } from 'react';
import { Printer, Bluetooth, CheckCircle2, XCircle } from 'lucide-react';
import { usePrinterStore } from '../store/printerStore';
import { bluetoothService } from '../services/bluetoothService';
import { useToast } from '../../../shared/hooks/useToast';

export default function PrinterSettings() {
  const { isConnected, deviceName } = usePrinterStore();
  const [connecting, setConnecting] = useState(false);
  const toast = useToast();

  const isBluetoothSupported = !!navigator.bluetooth;

  const handleConnect = async () => {
    try {
      setConnecting(true);
      await bluetoothService.connect();
      toast.success('Printer connected successfully!');
    } catch (err) {
      if (err.name === 'NotFoundError') {
        toast.info('No printer selected.');
      } else {
        toast.error('Failed to connect: ' + err.message);
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await bluetoothService.disconnect();
    toast.info('Printer disconnected');
  };

  const handleTestPrint = async () => {
    try {
      await bluetoothService.printReceipt(null);
      toast.success('Test print triggered!');
    } catch (err) {
      toast.error('Test print failed: ' + err.message);
    }
  };

  return (
    <div className="settings-section">
      <h3>🖨️ Thermal Printer Settings</h3>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {!isBluetoothSupported && (
          <div style={{
            padding: '10px 14px',
            background: 'var(--color-warning-bg)',
            color: 'var(--color-warning)',
            borderRadius: 8,
            fontSize: '0.8rem',
            fontWeight: 600,
          }}>
            ⚠️ Web Bluetooth is not supported in this browser. Use Chrome or Edge for direct Bluetooth printing.
            You can still use the <strong>Browser Print</strong> button as a fallback.
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: isConnected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: isConnected ? 'var(--color-success)' : 'var(--color-danger)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Printer size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              Status:{' '}
              {isConnected
                ? <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={16} /> Connected</span>
                : <span style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 4 }}><XCircle size={16} /> Disconnected</span>
              }
            </div>
            {isConnected && deviceName && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Device: {deviceName}
              </div>
            )}
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
              Connect a BLE Thermal Printer. Requires Chrome or Edge browser with Web Bluetooth support.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, borderTop: '1px solid var(--border-color-light)', paddingTop: 16 }}>
          {!isConnected ? (
            <button
              className="btn btn-primary"
              onClick={handleConnect}
              disabled={connecting || !isBluetoothSupported}
            >
              <Bluetooth size={16} /> {connecting ? 'Connecting...' : 'Connect Printer'}
            </button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={handleDisconnect}>Disconnect</button>
              <button className="btn btn-primary" onClick={handleTestPrint}>
                <Printer size={16} /> Test Print
              </button>
            </>
          )}
          <button className="btn btn-ghost" onClick={() => window.print()}>
            🖨️ Browser Print
          </button>
        </div>
      </div>
    </div>
  );
}
