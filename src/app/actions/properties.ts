"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

async function getTenantId(): Promise<string> {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error("No tenant found");
  return tenant.id;
}

export async function getPropertyDefinitions(objectType?: string) {
  const tenantId = await getTenantId();
  return prisma.propertyDefinition.findMany({
    where: {
      tenantId,
      ...(objectType ? { objectType } : {}),
    },
    orderBy: [{ objectType: "asc" }, { groupName: "asc" }, { orderIndex: "asc" }],
  });
}

export async function createPropertyDefinition(formData: FormData) {
  const tenantId = await getTenantId();

  const name = (formData.get("name") as string)?.trim();
  const label = (formData.get("label") as string)?.trim();
  const objectType = formData.get("objectType") as string;
  const fieldType = formData.get("fieldType") as string;

  if (!name || !label || !objectType || !fieldType) {
    return { error: "Name, label, object type, and field type are required" };
  }

  // Validate name is snake_case
  if (!/^[a-z][a-z0-9_]*$/.test(name)) {
    return { error: "Name must be snake_case (lowercase, underscores only)" };
  }

  // Check uniqueness
  const existing = await prisma.propertyDefinition.findUnique({
    where: { tenantId_objectType_name: { tenantId, objectType, name } },
  });
  if (existing) {
    return { error: `Property "${name}" already exists for ${objectType}` };
  }

  // Parse options for select/multiselect
  let options: { value: string; label: string }[] | undefined;
  if (fieldType === "select" || fieldType === "multiselect") {
    const optionsStr = formData.get("options") as string;
    if (optionsStr) {
      options = optionsStr
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [value, ...rest] = line.split("|");
          return { value: value.trim(), label: rest.length > 0 ? rest.join("|").trim() : value.trim() };
        });
    }
  }

  // Get max orderIndex for the group
  const maxOrder = await prisma.propertyDefinition.findFirst({
    where: { tenantId, objectType, groupName: (formData.get("groupName") as string) || "Custom Properties" },
    orderBy: { orderIndex: "desc" },
    select: { orderIndex: true },
  });

  await prisma.propertyDefinition.create({
    data: {
      tenantId,
      objectType,
      name,
      label,
      description: (formData.get("description") as string) || null,
      fieldType,
      options,
      isRequired: formData.get("isRequired") === "true",
      groupName: (formData.get("groupName") as string) || "Custom Properties",
      orderIndex: (maxOrder?.orderIndex ?? -1) + 1,
      defaultValue: (formData.get("defaultValue") as string) || null,
    },
  });

  revalidatePath("/settings/properties");
  return { success: true };
}

export async function updatePropertyDefinition(id: string, formData: FormData) {
  const prop = await prisma.propertyDefinition.findUnique({ where: { id } });
  if (!prop) return { error: "Property not found" };

  const label = (formData.get("label") as string)?.trim();
  if (!label) return { error: "Label is required" };

  let options: { value: string; label: string }[] | undefined;
  if (prop.fieldType === "select" || prop.fieldType === "multiselect") {
    const optionsStr = formData.get("options") as string;
    if (optionsStr !== null && optionsStr !== undefined) {
      options = optionsStr
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [value, ...rest] = line.split("|");
          return { value: value.trim(), label: rest.length > 0 ? rest.join("|").trim() : value.trim() };
        });
    }
  }

  await prisma.propertyDefinition.update({
    where: { id },
    data: {
      label,
      description: (formData.get("description") as string) || null,
      ...(options !== undefined ? { options } : {}),
      isRequired: formData.get("isRequired") === "true",
      groupName: (formData.get("groupName") as string) || prop.groupName,
      defaultValue: (formData.get("defaultValue") as string) || null,
    },
  });

  revalidatePath("/settings/properties");
  return { success: true };
}

export async function deletePropertyDefinition(id: string) {
  const prop = await prisma.propertyDefinition.findUnique({ where: { id } });
  if (!prop) return { error: "Property not found" };
  if (prop.isSystem) return { error: "Cannot delete system properties" };

  await prisma.propertyDefinition.delete({ where: { id } });
  revalidatePath("/settings/properties");
  return { success: true };
}

export async function updateEntityProperties(
  entityType: "contact" | "company" | "deal",
  entityId: string,
  propertyName: string,
  value: string | null
) {
  const model = entityType === "contact" ? prisma.contact : entityType === "company" ? prisma.company : prisma.deal;

  const entity = await (model as typeof prisma.contact).findUnique({
    where: { id: entityId },
    select: { properties: true },
  });
  if (!entity) return { error: "Entity not found" };

  const properties = (entity.properties as Record<string, unknown>) || {};
  if (value === null || value === "") {
    delete properties[propertyName];
  } else {
    properties[propertyName] = value;
  }

  await (model as typeof prisma.contact).update({
    where: { id: entityId },
    data: { properties: properties as Prisma.InputJsonValue },
  });

  revalidatePath(`/${entityType}s/${entityId}`);
  return { success: true };
}
