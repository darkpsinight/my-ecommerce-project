import React from 'react';
import { toast as hotToast, Toast } from 'react-hot-toast';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
  t: Toast;
  message: string;
  type?: 'success' | 'error';
}

const LargerDismissibleToast: React.FC<Props> = ({ t, message, type = 'success' }) => {
  // Define styles based on type
  const bgColor = type === 'error' ? '#fff2f2' : '#f0f9f0';
  const textColor = type === 'error' ? '#d32f2f' : '#2e7d32';
  const borderColor = type === 'error' ? '#ffcdd2' : '#c8e6c9';
  const iconColor = type === 'error' ? '#f44336' : '#4caf50';
  
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: 'auto',
        minWidth: 320,
        maxWidth: 380,
        padding: '14px 18px',
        fontSize: '0.95rem',
        borderRadius: 8,
        background: bgColor,
        color: textColor,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        fontWeight: 500,
        border: `1px solid ${borderColor}`,
        zIndex: 9999,
        position: 'relative',
      }}
      role="alert"
      aria-live="assertive"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
        {type === 'error' ? (
          <AlertCircle style={{ width: 20, height: 20, color: iconColor, flexShrink: 0 }} />
        ) : (
          <CheckCircle style={{ width: 20, height: 20, color: iconColor, flexShrink: 0 }} />
        )}
        <span style={{ fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.4 }}>{message}</span>
      </div>
      
      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 12,
          background: 'transparent',
          border: 'none',
          borderRadius: '50%',
          width: 24,
          height: 24,
          cursor: 'pointer',
          color: type === 'error' ? '#d32f2f' : '#2e7d32',
          opacity: 0.7,
          transition: 'all 0.2s ease',
          padding: 0,
          flexShrink: 0,
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.background = type === 'error' ? 'rgba(211, 47, 47, 0.08)' : 'rgba(46, 125, 50, 0.08)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.opacity = '0.7';
          e.currentTarget.style.background = 'transparent';
        }}
        aria-label="Dismiss notification"
        onClick={() => hotToast.remove(t.id)}
      >
        <X style={{ width: 16, height: 16 }} />
      </button>
    </div>
  );
};

export default LargerDismissibleToast;