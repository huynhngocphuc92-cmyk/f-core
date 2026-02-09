import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getDemoTenantId } from "@/lib/tenant";
import { createTicketCommentSchema } from "@/lib/validations/ticket";

// GET /api/tickets/[id]/comments - List comments for a ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getDemoTenantId();
    const { id } = await params;

    // Verify ticket exists and belongs to tenant
    const ticket = await prisma.ticket.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const comments = await prisma.ticketComment.findMany({
      where: { ticketId: id, deletedAt: null },
      include: {
        author: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ data: comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/tickets/[id]/comments - Add a comment to a ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getDemoTenantId();
    const { id } = await params;
    const body = await request.json();

    const parsed = createTicketCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify ticket exists and belongs to tenant
    const ticket = await prisma.ticket.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true, firstResponseAt: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Get demo user
    const demoUser = await prisma.user.findFirst({
      where: { tenantId },
      select: { id: true },
    });

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId: id,
        authorId: demoUser?.id,
        content: parsed.data.content,
        isInternal: parsed.data.isInternal,
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    // Track first public response for SLA
    if (!parsed.data.isInternal && !ticket.firstResponseAt) {
      await prisma.ticket.update({
        where: { id },
        data: { firstResponseAt: new Date() },
      });
    }

    // Create activity entry
    await prisma.ticketActivity.create({
      data: {
        ticketId: id,
        tenantId,
        type: "comment_added",
        description: parsed.data.isInternal ? "Internal note added" : "Public reply added",
        performedById: demoUser?.id,
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
