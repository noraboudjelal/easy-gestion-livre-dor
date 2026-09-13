export function estimatedWait(count, minutesPerClient) {
  if (count == null || count === '' || minutesPerClient == null || minutesPerClient === '') return null;
  const people = Number(count), minutes = Number(minutesPerClient);
  if (!Number.isFinite(people) || people < 0 || !Number.isInteger(people) || !Number.isFinite(minutes) || minutes <= 0) return null;
  return Math.ceil(people * minutes);
}

export function hasActiveTicket(state) {
  return Number.isInteger(state?.ticket_number) && state.ticket_number > 0 && ['waiting', 'called'].includes(state.ticket_status);
}
