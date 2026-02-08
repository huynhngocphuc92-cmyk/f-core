import prisma from "@/lib/prisma";
import MeetingTypeForm from "@/components/meetings/MeetingTypeForm";

async function getDefaultUserId() {
  const user = await prisma.user.findFirst({
    where: { role: "admin" },
    select: { id: true },
  });
  return user?.id || "";
}

export default async function NewMeetingTypePage() {
  const userId = await getDefaultUserId();

  return <MeetingTypeForm userId={userId} />;
}
