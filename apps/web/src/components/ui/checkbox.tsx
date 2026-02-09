"use client";

import * as React from "react";

interface CheckboxProps {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  value?: string;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  label,
  checked = false,
  onChange,
  value,
  disabled = false,
  className = "",
}: CheckboxProps) {
  const [isChecked, setIsChecked] = React.useState(checked);

  React.useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked;
    setIsChecked(newChecked);
    onChange?.(newChecked);
  };

  return (
    <label
      className={`flex items-center gap-2 cursor-pointer ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        value={value}
        disabled={disabled}
        className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed"
      />
      <span className="text-sm text-gray-700 select-none">{label}</span>
    </label>
  );
}
