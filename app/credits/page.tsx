"use client";

import { CreditsScreen } from "@/features/sales/components/credits-screen";
import { AppShell } from "@/features/shell/components/app-shell";

export default function CreditsPage() {
  return (
    <AppShell>
      <CreditsScreen />
    </AppShell>
  );
}
