"use client";

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode, useId } from "react";

/**
 * Accessible Form Input component
 * WCAG 2.1 Level A - 1.3.1 Info and Relationships, 3.3.2 Labels or Instructions
 */
interface AccessibleInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  error?: string;
  hint?: string;
  hideLabel?: boolean;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ label, error, hint, hideLabel = false, leftAddon, rightAddon, className = "", required, ...props }, ref) => {
    const inputId = useId();
    const errorId = useId();
    const hintId = useId();

    const describedBy = [
      hint ? hintId : null,
      error ? errorId : null,
    ].filter(Boolean).join(" ") || undefined;

    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className={hideLabel ? "sr-only" : "block text-sm font-medium text-gray-700 mb-1.5"}
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>

        {hint && !error && (
          <p id={hintId} className="text-sm text-gray-500 mb-1.5">
            {hint}
          </p>
        )}

        <div className="relative">
          {leftAddon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">
              {leftAddon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={describedBy}
            aria-required={required}
            className={`
              w-full rounded-lg border px-4 py-2.5 text-gray-900 placeholder:text-gray-400
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
              ${leftAddon ? "pl-10" : ""}
              ${rightAddon ? "pr-10" : ""}
              ${error
                ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:border-gray-500 focus:ring-gray-200"
              }
              ${className}
            `}
            {...props}
          />

          {rightAddon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">
              {rightAddon}
            </div>
          )}
        </div>

        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-red-600" role="alert">
            <span className="sr-only">Erreur: </span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = "AccessibleInput";

/**
 * Accessible Textarea component
 */
interface AccessibleTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  label: string;
  error?: string;
  hint?: string;
  hideLabel?: boolean;
  maxLength?: number;
  showCount?: boolean;
}

export const AccessibleTextarea = forwardRef<HTMLTextAreaElement, AccessibleTextareaProps>(
  ({ label, error, hint, hideLabel = false, maxLength, showCount = false, className = "", required, value, ...props }, ref) => {
    const textareaId = useId();
    const errorId = useId();
    const hintId = useId();

    const describedBy = [
      hint ? hintId : null,
      error ? errorId : null,
    ].filter(Boolean).join(" ") || undefined;

    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <div className="w-full">
        <label
          htmlFor={textareaId}
          className={hideLabel ? "sr-only" : "block text-sm font-medium text-gray-700 mb-1.5"}
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>

        {hint && !error && (
          <p id={hintId} className="text-sm text-gray-500 mb-1.5">
            {hint}
          </p>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
          aria-required={required}
          maxLength={maxLength}
          value={value}
          className={`
            w-full rounded-lg border px-4 py-2.5 text-gray-900 placeholder:text-gray-400
            transition-colors duration-200 resize-y min-h-[100px]
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
            ${error
              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
              : "border-gray-300 focus:border-gray-500 focus:ring-gray-200"
            }
            ${className}
          `}
          {...props}
        />

        <div className="flex justify-between mt-1.5">
          {error ? (
            <p id={errorId} className="text-sm text-red-600" role="alert">
              <span className="sr-only">Erreur: </span>
              {error}
            </p>
          ) : (
            <span />
          )}

          {showCount && maxLength && (
            <p className={`text-sm ${currentLength >= maxLength ? "text-red-600" : "text-gray-500"}`}>
              <span className="sr-only">Caractères utilisés: </span>
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

AccessibleTextarea.displayName = "AccessibleTextarea";

/**
 * Accessible Select component
 */
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface AccessibleSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  label: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
  hideLabel?: boolean;
  placeholder?: string;
}

export const AccessibleSelect = forwardRef<HTMLSelectElement, AccessibleSelectProps>(
  ({ label, options, error, hint, hideLabel = false, placeholder, className = "", required, ...props }, ref) => {
    const selectId = useId();
    const errorId = useId();
    const hintId = useId();

    const describedBy = [
      hint ? hintId : null,
      error ? errorId : null,
    ].filter(Boolean).join(" ") || undefined;

    return (
      <div className="w-full">
        <label
          htmlFor={selectId}
          className={hideLabel ? "sr-only" : "block text-sm font-medium text-gray-700 mb-1.5"}
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>

        {hint && !error && (
          <p id={hintId} className="text-sm text-gray-500 mb-1.5">
            {hint}
          </p>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={describedBy}
            aria-required={required}
            className={`
              w-full rounded-lg border px-4 py-2.5 text-gray-900
              appearance-none bg-white pr-10
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
              ${error
                ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:border-gray-500 focus:ring-gray-200"
              }
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-red-600" role="alert">
            <span className="sr-only">Erreur: </span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleSelect.displayName = "AccessibleSelect";

/**
 * Accessible Checkbox component
 */
interface AccessibleCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "id"> {
  label: string;
  description?: string;
  error?: string;
}

export const AccessibleCheckbox = forwardRef<HTMLInputElement, AccessibleCheckboxProps>(
  ({ label, description, error, className = "", ...props }, ref) => {
    const checkboxId = useId();
    const descriptionId = useId();
    const errorId = useId();

    const describedBy = [
      description ? descriptionId : null,
      error ? errorId : null,
    ].filter(Boolean).join(" ") || undefined;

    return (
      <div className="relative flex items-start">
        <div className="flex h-6 items-center">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            aria-describedby={describedBy}
            aria-invalid={error ? "true" : undefined}
            className={`
              h-4 w-4 rounded border-gray-300 text-gray-900
              focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50
              ${error ? "border-red-300" : ""}
              ${className}
            `}
            {...props}
          />
        </div>
        <div className="ml-3">
          <label htmlFor={checkboxId} className="text-sm font-medium text-gray-900">
            {label}
          </label>
          {description && (
            <p id={descriptionId} className="text-sm text-gray-500">
              {description}
            </p>
          )}
          {error && (
            <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
              <span className="sr-only">Erreur: </span>
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }
);

AccessibleCheckbox.displayName = "AccessibleCheckbox";

/**
 * Accessible Radio Group component
 */
interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface AccessibleRadioGroupProps {
  name: string;
  legend: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
  orientation?: "horizontal" | "vertical";
}

export function AccessibleRadioGroup({
  name,
  legend,
  options,
  value,
  onChange,
  error,
  required,
  orientation = "vertical",
}: AccessibleRadioGroupProps) {
  const errorId = useId();

  return (
    <fieldset>
      <legend className="text-sm font-medium text-gray-900 mb-3">
        {legend}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
      </legend>

      <div
        className={orientation === "horizontal" ? "flex flex-wrap gap-4" : "space-y-3"}
        role="radiogroup"
        aria-required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? errorId : undefined}
      >
        {options.map((option) => {
          const optionId = `${name}-${option.value}`;
          const descId = `${optionId}-desc`;

          return (
            <div key={option.value} className="relative flex items-start">
              <div className="flex h-6 items-center">
                <input
                  id={optionId}
                  name={name}
                  type="radio"
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange?.(e.target.value)}
                  disabled={option.disabled}
                  aria-describedby={option.description ? descId : undefined}
                  className="h-4 w-4 border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="ml-3">
                <label
                  htmlFor={optionId}
                  className={`text-sm font-medium ${option.disabled ? "text-gray-400" : "text-gray-900"}`}
                >
                  {option.label}
                </label>
                {option.description && (
                  <p id={descId} className="text-sm text-gray-500">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p id={errorId} className="mt-2 text-sm text-red-600" role="alert">
          <span className="sr-only">Erreur: </span>
          {error}
        </p>
      )}
    </fieldset>
  );
}
