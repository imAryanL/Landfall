// How far into hurricane season a date falls. Pure calendar math — no weather, no network.

// Atlantic hurricane season: Jun 1 through Nov 30.
const SEASON_START_MONTH = 5; // JS months are 0-based, so 5 is June
const SEASON_DAYS = 183; // Jun 30 + Jul 31 + Aug 31 + Sep 30 + Oct 31 + Nov 30

// JS can't subtract two dates into days, so the gap gets converted through milliseconds.
// Spelled out as 24h × 60m × 60s × 1000ms rather than 86400000 — easier to check by eye.
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// 0 before the season, 100 after it, and the percent elapsed in between.
// Takes the date instead of calling new Date() inside, so it can be checked against a fixed day.
export function seasonPercent(today: Date): number {
  // getFullYear, not a hardcoded year — this keeps working next season.
  const seasonStart = new Date(today.getFullYear(), SEASON_START_MONTH, 1);

  // getTime() is milliseconds since 1970, so subtracting gives the gap between the two dates.
  // Rounded: the dates carry different times of day, and November's DST day is 25 hours long.
  const daysIn = Math.round((today.getTime() - seasonStart.getTime()) / MS_PER_DAY);
  const percent = (daysIn / SEASON_DAYS) * 100;

  // Out of season this goes negative or past 100, and the bar can't draw either.
  if (percent < 0) {
    return 0;
  }
  if (percent > 100) {
    return 100;
  }
  return percent;
}
