"use client";

import { SalesScreen } from "@/features/sales/components/sales-screen";
import { AppShell } from "@/features/shell/components/app-shell";

export default function SalesPage() {
  return (
    <AppShell>
      <SalesScreen />
    </AppShell>
  );
}
