"use client";

import { MovementsScreen } from "@/features/sales/components/movements-screen";
import { AppShell } from "@/features/shell/components/app-shell";

export default function MovementsPage() {
  return (
    <AppShell>
      <MovementsScreen />
    </AppShell>
  );
}
