import { notFound } from "next/navigation";
import { getBookingPageData } from "@/app/actions/meetings";
import BookingClient from "./BookingClient";

export const dynamic = "force-dynamic";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getBookingPageData(slug);

  if (!data) notFound();

  return (
    <BookingClient
      data={{
        slug: data.slug,
        meetingType: {
          name: data.meetingType.name,
          duration: data.meetingType.duration,
          color: data.meetingType.color,
          description: data.meetingType.description,
          location: data.meetingType.location,
        },
        user: {
          name: data.user.name,
          email: data.user.email,
          avatarUrl: data.user.avatarUrl,
          availability: data.user.availability.map((a) => ({
            dayOfWeek: a.dayOfWeek,
          })),
        },
        customMessage: data.customMessage,
      }}
    />
  );
}
