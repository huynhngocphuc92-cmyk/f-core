"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/i18n/I18nProvider";

type QuoteCpqControlsProps = {
  quoteId: string;
};

export function QuoteCpqControls({ quoteId }: QuoteCpqControlsProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(
    action: string,
    url: string,
    body: Record<string, unknown>
  ) {
    setBusyAction(action);
    setError(null);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          payload.error ||
            t(
              "dashboard.quotes.cpqControls.errors.actionFailed",
              "CPQ action failed"
            )
        );
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t(
              "dashboard.quotes.cpqControls.errors.actionFailed",
              "CPQ action failed"
            )
      );
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-gray-900">
        {t("dashboard.quotes.cpqControls.title", "CPQ Controls")}
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          onClick={() =>
            runAction(
              "request-approval",
              `/api/quotes/${quoteId}/approval/request`,
              { note: "Requesting internal approval for this quote." }
            )
          }
          disabled={busyAction !== null}
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {busyAction === "request-approval"
            ? t("dashboard.quotes.cpqControls.running", "Running...")
            : t(
                "dashboard.quotes.cpqControls.requestApproval",
                "Request Approval"
              )}
        </button>

        <button
          onClick={() =>
            runAction(
              "approve",
              `/api/quotes/${quoteId}/approval/decision`,
              { decision: "approved", note: "Approved by CPQ reviewer." }
            )
          }
          disabled={busyAction !== null}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
        >
          {busyAction === "approve"
            ? t("dashboard.quotes.cpqControls.running", "Running...")
            : t("dashboard.quotes.cpqControls.approve", "Approve")}
        </button>

        <button
          onClick={() =>
            runAction(
              "reject",
              `/api/quotes/${quoteId}/approval/decision`,
              { decision: "rejected", note: "Rejected for revision." }
            )
          }
          disabled={busyAction !== null}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
          {busyAction === "reject"
            ? t("dashboard.quotes.cpqControls.running", "Running...")
            : t("dashboard.quotes.cpqControls.reject", "Reject")}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() =>
            runAction(
              "esign-sent",
              `/api/quotes/${quoteId}/esign/events`,
              { event: "sent", actorType: "internal", actorName: "CPQ Ops" }
            )
          }
          disabled={busyAction !== null}
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {busyAction === "esign-sent"
            ? t("dashboard.quotes.cpqControls.running", "Running...")
            : t(
                "dashboard.quotes.cpqControls.markESignSent",
                "Mark E-sign Sent"
              )}
        </button>

        <button
          onClick={() =>
            runAction(
              "esign-viewed",
              `/api/quotes/${quoteId}/esign/events`,
              { event: "viewed", actorType: "buyer", actorName: "Buyer" }
            )
          }
          disabled={busyAction !== null}
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {busyAction === "esign-viewed"
            ? t("dashboard.quotes.cpqControls.running", "Running...")
            : t("dashboard.quotes.cpqControls.markViewed", "Mark Viewed")}
        </button>

        <button
          onClick={() =>
            runAction(
              "esign-signed",
              `/api/quotes/${quoteId}/esign/events`,
              { event: "signed", actorType: "buyer", actorName: "Buyer" }
            )
          }
          disabled={busyAction !== null}
          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
        >
          {busyAction === "esign-signed"
            ? t("dashboard.quotes.cpqControls.running", "Running...")
            : t("dashboard.quotes.cpqControls.markSigned", "Mark Signed")}
        </button>

        <button
          onClick={() =>
            runAction(
              "esign-declined",
              `/api/quotes/${quoteId}/esign/events`,
              { event: "declined", actorType: "buyer", actorName: "Buyer" }
            )
          }
          disabled={busyAction !== null}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
          {busyAction === "esign-declined"
            ? t("dashboard.quotes.cpqControls.running", "Running...")
            : t("dashboard.quotes.cpqControls.markDeclined", "Mark Declined")}
        </button>
      </div>

      {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
