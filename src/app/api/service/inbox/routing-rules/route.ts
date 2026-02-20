import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  getServiceRoutingPolicy,
  setServiceRoutingPolicy,
  serviceRoutingPolicySchema,
} from "@/lib/service-routing-store";

// GET /api/service/inbox/routing-rules - Tenant routing policy + assignable users
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const policy = await getServiceRoutingPolicy(tenantId);

    const users = await prisma.user.findMany({
      where: { tenantId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      take: 200,
    });

    return NextResponse.json({ policy, users });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/service/inbox/routing-rules - Update tenant routing policy
export async function PUT(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const policy = serviceRoutingPolicySchema.parse(body?.policy ?? body);

    await setServiceRoutingPolicy(tenantId, policy);

    await logAuditEvent({
      request,
      action: "updated",
      entity: "service_routing_policy",
      entityId: tenantId,
      entityName: "tenant_service_routing_policy",
      changes: {
        teamCount: policy.teams.length,
        offHoursTeamId: policy.offHoursTeamId || null,
      },
    });

    return NextResponse.json({ policy });
  } catch (error) {
    return handleApiError(error);
  }
}
