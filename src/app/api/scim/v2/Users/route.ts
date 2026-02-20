import { NextRequest, NextResponse } from "next/server";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import {
  createScimUser,
  listScimUsers,
  scimCreateUserSchema,
} from "@/lib/scim-provisioning";
import { assertScimAuthorized, getScimTenantFromRequest } from "@/lib/scim-auth";
import { logAuditEvent } from "@/lib/audit-helpers";

function parseFilterParam(filter: string | null) {
  if (!filter) return undefined;
  const matched = filter.match(/userName\s+eq\s+"([^"]+)"/i);
  return matched?.[1];
}

// GET /api/scim/v2/Users
export async function GET(request: NextRequest) {
  try {
    assertScimAuthorized(request);
    const tenantId = getScimTenantFromRequest(request);

    const startIndex = Number.parseInt(request.nextUrl.searchParams.get("startIndex") || "1", 10);
    const count = Number.parseInt(request.nextUrl.searchParams.get("count") || "100", 10);
    const emailFilter = parseFilterParam(request.nextUrl.searchParams.get("filter"));

    const data = await listScimUsers(tenantId, {
      startIndex: Number.isFinite(startIndex) ? startIndex : 1,
      count: Number.isFinite(count) ? count : 100,
      emailFilter,
    });

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/scim/v2/Users
export async function POST(request: NextRequest) {
  try {
    assertScimAuthorized(request);
    const tenantId = getScimTenantFromRequest(request);
    const body = await request.json();
    const payload = scimCreateUserSchema.parse(body);
    const created = await createScimUser(tenantId, payload);

    await logAuditEvent({
      tenantId,
      action: "provisioned",
      entity: "scim_user",
      entityId: created.id,
      entityName: created.userName,
      metadata: {
        source: "scim",
        active: created.active,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT() {
  return handleApiError(new ApiError(405, "Method not allowed"));
}
