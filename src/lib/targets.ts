// Works out how much of each supply a household should aim for.
//
// Plain math — no React, no database. The same function feeds the live card during
// onboarding and the target quantities on the checklist, so the two can't disagree.
//
// One gallon per person per day is ready.gov's rule. Seven days is Florida emergency
// management's hurricane guidance — ready.gov's own figure is a three-day minimum, so
// the two stay cited separately and never get blended into one claim.

export const PLANNING_DAYS = 7;

const GALLONS_PER_PERSON_PER_DAY = 1;
const GALLONS_PER_PET_PER_DAY = 0.5;
const MEALS_PER_PERSON_PER_DAY = 2;

export type SupplyTargets = {
  waterGallons: number;
  meals: number;
  flashlights: number;
};

export function computeTargets(adults: number, kids: number, pets: number): SupplyTargets {
  const people = adults + kids;

  const rawWater =
    people * GALLONS_PER_PERSON_PER_DAY * PLANNING_DAYS +
    pets * GALLONS_PER_PET_PER_DAY * PLANNING_DAYS;

  return {
    // Rounded up — you can't buy part of a gallon, and running short is the failure
    // this app exists to prevent.
    waterGallons: Math.ceil(rawWater),
    meals: people * MEALS_PER_PERSON_PER_DAY * PLANNING_DAYS,
    // A house rule, not a published one: one per adult plus a spare.
    flashlights: adults + 1,
  };
}
