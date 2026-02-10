"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Trash2 } from "lucide-react";
import { sendCampaign, deleteCampaign } from "@/app/actions/campaigns";

export function SendButton({ campaignId }: { campaignId: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] transition-colors text-sm"
      >
        <Send className="w-4 h-4" />
        Send Campaign
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            {result ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Campaign Sent!
                </h3>
                <p className="text-sm text-gray-600 mb-4">{result}</p>
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    setResult(null);
                    router.refresh();
                  }}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-[#0891b2] rounded-lg hover:bg-[#0e7490]"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Send Campaign
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  This will send the campaign to all contacts with email
                  addresses. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      startTransition(async () => {
                        const res = await sendCampaign(campaignId);
                        if (res?.success) {
                          setResult(
                            `Sent to ${res.recipientCount} recipients.`
                          );
                        }
                      });
                    }}
                    disabled={isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#0891b2] rounded-lg hover:bg-[#0e7490] disabled:opacity-50"
                  >
                    {isPending ? "Sending..." : "Send Now"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function DeleteButton({ campaignId }: { campaignId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (!confirm("Delete this campaign?")) return;
        startTransition(async () => {
          await deleteCampaign(campaignId);
          router.push("/email-marketing");
        });
      }}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
      Delete
    </button>
  );
}
