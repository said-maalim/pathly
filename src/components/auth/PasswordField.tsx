import React, { useState } from 'react';

interface PasswordFieldProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export function PasswordField({ id, value, onChange, error, inputRef }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errId = `${id}-err`;

  return (
    <div className="ap-field">
      <label htmlFor={id}>Password</label>
      <div className="ap-pw">
        <input
          ref={inputRef}
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          autoComplete="current-password"
          placeholder="Enter your password"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errId : undefined}
          onChange={e => onChange(e.target.value)}
          className="ap-input"
        />
        <button
          type="button"
          aria-pressed={visible}
          onClick={() => setVisible(v => !v)}
          className="ap-show"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {error && (
        <p id={errId} role="alert" className="ap-err">{error}</p>
      )}
    </div>
  );
}
