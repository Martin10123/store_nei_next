"use client";

import { BranchesScreen } from "@/features/branches/components/branches-screen";
import { AppShell } from "@/features/shell/components/app-shell";

export default function BranchesPage() {
  return (
    <AppShell>
      <BranchesScreen />
    </AppShell>
  );
}
