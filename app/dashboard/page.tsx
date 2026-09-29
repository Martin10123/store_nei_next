"use client";

import { DashboardScreen } from "@/features/dashboard/components/dashboard-screen";
import { AppShell } from "@/features/shell/components/app-shell";

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardScreen />
    </AppShell>
  );
}
