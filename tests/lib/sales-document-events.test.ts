import { describe, expect, it } from "vitest";
import {
  buildSalesDocumentSummary,
  getSalesDocumentEventLabel,
  getSalesDocumentEventTypeFromMetadata,
} from "@/lib/sales-document-events";

describe("sales document events helpers", () => {
  it("extracts event type from metadata", () => {
    expect(getSalesDocumentEventTypeFromMetadata({ eventType: "view" })).toBe("view");
    expect(getSalesDocumentEventTypeFromMetadata({ eventType: "invalid" })).toBeNull();
  });

  it("builds summary counts from rows", () => {
    const summary = buildSalesDocumentSummary([
      { id: "1", createdAt: new Date(), subject: null, metadata: { eventType: "view" } },
      { id: "2", createdAt: new Date(), subject: null, metadata: { eventType: "download" } },
      { id: "3", createdAt: new Date(), subject: null, metadata: { eventType: "signed" } },
      { id: "4", createdAt: new Date(), subject: null, metadata: { eventType: "signed" } },
    ]);

    expect(summary.total).toBe(4);
    expect(summary.view).toBe(1);
    expect(summary.download).toBe(1);
    expect(summary.signed).toBe(2);
  });

  it("returns user-friendly labels", () => {
    expect(getSalesDocumentEventLabel("view")).toContain("viewed");
    expect(getSalesDocumentEventLabel("download")).toContain("downloaded");
    expect(getSalesDocumentEventLabel("signed")).toContain("signed");
  });
});
