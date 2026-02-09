import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { submitFormSchema, LAYOUT_FIELD_TYPES } from "@/lib/validations/form";

// ============================================
// GET /api/forms/[id]/submissions - List submissions
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const tenantId = "demo-tenant";

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const isSpamParam = searchParams.get("isSpam");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // Verify form belongs to tenant
    const form = await prisma.form.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    const where: Record<string, unknown> = {
      formId: id,
      tenantId,
    };

    if (isSpamParam !== null) {
      where.isSpam = isSpamParam === "true";
    }

    // Search across JSON data field (Prisma JSON filtering)
    if (search) {
      where.OR = [
        { data: { string_contains: search } },
      ];
    }

    const [submissions, total] = await Promise.all([
      prisma.formSubmission.findMany({
        where,
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { submittedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.formSubmission.count({ where }),
    ]);

    return NextResponse.json({
      data: submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/forms/[id]/submissions - Submit form (PUBLIC)
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Rate limit logging (simple implementation - log but don't enforce)
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0]?.trim() || "unknown";
    console.log(`Form submission from IP: ${clientIp} for form: ${id}`);

    // Find the published form with its fields
    const form = await prisma.form.findFirst({
      where: {
        id,
        status: "published",
        deletedAt: null,
      },
      include: {
        fields: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!form) {
      return NextResponse.json(
        { error: "Form not found or not published" },
        { status: 404 }
      );
    }

    // Validate submitted data against form schema
    const dataValidation = submitFormSchema.safeParse(body.data || body);
    if (!dataValidation.success) {
      return NextResponse.json(
        { error: "Invalid submission data", details: dataValidation.error.issues },
        { status: 400 }
      );
    }

    const submittedData = dataValidation.data as Record<string, unknown>;

    // Validate required fields
    const inputFields = form.fields.filter(
      (f) => !LAYOUT_FIELD_TYPES.includes(f.type as (typeof LAYOUT_FIELD_TYPES)[number])
    );

    const validationErrors: Array<{ field: string; message: string }> = [];

    for (const field of inputFields) {
      const value = submittedData[field.name];

      // Check required fields
      if (field.required && (value === undefined || value === null || value === "")) {
        validationErrors.push({
          field: field.name,
          message: `${field.label} is required`,
        });
        continue;
      }

      // Skip validation for empty optional fields
      if (value === undefined || value === null || value === "") {
        continue;
      }

      // Type-specific validation
      if (field.type === "email" && typeof value === "string") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          validationErrors.push({
            field: field.name,
            message: `${field.label} must be a valid email address`,
          });
        }
      }

      if (field.type === "number" && typeof value === "string") {
        if (isNaN(Number(value))) {
          validationErrors.push({
            field: field.name,
            message: `${field.label} must be a number`,
          });
        }
      }

      if (field.type === "url" && typeof value === "string") {
        try {
          new URL(value);
        } catch {
          validationErrors.push({
            field: field.name,
            message: `${field.label} must be a valid URL`,
          });
        }
      }

      // Custom validation rules
      if (field.validationRules && typeof value === "string") {
        const rules = field.validationRules as Record<string, unknown>;
        if (rules.minLength && value.length < Number(rules.minLength)) {
          validationErrors.push({
            field: field.name,
            message: `${field.label} must be at least ${rules.minLength} characters`,
          });
        }
        if (rules.maxLength && value.length > Number(rules.maxLength)) {
          validationErrors.push({
            field: field.name,
            message: `${field.label} must be at most ${rules.maxLength} characters`,
          });
        }
        if (rules.pattern) {
          try {
            const pattern = String(rules.pattern);
            // Safety: limit pattern length to prevent ReDoS
            if (pattern.length > 200) {
              validationErrors.push({
                field: field.name,
                message: `${field.label} format is invalid`,
              });
            } else if (!new RegExp(pattern).test(value)) {
              validationErrors.push({
                field: field.name,
                message: `${field.label} format is invalid`,
              });
            }
          } catch {
            // Invalid regex pattern stored in field config - skip validation
          }
        }
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    // Extract metadata from request
    const metadata = {
      ip: clientIp,
      userAgent: request.headers.get("user-agent") || null,
      referrer: request.headers.get("referer") || null,
      utmSource: body.utmSource || null,
      utmMedium: body.utmMedium || null,
      utmCampaign: body.utmCampaign || null,
    };

    // Auto-create or link contact if email field is present
    let contactId: string | null = null;
    const emailField = inputFields.find((f) => f.type === "email");
    const emailValue = emailField ? (submittedData[emailField.name] as string) : null;

    if (emailValue) {
      // Try to find existing contact
      const existingContact = await prisma.contact.findFirst({
        where: {
          email: emailValue,
          tenantId: form.tenantId,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (existingContact) {
        contactId = existingContact.id;
      } else {
        // Auto-create contact
        const firstNameField = inputFields.find(
          (f) => f.name === "firstName" || f.name === "first_name" || f.name === "name"
        );
        const lastNameField = inputFields.find(
          (f) => f.name === "lastName" || f.name === "last_name"
        );
        const phoneField = inputFields.find((f) => f.type === "phone");

        const newContact = await prisma.contact.create({
          data: {
            tenantId: form.tenantId,
            email: emailValue,
            firstName: firstNameField
              ? (submittedData[firstNameField.name] as string) || null
              : null,
            lastName: lastNameField
              ? (submittedData[lastNameField.name] as string) || null
              : null,
            phone: phoneField
              ? (submittedData[phoneField.name] as string) || null
              : null,
            lifecycleStage: "subscriber",
          },
        });

        contactId = newContact.id;
      }
    }

    // Create submission
    const submission = await prisma.formSubmission.create({
      data: {
        formId: id,
        tenantId: form.tenantId,
        data: submittedData as Prisma.InputJsonValue,
        metadata: metadata as Prisma.InputJsonValue,
        contactId,
        isSpam: false,
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error("Error submitting form:", error);
    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}
