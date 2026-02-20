import PortalTicketsClient from "./PortalTicketsClient";

export default async function PortalTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return <PortalTicketsClient token={params.token || ""} />;
}
