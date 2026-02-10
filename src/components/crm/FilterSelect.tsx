"use client";

export function FilterSelect({
  name,
  defaultValue,
  options,
}: {
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
      onChange={(e) => {
        const form = e.target.form;
        if (form) form.requestSubmit();
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
