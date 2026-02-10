import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUserAvailability } from "@/app/actions/meetings";
import AvailabilityEditor from "./AvailabilityEditor";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const availability = await getUserAvailability();

  return (
    <div className="p-6 pt-8">
      <Link
        href="/meetings"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0891b2] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Meetings
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Availability Settings
        </h1>
        <p className="text-gray-600 mt-1">
          Set your available hours for booking meetings
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl">
        <AvailabilityEditor
          initial={availability.map((a) => ({
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime: a.endTime,
          }))}
        />
      </div>
    </div>
  );
}
