"use client";

import { DailyCloseScreen } from "@/features/sales/components/daily-close-screen";
import { AppShell } from "@/features/shell/components/app-shell";

export default function DailyClosePage() {
  return (
    <AppShell>
      <DailyCloseScreen />
    </AppShell>
  );
}
