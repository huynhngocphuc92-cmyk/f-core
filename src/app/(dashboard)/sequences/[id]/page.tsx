import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Play,
  Pause,
  Users,
  CheckCircle2,
  Clock,
  BarChart3,
  Zap,
  User,
} from "lucide-react";
import { getSequence } from "@/app/actions/sequences";
import { SequenceDetailClient } from "./SequenceDetailClient";

export const dynamic = "force-dynamic";

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600" },
  active: { label: "Active", color: "bg-green-50 text-green-700" },
  paused: { label: "Paused", color: "bg-yellow-50 text-yellow-700" },
};

const enrollmentStatusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-blue-50 text-blue-600" },
  completed: { label: "Completed", color: "bg-green-50 text-green-700" },
  paused: { label: "Paused", color: "bg-yellow-50 text-yellow-700" },
  bounced: { label: "Bounced", color: "bg-red-50 text-red-600" },
  replied: { label: "Replied", color: "bg-purple-50 text-purple-700" },
  unsubscribed: { label: "Unsubscribed", color: "bg-gray-100 text-gray-600" },
};

export default async function SequenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sequence = await getSequence(id);

  if (!sequence) {
    notFound();
  }

  const st = statusConfig[sequence.status] || statusConfig.draft;
  const steps = Array.isArray(sequence.steps) ? sequence.steps : [];
  const replyRate = sequence.replyRate ? Number(sequence.replyRate) : 0;

  const serializedEnrollments = sequence.enrollments.map((e) => ({
    id: e.id,
    status: e.status,
    currentStep: e.currentStep,
    startedAt: e.startedAt.toISOString(),
    completedAt: e.completedAt?.toISOString() ?? null,
    lastStepAt: e.lastStepAt?.toISOString() ?? null,
    nextStepAt: e.nextStepAt?.toISOString() ?? null,
    contact: e.contact,
  }));

  return (
    <div className="p-6 pt-8">
      {/* Back Link */}
      <Link
        href="/sequences"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sequences
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{sequence.name}</h1>
            <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${st.color}`}>
              {st.label}
            </span>
          </div>
          {sequence.description && (
            <p className="text-gray-600 mt-1">{sequence.description}</p>
          )}
          {sequence.owner && (
            <p className="text-sm text-gray-500 mt-1">
              Owned by {sequence.owner.name || sequence.owner.email}
            </p>
          )}
        </div>
        <SequenceDetailClient
          sequenceId={id}
          status={sequence.status}
          name={sequence.name}
          description={sequence.description ?? ""}
          steps={steps as Record<string, unknown>[]}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{steps.length}</p>
              <p className="text-sm text-gray-500">Steps</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {sequence.enrolledCount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Enrolled</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {sequence.completedCount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{replyRate}%</p>
              <p className="text-sm text-gray-500">Reply Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Steps Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Sequence Steps ({steps.length})
            </h2>
          </div>
          {steps.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No steps added yet</p>
              <p className="text-xs text-gray-400">Edit the sequence to add email steps</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {steps.map((step, index) => {
                const s = step as Record<string, unknown>;
                const type = (s.type as string) || "email";
                const subject = (s.subject as string) || `Step ${index + 1}`;
                const delay = (s.delay as number) || 0;
                const delayUnit = (s.delayUnit as string) || "days";
                return (
                  <div key={index} className="px-5 py-4 flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-sm font-medium text-purple-700">
                        {index + 1}
                      </div>
                      {index < steps.length - 1 && (
                        <div className="w-px h-6 bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {type === "email" ? (
                          <Mail className="w-3.5 h-3.5 text-purple-500" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                        )}
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {subject}
                        </span>
                      </div>
                      {index > 0 && delay > 0 && (
                        <p className="text-xs text-gray-500">
                          Wait {delay} {delayUnit} after previous step
                        </p>
                      )}
                      {typeof s.body === "string" && s.body && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {s.body.substring(0, 120)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Enrollments */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Enrollments ({serializedEnrollments.length})
            </h2>
          </div>
          {serializedEnrollments.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No enrollments yet</p>
              <p className="text-xs text-gray-400">Enroll contacts to start the sequence</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {serializedEnrollments.map((enrollment) => {
                const es = enrollmentStatusConfig[enrollment.status] || enrollmentStatusConfig.active;
                return (
                  <div key={enrollment.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <Link
                          href={`/contacts/${enrollment.contact.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-[#0891b2]"
                        >
                          {[enrollment.contact.firstName, enrollment.contact.lastName]
                            .filter(Boolean)
                            .join(" ") || enrollment.contact.email}
                        </Link>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>Step {enrollment.currentStep + 1}/{steps.length || "?"}</span>
                          <span>
                            Started{" "}
                            {new Date(enrollment.startedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full ${es.color}`}>
                      {es.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
