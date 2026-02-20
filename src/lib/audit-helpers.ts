import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, getTenantId } from "@/lib/auth-helpers";

interface AuditEventInput {
  request?: NextRequest;
  tenantId?: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  entityName?: string;
  changes?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
}

function getRequestContext(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor
    ? forwardedFor.split(",")[0].trim()
    : request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent");

  return { ipAddress, userAgent };
}

export async function logAuditEvent(input: AuditEventInput): Promise<void> {
  try {
    const resolvedTenantId =
      input.tenantId ||
      (input.request ? await getTenantId(input.request) : undefined);
    let resolvedUserId = input.userId;

    if (!resolvedUserId && input.request) {
      try {
        const user = await getCurrentUser(input.request);
        resolvedUserId = user.id;
      } catch {
        resolvedUserId = undefined;
      }
    }

    if (!resolvedTenantId) return;

    const { ipAddress, userAgent } = input.request
      ? getRequestContext(input.request)
      : { ipAddress: null, userAgent: null };

    await prisma.auditLog.create({
      data: {
        tenantId: resolvedTenantId,
        userId: resolvedUserId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        entityName: input.entityName,
        changes: input.changes,
        metadata: input.metadata || {},
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
      },
    });
  } catch {
    // Audit logging should never break primary API behavior.
  }
}
