"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { api, errorMessage } from "@/lib/api";
import { money } from "@/lib/money";
import { queryKeys, useStoreQuery } from "@/lib/queries";
import { useSession } from "@/lib/use-session";

type Preview = {
  closed_on: string;
  total_sold: string;
  total_cost: string;
  total_credit: string;
  top_product_id: number | null;
  already_closed: boolean;
};

type DailyClose = {
  id: number;
  closed_on: string;
  total_sold: string;
  total_cost: string;
  total_credit: string;
  top_product: { id: number; name: string } | null;
};

function todayInBogota() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

export function DailyCloseScreen() {
  const session = useSession();
  const queryClient = useQueryClient();
  const [closedOn, setClosedOn] = useState(todayInBogota);
  const closesQuery = useStoreQuery<DailyClose[]>(queryKeys.closes, "/daily-closes");
  const previewQuery = useStoreQuery<Preview>(["daily-close-preview", closedOn], `/daily-closes/preview?closed_on=${closedOn}`, Boolean(closedOn));
  const closes = closesQuery.data ?? [];
  const preview = previewQuery.data ?? null;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function closeDay() {
    if (!session) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const close = await api<DailyClose>(
        "/daily-closes",
        { method: "POST", body: JSON.stringify({ closed_on: closedOn }) },
        session.token,
      );
      queryClient.setQueryData<DailyClose[]>(queryKeys.closes, (previous = []) => [
        close,
        ...previous.filter((item) => item.closed_on.slice(0, 10) !== close.closed_on.slice(0, 10)),
      ]);
      queryClient.setQueryData<Preview>(["daily-close-preview", closedOn], (current) => (current ? { ...current, already_closed: true } : current));
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  const margin = preview ? Number(preview.total_sold) - Number(preview.total_cost) : 0;

  return (
    <>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Cierre del día</h2>
        <p className="text-sm text-muted-foreground">Ventas, costo y fiado de la jornada.</p>
      </div>
      <div className="grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:max-w-sm">
        <DateField label="Fecha" value={closedOn} onChange={setClosedOn} />
      </div>
      {preview ? (
        <dl className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-primary/20 bg-secondary p-4">
            <dt className="text-sm text-secondary-foreground/80">Vendido</dt>
            <dd className="mt-1 text-xl font-semibold text-primary">{money.format(Number(preview.total_sold))}</dd>
          </div>
          <div className="rounded-2xl border border-accent/50 bg-accent/40 p-4">
            <dt className="text-sm text-accent-foreground/80">Costo</dt>
            <dd className="mt-1 text-xl font-semibold">{money.format(Number(preview.total_cost))}</dd>
          </div>
          <div className="rounded-2xl border border-chart-3/30 bg-chart-3/15 p-4">
            <dt className="text-sm text-muted-foreground">Fiado</dt>
            <dd className="mt-1 text-xl font-semibold">{money.format(Number(preview.total_credit))}</dd>
          </div>
          <div className="rounded-2xl border border-chart-4/30 bg-chart-4/15 p-4">
            <dt className="text-sm text-muted-foreground">Margen</dt>
            <dd className="mt-1 text-xl font-semibold">{money.format(margin)}</dd>
          </div>
        </dl>
      ) : null}
      {error || previewQuery.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error ?? errorMessage(previewQuery.error)}</p>
      ) : null}
      <Button type="button" size="lg" className="h-11 w-fit" disabled={pending || preview?.already_closed} onClick={closeDay}>
        {preview?.already_closed ? "Ese día ya está cerrado" : pending ? "Cerrando…" : "Cerrar día"}
      </Button>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="bg-secondary text-left text-secondary-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Vendido</th>
              <th className="px-4 py-3 font-medium">Fiado</th>
              <th className="px-4 py-3 font-medium">Más vendido</th>
            </tr>
          </thead>
          <tbody>
            {closes.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-muted-foreground" colSpan={4}>
                  Todavía no hay cierres.
                </td>
              </tr>
            ) : (
              closes.map((close) => (
                <tr key={close.id} className="border-t border-border">
                  <td className="px-4 py-3">{String(close.closed_on).slice(0, 10)}</td>
                  <td className="px-4 py-3">{money.format(Number(close.total_sold))}</td>
                  <td className="px-4 py-3">{money.format(Number(close.total_credit))}</td>
                  <td className="px-4 py-3">{close.top_product?.name ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
