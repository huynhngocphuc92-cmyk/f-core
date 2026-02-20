import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SequenceCreateForm } from "./SequenceCreateForm";

export const dynamic = "force-dynamic";

export default function NewSequencePage() {
  return (
    <div className="p-6 pt-8">
      <Link
        href="/sequences"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sequences
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Sequence</h1>
        <p className="text-gray-600 mt-1">
          Build an automated email sequence to engage your contacts
        </p>
      </div>

      <SequenceCreateForm />
    </div>
  );
}
