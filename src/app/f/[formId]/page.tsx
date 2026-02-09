"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle, AlertCircle, Send } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface FieldOption {
  label: string;
  value: string;
}

interface FormField {
  id: string;
  type: string;
  label: string;
  name: string;
  placeholder: string;
  helpText: string;
  required: boolean;
  width: "full" | "half" | "third";
  options: FieldOption[];
  order: number;
  orderIndex?: number;
}

interface Form {
  id: string;
  name: string;
  description: string;
  status: string;
  fields: FormField[];
}

// =============================================================================
// PUBLIC FORM PAGE
// =============================================================================

export default function PublicFormPage() {
  const params = useParams();
  const formId = params.formId as string;

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Load form
  useEffect(() => {
    async function loadForm() {
      try {
        setLoading(true);
        const res = await fetch(`/api/forms/${formId}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Form not found");
          throw new Error("Failed to load form");
        }
        const data = await res.json();

        if (data.status !== "published") {
          throw new Error("This form is not currently accepting responses.");
        }

        setForm(data);

        // Initialize form data with empty values
        const initialData: Record<string, string> = {};
        (data.fields || []).forEach((field: FormField) => {
          if (
            !["heading", "paragraph", "divider", "spacer", "hidden"].includes(
              field.type,
            )
          ) {
            initialData[field.name] = "";
          }
        });
        setFormData(initialData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, [formId]);

  // Update field value
  const updateValue = useCallback((fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);

  // Validate
  const validate = useCallback(() => {
    if (!form) return false;
    const errors: Record<string, string> = {};

    form.fields
      .filter((f) => f.required)
      .forEach((field) => {
        const val = formData[field.name];
        if (!val || val.trim() === "") {
          errors[field.name] = `${field.label} is required`;
        }

        // Email format
        if (field.type === "email" && val && val.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(val)) {
            errors[field.name] = "Please enter a valid email address";
          }
        }

        // URL format
        if (field.type === "url" && val && val.trim()) {
          try {
            new URL(val);
          } catch {
            errors[field.name] = "Please enter a valid URL";
          }
        }
      });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form, formData]);

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch(`/api/forms/${formId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: formData }),
      });

      if (!res.ok) {
        const respData = await res.json().catch(() => ({}));
        throw new Error(respData.error || "Failed to submit form");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0891b2]" />
      </div>
    );
  }

  // Error (form not found / not published)
  if (error && !form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Form Unavailable
          </h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // Success / Thank you
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h1>
          <p className="text-gray-500">
            Your response has been submitted successfully.
          </p>
        </div>
      </div>
    );
  }

  if (!form) return null;

  const sortedFields = [...form.fields].sort((a, b) => (a.orderIndex ?? a.order ?? 0) - (b.orderIndex ?? b.order ?? 0));

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:py-12">
      <div className="max-w-2xl mx-auto">
        {/* Form Card */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-6 sm:px-8 sm:py-8 border-b border-gray-100 bg-gradient-to-r from-cyan-50 to-white">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {form.name}
            </h1>
            {form.description && (
              <p className="text-gray-500 mt-2">{form.description}</p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 sm:px-8 sm:py-8">
            {/* Submit Error */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {sortedFields.map((field) => (
                <PublicField
                  key={field.id}
                  field={field}
                  value={formData[field.name] || ""}
                  onChange={(val) => updateValue(field.name, val)}
                  error={validationErrors[field.name]}
                />
              ))}
            </div>

            {/* Submit */}
            {sortedFields.filter(
              (f) =>
                !["heading", "paragraph", "divider", "spacer"].includes(
                  f.type,
                ),
            ).length > 0 && (
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-md bg-[#0891b2] px-6 py-3 text-base font-semibold text-white hover:bg-[#0ea5e9] transition-colors shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 mr-2" />
                  )}
                  Submit
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            Powered by{" "}
            <span className="font-medium text-gray-500">F-CORE</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PUBLIC FIELD COMPONENT
// =============================================================================

function PublicField({
  field,
  value,
  onChange,
  error,
}: {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  // Layout fields
  if (field.type === "heading") {
    return (
      <h3 className="text-xl font-semibold text-gray-900 pt-2">
        {field.label}
      </h3>
    );
  }
  if (field.type === "paragraph") {
    return <p className="text-sm text-gray-600">{field.label}</p>;
  }
  if (field.type === "divider") {
    return <hr className="border-gray-200" />;
  }
  if (field.type === "spacer") {
    return <div className="h-4" />;
  }
  if (field.type === "hidden") {
    return <input type="hidden" name={field.name} value={value} />;
  }

  const widthClass =
    field.width === "half"
      ? "sm:w-1/2"
      : field.width === "third"
        ? "sm:w-1/3"
        : "w-full";

  const inputClass = `w-full px-4 py-2.5 rounded-lg border ${
    error
      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
      : "border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100"
  } outline-none transition-colors`;

  return (
    <div className={widthClass}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {/* Text, Email, Phone, Number, Date, URL */}
      {["text", "email", "phone", "number", "date", "url"].includes(
        field.type,
      ) && (
        <input
          type={field.type === "phone" ? "tel" : field.type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          className={inputClass}
        />
      )}

      {/* Textarea */}
      {field.type === "textarea" && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          rows={4}
          className={`${inputClass} resize-none`}
        />
      )}

      {/* Dropdown */}
      {field.type === "dropdown" && (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className={`${inputClass} bg-white`}
        >
          <option value="">{field.placeholder || "Select..."}</option>
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {/* Radio */}
      {field.type === "radio" && (
        <div className="space-y-2 mt-1">
          {field.options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer"
            >
              <input
                type="radio"
                name={field.name}
                value={opt.value}
                checked={value === opt.value}
                onChange={(e) => onChange(e.target.value)}
                className="w-4 h-4 text-[#0891b2] focus:ring-[#0891b2] border-gray-300"
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}

      {/* Checkbox */}
      {field.type === "checkbox" && (
        <div className="space-y-2 mt-1">
          {field.options.map((opt) => {
            const selectedValues = value ? value.split(",") : [];
            const isChecked = selectedValues.includes(opt.value);
            return (
              <label
                key={opt.value}
                className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={isChecked}
                  onChange={() => {
                    const next = isChecked
                      ? selectedValues.filter((v) => v !== opt.value)
                      : [...selectedValues, opt.value];
                    onChange(next.filter(Boolean).join(","));
                  }}
                  className="w-4 h-4 rounded text-[#0891b2] focus:ring-[#0891b2] border-gray-300"
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      )}

      {/* Help text */}
      {field.helpText && !error && (
        <p className="mt-1.5 text-xs text-gray-400">{field.helpText}</p>
      )}

      {/* Validation Error */}
      {error && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}
