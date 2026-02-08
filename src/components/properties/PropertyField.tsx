"use client";

import { memo } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface PropertyFieldProps {
  name: string;
  label: string;
  fieldType: string;
  value: string | number | boolean | string[] | null | undefined;
  options?: SelectOption[] | null;
  isRequired?: boolean;
  isReadonly?: boolean;
  onChange: (value: string | number | boolean | string[] | null) => void;
  editMode?: boolean;
}

function PropertyFieldInner({
  name,
  label,
  fieldType,
  value,
  options,
  isRequired,
  isReadonly,
  onChange,
  editMode = false,
}: PropertyFieldProps) {
  if (!editMode) {
    return <PropertyValue fieldType={fieldType} value={value} options={options} />;
  }

  const baseInputClass =
    "w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0891b2] focus:border-[#0891b2] bg-white";

  switch (fieldType) {
    case "text":
      return (
        <input
          type="text"
          name={name}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          required={isRequired}
          readOnly={isReadonly}
          placeholder={label}
          className={baseInputClass}
        />
      );

    case "number":
      return (
        <input
          type="number"
          name={name}
          value={(value as number) ?? ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          required={isRequired}
          readOnly={isReadonly}
          placeholder={label}
          className={baseInputClass}
        />
      );

    case "date":
      return (
        <input
          type="date"
          name={name}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          required={isRequired}
          readOnly={isReadonly}
          className={baseInputClass}
        />
      );

    case "datetime":
      return (
        <input
          type="datetime-local"
          name={name}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          required={isRequired}
          readOnly={isReadonly}
          className={baseInputClass}
        />
      );

    case "select":
      return (
        <select
          name={name}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          required={isRequired}
          disabled={isReadonly}
          className={baseInputClass}
        >
          <option value="">Select...</option>
          {(options as SelectOption[])?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case "multiselect": {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-1">
          {(options as SelectOption[])?.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...selected, opt.value]
                    : selected.filter((v) => v !== opt.value);
                  onChange(next.length > 0 ? next : null);
                }}
                disabled={isReadonly}
                className="rounded border-gray-300 text-[#0891b2] focus:ring-[#0891b2]"
              />
              <span className="text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      );
    }

    case "checkbox":
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            disabled={isReadonly}
            className="rounded border-gray-300 text-[#0891b2] focus:ring-[#0891b2]"
          />
          <span className="text-sm text-gray-700">{label}</span>
        </label>
      );

    case "email":
      return (
        <input
          type="email"
          name={name}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          required={isRequired}
          readOnly={isReadonly}
          placeholder="name@example.com"
          className={baseInputClass}
        />
      );

    case "phone":
      return (
        <input
          type="tel"
          name={name}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          required={isRequired}
          readOnly={isReadonly}
          placeholder="+1 (555) 000-0000"
          className={baseInputClass}
        />
      );

    case "url":
      return (
        <input
          type="url"
          name={name}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          required={isRequired}
          readOnly={isReadonly}
          placeholder="https://example.com"
          className={baseInputClass}
        />
      );

    default:
      return (
        <input
          type="text"
          name={name}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
        />
      );
  }
}

function PropertyValue({
  fieldType,
  value,
  options,
}: {
  fieldType: string;
  value: string | number | boolean | string[] | null | undefined;
  options?: SelectOption[] | null;
}) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-gray-400 text-sm">--</span>;
  }

  switch (fieldType) {
    case "email":
      return (
        <a href={`mailto:${value}`} className="text-sm text-[#0891b2] hover:underline">
          {String(value)}
        </a>
      );

    case "phone":
      return (
        <a href={`tel:${value}`} className="text-sm text-[#0891b2] hover:underline">
          {String(value)}
        </a>
      );

    case "url":
      return (
        <a
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#0891b2] hover:underline truncate block"
        >
          {String(value).replace(/^https?:\/\//, "")}
        </a>
      );

    case "checkbox":
      return <span className="text-sm text-gray-900">{value ? "Yes" : "No"}</span>;

    case "select": {
      const opt = (options as SelectOption[])?.find((o) => o.value === value);
      return <span className="text-sm text-gray-900">{opt?.label || String(value)}</span>;
    }

    case "multiselect": {
      const vals = Array.isArray(value) ? value : [];
      const labels = vals.map((v) => {
        const opt = (options as SelectOption[])?.find((o) => o.value === v);
        return opt?.label || v;
      });
      return (
        <div className="flex flex-wrap gap-1">
          {labels.map((label, i) => (
            <span
              key={i}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
            >
              {label}
            </span>
          ))}
        </div>
      );
    }

    case "date":
      return (
        <span className="text-sm text-gray-900">
          {new Date(String(value)).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      );

    case "datetime":
      return (
        <span className="text-sm text-gray-900">
          {new Date(String(value)).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      );

    case "number":
      return <span className="text-sm text-gray-900">{Number(value).toLocaleString()}</span>;

    default:
      return <span className="text-sm text-gray-900">{String(value)}</span>;
  }
}

const PropertyField = memo(PropertyFieldInner);
export default PropertyField;
export { PropertyValue };
export type { PropertyFieldProps, SelectOption };
