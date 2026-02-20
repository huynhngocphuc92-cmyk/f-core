import { describe, expect, it } from "vitest";
import { applyTransform, validateMappingRules } from "@/lib/data-mapping-rules";

describe("data mapping rules", () => {
  it("applies transformation operations", () => {
    expect(applyTransform("  Demo@Example.com  ", { operation: "trim" })).toBe("Demo@Example.com");
    expect(applyTransform("demo", { operation: "uppercase" })).toBe("DEMO");
    expect(applyTransform("100", { operation: "prefix", argument: "USD-" })).toBe("USD-100");
    expect(applyTransform("abc-123", { operation: "replace", argument: "-=>_" })).toBe("abc_123");
  });

  it("reports validation issues and builds preview", () => {
    const result = validateMappingRules({
      fieldMappings: [
        {
          sourceField: "email",
          targetField: "Email",
          transform: { operation: "trim" },
          validations: [{ type: "required" }, { type: "email" }],
        },
        {
          sourceField: "name",
          targetField: "Company",
          transform: { operation: "uppercase" },
          validations: [{ type: "max_length", value: 5 }],
        },
      ],
      sampleRecord: {
        email: " invalid-email ",
        name: "Long Company",
      },
    });

    expect(result.isValid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.preview).toEqual({
      Email: "invalid-email",
      Company: "LONG COMPANY",
    });
  });
});
