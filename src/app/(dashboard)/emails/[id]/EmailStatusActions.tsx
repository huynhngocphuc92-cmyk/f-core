"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, MousePointerClick, AlertCircle } from "lucide-react";
import { updateEmailStatus } from "@/app/actions/emails";

const statuses = [
  { value: "delivered", label: "Delivered", icon: Eye, color: "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100" },
  { value: "opened", label: "Opened", icon: Eye, color: "text-green-600 bg-green-50 border-green-200 hover:bg-green-100" },
  { value: "clicked", label: "Clicked", icon: MousePointerClick, color: "text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100" },
  { value: "bounced", label: "Bounced", icon: AlertCircle, color: "text-red-600 bg-red-50 border-red-200 hover:bg-red-100" },
];

export default function EmailStatusActions({
  emailId,
  currentStatus,
}: {
  emailId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function simulate(status: string) {
    startTransition(async () => {
      await updateEmailStatus(emailId, status);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 mb-2">Simulate tracking events:</p>
      {statuses.map((s) => {
        const Icon = s.icon;
        const isActive = currentStatus === s.value;
        return (
          <button
            key={s.value}
            onClick={() => simulate(s.value)}
            disabled={isPending || isActive}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors disabled:opacity-50 ${
              isActive ? s.color + " font-medium" : "text-gray-600 bg-white border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {s.label}
            {isActive && <span className="ml-auto text-xs">(current)</span>}
          </button>
        );
      })}
    </div>
  );
}
