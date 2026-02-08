import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import BookingPage from "@/components/meetings/BookingPage";

async function getMeetingType(userId: string, slug: string) {
  const meetingType = await prisma.meetingType.findUnique({
    where: { userId_slug: { userId, slug } },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      duration: true,
      color: true,
      locationType: true,
      minNotice: true,
      maxAdvance: true,
      customFields: true,
      isActive: true,
      deletedAt: true,
      user: { select: { id: true, name: true, avatarUrl: true } },
      availability: {
        where: { isActive: true },
        select: { dayOfWeek: true, startTime: true, endTime: true, timezone: true },
        orderBy: { dayOfWeek: "asc" },
      },
    },
  });

  if (!meetingType || meetingType.deletedAt || !meetingType.isActive) {
    return null;
  }

  return meetingType;
}

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ userId: string; slug: string }>;
}) {
  const { userId, slug } = await params;
  const meetingType = await getMeetingType(userId, slug);

  if (!meetingType) {
    notFound();
  }

  return (
    <BookingPage
      meetingType={{
        id: meetingType.id,
        name: meetingType.name,
        slug: meetingType.slug,
        description: meetingType.description,
        duration: meetingType.duration,
        color: meetingType.color,
        locationType: meetingType.locationType,
        minNotice: meetingType.minNotice,
        maxAdvance: meetingType.maxAdvance,
        user: meetingType.user,
        availability: meetingType.availability,
      }}
      userId={userId}
    />
  );
}
