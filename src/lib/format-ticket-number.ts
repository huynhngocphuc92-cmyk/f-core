/**
 * Format a ticket number for display: 1 -> "T-0001"
 */
export function formatTicketNumber(ticketNumber: number): string {
  return `T-${String(ticketNumber).padStart(4, "0")}`;
}
