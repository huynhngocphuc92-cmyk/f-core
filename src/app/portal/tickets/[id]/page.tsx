import PortalTicketDetailClient from "./PortalTicketDetailClient";

export default async function PortalTicketDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const [{ id }, search] = await Promise.all([params, searchParams]);
  return <PortalTicketDetailClient id={id} token={search.token || ""} />;
}
