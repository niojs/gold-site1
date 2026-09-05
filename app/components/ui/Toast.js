'use client';

export default function Toast({ toast }) {
  if (!toast) return null;

  const colors = {
    success: { bg: 'rgba(46,204,113,0.12)', border: 'rgba(46,204,113,0.4)', text: '#2ecc71', icon: '✅' },
    error: { bg: 'rgba(207,107,94,0.12)', border: 'rgba(207,107,94,0.4)', text: '#cf6b5e', icon: '❌' },
    info: { bg: 'rgba(91,155,213,0.12)', border: 'rgba(91,155,213,0.4)', text: '#5b9bd5', icon: 'ℹ️' },
  };

  const c = colors[toast.type] || colors.info;

  return (
    <div className="toast-wrapper">
      <div className="toast-box">
        <span className="toast-icon">{c.icon}</span>
        <span className="toast-text">{toast.message}</span>
      </div>
      <style jsx>{`
        .toast-wrapper {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          z-index: 9999;
          animation: toastIn 0.3s ease;
        }
        .toast-box {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.8rem 1.2rem;
          background: ${c.bg};
          border: 1px solid ${c.border};
          border-radius: 12px;
          color: ${c.text};
          font-size: 0.9rem;
          font-weight: 500;
          backdrop-filter: blur(12px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          max-width: 400px;
        }
        .toast-icon {
          font-size: 1rem;
          flex-shrink: 0;
        }
        .toast-text {
          line-height: 1.3;
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
