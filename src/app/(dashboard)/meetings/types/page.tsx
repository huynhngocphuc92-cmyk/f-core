import Link from "next/link";
import { ArrowLeft, Clock, MapPin, Users } from "lucide-react";
import { getMeetingTypes } from "@/app/actions/meetings";
import {
  CreateMeetingTypeButton,
  MeetingTypeActions,
} from "./MeetingTypeActions";

export const dynamic = "force-dynamic";

export default async function MeetingTypesPage() {
  const types = await getMeetingTypes();

  return (
    <div className="p-6 pt-8">
      <Link
        href="/meetings"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0891b2] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Meetings
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meeting Types</h1>
          <p className="text-gray-600 mt-1">
            Configure the types of meetings you offer
          </p>
        </div>
        <CreateMeetingTypeButton />
      </div>

      {types.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-12">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No meeting types yet</p>
          <CreateMeetingTypeButton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map((type) => (
            <div
              key={type.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-[#0891b2]/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: type.color }}
                  />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {type.name}
                    </h3>
                  </div>
                </div>
                <MeetingTypeActions id={type.id} name={type.name} />
              </div>

              {type.description && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                  {type.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-400 pt-3 border-t border-gray-100">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {type.duration} min
                </span>
                {type.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {type.location}
                  </span>
                )}
                {type.owner && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {type.owner.name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
