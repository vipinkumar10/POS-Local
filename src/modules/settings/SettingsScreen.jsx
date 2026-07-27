import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Save, Download, Upload, Trash2, Moon, Sun, Smartphone } from 'lucide-react';
import db from '../../db/database';
import { useToast } from '../../shared/hooks/useToast';
import PrinterSettings from '../printing/components/PrinterSettings';
import { usePWAInstall } from '../../shared/hooks/usePWAInstall';
import { syncService } from '../sync/services/syncService';
import { Cloud, Mail, RefreshCw, Clock } from 'lucide-react';

export default function SettingsScreen() {
  const toast = useToast();
  const config = useLiveQuery(() => db.businessConfig.get('config'));
  const { canInstall, install, installed } = usePWAInstall();

  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [gstPercent, setGstPercent] = useState('');
  const [footerMessage, setFooterMessage] = useState('');
  const [loaded, setLoaded] = useState(false);

  // Sync & Cloud Settings
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [reportEnabled, setReportEnabled] = useState(false);
  const [reportHour, setReportHour] = useState('23');
  const [reportRecipient, setReportRecipient] = useState('');
  const [syncInterval, setSyncInterval] = useState('5');
  const [syncing, setSyncing] = useState(false);
  const [pushing, setPushing] = useState(false);

  // Load config into form
  useEffect(() => {
    if (config && !loaded) {
      setBusinessName(config.businessName || '');
      setAddress(config.address || '');
      setPhone(config.phone || '');
      setGstNumber(config.gstNumber || '');
      setGstPercent(String(config.gstPercent || 5));
      setFooterMessage(config.footerMessage || '');
      setSyncEnabled(config.syncEnabled || false);
      setReportEnabled(config.reportEnabled || false);
      setReportHour(String(config.reportHour || '23'));
      setReportRecipient(config.reportRecipient || '');
      setSyncInterval(String(config.syncInterval || '5'));
      setLoaded(true);
    }
  }, [config, loaded]);

  const saveSettings = async () => {
    await db.businessConfig.update('config', {
      businessName: businessName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      gstNumber: gstNumber.trim(),
      gstPercent: Number(gstPercent) || 5,
      cgstPercent: (Number(gstPercent) || 5) / 2,
      sgstPercent: (Number(gstPercent) || 5) / 2,
      footerMessage: footerMessage.trim(),
      syncEnabled,
      reportEnabled,
      reportHour: Number(reportHour),
      reportRecipient: reportRecipient.trim(),
      syncInterval: Number(syncInterval),
    });

    if (syncEnabled) {
      await syncService.updateBackendConfig('report.scheduler.enabled', reportEnabled, 'Enable daily reports');
      await syncService.updateBackendConfig('report.scheduler.hour', reportHour, 'Daily report hour (0-23)');
      await syncService.updateBackendConfig('report.recipient.email', reportRecipient, 'Report recipient email');
      
      // Sync business info to backend
      await syncService.updateBackendConfig('business.name', businessName, 'Business Name');
      await syncService.updateBackendConfig('business.address', address, 'Business Address');
      await syncService.updateBackendConfig('business.phone', phone, 'Business Phone');
      await syncService.updateBackendConfig('business.gst.number', gstNumber, 'GST Number');
      await syncService.updateBackendConfig('business.gst.percent', gstPercent, 'GST Percentage');
      
      // Perform full sync (push and pull) after save
      await syncService.performSync();
    }

    toast.success('Settings saved successfully!');
  };

  const handleManualSync = async () => {
    setSyncing(true);
    const result = await syncService.performSync(true); // Force sync
    setSyncing(false);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleManualPush = async () => {
    setPushing(true);
    const result = await syncService.pushData(true); // Force push
    setPushing(false);
    if (result.success) {
      toast.success('Local data pushed to cloud successfully!');
    } else {
      toast.error('Push failed: ' + result.message);
    }
  };

  const toggleTheme = () => {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    db.businessConfig.update('config', { theme: next });
    toast.info(`Switched to ${next} mode`);
  };

  const exportData = async () => {
    try {
      const data = {
        exportDate: new Date().toISOString(),
        businessConfig: await db.businessConfig.toArray(),
        categories: await db.categories.toArray(),
        menuItems: await db.menuItems.toArray(),
        inventoryItems: await db.inventoryItems.toArray(),
        menuItemIngredients: await db.menuItemIngredients.toArray(),
        orders: await db.orders.toArray(),
        orderItems: await db.orderItems.toArray(),
        expenses: await db.expenses.toArray(),
        expenseCategories: await db.expenseCategories.toArray(),
        inventoryTransactions: await db.inventoryTransactions.toArray(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pos-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully!');
    } catch (err) {
      toast.error('Export failed: ' + err.message);
    }
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.businessConfig || !data.categories) {
          toast.error('Invalid backup file format');
          return;
        }

        if (!confirm('This will REPLACE all current data. Are you sure?')) return;

        // Clear and restore
        await db.transaction('rw',
          [db.businessConfig, db.categories, db.menuItems, db.inventoryItems,
          db.menuItemIngredients, db.orders, db.orderItems, db.expenses,
          db.expenseCategories, db.inventoryTransactions],
          async () => {
            await db.businessConfig.clear();
            await db.categories.clear();
            await db.menuItems.clear();
            await db.inventoryItems.clear();
            await db.menuItemIngredients.clear();
            await db.orders.clear();
            await db.orderItems.clear();
            await db.expenses.clear();
            await db.expenseCategories.clear();
            await db.inventoryTransactions.clear();

            if (data.businessConfig) await db.businessConfig.bulkAdd(data.businessConfig);
            if (data.categories) await db.categories.bulkAdd(data.categories);
            if (data.menuItems) await db.menuItems.bulkAdd(data.menuItems);
            if (data.inventoryItems) await db.inventoryItems.bulkAdd(data.inventoryItems);
            if (data.menuItemIngredients) await db.menuItemIngredients.bulkAdd(data.menuItemIngredients);
            if (data.orders) await db.orders.bulkAdd(data.orders);
            if (data.orderItems) await db.orderItems.bulkAdd(data.orderItems);
            if (data.expenses) await db.expenses.bulkAdd(data.expenses);
            if (data.expenseCategories) await db.expenseCategories.bulkAdd(data.expenseCategories);
            if (data.inventoryTransactions) await db.inventoryTransactions.bulkAdd(data.inventoryTransactions);
          }
        );

        toast.success('Data imported successfully! Refreshing...');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        toast.error('Import failed: ' + err.message);
      }
    };
    input.click();
  };

  const clearAllData = async () => {
    if (!confirm('⚠️ This will DELETE ALL DATA permanently. Are you sure?')) return;
    if (!confirm('This cannot be undone. Type "yes" in the next prompt.')) return;

    await db.delete();
    toast.info('All data cleared. Reloading...');
    setTimeout(() => window.location.reload(), 1000);
  };

  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';

  return (
    <>
      <div className="page-header">
        <h1>⚙️ Settings</h1>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={handleManualSync} disabled={syncing}>
            <RefreshCw size={16} className={syncing ? 'spin' : ''} />
            {syncing ? 'Syncing...' : 'Full Sync'}
          </button>
          <button className="btn btn-secondary" onClick={toggleTheme}>
            {currentTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {currentTheme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Business Settings */}
        <div className="settings-section" style={{ marginBottom: 40 }}>
          <h3>🏪 Business Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Business Name</label>
              <input className="form-input" placeholder="My Restaurant" value={businessName} onChange={e => setBusinessName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea className="form-textarea" placeholder="Enter business address" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" placeholder="+91 9999999999" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">GST Number</label>
                <input className="form-input" placeholder="22AAAAA0000A1Z5" value={gstNumber} onChange={e => setGstNumber(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">GST Percentage (%)</label>
                <input className="form-input" type="number" min="0" max="28" value={gstPercent} onChange={e => setGstPercent(e.target.value)} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  CGST: {(Number(gstPercent) / 2).toFixed(1)}% + SGST: {(Number(gstPercent) / 2).toFixed(1)}%
                </span>
              </div>
              <div className="form-group">
                <label className="form-label">Bill Footer Message</label>
                <input className="form-input" placeholder="Thank you! Visit again!" value={footerMessage} onChange={e => setFooterMessage(e.target.value)} />
              </div>
            </div>
            <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={saveSettings}>
              <Save size={16} /> Save Settings
            </button>
          </div>
        </div>

        {/* Printer Settings */}
        <PrinterSettings />

        {/* Cloud Sync & Reports */}
        <div className="settings-section">
          <h3><Cloud size={16} style={{ display: 'inline', marginRight: 6 }} />Cloud Sync & Reports</h3>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>Enable Cloud Sync</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  Sync data with the Spring Boot backend server for remote access and backup.
                </div>
              </div>
              <label className="switch">
                <input type="checkbox" checked={syncEnabled} onChange={e => setSyncEnabled(e.target.checked ? true : false)} />
                <span className="slider round"></span>
              </label>
            </div>

            {syncEnabled && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><Mail size={14} /> Automated Daily Reports</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input type="checkbox" checked={reportEnabled} onChange={e => setReportEnabled(e.target.checked)} />
                      <span style={{ fontSize: '0.8rem' }}>Enabled</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label"><Clock size={14} /> Report Send Time (24h)</label>
                    <select className="form-select" value={reportHour} onChange={e => setReportHour(e.target.value)}>
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><RefreshCw size={14} /> Auto Sync Interval</label>
                    <select className="form-select" value={syncInterval} onChange={e => setSyncInterval(e.target.value)}>
                      <option value="1">Every 1 Minute</option>
                      <option value="2">Every 2 Minutes</option>
                      <option value="5">Every 5 Minutes</option>
                      <option value="10">Every 10 Minutes</option>
                      <option value="30">Every 30 Minutes</option>
                      <option value="60">Every 1 Hour</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Recipient Email</label>
                    <input
                      className="form-input"
                      type="email"
                      placeholder="email@example.com"
                      value={reportRecipient}
                      onChange={e => setReportRecipient(e.target.value)}
                    />
                  </div>
                </div>

                {config?.lastSyncAt && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={12} /> Last synced: {new Date(config.lastSyncAt).toLocaleString()}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-primary" onClick={handleManualPush} disabled={pushing}>
                    <Cloud size={16} className={pushing ? 'spin' : ''} />
                    {pushing ? 'Pushing...' : 'Push to Cloud'}
                  </button>
                  <button className="btn btn-ghost" onClick={() => fetch('http://localhost:8080/api/reports/send-email', { method: 'POST' }).then(() => toast.success('Email triggered!'))}>
                    <Mail size={16} /> Test Email
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Data Management */}
        <div className="settings-section">
          <h3>💾 Data Management</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>Export Backup</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  Download all data as a JSON file for backup
                </div>
              </div>
              <button className="btn btn-secondary" onClick={exportData}>
                <Download size={16} /> Export
              </button>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>Import Backup</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  Restore data from a previously exported JSON file
                </div>
              </div>
              <button className="btn btn-secondary" onClick={importData}>
                <Upload size={16} /> Import
              </button>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, borderColor: 'var(--color-danger)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--color-danger)' }}>⚠️ Clear All Data</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  Permanently delete all data. This cannot be undone!
                </div>
              </div>
              <button className="btn btn-danger" onClick={clearAllData}>
                <Trash2 size={16} /> Clear Data
              </button>
            </div>
          </div>
        </div>

        {/* Install App */}
        <div className="settings-section">
          <h3><Smartphone size={16} style={{ display: 'inline', marginRight: 6 }} />Install App</h3>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: '2rem' }}>📲</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>Install POS Local on this device</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                {installed
                  ? '✅ Already installed as a standalone app on this device.'
                  : 'Install to your home screen for a full-screen, offline-first experience without the browser toolbar.'}
              </div>
            </div>
            {canInstall && !installed && (
              <button className="btn btn-primary" onClick={install}>
                📲 Install App
              </button>
            )}
            {installed && (
              <span className="badge badge-success">Installed</span>
            )}
            {!canInstall && !installed && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Open in Chrome to install</span>
            )}
          </div>
        </div>

        {/* App Info */}
        <div style={{ marginTop: 40, padding: '16px 0', borderTop: '1px solid var(--border-color-light)', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
          <p><strong>POS Local</strong> v1.0.0 — Offline-First Restaurant POS</p>
          <p>All data is stored locally on this device using IndexedDB.</p>
        </div>
      </div>
    </>
  );
}
