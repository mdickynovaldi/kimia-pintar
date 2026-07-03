"use client";

import { useState } from "react";
import { Eye } from "../icons";

interface PasswordFieldProps {
  id: string;
  name?: string;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
}

/** Password input with a show/hide reveal toggle (.input-group + .trail).
 * Uncontrolled by default; pass `value` + `onChange` to control it. */
export function PasswordField({
  id,
  name,
  placeholder = "••••••••",
  defaultValue,
  value,
  onChange,
  autoComplete = "current-password",
  required,
}: PasswordFieldProps) {
  const [shown, setShown] = useState(false);
  const controlled = value !== undefined;
  return (
    <div className="input-group">
      <input
        className="input"
        id={id}
        name={name ?? id}
        type={shown ? "text" : "password"}
        placeholder={placeholder}
        {...(controlled
          ? { value, onChange: (e) => onChange?.(e.target.value) }
          : { defaultValue })}
        autoComplete={autoComplete}
        required={required}
      />
      <button
        type="button"
        className={`trail${shown ? " on" : ""}`}
        aria-label={shown ? "Sembunyikan sandi" : "Tampilkan sandi"}
        aria-pressed={shown}
        onClick={() => setShown((v) => !v)}
      >
        <Eye width={18} height={18} />
      </button>
    </div>
  );
}
