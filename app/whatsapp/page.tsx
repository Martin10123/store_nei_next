"use client";

import { WhatsappScreen } from "@/features/whatsapp/components/whatsapp-screen";
import { AppShell } from "@/features/shell/components/app-shell";

export default function WhatsappPage() {
  return (
    <AppShell>
      <WhatsappScreen />
    </AppShell>
  );
}
