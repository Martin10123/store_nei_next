"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api";
import { queryKeys, useStoreQuery } from "@/lib/queries";
import { useSession } from "@/lib/use-session";

type Branch = {
  id: number;
  name: string;
  is_active: boolean;
};

export function BranchesScreen() {
  const session = useSession();
  const queryClient = useQueryClient();
  const branchesQuery = useStoreQuery<Branch[]>(queryKeys.branches, "/branches");
  const branches = branchesQuery.data ?? [];
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function createBranch(event: FormEvent) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const branch = await api<Branch>("/branches", { method: "POST", body: JSON.stringify({ name }) }, session.token);
      queryClient.setQueryData<Branch[]>(queryKeys.branches, (previous = []) =>
        [...previous, branch].sort((a, b) => a.name.localeCompare(b.name, "es")),
      );
      setName("");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  async function toggle(branch: Branch) {
    if (!session) {
      return;
    }

    setError(null);

    try {
      const updated = await api<Branch>(
        `/branches/${branch.id}`,
        { method: "PATCH", body: JSON.stringify({ is_active: !branch.is_active }) },
        session.token,
      );
      queryClient.setQueryData<Branch[]>(queryKeys.branches, (previous = []) =>
        previous.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  return (
    <>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Sucursales</h2>
        <p className="text-sm text-muted-foreground">
          Elige una sucursal activa en la barra de arriba. El inventario, las ventas y los fiados siguen siendo de toda la tienda.
        </p>
      </div>
      <form className="grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:grid-cols-[1fr_auto] sm:items-end" onSubmit={createBranch}>
        <Field label="Nombre" required value={name} onChange={(event) => setName(event.target.value)} />
        <Button type="submit" className="h-11" disabled={pending}>
          Agregar sucursal
        </Button>
      </form>
      {error || branchesQuery.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error ?? errorMessage(branchesQuery.error)}</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {branches.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-accent bg-accent/25 px-4 py-8 text-sm text-accent-foreground sm:col-span-2">
            Esta tienda todavía no tiene sucursales. La primera puede ser el punto principal.
          </p>
        ) : null}
        {branches.map((branch) => (
          <article key={branch.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div>
              <p className="font-semibold">{branch.name}</p>
              <p className={`text-sm ${branch.is_active ? "text-primary" : "text-muted-foreground"}`}>{branch.is_active ? "Activa" : "Inactiva"}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => toggle(branch)}>
              {branch.is_active ? "Desactivar" : "Activar"}
            </Button>
          </article>
        ))}
      </div>
    </>
  );
}
