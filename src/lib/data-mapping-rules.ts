import { z } from "zod";

export const transformOperationSchema = z.enum([
  "none",
  "trim",
  "lowercase",
  "uppercase",
  "prefix",
  "suffix",
  "replace",
  "to_number",
  "to_iso_date",
]);

export const fieldValidationRuleSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("required") }),
  z.object({ type: z.literal("max_length"), value: z.number().int().min(1).max(2000) }),
  z.object({ type: z.literal("regex"), value: z.string().min(1).max(240) }),
  z.object({ type: z.literal("email") }),
]);

export const mappingRuleSchema = z
  .object({
    sourceField: z.string().min(1).max(120),
    targetField: z.string().min(1).max(120),
    transform: z
      .object({
        operation: transformOperationSchema.default("none"),
        argument: z.string().max(240).optional(),
      })
      .default({ operation: "none" }),
    validations: z.array(fieldValidationRuleSchema).default([]),
    defaultValue: z.string().max(240).optional(),
  })
  .superRefine((value, ctx) => {
    if (["prefix", "suffix", "replace"].includes(value.transform.operation) && !value.transform.argument) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["transform", "argument"],
        message: `transform argument is required for ${value.transform.operation}`,
      });
    }

    if (value.validations.some((rule) => rule.type === "required") && value.defaultValue === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["defaultValue"],
        message: "defaultValue cannot be empty when required validation is enabled",
      });
    }
  });

export const validateMappingRulesSchema = z.object({
  fieldMappings: z.array(mappingRuleSchema).min(1).max(200),
  sampleRecord: z.record(z.string(), z.unknown()).optional(),
});

export type MappingValidationIssue = {
  sourceField: string;
  targetField: string;
  severity: "warning" | "error";
  message: string;
};

export function applyTransform(value: unknown, transform: z.infer<typeof mappingRuleSchema>["transform"]): string {
  const raw = value == null ? "" : String(value);

  switch (transform.operation) {
    case "none":
      return raw;
    case "trim":
      return raw.trim();
    case "lowercase":
      return raw.toLowerCase();
    case "uppercase":
      return raw.toUpperCase();
    case "prefix":
      return `${transform.argument ?? ""}${raw}`;
    case "suffix":
      return `${raw}${transform.argument ?? ""}`;
    case "replace": {
      const [from = "", to = ""] = (transform.argument ?? "").split("=>");
      return from ? raw.split(from).join(to) : raw;
    }
    case "to_number": {
      const normalized = raw.replace(/,/g, "").trim();
      const valueAsNumber = Number(normalized);
      return Number.isFinite(valueAsNumber) ? String(valueAsNumber) : "";
    }
    case "to_iso_date": {
      const date = new Date(raw);
      return Number.isNaN(date.getTime()) ? "" : date.toISOString();
    }
    default:
      return raw;
  }
}

function runValidationRules(value: string, rules: z.infer<typeof fieldValidationRuleSchema>[]) {
  const issues: MappingValidationIssue[] = [];

  for (const rule of rules) {
    if (rule.type === "required" && value.trim().length === 0) {
      issues.push({
        sourceField: "",
        targetField: "",
        severity: "error",
        message: "value is required",
      });
      continue;
    }

    if (rule.type === "max_length" && value.length > rule.value) {
      issues.push({
        sourceField: "",
        targetField: "",
        severity: "error",
        message: `value exceeds max_length ${rule.value}`,
      });
      continue;
    }

    if (rule.type === "regex") {
      try {
        const expression = new RegExp(rule.value);
        if (!expression.test(value)) {
          issues.push({
            sourceField: "",
            targetField: "",
            severity: "error",
            message: "value does not match regex",
          });
        }
      } catch {
        issues.push({
          sourceField: "",
          targetField: "",
          severity: "error",
          message: "invalid regex pattern",
        });
      }
      continue;
    }

    if (rule.type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        issues.push({
          sourceField: "",
          targetField: "",
          severity: "error",
          message: "value is not a valid email",
        });
      }
    }
  }

  return issues;
}

export function validateMappingRules(input: z.infer<typeof validateMappingRulesSchema>) {
  const parsed = validateMappingRulesSchema.parse(input);
  const issues: MappingValidationIssue[] = [];

  const uniqueSourceTarget = new Set<string>();

  for (const rule of parsed.fieldMappings) {
    const key = `${rule.sourceField}=>${rule.targetField}`;
    if (uniqueSourceTarget.has(key)) {
      issues.push({
        sourceField: rule.sourceField,
        targetField: rule.targetField,
        severity: "error",
        message: "duplicate source/target mapping",
      });
    } else {
      uniqueSourceTarget.add(key);
    }

    const sampleValue = parsed.sampleRecord?.[rule.sourceField] ?? rule.defaultValue ?? "";
    const transformedValue = applyTransform(sampleValue, rule.transform);

    for (const validationIssue of runValidationRules(transformedValue, rule.validations)) {
      issues.push({
        ...validationIssue,
        sourceField: rule.sourceField,
        targetField: rule.targetField,
      });
    }
  }

  return {
    mappings: parsed.fieldMappings,
    issues,
    isValid: issues.every((item) => item.severity !== "error"),
    preview:
      parsed.sampleRecord == null
        ? null
        : Object.fromEntries(
            parsed.fieldMappings.map((rule) => {
              const sourceValue = parsed.sampleRecord?.[rule.sourceField] ?? rule.defaultValue ?? "";
              return [rule.targetField, applyTransform(sourceValue, rule.transform)];
            })
          ),
  };
}

export const mappingValidationCatalog = {
  transformOperations: transformOperationSchema.options,
  validationRules: ["required", "max_length", "regex", "email"],
};
