export function formatTicketNumber(number) {
  return String(Math.max(0, Number(number) || 0)).padStart(3, "0");
}

