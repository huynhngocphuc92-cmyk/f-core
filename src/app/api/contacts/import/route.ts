import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";

// Parse a single CSV line respecting quoted fields
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote (double quote)
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }

  fields.push(current.trim());
  return fields;
}

// Map CSV header names to Prisma field names
const FIELD_MAP: Record<string, string> = {
  firstname: "firstName",
  first_name: "firstName",
  lastname: "lastName",
  last_name: "lastName",
  email: "email",
  phone: "phone",
  lifecyclestage: "lifecycleStage",
  lifecycle_stage: "lifecycleStage",
  jobtitle: "jobTitle",
  job_title: "jobTitle",
  company: "_company", // special: not a direct field
  city: "city",
  country: "country",
  state: "state",
  address: "address",
  postalcode: "postalCode",
  postal_code: "postalCode",
  website: "website",
  department: "department",
  mobilephone: "mobilePhone",
  mobile_phone: "mobilePhone",
  linkedinurl: "linkedinUrl",
  linkedin_url: "linkedinUrl",
};

// Allowed lifecycle stage values
const VALID_LIFECYCLE_STAGES = [
  "subscriber",
  "lead",
  "mql",
  "sql",
  "opportunity",
  "customer",
  "evangelist",
];

// POST /api/contacts/import - Import contacts from CSV
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Send a CSV file as 'file' in multipart/form-data." },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Only CSV files are supported." },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV file must contain a header row and at least one data row." },
        { status: 400 }
      );
    }

    // Parse header row
    const rawHeaders = parseCsvLine(lines[0]);
    const mappedHeaders = rawHeaders.map((h) => {
      const normalized = h.toLowerCase().replace(/\s+/g, "").replace(/-/g, "");
      return FIELD_MAP[normalized] || null;
    });

    // Check that we have at least email or firstName
    const hasEmail = mappedHeaders.includes("email");
    const hasFirstName = mappedHeaders.includes("firstName");

    if (!hasEmail && !hasFirstName) {
      return NextResponse.json(
        {
          error:
            "CSV must contain at least an 'email' or 'firstName' column. Found columns: " +
            rawHeaders.join(", "),
        },
        { status: 400 }
      );
    }

    // Get existing emails in this tenant for dedup
    const existingContacts = await prisma.contact.findMany({
      where: { tenantId, deletedAt: null, email: { not: null } },
      select: { email: true },
    });
    const existingEmails = new Set(
      existingContacts
        .map((c) => c.email?.toLowerCase())
        .filter(Boolean)
    );

    let created = 0;
    let skipped = 0;
    const errors: { row: number; message: string }[] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCsvLine(lines[i]);
        const record: Record<string, string> = {};

        for (let j = 0; j < mappedHeaders.length; j++) {
          const field = mappedHeaders[j];
          if (field && values[j]) {
            record[field] = values[j];
          }
        }

        // Skip if no email and no firstName
        if (!record.email && !record.firstName) {
          errors.push({ row: i + 1, message: "Missing email and firstName" });
          continue;
        }

        // Deduplicate by email
        if (record.email && existingEmails.has(record.email.toLowerCase())) {
          skipped++;
          continue;
        }

        // Validate lifecycle stage
        if (
          record.lifecycleStage &&
          !VALID_LIFECYCLE_STAGES.includes(record.lifecycleStage.toLowerCase())
        ) {
          record.lifecycleStage = "subscriber";
        } else if (record.lifecycleStage) {
          record.lifecycleStage = record.lifecycleStage.toLowerCase();
        }

        // Remove the _company pseudo-field (not a direct Contact column)
        delete record._company;

        await prisma.contact.create({
          data: {
            tenantId,
            email: record.email || null,
            firstName: record.firstName || null,
            lastName: record.lastName || null,
            phone: record.phone || null,
            mobilePhone: record.mobilePhone || null,
            lifecycleStage: record.lifecycleStage || "subscriber",
            jobTitle: record.jobTitle || null,
            department: record.department || null,
            website: record.website || null,
            linkedinUrl: record.linkedinUrl || null,
            address: record.address || null,
            city: record.city || null,
            state: record.state || null,
            country: record.country || null,
            postalCode: record.postalCode || null,
            properties: {},
          },
        });

        // Add to the dedup set so subsequent rows in the same file are caught
        if (record.email) {
          existingEmails.add(record.email.toLowerCase());
        }

        created++;
      } catch (rowError) {
        errors.push({
          row: i + 1,
          message:
            rowError instanceof Error ? rowError.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      total: lines.length - 1,
      created,
      skipped,
      errors: errors.length,
      errorDetails: errors.slice(0, 20), // limit error detail output
    });
  } catch (error) {
    return handleApiError(error);
  }
}
