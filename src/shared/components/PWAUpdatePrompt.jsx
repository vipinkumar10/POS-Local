import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * PWA Update Prompt — shown as a banner when a new service worker is available.
 * The user can click "Update" to instantly reload to the new version.
 */
export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[PWA] Service Worker registered:', r);
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker registration error:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 80,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      borderLeft: '4px solid var(--color-primary)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 20px',
      boxShadow: 'var(--shadow-lg)',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      zIndex: 300,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
        🔄 New version available!
      </span>
      <button
        className="btn btn-primary btn-sm"
        onClick={() => updateServiceWorker(true)}
      >
        Update Now
      </button>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => setNeedRefresh(false)}
      >
        Later
      </button>
    </div>
  );
}
