"use client";

import { useState } from "react";
import { Eye } from "../icons";

interface PasswordFieldProps {
  id: string;
  name?: string;
  placeholder?: string;
  defaultValue?: string;
  autoComplete?: string;
  required?: boolean;
}

/** Password input with a show/hide reveal toggle (.input-group + .trail). */
export function PasswordField({
  id,
  name,
  placeholder = "••••••••",
  defaultValue,
  autoComplete = "current-password",
  required,
}: PasswordFieldProps) {
  const [shown, setShown] = useState(false);
  return (
    <div className="input-group">
      <input
        className="input"
        id={id}
        name={name ?? id}
        type={shown ? "text" : "password"}
        placeholder={placeholder}
        defaultValue={defaultValue}
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
