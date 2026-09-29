"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { SelectField } from "@/components/ui/select-field";
import { api, errorMessage } from "@/lib/api";
import { money } from "@/lib/money";
import { queryKeys, useStoreQuery } from "@/lib/queries";
import { useSession } from "@/lib/use-session";
import type { Product } from "@/lib/session";

type PaymentMethod = "cash" | "nequi" | "daviplata" | "credit" | "card";

type CreditCustomer = {
  id: number;
  full_name: string;
  is_active: boolean;
};

type Sale = {
  id: number;
  total: string;
  payment_method: PaymentMethod;
  credit_customer: { id: number; full_name: string } | null;
  lines: { id: number; quantity: string; product: { name: string } | null }[];
};

const paymentLabels: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  nequi: "Nequi",
  daviplata: "Daviplata",
  credit: "Fiado",
  card: "Tarjeta",
};

export function SalesScreen() {
  const session = useSession();
  const queryClient = useQueryClient();
  const productsQuery = useStoreQuery<Product[]>(queryKeys.products, "/products");
  const customersQuery = useStoreQuery<CreditCustomer[]>(queryKeys.customers, "/credit-customers");
  const salesQuery = useStoreQuery<Sale[]>(queryKeys.sales, "/sales");
  const products = productsQuery.data ?? [];
  const customers = (customersQuery.data ?? []).filter((customer) => customer.is_active);
  const sales = salesQuery.data ?? [];
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [lines, setLines] = useState<{ product_id: number; name: string; quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [customerId, setCustomerId] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const selectedProduct = productId || (products[0] ? String(products[0].id) : "");

  function addLine() {
    const product = products.find((item) => item.id === Number(selectedProduct));
    const amount = Number(quantity);
    if (!product || amount <= 0) {
      return;
    }

    setLines((previous) => {
      const existing = previous.find((line) => line.product_id === product.id);
      if (existing) {
        return previous.map((line) => (line.product_id === product.id ? { ...line, quantity: line.quantity + amount } : line));
      }

      return [...previous, { product_id: product.id, name: product.name, quantity: amount }];
    });
  }

  async function registerSale(event: FormEvent) {
    event.preventDefault();
    if (!session || lines.length === 0) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const sale = await api<Sale>(
        "/sales",
        {
          method: "POST",
          body: JSON.stringify({
            payment_method: paymentMethod,
            credit_customer_id: paymentMethod === "credit" ? Number(customerId) : null,
            due_on: paymentMethod === "credit" && dueOn ? dueOn : null,
            lines: lines.map((line) => ({ product_id: line.product_id, quantity: line.quantity })),
          }),
        },
        session.token,
      );
      queryClient.setQueryData<Sale[]>(queryKeys.sales, (previous = []) => [sale, ...previous]);
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
      queryClient.invalidateQueries({ queryKey: ["daily-close-preview"] });
      setLines([]);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Ventas</h2>
        <p className="text-sm text-muted-foreground">Registra la venta y el stock baja solo.</p>
      </div>
      <form className="grid gap-4 rounded-2xl border border-border bg-card shadow-sm p-4" onSubmit={registerSale}>
        <div className="grid gap-4 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
          <SelectField
            label="Producto"
            value={selectedProduct}
            onValueChange={setProductId}
            options={products.map((product) => ({ value: String(product.id), label: product.name }))}
          />
          <Field label="Cantidad" type="number" min="0.001" step="0.001" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          <Button type="button" variant="outline" className="h-11" onClick={addLine}>
            Agregar
          </Button>
        </div>
        <ul className="flex flex-col gap-2 text-sm">
          {lines.length === 0 ? <li className="text-muted-foreground">La venta todavía no tiene productos.</li> : null}
          {lines.map((line) => (
            <li key={line.product_id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
              <span>
                {line.name} · {line.quantity}
              </span>
              <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setLines((previous) => previous.filter((item) => item.product_id !== line.product_id))}>
                Quitar
              </button>
            </li>
          ))}
        </ul>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Pago"
            value={paymentMethod}
            onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
            options={Object.entries(paymentLabels).map(([value, label]) => ({ value, label }))}
          />
          {paymentMethod === "credit" ? (
            <SelectField
              label="Fiado"
              required
              value={customerId}
              placeholder="Elige un cliente"
              onValueChange={setCustomerId}
              options={customers.map((customer) => ({ value: String(customer.id), label: customer.full_name }))}
            />
          ) : null}
          {paymentMethod === "credit" ? <DateField label="Vence el" value={dueOn} onChange={setDueOn} /> : null}
        </div>
        {error || productsQuery.error || salesQuery.error ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error ?? errorMessage(productsQuery.error ?? salesQuery.error)}</p>
        ) : null}
        <Button type="submit" size="lg" className="h-11" disabled={pending || lines.length === 0}>
          {pending ? "Guardando…" : "Registrar venta"}
        </Button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="bg-secondary text-left text-secondary-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Productos</th>
              <th className="px-4 py-3 font-medium">Pago</th>
              <th className="px-4 py-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-muted-foreground" colSpan={3}>
                  Todavía no hay ventas.
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    {sale.lines.map((line) => `${line.product?.name ?? "Producto"} × ${Number(line.quantity)}`).join(", ")}
                    {sale.credit_customer ? ` · ${sale.credit_customer.full_name}` : ""}
                  </td>
                  <td className="px-4 py-3">{paymentLabels[sale.payment_method]}</td>
                  <td className="px-4 py-3">{money.format(Number(sale.total))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
