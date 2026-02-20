import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import { createMergeAudit, listMergeAudit, mergeDuplicateSchema } from "@/lib/data-quality-store";

function pickValue<T>(primaryValue: T, duplicateValue: T, mode: "prefer_primary" | "prefer_duplicate") {
  if (mode === "prefer_duplicate") {
    return duplicateValue ?? primaryValue;
  }
  return primaryValue ?? duplicateValue;
}

// GET /api/data/quality/merge - List merge audit history
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    return NextResponse.json({ data: await listMergeAudit(tenantId) });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/data/quality/merge - Apply duplicate merge workflow
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const user = await getCurrentUser(request);
    const body = await request.json();
    const payload = mergeDuplicateSchema.parse(body);

    if (payload.primaryId === payload.duplicateId) {
      throw new ApiError(400, "primaryId and duplicateId must be different");
    }

    if (payload.objectType === "contact") {
      const [primary, duplicate] = await Promise.all([
        prisma.contact.findFirst({
          where: { id: payload.primaryId, tenantId, deletedAt: null },
        }),
        prisma.contact.findFirst({
          where: { id: payload.duplicateId, tenantId, deletedAt: null },
        }),
      ]);

      if (!primary || !duplicate) {
        throw new ApiError(404, "Contact merge target not found");
      }

      const mode = payload.mergeMode === "custom" ? "prefer_primary" : payload.mergeMode;
      const mergedData = {
        firstName: mode === "prefer_duplicate" ? duplicate.firstName || primary.firstName : primary.firstName || duplicate.firstName,
        lastName: mode === "prefer_duplicate" ? duplicate.lastName || primary.lastName : primary.lastName || duplicate.lastName,
        email: pickValue(primary.email, duplicate.email, mode),
        phone: pickValue(primary.phone, duplicate.phone, mode),
        mobilePhone: pickValue(primary.mobilePhone, duplicate.mobilePhone, mode),
        jobTitle: pickValue(primary.jobTitle, duplicate.jobTitle, mode),
      };

      const fieldsMerged = Object.keys(mergedData);

      const audit = await createMergeAudit(tenantId, {
        objectType: "contact",
        primaryId: primary.id,
        duplicateId: duplicate.id,
        mergedBy: user.id,
        dryRun: payload.dryRun,
        fieldsMerged,
      });

      if (!payload.dryRun) {
        await prisma.contact.update({ where: { id: primary.id }, data: mergedData });
        await prisma.contact.update({ where: { id: duplicate.id }, data: { deletedAt: new Date() } });
      }

      await logAuditEvent({
        request,
        action: "updated",
        entity: "data_quality_merge",
        entityId: audit.id,
        entityName: `contact:${primary.id}`,
        changes: {
          duplicateId: duplicate.id,
          dryRun: payload.dryRun,
          fieldsMerged,
        },
      });

      return NextResponse.json({
        audit,
        merged: {
          objectType: "contact",
          primaryId: primary.id,
          duplicateId: duplicate.id,
          dryRun: payload.dryRun,
        },
      });
    }

    const [primary, duplicate] = await Promise.all([
      prisma.company.findFirst({
        where: { id: payload.primaryId, tenantId, deletedAt: null },
      }),
      prisma.company.findFirst({
        where: { id: payload.duplicateId, tenantId, deletedAt: null },
      }),
    ]);

    if (!primary || !duplicate) {
      throw new ApiError(404, "Company merge target not found");
    }

    const mode = payload.mergeMode === "custom" ? "prefer_primary" : payload.mergeMode;
    const mergedData = {
      name: mode === "prefer_duplicate" ? duplicate.name || primary.name : primary.name || duplicate.name,
      domain: pickValue(primary.domain, duplicate.domain, mode),
      phone: pickValue(primary.phone, duplicate.phone, mode),
      website: pickValue(primary.website, duplicate.website, mode),
      industry: pickValue(primary.industry, duplicate.industry, mode),
      description: pickValue(primary.description, duplicate.description, mode),
    };

    const fieldsMerged = Object.keys(mergedData);

    const audit = await createMergeAudit(tenantId, {
      objectType: "company",
      primaryId: primary.id,
      duplicateId: duplicate.id,
      mergedBy: user.id,
      dryRun: payload.dryRun,
      fieldsMerged,
    });

    if (!payload.dryRun) {
      await prisma.company.update({ where: { id: primary.id }, data: mergedData });
      await prisma.company.update({ where: { id: duplicate.id }, data: { deletedAt: new Date() } });
    }

    await logAuditEvent({
      request,
      action: "updated",
      entity: "data_quality_merge",
      entityId: audit.id,
      entityName: `company:${primary.id}`,
      changes: {
        duplicateId: duplicate.id,
        dryRun: payload.dryRun,
        fieldsMerged,
      },
    });

    return NextResponse.json({
      audit,
      merged: {
        objectType: "company",
        primaryId: primary.id,
        duplicateId: duplicate.id,
        dryRun: payload.dryRun,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
