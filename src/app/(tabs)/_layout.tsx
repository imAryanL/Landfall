// Layout for the four main tabs. The folder name is in parentheses, which tells Expo
// Router to group these files without adding anything to the address — so the screens
// inside still live at /, /checklist, /inventory and /alerts, exactly as before.
//
// This exists so the tabs can sit inside a stack. Onboarding needs to open as a full
// screen with no tab bar, and that is only possible when the tabs are one branch of a
// stack rather than the root of the whole app.
//
// It is also the first-launch gate: the tabs are what the app opens on, so this is where
// a user who has never been through onboarding gets turned around.

import { Redirect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import AppTabs from '@/components/app-tabs';
import { hasHousehold } from '@/db/household';

// Three answers, not a boolean. 'checking' has to be its own state because the database
// reply arrives a moment later, and guessing either way in the meantime shows somebody a
// screen they should never have seen.
type GateStatus = 'checking' | 'onboarding' | 'ready';

export default function TabsLayout() {
  const db = useSQLiteContext();
  const [status, setStatus] = useState<GateStatus>('checking');

  useEffect(() => {
    async function check() {
      const exists = await hasHousehold(db);
      setStatus(exists ? 'ready' : 'onboarding');
    }

    check();
  }, [db]);

  // The splash overlay is usually still up while this runs, so it is not a blank flash in
  // practice — but it has to be right on its own, since the splash leaves on a timer that
  // knows nothing about the database.
  if (status === 'checking') {
    return null;
  }

  // replace, not push, is handled by Redirect itself — the tabs never entered the history,
  // so there is nothing for a back gesture to return to.
  if (status === 'onboarding') {
    return <Redirect href="/onboarding/welcome" />;
  }

  return <AppTabs />;
}
