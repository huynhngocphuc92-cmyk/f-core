"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Users,
  FileText,
  Settings,
  Send,
  Mail,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  subject: string | null;
  category: string | null;
  previewText: string | null;
}

interface ContactList {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  _count: { members: number };
}

const STEPS = [
  { id: "details", label: "Details", icon: Mail },
  { id: "audience", label: "Audience", icon: Users },
  { id: "content", label: "Content", icon: FileText },
  { id: "review", label: "Review", icon: Check },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [lists, setLists] = useState<ContactList[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [fromName, setFromName] = useState("F-CORE Team");
  const [fromEmail, setFromEmail] = useState("hello@f-core.com");
  const [description, setDescription] = useState("");
  const [listId, setListId] = useState("");
  const [templateId, setTemplateId] = useState("");

  useEffect(() => {
    fetch("/api/email-marketing/templates?limit=50")
      .then((r) => r.json())
      .then((d) => setTemplates(d.data || []));
    fetch("/api/email-marketing/lists?limit=50")
      .then((r) => r.json())
      .then((d) => setLists(d.data || []));
  }, []);

  const canNext = () => {
    if (step === 0) return name.trim() && subject.trim() && fromName.trim() && fromEmail.trim();
    if (step === 1) return !!listId;
    return true;
  };

  const handleCreate = async (sendNow: boolean) => {
    setSaving(true);
    try {
      const res = await fetch("/api/email-marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          subject,
          previewText: previewText || undefined,
          fromName,
          fromEmail,
          description: description || undefined,
          listId: listId || undefined,
          templateId: templateId || undefined,
        }),
      });
      const campaign = await res.json();

      if (sendNow && campaign.id) {
        await fetch(`/api/email-marketing/campaigns/${campaign.id}/send`, {
          method: "POST",
        });
      }

      router.push(campaign.id ? `/email-marketing/campaigns/${campaign.id}` : "/email-marketing");
    } catch {
      setSaving(false);
    }
  };

  const selectedList = lists.find((l) => l.id === listId);
  const selectedTemplate = templates.find((t) => t.id === templateId);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/email-marketing")}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Campaign</h1>
          <p className="text-sm text-gray-500 mt-0.5">Set up your email campaign step by step</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((s, i) => {
          const StepIcon = s.icon;
          const isActive = i === step;
          const isCompleted = i < step;
          return (
            <div key={s.id} className="flex items-center flex-1">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full ${
                  isActive
                    ? "bg-[#0891b2]/10 text-[#0891b2]"
                    : isCompleted
                    ? "text-green-600 hover:bg-green-50"
                    : "text-gray-400"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    isActive
                      ? "bg-[#0891b2] text-white"
                      : isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : <StepIcon className="w-3.5 h-3.5" />}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px ${i < step ? "bg-green-400" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        {/* Step 0: Details */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Campaign Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., March Newsletter"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Your March Update is Here!"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preview Text</label>
              <input
                type="text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Text shown in inbox preview"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Name *</label>
                <input
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Email *</label>
                <input
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Internal Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Internal notes about this campaign"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 1: Audience */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Select Audience</h2>
            <p className="text-sm text-gray-500">Choose a contact list to send this campaign to.</p>
            {lists.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">No contact lists found. Create one first.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => setListId(list.id)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      listId === list.id
                        ? "border-[#0891b2] bg-[#0891b2]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{list.name}</div>
                        {list.description && (
                          <div className="text-xs text-gray-500 mt-0.5">{list.description}</div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {list._count?.members ?? list.memberCount} contacts
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Content/Template */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Select Template</h2>
            <p className="text-sm text-gray-500">Choose a template for your email content (optional).</p>
            <button
              onClick={() => setTemplateId("")}
              className={`w-full text-left p-4 rounded-lg border transition-colors ${
                !templateId ? "border-[#0891b2] bg-[#0891b2]/5" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-sm font-medium text-gray-900">No template (plain text)</div>
              <div className="text-xs text-gray-500 mt-0.5">Send a plain email without a template</div>
            </button>
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => setTemplateId(tpl.id)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  templateId === tpl.id
                    ? "border-[#0891b2] bg-[#0891b2]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{tpl.name}</div>
                    {tpl.subject && (
                      <div className="text-xs text-gray-500 mt-0.5">Subject: {tpl.subject}</div>
                    )}
                  </div>
                  {tpl.category && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      {tpl.category}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Review Campaign</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Campaign Name</span>
                <span className="text-sm font-medium text-gray-900">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Subject</span>
                <span className="text-sm font-medium text-gray-900">{subject}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">From</span>
                <span className="text-sm font-medium text-gray-900">{fromName} &lt;{fromEmail}&gt;</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Audience</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedList ? `${selectedList.name} (${selectedList._count?.members ?? selectedList.memberCount} contacts)` : "Not selected"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Template</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedTemplate ? selectedTemplate.name : "None"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => (step === 0 ? router.push("/email-marketing") : setStep(step - 1))}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 0 ? "Cancel" : "Back"}
        </button>

        <div className="flex gap-2">
          {step === 3 ? (
            <>
              <button
                onClick={() => handleCreate(false)}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <Settings className="w-4 h-4" />
                Save as Draft
              </button>
              <button
                onClick={() => handleCreate(true)}
                disabled={saving || !listId}
                className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0ea5e9] transition-colors font-medium text-sm disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {saving ? "Sending..." : "Send Now"}
              </button>
            </>
          ) : (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0ea5e9] transition-colors font-medium text-sm disabled:opacity-50"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
