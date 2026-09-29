"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api";
import { money } from "@/lib/money";
import { queryKeys, useStoreQuery } from "@/lib/queries";
import { useSession } from "@/lib/use-session";

type AlertItem = {
  id: number;
  alert_type: "low_stock" | "expiration" | "overdue_credit";
  message: string;
  is_resolved: boolean;
};

type DailyClose = {
  id: number;
  closed_on: string;
  total_sold: string;
  ai_summary: string | null;
  top_product: { id: number; name: string } | null;
};

type Dashboard = {
  today: string;
  today_sales_total: string;
  low_stock_count: number;
  open_alerts: AlertItem[];
  recent_closes: DailyClose[];
};

const alertLabels = {
  low_stock: "Stock bajo",
  expiration: "Vencimiento",
  overdue_credit: "Fiado vencido",
};

export function DashboardScreen() {
  const session = useSession();
  const queryClient = useQueryClient();
  const dashboardQuery = useStoreQuery<Dashboard>(queryKeys.dashboard, "/dashboard");
  const dashboard = dashboardQuery.data;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const closes = dashboard?.recent_closes ?? [];
  const peak = Math.max(...closes.map((close) => Number(close.total_sold)), 1);

  async function refreshAlerts() {
    if (!session) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const openAlerts = await api<AlertItem[]>("/alerts/refresh", { method: "POST" }, session.token);
      queryClient.setQueryData<Dashboard>(queryKeys.dashboard, (current) =>
        current ? { ...current, open_alerts: openAlerts } : current,
      );
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  async function resolveAlert(alert: AlertItem) {
    if (!session) {
      return;
    }

    setError(null);

    try {
      await api(`/alerts/${alert.id}`, { method: "PATCH" }, session.token);
      queryClient.setQueryData<Dashboard>(queryKeys.dashboard, (current) =>
        current ? { ...current, open_alerts: current.open_alerts.filter((item) => item.id !== alert.id) } : current,
      );
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Hoy en la tienda</h2>
          <p className="text-sm text-muted-foreground">Ventas, stock corto y lo que conviene mirar antes de cerrar.</p>
        </div>
        <Button type="button" variant="secondary" onClick={refreshAlerts} disabled={pending}>
          {pending ? "Revisando…" : "Revisar alertas"}
        </Button>
      </div>
      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-primary/20 bg-secondary p-4">
          <dt className="text-sm text-secondary-foreground/80">Ventas de hoy</dt>
          <dd className="mt-1 text-2xl font-semibold text-primary">{money.format(Number(dashboard?.today_sales_total ?? 0))}</dd>
        </div>
        <div className="rounded-2xl border border-accent/50 bg-accent/40 p-4">
          <dt className="text-sm text-accent-foreground/80">Stock en mínimo</dt>
          <dd className="mt-1 text-2xl font-semibold">{dashboard?.low_stock_count ?? 0}</dd>
        </div>
        <div className="rounded-2xl border border-chart-3/30 bg-chart-3/15 p-4">
          <dt className="text-sm text-muted-foreground">Alertas abiertas</dt>
          <dd className="mt-1 text-2xl font-semibold">{dashboard?.open_alerts.length ?? 0}</dd>
        </div>
      </dl>
      {error || dashboardQuery.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error ?? errorMessage(dashboardQuery.error)}</p>
      ) : null}
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h3 className="font-semibold">Alertas</h3>
        {dashboardQuery.isPending ? <p className="mt-3 text-sm text-muted-foreground">Cargando la tienda…</p> : null}
        {!dashboardQuery.isPending && (dashboard?.open_alerts.length ?? 0) === 0 ? (
          <p className="mt-3 rounded-xl bg-secondary px-3 py-4 text-sm text-secondary-foreground">
            No hay alertas abiertas. Revisa el inventario si cambió el stock, un vencimiento o un fiado.
          </p>
        ) : null}
        <ul className="mt-3 flex flex-col gap-2">
          {(dashboard?.open_alerts ?? []).map((alert) => (
            <li key={alert.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-3">
              <div>
                <p className="text-xs font-semibold tracking-wide text-primary uppercase">{alertLabels[alert.alert_type]}</p>
                <p className="mt-1 text-sm">{alert.message}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => resolveAlert(alert)}>
                Resolver
              </Button>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h3 className="font-semibold">Cierres recientes</h3>
        {closes.length === 0 ? (
          <p className="mt-3 rounded-xl bg-accent/30 px-3 py-4 text-sm text-accent-foreground">Todavía no hay cierres. El primero va a aparecer aquí como una barra.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {closes.map((close) => {
              const width = Math.max(8, Math.round((Number(close.total_sold) / peak) * 100));
              return (
                <li key={close.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{String(close.closed_on).slice(0, 10)}</span>
                    <span className="font-medium text-primary">{money.format(Number(close.total_sold))}</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted">
                    <div className="h-3 rounded-full bg-primary" style={{ width: `${width}%` }} />
                  </div>
                  {close.ai_summary ? <p className="mt-1 text-xs text-muted-foreground">{close.ai_summary}</p> : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
