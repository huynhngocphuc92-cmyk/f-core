import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  buildStructuredSections,
  composePageSchema,
  getPageTemplate,
  listReusableBlocks,
  renderStructuredSectionsHtml,
} from "@/lib/content-page-builder";

// POST /api/content/pages/compose - Apply template + reusable blocks into landing page content structure
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const user = await getCurrentUser(request);
    const body = await request.json();
    const payload = composePageSchema.parse(body);

    const template = getPageTemplate(payload.templateKey);
    if (!template) {
      throw new ApiError(404, "Template not found");
    }

    const page = await prisma.landingPage.findFirst({
      where: {
        id: payload.landingPageId,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        contentJson: true,
      },
    });

    if (!page) {
      throw new ApiError(404, "Landing page not found");
    }

    const allBlocks = await listReusableBlocks(tenantId);
    const selectedBlocks = payload.blockIds
      .map((id) => allBlocks.find((block) => block.id === id) || null)
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    if (selectedBlocks.length === 0) {
      throw new ApiError(400, "No valid reusable blocks selected");
    }

    let sections;
    try {
      sections = buildStructuredSections({
        template,
        selectedBlocks,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Missing reusable block")) {
        throw new ApiError(409, error.message);
      }
      throw error;
    }

    const contentJson = {
      ...(page.contentJson && typeof page.contentJson === "object" ? page.contentJson : {}),
      sectionTemplate: template.key,
      sectionTemplateName: template.name,
      structuredSections: sections,
      reusableBlockIds: selectedBlocks.map((block) => block.id),
      composedAt: new Date().toISOString(),
      composedBy: user.id,
    };

    const contentHtml = renderStructuredSectionsHtml(sections);

    const updated = await prisma.landingPage.update({
      where: {
        id: page.id,
      },
      data: {
        templateId: template.key,
        contentJson: contentJson as any,
        contentHtml,
      },
      select: {
        id: true,
        name: true,
        templateId: true,
        contentJson: true,
        contentHtml: true,
        updatedAt: true,
      },
    });

    await logAuditEvent({
      request,
      action: "updated",
      entity: "landing_page",
      entityId: updated.id,
      entityName: updated.name,
      changes: {
        composed: true,
        templateKey: template.key,
        blockCount: selectedBlocks.length,
      },
    });

    return NextResponse.json({
      page: updated,
      template,
      sections,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
