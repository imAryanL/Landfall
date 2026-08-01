// Layout for the four main tabs. The folder name is in parentheses, which tells Expo
// Router to group these files without adding anything to the address — so the screens
// inside still live at /, /checklist, /inventory and /alerts, exactly as before.
//
// This exists so the tabs can sit inside a stack. Onboarding needs to open as a full
// screen with no tab bar, and that is only possible when the tabs are one branch of a
// stack rather than the root of the whole app.

import AppTabs from '@/components/app-tabs';

export default function TabsLayout() {
  return <AppTabs />;
}
