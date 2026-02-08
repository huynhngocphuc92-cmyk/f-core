import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  generateTrackingId,
  generateMessageId,
  injectTrackingPixel,
  rewriteLinksForTracking,
} from "@/lib/email-tracking";

const TENANT_ID = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

const recipientSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

const createEmailSchema = z.object({
  toRecipients: z.array(recipientSchema).min(1, "At least one recipient is required"),
  ccRecipients: z.array(recipientSchema).optional(),
  bccRecipients: z.array(recipientSchema).optional(),
  subject: z.string().max(998).optional(),
  bodyHtml: z.string().max(500000).optional(),
  bodyText: z.string().max(500000).optional(),
  fromEmail: z.string().email().optional(),
  fromName: z.string().max(255).optional(),
  isDraft: z.boolean().optional(),
  trackOpens: z.boolean().optional(),
  trackClicks: z.boolean().optional(),
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  dealId: z.string().optional(),
  templateId: z.string().optional(),
  threadId: z.string().optional(),
  inReplyTo: z.string().optional(),
  references: z.string().optional(),
  direction: z.enum(["outbound", "inbound"]).optional(),
  scheduledAt: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// GET /api/emails - List emails
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const contactId = searchParams.get("contactId");
    const companyId = searchParams.get("companyId");
    const dealId = searchParams.get("dealId");
    const threadId = searchParams.get("threadId");
    const status = searchParams.get("status");
    const direction = searchParams.get("direction");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(
      parseInt(searchParams.get("pageSize") || "20"),
      100
    );

    const where = {
      tenantId: TENANT_ID,
      deletedAt: null,
      ...(contactId && { contactId }),
      ...(companyId && { companyId }),
      ...(dealId && { dealId }),
      ...(threadId && { threadId }),
      ...(status && { status }),
      ...(direction && { direction }),
      ...(search && {
        OR: [
          { subject: { contains: search, mode: "insensitive" as const } },
          { fromEmail: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [emails, total] = await Promise.all([
      prisma.email.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true } },
          contact: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          company: { select: { id: true, name: true } },
          deal: { select: { id: true, name: true } },
          template: { select: { id: true, name: true } },
          _count: { select: { events: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.email.count({ where }),
    ]);

    return NextResponse.json({
      data: emails,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching emails:", error);
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
}

// POST /api/emails - Create/send email
export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = createEmailSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const body = parsed.data;

    const trackingId = generateTrackingId();
    const messageId = generateMessageId();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    let bodyHtml = body.bodyHtml || "";
    const bodyOriginal = bodyHtml;
    const trackOpens = body.trackOpens !== false;
    const trackClicks = body.trackClicks !== false;

    // Inject tracking pixel
    if (trackOpens && bodyHtml) {
      bodyHtml = injectTrackingPixel(bodyHtml, trackingId, baseUrl);
    }

    // Rewrite links for click tracking
    if (trackClicks && bodyHtml) {
      bodyHtml = rewriteLinksForTracking(bodyHtml, trackingId, baseUrl);
    }

    const isDraft = body.isDraft === true;
    const status = isDraft ? "draft" : "sent";
    const sentAt = isDraft ? null : new Date();

    // Determine threadId
    let threadId = body.threadId || null;
    if (!threadId && !body.inReplyTo) {
      threadId = `thread_${trackingId}`;
    }

    // Look up owner
    const owner = await prisma.user.findFirst({
      where: { tenantId: TENANT_ID },
    });

    const email = await prisma.email.create({
      data: {
        tenantId: TENANT_ID,
        trackingId,
        messageId,
        threadId,
        inReplyTo: body.inReplyTo || null,
        references: body.references || null,
        fromEmail: body.fromEmail || owner?.email || "user@fcore.app",
        fromName: body.fromName || owner?.name || "F-CORE User",
        toRecipients: body.toRecipients as Prisma.InputJsonValue,
        ccRecipients: body.ccRecipients as Prisma.InputJsonValue | undefined,
        bccRecipients: body.bccRecipients as Prisma.InputJsonValue | undefined,
        subject: body.subject || null,
        bodyHtml,
        bodyText: body.bodyText || null,
        bodyOriginal,
        status,
        direction: body.direction || "outbound",
        sentAt,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        templateId: body.templateId || null,
        contactId: body.contactId || null,
        companyId: body.companyId || null,
        dealId: body.dealId || null,
        ownerId: owner?.id || null,
        metadata: (body.metadata || {}) as Prisma.InputJsonValue,
      },
      include: {
        owner: { select: { id: true, name: true } },
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // Log SENT event
    if (!isDraft) {
      await prisma.emailEvent.create({
        data: {
          emailId: email.id,
          eventType: "SENT",
        },
      });

      // Also create an Activity record for timeline
      await prisma.activity.create({
        data: {
          tenantId: TENANT_ID,
          type: "email",
          subject: email.subject,
          body: email.bodyText,
          contactId: email.contactId,
          companyId: email.companyId,
          dealId: email.dealId,
          ownerId: email.ownerId,
          emailTo: Array.isArray(body.toRecipients)
            ? body.toRecipients.map((r: { email: string }) => r.email).join(", ")
            : "",
          emailCc: body.ccRecipients
            ? body.ccRecipients.map((r: { email: string }) => r.email).join(", ")
            : null,
          emailStatus: "sent",
          metadata: { emailId: email.id, trackingId },
        },
      });
    }

    return NextResponse.json(email, { status: 201 });
  } catch (error) {
    console.error("Error creating email:", error);
    return NextResponse.json(
      { error: "Failed to create email" },
      { status: 500 }
    );
  }
}
