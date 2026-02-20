import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkPermission, getUserData } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import {
  buildKnowledgeAgentAnswer,
  knowledgeAgentRequestSchema,
} from "@/lib/ai/knowledge-agent";

async function computeKnowledgeAgentResponse(
  tenantId: string,
  input: {
    query: string;
    maxCitations?: number;
  }
) {
  const articles = await prisma.kBArticle.findMany({
    where: {
      tenantId,
      deletedAt: null,
      status: "published",
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      contentHtml: true,
      tags: true,
      viewCount: true,
      helpfulCount: true,
      publishedAt: true,
      category: {
        select: { name: true, slug: true },
      },
    },
    orderBy: [{ publishedAt: "desc" }, { viewCount: "desc" }],
    take: 2000,
  });

  return buildKnowledgeAgentAnswer({
    query: input.query,
    maxCitations: input.maxCitations,
    articles,
  });
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserData(request);
    await checkPermission("ai.use", request);
    const payload = knowledgeAgentRequestSchema.parse({
      query: request.nextUrl.searchParams.get("query"),
      maxCitations: request.nextUrl.searchParams.get("maxCitations")
        ? Number(request.nextUrl.searchParams.get("maxCitations"))
        : undefined,
    });

    const data = await computeKnowledgeAgentResponse(user.tenantId, payload);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserData(request);
    await checkPermission("ai.use", request);
    const body = await request.json();
    const payload = knowledgeAgentRequestSchema.parse(body);

    const data = await computeKnowledgeAgentResponse(user.tenantId, payload);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
