import { NextRequest, NextResponse } from "next/server";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import {
  deactivateScimUser,
  getScimUserById,
  patchScimUser,
  scimPatchUserSchema,
} from "@/lib/scim-provisioning";
import { assertScimAuthorized, getScimTenantFromRequest } from "@/lib/scim-auth";
import { logAuditEvent } from "@/lib/audit-helpers";

// GET /api/scim/v2/Users/[id]
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertScimAuthorized(request);
    const tenantId = getScimTenantFromRequest(request);
    const { id } = await context.params;

    const user = await getScimUserById(tenantId, id);
    if (!user) throw new ApiError(404, "SCIM user not found");

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/scim/v2/Users/[id]
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertScimAuthorized(request);
    const tenantId = getScimTenantFromRequest(request);
    const { id } = await context.params;
    const body = await request.json();
    const payload = scimPatchUserSchema.parse(body);

    const user = await patchScimUser(tenantId, id, payload);
    if (!user) throw new ApiError(404, "SCIM user not found");

    await logAuditEvent({
      tenantId,
      action: "updated",
      entity: "scim_user",
      entityId: user.id,
      entityName: user.userName,
      metadata: {
        source: "scim",
        active: user.active,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/scim/v2/Users/[id]
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertScimAuthorized(request);
    const tenantId = getScimTenantFromRequest(request);
    const { id } = await context.params;

    const user = await deactivateScimUser(tenantId, id);
    if (!user) throw new ApiError(404, "SCIM user not found");

    await logAuditEvent({
      tenantId,
      action: "deactivated",
      entity: "scim_user",
      entityId: user.id,
      entityName: user.userName,
      metadata: {
        source: "scim",
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
