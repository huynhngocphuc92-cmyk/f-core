import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";
import {
  createMockParams,
  createMockRequest,
  getResponseBody,
} from "./helpers/mock-request";
import { GET as listContacts, POST as createContact } from "@/app/api/contacts/route";
import {
  GET as getContactById,
  PATCH as patchContactById,
} from "@/app/api/contacts/[id]/route";
import { buildReportQuery } from "@/lib/reports/query-builder";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockCheckOwnership = vi.mocked(checkOwnership);

const TENANT_ID = "tenant-test-id";

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockCheckOwnership.mockResolvedValue(true);
});

describe("API Security Suite (Next.js handlers)", () => {
  describe("Authentication & authorization", () => {
    it("returns 401 when listing contacts without authentication", async () => {
      mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

      const response = await listContacts(createMockRequest("/api/contacts"));
      const body = await getResponseBody(response);

      expect(response.status).toBe(401);
      expect(body.error).toBe("Authentication required");
    });

    it("returns 403 when reading a contact from a different tenant", async () => {
      mockPrisma.contact.findUnique.mockResolvedValue({
        id: "contact-1",
        tenantId: "tenant-other",
      } as never);
      mockCheckOwnership.mockRejectedValue(
        new Error("Forbidden: You do not have access to this resource"),
      );

      const response = await getContactById(
        createMockRequest("/api/contacts/contact-1"),
        createMockParams({ id: "contact-1" }),
      );
      const body = await getResponseBody(response);

      expect(response.status).toBe(403);
      expect(body.error).toMatch(/forbidden/i);
    });

    it("enforces ownership check before mutating a contact", async () => {
      mockPrisma.contact.findUnique.mockResolvedValue({
        tenantId: TENANT_ID,
      } as never);
      mockPrisma.contact.update.mockResolvedValue({ id: "contact-1" } as never);

      await patchContactById(
        createMockRequest("/api/contacts/contact-1", {
          method: "PATCH",
          body: { firstName: "Updated" },
        }),
        createMockParams({ id: "contact-1" }),
      );

      expect(mockCheckOwnership).toHaveBeenCalled();
    });
  });

  describe("Tenant isolation", () => {
    it("always injects authenticated tenant ID for create contact", async () => {
      mockPrisma.contact.create.mockResolvedValue({
        id: "contact-1",
        tenantId: TENANT_ID,
      } as never);

      await createContact(
        createMockRequest("/api/contacts", {
          method: "POST",
          body: {
            email: "tenant-test@example.com",
            tenantId: "tenant-attacker",
          },
        }),
      );

      const payload = mockPrisma.contact.create.mock.calls[0][0];
      expect(payload?.data.tenantId).toBe(TENANT_ID);
    });
  });

  describe("Input validation", () => {
    it("returns 400 when create contact payload misses required fields", async () => {
      const response = await createContact(
        createMockRequest("/api/contacts", {
          method: "POST",
          body: { lastName: "Only-last-name" },
        }),
      );
      const body = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(body.error).toMatch(/email or first name is required/i);
    });
  });

  describe("SQL injection hardening", () => {
    it("rejects report definition using unsafe metric field", () => {
      expect(() =>
        buildReportQuery(
          {
            dataSource: "deals",
            metrics: [{ field: '"amount"; DROP TABLE "Deal"; --', aggregate: "sum" }],
            dimensions: [],
            filters: [],
            chart: { chartType: "table" },
          },
          TENANT_ID,
        ),
      ).toThrow(/invalid field/i);
    });

    it("parameterizes filter values in generated report SQL", () => {
      const query = buildReportQuery(
        {
          dataSource: "contacts",
          metrics: [{ field: "*", aggregate: "count" }],
          dimensions: [],
          filters: [
            {
              field: "email",
              operator: "contains",
              value: "'; DROP TABLE \"Contact\"; --",
            },
          ],
          chart: { chartType: "number" },
        },
        TENANT_ID,
      );

      expect(query.sql).toContain("$1");
      expect(query.sql).toContain("$2");
      expect(query.params).toEqual([
        TENANT_ID,
        "%'; DROP TABLE \"Contact\"; --%",
      ]);
      expect(query.sql).not.toContain("DROP TABLE");
    });
  });
});
