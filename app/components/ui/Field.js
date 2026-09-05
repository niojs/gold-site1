'use client';

export default function Field({ label, type = 'text', value, onChange, step, placeholder, disabled, options }) {
  if (options) {
    return (
      <div className="field-wrap">
        <label className="field-label">{label}</label>
        <select
          className="field-select"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">Выберите</option>
          {options.map((opt) => (
            <option key={opt.value || opt} value={opt.value || opt}>
              {opt.label || opt}
            </option>
          ))}
        </select>
        <style jsx>{fieldStyles}</style>
      </div>
    );
  }

  return (
    <div className="field-wrap">
      <label className="field-label">{label}</label>
      <input
        className="field-input"
        type={type}
        step={step}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      <style jsx>{fieldStyles}</style>
    </div>
  );
}

const fieldStyles = `
  .field-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .field-label {
    color: #a89a7e;
    font-size: 0.78rem;
    letter-spacing: 0.3px;
    padding-left: 0.2rem;
  }
  .field-input {
    background: rgba(10, 10, 10, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 0.8rem 0.9rem;
    color: #e0dcc8;
    font-size: 0.95rem;
    width: 100%;
    transition: all 0.2s ease;
  }
  .field-input:focus {
    outline: none;
    border-color: #d4af37;
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
  }
  .field-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .field-input::placeholder {
    color: rgba(224, 220, 200, 0.4);
  }
  .field-input[type='date'],
  .field-input[type='time'] {
    color-scheme: dark;
  }
  .field-select {
    background: rgba(10, 10, 10, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 0.8rem 0.9rem;
    color: #e0dcc8;
    font-size: 0.95rem;
    width: 100%;
    cursor: pointer;
    transition: all 0.2s ease;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23d4af37' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.8rem center;
  }
  .field-select:focus {
    outline: none;
    border-color: #d4af37;
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
  }
  .field-select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .field-select option {
    background: #1a1712;
    color: #e0dcc8;
  }
`;
