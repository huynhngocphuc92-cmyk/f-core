import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";

import { POST as importContacts } from "@/app/api/contacts/import/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);

function createCsvFile(content: string, filename = "contacts.csv"): File {
  return new File([content], filename, { type: "text/csv" });
}

function createFormDataRequest(file: File | null) {
  const formData = new FormData();
  if (file) {
    formData.append("file", file);
  }

  const request = createMockRequest("/api/contacts/import", { method: "POST" });

  // Override formData method
  const originalFormData = request.formData;
  vi.spyOn(request, "formData").mockResolvedValue(formData);

  return request;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue("tenant-test-id");
  mockPrisma.contact.findMany.mockResolvedValue([]);
});

describe("POST /api/contacts/import", () => {
  it("should import contacts from CSV", async () => {
    mockPrisma.contact.create.mockResolvedValue({} as any);

    const csv = "email,firstName,lastName\njohn@example.com,John,Doe\njane@example.com,Jane,Smith";
    const request = createFormDataRequest(createCsvFile(csv));
    const response = await importContacts(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.total).toBe(2);
    expect(body.created).toBe(2);
    expect(body.skipped).toBe(0);
  });

  it("should return 400 when no file provided", async () => {
    const request = createFormDataRequest(null);
    const response = await importContacts(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 for non-CSV files", async () => {
    const file = new File(["data"], "contacts.xlsx", { type: "application/xlsx" });
    const request = createFormDataRequest(file);
    const response = await importContacts(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 for CSV without required columns", async () => {
    const csv = "name,age\nJohn,30";
    const request = createFormDataRequest(createCsvFile(csv));
    const response = await importContacts(request);

    expect(response.status).toBe(400);
  });

  it("should skip duplicate emails", async () => {
    mockPrisma.contact.findMany.mockResolvedValue([
      { email: "existing@example.com" },
    ] as any);
    mockPrisma.contact.create.mockResolvedValue({} as any);

    const csv = "email,firstName\nexisting@example.com,Old\nnew@example.com,New";
    const request = createFormDataRequest(createCsvFile(csv));
    const response = await importContacts(request);
    const body = await getResponseBody(response);

    expect(body.created).toBe(1);
    expect(body.skipped).toBe(1);
  });

  it("should return 400 for header-only CSV", async () => {
    const csv = "email,firstName";
    const request = createFormDataRequest(createCsvFile(csv));
    const response = await importContacts(request);

    expect(response.status).toBe(400);
  });

  it("should return 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const csv = "email,firstName\ntest@test.com,Test";
    const request = createFormDataRequest(createCsvFile(csv));
    const response = await importContacts(request);

    expect(response.status).toBe(401);
  });
});
