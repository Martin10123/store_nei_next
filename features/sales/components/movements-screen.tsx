"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { api, errorMessage } from "@/lib/api";
import { queryKeys, useStoreQuery } from "@/lib/queries";
import { useSession } from "@/lib/use-session";
import type { Product } from "@/lib/session";

type Movement = {
  id: number;
  movement_type: "in" | "out" | "waste" | "adjustment";
  quantity: string;
  reason: string | null;
  created_at: string;
  product: { id: number; name: string } | null;
};

const labels: Record<Movement["movement_type"], string> = {
  in: "Entrada",
  out: "Salida",
  waste: "Merma",
  adjustment: "Ajuste",
};

export function MovementsScreen() {
  const session = useSession();
  const queryClient = useQueryClient();
  const productsQuery = useStoreQuery<Product[]>(queryKeys.products, "/products");
  const movementsQuery = useStoreQuery<Movement[]>(queryKeys.movements, "/inventory-movements");
  const products = productsQuery.data ?? [];
  const movements = movementsQuery.data ?? [];
  const [productId, setProductId] = useState("");
  const [movementType, setMovementType] = useState<Movement["movement_type"]>("in");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const selectedProduct = productId || (products[0] ? String(products[0].id) : "");

  async function registerMovement(event: FormEvent) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const movement = await api<Movement>(
        "/inventory-movements",
        {
          method: "POST",
          body: JSON.stringify({
            product_id: Number(selectedProduct),
            movement_type: movementType,
            quantity: Number(quantity),
            reason: reason || null,
          }),
        },
        session.token,
      );
      queryClient.setQueryData<Movement[]>(queryKeys.movements, (previous = []) => [movement, ...previous]);
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      setQuantity("");
      setReason("");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Movimientos</h2>
        <p className="text-sm text-muted-foreground">Entradas, salidas, mermas y conteos.</p>
      </div>
      <form className="grid gap-4 rounded-2xl border border-border bg-card shadow-sm p-4 sm:grid-cols-2" onSubmit={registerMovement}>
        <SelectField
          label="Producto"
          required
          value={selectedProduct}
          onValueChange={setProductId}
          options={products.map((product) => ({ value: String(product.id), label: product.name }))}
        />
        <SelectField
          label="Tipo"
          value={movementType}
          onValueChange={(value) => setMovementType(value as Movement["movement_type"])}
          options={Object.entries(labels).map(([value, label]) => ({ value, label }))}
        />
        <Field
          label={movementType === "adjustment" ? "Stock contado" : "Cantidad"}
          type="number"
          min="0"
          step="0.001"
          required
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
        />
        <Field label="Motivo" value={reason} onChange={(event) => setReason(event.target.value)} />
        {productsQuery.error || movementsQuery.error || error ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2">
            {error ?? errorMessage(productsQuery.error ?? movementsQuery.error)}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="h-11 sm:col-span-2" disabled={pending || !selectedProduct}>
          {pending ? "Guardando…" : "Registrar movimiento"}
        </Button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="bg-secondary text-left text-secondary-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Cantidad</th>
              <th className="px-4 py-3 font-medium">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-muted-foreground" colSpan={4}>
                  Todavía no hay movimientos.
                </td>
              </tr>
            ) : (
              movements.map((movement) => (
                <tr key={movement.id} className="border-t border-border">
                  <td className="px-4 py-3">{movement.product?.name}</td>
                  <td className="px-4 py-3">{labels[movement.movement_type]}</td>
                  <td className="px-4 py-3">{Number(movement.quantity)}</td>
                  <td className="px-4 py-3">{movement.reason}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
