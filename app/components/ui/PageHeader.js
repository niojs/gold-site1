'use client';

export default function PageHeader({ title, site, children }) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        <h1 className="page-header-title">{title}</h1>
        {site && (
          <span className="page-header-badge">{site}</span>
        )}
      </div>
      {children && (
        <div className="page-header-actions">{children}</div>
      )}
      <style jsx>{`
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.8rem;
          margin-bottom: 1.5rem;
        }
        .page-header-left {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }
        .page-header-title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
        }
        .page-header-badge {
          background: rgba(212,175,55,0.15);
          color: #d4af37;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.25rem 0.7rem;
          border-radius: 20px;
        }
        .page-header-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
}
