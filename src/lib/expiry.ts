// How close a supply's replace-by date is, and the words for it. Pure date math.
// The column is still expires_at; the user-facing word is "replace", per ready.gov.

// JS can't subtract two dates into days, so the gap goes through milliseconds.
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Negative once the date has passed. Rounded, since the two dates rarely share a time of day.
export function daysUntil(expiresAt: string, today: Date): number {
  const expiry = new Date(expiresAt);
  return Math.round((expiry.getTime() - today.getTime()) / MS_PER_DAY);
}

// Also when the 30-day reminder fires, so the amber on screen matches the notification.
export function isExpiringSoon(daysLeft: number): boolean {
  return daysLeft <= 30;
}

export function expiryLabel(daysLeft: number): string {
  if (daysLeft > 1) {
    return `Replace in ${daysLeft} days`;
  }
  if (daysLeft === 1) {
    return 'Replace tomorrow';
  }
  if (daysLeft === 0) {
    return 'Replace today';
  }
  if (daysLeft === -1) {
    return 'Was due yesterday';
  }
  return `Was due ${-daysLeft} days ago`;
}
