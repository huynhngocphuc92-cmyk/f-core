import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import {
  mappingValidationCatalog,
  validateMappingRules,
  validateMappingRulesSchema,
} from "@/lib/data-mapping-rules";

// GET /api/data/sync/mappings/validate - List transform and validation catalog
export async function GET(request: NextRequest) {
  try {
    await getTenantId(request);
    return NextResponse.json({
      data: mappingValidationCatalog,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/data/sync/mappings/validate - Validate mapping rules and preview transformations
export async function POST(request: NextRequest) {
  try {
    await getTenantId(request);
    const body = await request.json();
    const payload = validateMappingRulesSchema.parse(body);

    return NextResponse.json({
      data: validateMappingRules(payload),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
