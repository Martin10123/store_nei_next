"use client";

import { InventoryScreen } from "@/features/inventory/components/inventory-screen";
import { AppShell } from "@/features/shell/components/app-shell";

export default function ProductsPage() {
  return (
    <AppShell>
      <InventoryScreen />
    </AppShell>
  );
}
