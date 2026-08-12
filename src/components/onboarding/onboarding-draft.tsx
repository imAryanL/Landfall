// Holds the onboarding answers in memory while the user moves between screens. Nothing
// here touches the database — screen 6 reads this and writes the household row in one go.

import { createContext, useContext, useState, type ReactNode } from 'react';

import type { PointData } from '@/lib/nws';

export type OnboardingDraft = {
  // Screen 2 — household
  name: string;
  adults: number;
  kids: number;
  pets: number;
  concerns: string[];

  // Screen 3 — home & location
  zip: string;
  homeType: string | null;
  point: PointData | null;

  // Screen 4 — supplies
  owned: string[];
};

// One adult and nothing else — the smallest true household, and what screen 2's steppers
// already show. Starting at 2 would quietly ship a wrong number for anyone living alone
// who doesn't notice it.
const EMPTY_DRAFT: OnboardingDraft = {
  name: '',
  adults: 1,
  kids: 0,
  pets: 0,
  concerns: [],
  zip: '',
  homeType: null,
  point: null,
  owned: [],
};

// What every onboarding screen gets: the answers so far, and a way to change them.
type OnboardingDraftValue = {
  draft: OnboardingDraft;
  updateDraft: (changes: Partial<OnboardingDraft>) => void;
};

const OnboardingDraftContext = createContext<OnboardingDraftValue | null>(null);

export function OnboardingDraftProvider({ children }: { children: ReactNode }) {
  // The same useState the screens used, moved above them so they all share one copy.
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  // Takes only the fields that changed, so a screen never has to pass back answers it
  // didn't collect.
  function updateDraft(changes: Partial<OnboardingDraft>) {
    setDraft((current) => ({ ...current, ...changes }));
  }

  return (
    <OnboardingDraftContext.Provider value={{ draft, updateDraft }}>
      {children}
    </OnboardingDraftContext.Provider>
  );
}

export function useOnboardingDraft() {
  const value = useContext(OnboardingDraftContext);

  // Null means this screen rendered outside the provider, which would otherwise blow up
  // later on a line that looks unrelated.
  if (!value) {
    throw new Error('useOnboardingDraft must be used inside OnboardingDraftProvider');
  }

  return value;
}
