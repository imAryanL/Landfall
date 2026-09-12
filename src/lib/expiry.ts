// How close a stored expiry date is, and the calm copy for it. Pure calendar math — no
// database, no notifications.

// JS can't subtract two dates into days, so the gap goes through milliseconds.
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Negative once the date has passed. Takes today as an argument (like seasonPercent) so
// it's checkable against a fixed day. Rounded: the two dates rarely share a time of day.
export function daysUntil(expiresAt: string, today: Date): number {
  const expiry = new Date(expiresAt);
  return Math.round((expiry.getTime() - today.getTime()) / MS_PER_DAY);
}

// The amber threshold — also when the 30-day reminder fires, so the color on screen and
// the notification already sent always agree with each other.
export function isExpiringSoon(daysLeft: number): boolean {
  return daysLeft <= 30;
}

// Calm and specific, never a bare number and never "urgent" — same voice as the rest of
// the app's warning copy.
export function expiryLabel(daysLeft: number): string {
  if (daysLeft > 1) {
    return `Expires in ${daysLeft} days`;
  }
  if (daysLeft === 1) {
    return 'Expires tomorrow';
  }
  if (daysLeft === 0) {
    return 'Expires today';
  }
  if (daysLeft === -1) {
    return 'Expired yesterday';
  }
  return `Expired ${-daysLeft} days ago`;
}
