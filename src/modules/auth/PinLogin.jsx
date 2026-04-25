import { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Delete } from 'lucide-react';
import db from '../../db/database';

export default function PinLogin({ onSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const config = useLiveQuery(() => db.businessConfig.get('config'));

  const handleKey = useCallback((digit) => {
    setError('');
    setPin(prev => {
      if (prev.length >= 4) return prev;
      const newPin = prev + digit;
      if (newPin.length === 4) {
        setTimeout(() => verifyPin(newPin), 150);
      }
      return newPin;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setError('');
    setPin(prev => prev.slice(0, -1));
  }, []);

  const verifyPin = async (enteredPin) => {
    const user = await db.users.where('pin').equals(enteredPin).first();
    if (user) {
      onSuccess(user);
    } else {
      setError('Invalid PIN. Try again.');
      setPin('');
    }
  };

  const keys = ['1','2','3','4','5','6','7','8','9','','0','back'];

  return (
    <div className="pin-screen">
      <div className="pin-logo">P</div>
      <div className="pin-title">{config?.businessName || 'POS Local'}</div>
      <p style={{ color: '#868e96', fontSize: '0.85rem' }}>Enter your PIN to continue</p>

      <div className="pin-dots">
        {[0,1,2,3].map(i => (
          <div
            key={i}
            className={`pin-dot ${i < pin.length ? 'filled' : ''} ${error ? 'error' : ''}`}
          />
        ))}
      </div>

      <div className="pin-error">{error}</div>

      <div className="pin-keypad">
        {keys.map((key, i) => {
          if (key === '') return <div key={i} className="pin-key empty" />;
          if (key === 'back') {
            return (
              <button key={i} className="pin-key backspace" onClick={handleBackspace}>
                <Delete size={22} />
              </button>
            );
          }
          return (
            <button key={i} className="pin-key" onClick={() => handleKey(key)}>
              {key}
            </button>
          );
        })}
      </div>

      <p style={{ color: '#495057', fontSize: '0.75rem', marginTop: '8px' }}>
        Default PIN: <strong>1234</strong>
      </p>
    </div>
  );
}
