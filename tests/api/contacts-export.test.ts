import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";

import { GET as exportContacts } from "@/app/api/contacts/export/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue("tenant-test-id");
});

describe("GET /api/contacts/export", () => {
  it("should return CSV with correct headers", async () => {
    mockPrisma.contact.findMany.mockResolvedValue([]);

    const request = createMockRequest("/api/contacts/export");
    const response = await exportContacts(request);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(response.headers.get("Content-Disposition")).toContain("contacts-");
    expect(text).toContain("firstName,lastName,email");
  });

  it("should export contact data as CSV rows", async () => {
    mockPrisma.contact.findMany.mockResolvedValue([
      {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "555-1234",
        lifecycleStage: "lead",
        jobTitle: "Engineer",
        city: "NYC",
        country: "US",
        companies: [{ company: { name: "Acme Corp" } }],
      },
    ] as any);

    const request = createMockRequest("/api/contacts/export");
    const response = await exportContacts(request);
    const text = await response.text();
    const lines = text.split("\n");

    expect(lines.length).toBe(2);
    expect(lines[1]).toContain("John");
    expect(lines[1]).toContain("john@example.com");
    expect(lines[1]).toContain("Acme Corp");
  });

  it("should escape CSV fields with commas", async () => {
    mockPrisma.contact.findMany.mockResolvedValue([
      {
        firstName: "John",
        lastName: "Doe, Jr.",
        email: "john@example.com",
        phone: null,
        lifecycleStage: null,
        jobTitle: null,
        city: null,
        country: null,
        companies: [],
      },
    ] as any);

    const request = createMockRequest("/api/contacts/export");
    const response = await exportContacts(request);
    const text = await response.text();

    expect(text).toContain('"Doe, Jr."');
  });

  it("should return 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const request = createMockRequest("/api/contacts/export");
    const response = await exportContacts(request);

    expect(response.status).toBe(401);
  });
});
