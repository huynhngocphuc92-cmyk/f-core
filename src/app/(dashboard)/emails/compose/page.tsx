import { getEmailTemplates } from "@/app/actions/emails";
import ComposeClient from "./ComposeClient";

export const dynamic = "force-dynamic";

export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string; contactId?: string }>;
}) {
  const { to, contactId } = await searchParams;
  const templates = await getEmailTemplates();

  return (
    <ComposeClient
      templates={templates.map((t) => ({
        id: t.id,
        name: t.name,
        subject: t.subject,
        body: t.body,
        category: t.category,
      }))}
      prefillTo={to}
      prefillContactId={contactId}
    />
  );
}
