'use client';
import { useEffect, useRef } from 'react';

export default function Modal({ open, onClose, title, children, width = '500px' }) {
  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    if (modalRef.current) modalRef.current.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="modal-box" ref={modalRef} tabIndex={-1} style={{ maxWidth: width }}>
        <div className="modal-head">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          z-index: 2000;
          animation: fadeIn 0.2s ease;
        }
        .modal-box {
          background: #14120f;
          border: 1px solid rgba(212,175,55,0.3);
          border-radius: 16px;
          padding: 1.5rem;
          width: 100%;
          max-height: 85vh;
          overflow-y: auto;
          outline: none;
          animation: slideUp 0.25s ease;
        }
        .modal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.3rem;
        }
        .modal-title {
          color: #d4af37;
          font-size: 1.15rem;
          font-weight: 600;
          margin: 0;
        }
        .modal-close {
          background: none;
          border: none;
          color: #8a7e6a;
          font-size: 1.1rem;
          cursor: pointer;
          padding: 0.3rem;
          border-radius: 6px;
          transition: all 0.2s;
          line-height: 1;
        }
        .modal-close:hover {
          color: #cf6b5e;
          background: rgba(207,107,94,0.1);
        }
        .modal-body {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
