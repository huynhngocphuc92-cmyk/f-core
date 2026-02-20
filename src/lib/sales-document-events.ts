import { z } from "zod";

export const salesDocumentEventTypeSchema = z.enum(["view", "download", "signed"]);
export const salesDocumentEventSourceSchema = z.enum(["portal", "email", "manual"]);

export type SalesDocumentEventType = z.infer<typeof salesDocumentEventTypeSchema>;

export const createSalesDocumentEventSchema = z.object({
  quoteId: z.string().min(1).max(64),
  eventType: salesDocumentEventTypeSchema,
  recipientEmail: z.string().email().optional(),
  source: salesDocumentEventSourceSchema.default("manual"),
  occurredAt: z.string().datetime().optional(),
});

export type SalesDocumentEventRow = {
  id: string;
  createdAt: Date;
  subject: string | null;
  metadata: unknown;
};

function toObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

export function getSalesDocumentEventTypeFromMetadata(
  metadata: unknown
): SalesDocumentEventType | null {
  const data = toObject(metadata);
  const parsed = salesDocumentEventTypeSchema.safeParse(data.eventType);
  return parsed.success ? parsed.data : null;
}

export function getSalesDocumentEventLabel(type: SalesDocumentEventType): string {
  switch (type) {
    case "view":
      return "Document viewed";
    case "download":
      return "Document downloaded";
    case "signed":
      return "Document signed";
    default:
      return "Document event";
  }
}

export function buildSalesDocumentSummary(rows: SalesDocumentEventRow[]) {
  const summary = {
    total: 0,
    view: 0,
    download: 0,
    signed: 0,
  };

  for (const row of rows) {
    const type = getSalesDocumentEventTypeFromMetadata(row.metadata);
    if (!type) continue;
    summary.total += 1;
    summary[type] += 1;
  }

  return summary;
}
