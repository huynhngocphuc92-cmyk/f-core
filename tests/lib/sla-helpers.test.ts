import { describe, expect, it, vi } from "vitest";
import {
  computeTicketDueDate,
  getSlaStatus,
  getSlaTarget,
} from "@/lib/sla-helpers";

describe("sla-helpers", () => {
  it("returns default medium target for unknown priority", () => {
    expect(getSlaTarget("unknown")).toEqual({
      firstResponseMinutes: 120,
      resolutionHours: 24,
    });
  });

  it("computes due date from priority target", () => {
    const createdAt = new Date("2026-02-14T00:00:00.000Z");
    const due = computeTicketDueDate(createdAt, "urgent");

    expect(due.toISOString()).toBe("2026-02-14T04:00:00.000Z");
  });

  it("marks first response and resolution breach when overdue", () => {
    vi.setSystemTime(new Date("2026-02-15T12:00:00.000Z"));

    const status = getSlaStatus(
      {
        createdAt: new Date("2026-02-14T00:00:00.000Z"),
        priority: "medium",
        status: "open",
        dueDate: null,
        firstResponseAt: null,
      },
      new Date()
    );

    expect(status.firstResponse.breached).toBe(true);
    expect(status.resolution.breached).toBe(true);
    expect(status.breached).toBe(true);

    vi.useRealTimers();
  });

  it("does not mark resolution breach for resolved ticket", () => {
    const status = getSlaStatus(
      {
        createdAt: new Date("2026-02-14T00:00:00.000Z"),
        priority: "high",
        status: "resolved",
        dueDate: new Date("2026-02-14T04:00:00.000Z"),
        firstResponseAt: new Date("2026-02-14T00:30:00.000Z"),
      },
      new Date("2026-02-15T00:00:00.000Z")
    );

    expect(status.resolution.breached).toBe(false);
    expect(status.breached).toBe(false);
  });
});
