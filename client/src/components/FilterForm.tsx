import { ReactNode } from "react";

export function FilterForm({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-4 rounded border border-slate-200 bg-white p-4">
      {children}
    </div>
  );
}

interface FieldWrapperProps {
  label: string;
  children: ReactNode;
}

function FieldWrapper({ label, children }: FieldWrapperProps) {
  return (
    <label className="flex flex-col text-sm">
      <span className="mb-1 text-slate-600">{label}</span>
      {children}
    </label>
  );
}

const fieldClass =
  "rounded border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <FieldWrapper label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TextField({ label, value, onChange, placeholder }: TextFieldProps) {
  return (
    <FieldWrapper label={label}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={fieldClass}
      />
    </FieldWrapper>
  );
}

interface MonthRangeFieldProps {
  fromLabel?: string;
  toLabel?: string;
  from: string;
  to: string;
  onChangeFrom: (value: string) => void;
  onChangeTo: (value: string) => void;
}

export function MonthRangeField({
  fromLabel = "開始年月",
  toLabel = "終了年月",
  from,
  to,
  onChangeFrom,
  onChangeTo,
}: MonthRangeFieldProps) {
  return (
    <>
      <FieldWrapper label={fromLabel}>
        <input
          type="month"
          value={from}
          onChange={(e) => onChangeFrom(e.target.value)}
          className={fieldClass}
        />
      </FieldWrapper>
      <FieldWrapper label={toLabel}>
        <input
          type="month"
          value={to}
          onChange={(e) => onChangeTo(e.target.value)}
          className={fieldClass}
        />
      </FieldWrapper>
    </>
  );
}
