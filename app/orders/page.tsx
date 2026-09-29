"use client";

import { OrdersScreen } from "@/features/orders/components/orders-screen";
import { AppShell } from "@/features/shell/components/app-shell";

export default function OrdersPage() {
  return (
    <AppShell>
      <OrdersScreen />
    </AppShell>
  );
}
