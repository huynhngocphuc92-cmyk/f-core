import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { createMockParams, createMockRequest, getResponseBody } from "../helpers/mock-request";
import { resetScimProvisioningStoreForTests } from "@/lib/scim-provisioning";
import { GET as listUsers, POST as createUser } from "@/app/api/scim/v2/Users/route";
import {
  DELETE as deleteUser,
  GET as getUserById,
  PATCH as patchUser,
} from "@/app/api/scim/v2/Users/[id]/route";

const AUTH_HEADERS = {
  authorization: "Bearer scim-demo-token",
  "x-tenant-id": "tenant-scim-demo",
};
const mockPrisma = vi.mocked(prisma);

beforeEach(async () => {
  await resetScimProvisioningStoreForTests();
});

describe("SCIM Users API", () => {
  it("creates and lists users", async () => {
    const createResponse = await createUser(
      createMockRequest("/api/scim/v2/Users", {
        method: "POST",
        headers: AUTH_HEADERS,
        body: {
          externalId: "idp-123",
          userName: "alice@f-core.com",
          active: true,
          name: { givenName: "Alice", familyName: "Nguyen" },
          emails: [{ value: "alice@f-core.com", primary: true }],
          roles: [{ value: "manager" }],
        },
      })
    );
    const createdBody = await getResponseBody(createResponse);
    expect(createResponse.status).toBe(201);
    expect(createdBody.userName).toBe("alice@f-core.com");
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "provisioned",
          entity: "scim_user",
        }),
      })
    );

    const listResponse = await listUsers(
      createMockRequest('/api/scim/v2/Users?filter=userName%20eq%20"alice@f-core.com"', {
        headers: AUTH_HEADERS,
      })
    );
    const listBody = await getResponseBody(listResponse);
    expect(listResponse.status).toBe(200);
    expect(listBody.totalResults).toBe(1);
    expect(listBody.Resources[0].id).toBe(createdBody.id);
  });

  it("patches and deactivates users", async () => {
    const createResponse = await createUser(
      createMockRequest("/api/scim/v2/Users", {
        method: "POST",
        headers: AUTH_HEADERS,
        body: {
          userName: "bob@f-core.com",
          emails: [{ value: "bob@f-core.com", primary: true }],
        },
      })
    );
    const createdBody = await getResponseBody(createResponse);

    const patchResponse = await patchUser(
      createMockRequest(`/api/scim/v2/Users/${createdBody.id}`, {
        method: "PATCH",
        headers: AUTH_HEADERS,
        body: {
          Operations: [{ op: "replace", path: "active", value: false }],
        },
      }),
      createMockParams({ id: createdBody.id })
    );
    const patchedBody = await getResponseBody(patchResponse);
    expect(patchResponse.status).toBe(200);
    expect(patchedBody.active).toBe(false);
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "updated",
          entity: "scim_user",
        }),
      })
    );

    const detailResponse = await getUserById(
      createMockRequest(`/api/scim/v2/Users/${createdBody.id}`, {
        headers: AUTH_HEADERS,
      }),
      createMockParams({ id: createdBody.id })
    );
    const detailBody = await getResponseBody(detailResponse);
    expect(detailBody.active).toBe(false);

    const deleteResponse = await deleteUser(
      createMockRequest(`/api/scim/v2/Users/${createdBody.id}`, {
        method: "DELETE",
        headers: AUTH_HEADERS,
      }),
      createMockParams({ id: createdBody.id })
    );
    expect(deleteResponse.status).toBe(204);
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "deactivated",
          entity: "scim_user",
        }),
      })
    );
  });

  it("returns 401 for invalid token", async () => {
    const response = await listUsers(
      createMockRequest("/api/scim/v2/Users", {
        headers: {
          authorization: "Bearer wrong-token",
          "x-tenant-id": "tenant-scim-demo",
        },
      })
    );
    expect(response.status).toBe(401);
  });

  it("returns 400 when tenant header is missing", async () => {
    const response = await listUsers(
      createMockRequest("/api/scim/v2/Users", {
        headers: {
          authorization: "Bearer scim-demo-token",
        },
      })
    );
    expect(response.status).toBe(400);
  });
});
