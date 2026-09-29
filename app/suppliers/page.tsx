"use client";

import { SuppliersScreen } from "@/features/suppliers/components/suppliers-screen";
import { AppShell } from "@/features/shell/components/app-shell";

export default function SuppliersPage() {
  return (
    <AppShell>
      <SuppliersScreen />
    </AppShell>
  );
}
