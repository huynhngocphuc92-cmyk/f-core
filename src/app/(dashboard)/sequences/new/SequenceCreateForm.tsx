"use client";

import { useState } from "react";
import { createSequence } from "@/app/actions/sequences";
import { Plus, Trash2, Mail, Clock, GripVertical } from "lucide-react";

interface Step {
  type: "email" | "delay";
  subject: string;
  body: string;
  delay: number;
  delayUnit: "hours" | "days";
}

const emptyStep: Step = {
  type: "email",
  subject: "",
  body: "",
  delay: 1,
  delayUnit: "days",
};

export function SequenceCreateForm() {
  const [steps, setSteps] = useState<Step[]>([{ ...emptyStep }]);
  const [pending, setPending] = useState(false);

  const addStep = () => {
    setSteps([...steps, { ...emptyStep, delay: 1 }]);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof Step, value: string | number) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const handleSubmit = async (formData: FormData) => {
    setPending(true);
    formData.set("steps", JSON.stringify(steps));
    try {
      await createSequence(formData);
    } catch {
      setPending(false);
    }
  };

  return (
    <form action={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Basic Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Sequence Details
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g., Welcome Series"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors text-sm"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="What is this sequence about?"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Step Builder */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Steps ({steps.length})
              </h2>
              <button
                type="button"
                onClick={addStep}
                className="flex items-center gap-1.5 text-sm text-[#0891b2] hover:text-[#0e7490] font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Step
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {steps.map((step, index) => (
                <div key={index} className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-gray-300" />
                      <div className="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center text-xs font-medium text-purple-700">
                        {index + 1}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-1">
                      <select
                        value={step.type}
                        onChange={(e) => updateStep(index, "type", e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none"
                      >
                        <option value="email">Email</option>
                        <option value="delay">Wait</option>
                      </select>
                    </div>

                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {step.type === "email" ? (
                    <div className="space-y-3 ml-12">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Subject
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={step.subject}
                            onChange={(e) => updateStep(index, "subject", e.target.value)}
                            placeholder="Email subject line"
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Body
                        </label>
                        <textarea
                          value={step.body}
                          onChange={(e) => updateStep(index, "body", e.target.value)}
                          placeholder="Write your email content..."
                          rows={3}
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none"
                        />
                      </div>
                      {index > 0 && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500">Wait</span>
                          <input
                            type="number"
                            min={0}
                            value={step.delay}
                            onChange={(e) => updateStep(index, "delay", Number(e.target.value))}
                            className="w-16 px-2 py-1 rounded border border-gray-200 text-sm text-center focus:border-[#0891b2] outline-none"
                          />
                          <select
                            value={step.delayUnit}
                            onChange={(e) => updateStep(index, "delayUnit", e.target.value)}
                            className="px-2 py-1 rounded border border-gray-200 text-sm focus:border-[#0891b2] outline-none"
                          >
                            <option value="hours">hours</option>
                            <option value="days">days</option>
                          </select>
                          <span className="text-xs text-gray-500">after previous step</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 ml-12">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Wait</span>
                      <input
                        type="number"
                        min={1}
                        value={step.delay}
                        onChange={(e) => updateStep(index, "delay", Number(e.target.value))}
                        className="w-16 px-2 py-1.5 rounded border border-gray-200 text-sm text-center focus:border-[#0891b2] outline-none"
                      />
                      <select
                        value={step.delayUnit}
                        onChange={(e) => updateStep(index, "delayUnit", e.target.value)}
                        className="px-2 py-1.5 rounded border border-gray-200 text-sm focus:border-[#0891b2] outline-none"
                      >
                        <option value="hours">hours</option>
                        <option value="days">days</option>
                      </select>
                      <span className="text-sm text-gray-500">before next step</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <a
              href="/sequences"
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={pending}
              className="px-6 py-2 bg-[#0891b2] text-white rounded-lg text-sm font-medium hover:bg-[#0e7490] transition-colors disabled:opacity-50"
            >
              {pending ? "Creating..." : "Create Sequence"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
