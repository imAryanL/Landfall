// Layout for the four main tabs, and the first-launch gate.
// The tabs sit inside a stack so onboarding can open full-screen with no tab bar.

import { Redirect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import AppTabs from '@/components/app-tabs';
import { hasHousehold } from '@/db/household';

// Three answers, not a boolean — guessing while the database replies flashes the wrong screen.
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

  // The splash usually covers this frame, but it leaves on a timer that knows nothing
  // about the database, so this has to be correct on its own.
  if (status === 'checking') {
    return null;
  }

  if (status === 'onboarding') {
    return <Redirect href="/onboarding/welcome" />;
  }

  return <AppTabs />;
}
