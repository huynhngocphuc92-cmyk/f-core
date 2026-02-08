import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import MeetingTypeForm from "@/components/meetings/MeetingTypeForm";

async function getMeetingType(id: string) {
  const meetingType = await prisma.meetingType.findUnique({
    where: { id, deletedAt: null },
    include: {
      availability: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
    },
  });
  return meetingType;
}

export default async function EditMeetingTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meetingType = await getMeetingType(id);

  if (!meetingType) {
    notFound();
  }

  return (
    <MeetingTypeForm
      userId={meetingType.userId}
      initialData={{
        id: meetingType.id,
        name: meetingType.name,
        slug: meetingType.slug,
        description: meetingType.description,
        duration: meetingType.duration,
        color: meetingType.color,
        bufferBefore: meetingType.bufferBefore,
        bufferAfter: meetingType.bufferAfter,
        minNotice: meetingType.minNotice,
        maxAdvance: meetingType.maxAdvance,
        locationType: meetingType.locationType,
        locationValue: meetingType.locationValue,
        availability: meetingType.availability.map((a) => ({
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
        })),
      }}
    />
  );
}
