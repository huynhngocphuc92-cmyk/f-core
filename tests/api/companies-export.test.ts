import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";

import { GET as exportCompanies } from "@/app/api/companies/export/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue("tenant-test-id");
});

describe("GET /api/companies/export", () => {
  it("should return CSV with correct headers", async () => {
    mockPrisma.company.findMany.mockResolvedValue([]);

    const request = createMockRequest("/api/companies/export");
    const response = await exportCompanies(request);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(response.headers.get("Content-Disposition")).toContain("companies-");
    expect(text).toContain("name,domain,industry");
  });

  it("should export company data as CSV rows", async () => {
    mockPrisma.company.findMany.mockResolvedValue([
      {
        name: "Acme Corp",
        domain: "acme.com",
        industry: "Technology",
        size: "50-200",
        phone: "555-1234",
        website: "https://acme.com",
        city: "San Francisco",
        country: "US",
      },
    ] as any);

    const request = createMockRequest("/api/companies/export");
    const response = await exportCompanies(request);
    const text = await response.text();
    const lines = text.split("\n");

    expect(lines.length).toBe(2);
    expect(lines[1]).toContain("Acme Corp");
    expect(lines[1]).toContain("acme.com");
  });

  it("should return 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const request = createMockRequest("/api/companies/export");
    const response = await exportCompanies(request);

    expect(response.status).toBe(401);
  });
});
