import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { feedbackSchema } from "@/lib/validations/kb";

// ============================================
// GET /api/kb/articles/[id]/feedback - Get feedback stats
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = "demo-tenant";

    // Verify article exists and belongs to tenant
    const article = await prisma.kBArticle.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        id: true,
        helpfulCount: true,
        notHelpfulCount: true,
      },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    // Get recent comments (feedback with comment text)
    const feedbackWithComments = await prisma.kBArticleFeedback.findMany({
      where: {
        articleId: id,
        tenantId,
        comment: { not: null },
      },
      select: {
        id: true,
        isHelpful: true,
        comment: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      articleId: id,
      helpful: article.helpfulCount,
      notHelpful: article.notHelpfulCount,
      total: article.helpfulCount + article.notHelpfulCount,
      comments: feedbackWithComments,
    });
  } catch (error) {
    console.error("Error fetching KB article feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/kb/articles/[id]/feedback - Submit feedback
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const tenantId = "demo-tenant";

    const validation = feedbackSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { isHelpful, comment, visitorId } = validation.data;

    // Verify article exists and belongs to tenant
    const article = await prisma.kBArticle.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    // Get IP address from request headers
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;

    // If visitorId provided, upsert (update existing feedback or create new)
    if (visitorId) {
      const existingFeedback = await prisma.kBArticleFeedback.findUnique({
        where: {
          articleId_visitorId: {
            articleId: id,
            visitorId,
          },
        },
        select: { id: true, isHelpful: true },
      });

      if (existingFeedback) {
        // Update existing feedback and adjust counters
        const oldIsHelpful = existingFeedback.isHelpful;

        await prisma.$transaction([
          prisma.kBArticleFeedback.update({
            where: { id: existingFeedback.id },
            data: {
              isHelpful,
              comment: comment || null,
              ipAddress,
            },
          }),
          // Adjust counters only if the vote changed
          ...(oldIsHelpful !== isHelpful
            ? [
                prisma.kBArticle.update({
                  where: { id },
                  data: {
                    helpfulCount: isHelpful
                      ? { increment: 1 }
                      : { decrement: 1 },
                    notHelpfulCount: isHelpful
                      ? { decrement: 1 }
                      : { increment: 1 },
                  },
                }),
              ]
            : []),
        ]);

        return NextResponse.json({ success: true, action: "updated" });
      }
    }

    // Create new feedback and increment counter
    await prisma.$transaction([
      prisma.kBArticleFeedback.create({
        data: {
          articleId: id,
          tenantId,
          isHelpful,
          comment: comment || null,
          visitorId: visitorId || null,
          ipAddress,
        },
      }),
      prisma.kBArticle.update({
        where: { id },
        data: {
          helpfulCount: isHelpful ? { increment: 1 } : undefined,
          notHelpfulCount: !isHelpful ? { increment: 1 } : undefined,
        },
      }),
    ]);

    return NextResponse.json({ success: true, action: "created" }, { status: 201 });
  } catch (error) {
    console.error("Error submitting KB article feedback:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
