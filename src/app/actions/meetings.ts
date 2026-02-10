"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

async function getTenantId(): Promise<string> {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error("No tenant found");
  return tenant.id;
}

async function getDefaultUserId(): Promise<string> {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found");
  return user.id;
}

// ============================================
// MEETING TYPES
// ============================================

export async function getMeetingTypes() {
  const tenantId = await getTenantId();
  return prisma.meetingType.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });
}

export async function getMeetingType(id: string) {
  const tenantId = await getTenantId();
  return prisma.meetingType.findFirst({
    where: { id, tenantId, deletedAt: null },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      meetingLinks: { where: { isActive: true } },
    },
  });
}

export async function createMeetingType(formData: FormData) {
  const tenantId = await getTenantId();
  const userId = await getDefaultUserId();

  const name = formData.get("name") as string;
  const duration = parseInt(formData.get("duration") as string, 10);
  const description = (formData.get("description") as string) || undefined;
  const location = (formData.get("location") as string) || undefined;
  const color = (formData.get("color") as string) || "#0891b2";

  if (!name || !duration) {
    return { error: "Name and duration are required" };
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Check uniqueness
  const existing = await prisma.meetingType.findFirst({
    where: { tenantId, slug, deletedAt: null },
  });

  const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

  await prisma.meetingType.create({
    data: {
      tenantId,
      name,
      slug: finalSlug,
      duration,
      description,
      location,
      color,
      ownerId: userId,
    },
  });

  revalidatePath("/meetings");
  return { success: true };
}

export async function deleteMeetingType(id: string) {
  const tenantId = await getTenantId();
  await prisma.meetingType.updateMany({
    where: { id, tenantId },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/meetings");
}

// ============================================
// MEETING LINKS
// ============================================

export async function getMeetingLinks() {
  const tenantId = await getTenantId();
  return prisma.meetingLink.findMany({
    where: { tenantId, isActive: true },
    include: {
      meetingType: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createMeetingLink(meetingTypeId: string) {
  const tenantId = await getTenantId();
  const userId = await getDefaultUserId();

  const meetingType = await prisma.meetingType.findFirst({
    where: { id: meetingTypeId, tenantId, deletedAt: null },
  });

  if (!meetingType) return { error: "Meeting type not found" };

  const slug = `${meetingType.slug}-${Date.now().toString(36)}`;

  const link = await prisma.meetingLink.create({
    data: {
      tenantId,
      slug,
      userId,
      meetingTypeId,
    },
  });

  revalidatePath("/meetings");
  return { success: true, slug: link.slug };
}

export async function deleteMeetingLink(id: string) {
  const tenantId = await getTenantId();
  await prisma.meetingLink.updateMany({
    where: { id, tenantId },
    data: { isActive: false },
  });
  revalidatePath("/meetings");
}

// ============================================
// USER AVAILABILITY
// ============================================

export async function getUserAvailability() {
  const userId = await getDefaultUserId();
  return prisma.userAvailability.findMany({
    where: { userId, isActive: true },
    orderBy: { dayOfWeek: "asc" },
  });
}

export async function saveAvailability(
  slots: { dayOfWeek: number; startTime: string; endTime: string }[]
) {
  const userId = await getDefaultUserId();

  // Delete existing and recreate
  await prisma.userAvailability.deleteMany({ where: { userId } });

  if (slots.length > 0) {
    await prisma.userAvailability.createMany({
      data: slots.map((s) => ({
        userId,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    });
  }

  revalidatePath("/meetings");
  return { success: true };
}

// ============================================
// PUBLIC BOOKING
// ============================================

export async function getBookingPageData(linkSlug: string) {
  const link = await prisma.meetingLink.findFirst({
    where: { slug: linkSlug, isActive: true },
    include: {
      meetingType: true,
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
        include: {
          availability: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
        },
      },
    },
  });

  if (!link) return null;
  return link;
}

export async function getAvailableSlots(linkSlug: string, dateStr: string) {
  const link = await prisma.meetingLink.findFirst({
    where: { slug: linkSlug, isActive: true },
    include: {
      meetingType: true,
      user: {
        include: {
          availability: { where: { isActive: true } },
        },
      },
    },
  });

  if (!link) return [];

  const date = new Date(dateStr);
  const dayOfWeek = date.getDay();

  const dayAvailability = link.user.availability.find(
    (a) => a.dayOfWeek === dayOfWeek
  );

  if (!dayAvailability) return [];

  // Generate time slots based on availability and duration
  const slots: string[] = [];
  const [startH, startM] = dayAvailability.startTime.split(":").map(Number);
  const [endH, endM] = dayAvailability.endTime.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const duration = link.meetingType.duration;
  const buffer = link.meetingType.bufferAfter;

  // Get existing meetings for this date to filter out conflicts
  const dayStart = new Date(dateStr);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dateStr);
  dayEnd.setHours(23, 59, 59, 999);

  const existingMeetings = await prisma.activity.findMany({
    where: {
      ownerId: link.userId,
      type: "meeting",
      meetingStart: { gte: dayStart, lte: dayEnd },
    },
    select: { meetingStart: true, meetingEnd: true },
  });

  for (let m = startMinutes; m + duration <= endMinutes; m += duration + buffer) {
    const slotH = Math.floor(m / 60);
    const slotM = m % 60;
    const timeStr = `${slotH.toString().padStart(2, "0")}:${slotM.toString().padStart(2, "0")}`;

    // Check conflicts
    const slotStart = new Date(dateStr);
    slotStart.setHours(slotH, slotM, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

    const hasConflict = existingMeetings.some((mt) => {
      if (!mt.meetingStart || !mt.meetingEnd) return false;
      return slotStart < mt.meetingEnd && slotEnd > mt.meetingStart;
    });

    if (!hasConflict) {
      slots.push(timeStr);
    }
  }

  return slots;
}

export async function bookMeeting(data: {
  linkSlug: string;
  date: string;
  time: string;
  guestName: string;
  guestEmail: string;
  notes?: string;
}) {
  const link = await prisma.meetingLink.findFirst({
    where: { slug: data.linkSlug, isActive: true },
    include: { meetingType: true },
  });

  if (!link) return { error: "Booking link not found" };

  const tenantId = link.tenantId;
  const [h, m] = data.time.split(":").map(Number);
  const meetingStart = new Date(data.date);
  meetingStart.setHours(h, m, 0, 0);
  const meetingEnd = new Date(
    meetingStart.getTime() + link.meetingType.duration * 60 * 1000
  );

  // Create activity for the meeting
  await prisma.activity.create({
    data: {
      tenantId,
      type: "meeting",
      subject: `${link.meetingType.name} with ${data.guestName}`,
      body: data.notes || undefined,
      ownerId: link.userId,
      meetingStart,
      meetingEnd,
      meetingLocation: link.meetingType.location,
      attendees: [data.guestEmail],
    },
  });

  return { success: true };
}

// ============================================
// MEETINGS LIST (from activities)
// ============================================

export async function getMeetings(search?: string) {
  const tenantId = await getTenantId();
  return prisma.activity.findMany({
    where: {
      tenantId,
      type: "meeting",
      ...(search
        ? {
            OR: [
              { subject: { contains: search, mode: "insensitive" as const } },
              { meetingLocation: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { meetingStart: "desc" },
    take: 50,
  });
}
