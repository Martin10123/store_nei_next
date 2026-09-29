"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bike, CalendarDays, LayoutDashboard, MessageCircle, Package, ShoppingBag, Store, Truck, Wallet, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { api } from "@/lib/api";
import { queryKeys, useStoreQuery } from "@/lib/queries";
import { clearSession, readSession, type Session } from "@/lib/session";

const links = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/products", label: "Inventario", icon: Package },
  { href: "/movements", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/sales", label: "Ventas", icon: ShoppingBag },
  { href: "/credits", label: "Fiados", icon: Wallet },
  { href: "/daily-close", label: "Cierre", icon: CalendarDays },
  { href: "/suppliers", label: "Proveedores", icon: Truck },
  { href: "/orders", label: "Pedidos", icon: Bike },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/branches", label: "Sucursales", icon: Store },
];

type Branch = {
  id: number;
  name: string;
  is_active: boolean;
};

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [branchId, setBranchId] = useState("");
  const branchesQuery = useStoreQuery<Branch[]>(queryKeys.branches, "/branches");
  const branches = (branchesQuery.data ?? []).filter((branch) => branch.is_active);

  useEffect(() => {
    const current = readSession();
    if (!current) {
      router.replace("/");
      return;
    }

    setSession(current);
    setBranchId(window.localStorage.getItem("tenderos.branch") ?? "");
  }, [router]);

  function chooseBranch(value: string) {
    const next = value === "all" ? "" : value;
    setBranchId(next);
    if (next) {
      window.localStorage.setItem("tenderos.branch", next);
      return;
    }

    window.localStorage.removeItem("tenderos.branch");
  }

  function signOut() {
    if (session) {
      void api("/logout", { method: "POST" }, session.token).catch(() => undefined);
    }
    clearSession();
    queryClient.clear();
    router.replace("/");
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-svh bg-background">
      <aside className="hidden w-56 shrink-0 flex-col bg-sidebar px-3 py-5 text-sidebar-foreground md:flex">
        <p className="px-3 text-xs font-semibold tracking-[0.16em] text-sidebar-primary uppercase">Tenderos</p>
        <nav className="mt-6 flex flex-col gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${active ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground" : "hover:bg-sidebar-accent"}`}
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{session.business.name}</p>
            <p className="truncate text-xs text-muted-foreground">{session.user.full_name}</p>
          </div>
          {branches.length > 0 ? (
            <div className="hidden w-52 shrink-0 sm:block">
              <SelectField
                label="Sucursal"
                value={branchId || "all"}
                onValueChange={chooseBranch}
                options={[
                  { value: "all", label: "Toda la tienda" },
                  ...branches.map((branch) => ({ value: String(branch.id), label: branch.name })),
                ]}
              />
            </div>
          ) : null}
          <Button type="button" variant="outline" onClick={signOut}>
            Salir
          </Button>
        </header>
        <nav className="flex gap-2 overflow-x-auto border-b border-border bg-card px-4 py-2 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={false}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${pathname === link.href ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex-1 px-4 py-6">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
