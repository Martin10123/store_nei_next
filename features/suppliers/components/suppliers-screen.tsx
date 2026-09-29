"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { api, errorMessage } from "@/lib/api";
import { money } from "@/lib/money";
import { queryKeys, useStoreQuery } from "@/lib/queries";
import { useSession } from "@/lib/use-session";
import type { Product } from "@/lib/session";

type Supplier = {
  id: number;
  name: string;
  contact_name: string | null;
  phone: string | null;
};

type SupplierPrice = {
  id: number;
  product_id: number;
  supplier_id: number;
  price: string;
  source: string;
  product: { id: number; name: string; cost_price: string } | null;
  supplier: { id: number; name: string } | null;
};

type PriceQuote = {
  id: number;
  found_name: string;
  found_price: string;
  product_id: number | null;
  product: { id: number; name: string } | null;
  price_source: { id: number; name: string } | null;
};

function latestPrices(rows: SupplierPrice[]) {
  const seen = new Map<string, SupplierPrice>();

  for (const row of rows) {
    const key = `${row.product_id}-${row.supplier_id}`;
    if (!seen.has(key)) {
      seen.set(key, row);
    }
  }

  return [...seen.values()];
}

export function SuppliersScreen() {
  const session = useSession();
  const queryClient = useQueryClient();
  const suppliersQuery = useStoreQuery<Supplier[]>(queryKeys.suppliers, "/suppliers");
  const pricesQuery = useStoreQuery<SupplierPrice[]>(queryKeys.supplierPrices, "/supplier-prices");
  const quotesQuery = useStoreQuery<PriceQuote[]>(queryKeys.priceQuotes, "/price-quotes");
  const productsQuery = useStoreQuery<Product[]>(queryKeys.products, "/products");
  const suppliers = suppliersQuery.data ?? [];
  const prices = latestPrices(pricesQuery.data ?? []);
  const quotes = quotesQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [productId, setProductId] = useState("");
  const [price, setPrice] = useState("");
  const [foundName, setFoundName] = useState("");
  const [foundPrice, setFoundPrice] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [assignments, setAssignments] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const supplierValue = supplierId || (suppliers[0] ? String(suppliers[0].id) : "");
  const productValue = productId || (products[0] ? String(products[0].id) : "");

  async function createSupplier(event: FormEvent) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const supplier = await api<Supplier>(
        "/suppliers",
        { method: "POST", body: JSON.stringify({ name, contact_name: contactName || null, phone: phone || null }) },
        session.token,
      );
      queryClient.setQueryData<Supplier[]>(queryKeys.suppliers, (previous = []) =>
        [...previous, supplier].sort((a, b) => a.name.localeCompare(b.name, "es")),
      );
      setName("");
      setContactName("");
      setPhone("");
      setSupplierId(String(supplier.id));
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  async function recordPrice(event: FormEvent) {
    event.preventDefault();
    if (!session || !supplierValue || !productValue) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const row = await api<SupplierPrice>(
        "/supplier-prices",
        {
          method: "POST",
          body: JSON.stringify({
            supplier_id: Number(supplierValue),
            product_id: Number(productValue),
            price: Number(price),
            source: "manual",
          }),
        },
        session.token,
      );
      queryClient.setQueryData<SupplierPrice[]>(queryKeys.supplierPrices, (previous = []) => [row, ...previous]);
      setPrice("");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  async function saveQuote(event: FormEvent) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const quote = await api<PriceQuote>(
        "/price-quotes",
        {
          method: "POST",
          body: JSON.stringify({
            found_name: foundName,
            found_price: Number(foundPrice),
            source_name: sourceName || null,
          }),
        },
        session.token,
      );
      queryClient.setQueryData<PriceQuote[]>(queryKeys.priceQuotes, (previous = []) => [quote, ...previous]);
      setFoundName("");
      setFoundPrice("");
      setSourceName("");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  async function assignQuote(quote: PriceQuote) {
    if (!session || !assignments[quote.id]) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const updated = await api<PriceQuote>(
        `/price-quotes/${quote.id}/assign`,
        { method: "POST", body: JSON.stringify({ product_id: Number(assignments[quote.id]) }) },
        session.token,
      );
      queryClient.setQueryData<PriceQuote[]>(queryKeys.priceQuotes, (previous = []) =>
        previous.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Proveedores</h2>
        <p className="text-sm text-muted-foreground">Precios de compra y cotizaciones pegadas a mano. No buscamos en internet.</p>
      </div>
      <form className="grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:grid-cols-3" onSubmit={createSupplier}>
        <Field label="Proveedor" required value={name} onChange={(event) => setName(event.target.value)} />
        <Field label="Contacto" value={contactName} onChange={(event) => setContactName(event.target.value)} />
        <Field label="Teléfono" value={phone} onChange={(event) => setPhone(event.target.value)} />
        <Button type="submit" className="h-11 sm:col-span-3" disabled={pending}>
          Agregar proveedor
        </Button>
      </form>
      <form className="grid gap-4 rounded-2xl border border-primary/15 bg-secondary/50 p-4 sm:grid-cols-[1fr_1fr_9rem_auto] sm:items-end" onSubmit={recordPrice}>
        <SelectField
          label="Proveedor"
          value={supplierValue}
          onValueChange={setSupplierId}
          placeholder="Agrega un proveedor"
          options={suppliers.map((supplier) => ({ value: String(supplier.id), label: supplier.name }))}
        />
        <SelectField
          label="Producto"
          value={productValue}
          onValueChange={setProductId}
          placeholder="Agrega un producto"
          options={products.map((product) => ({ value: String(product.id), label: product.name }))}
        />
        <Field label="Precio" type="number" min="0" step="1" required value={price} onChange={(event) => setPrice(event.target.value)} />
        <Button type="submit" className="h-11" disabled={pending || !supplierValue || !productValue}>
          Anotar precio
        </Button>
      </form>
      {error || suppliersQuery.error || pricesQuery.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error ?? errorMessage(suppliersQuery.error ?? pricesQuery.error)}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="bg-secondary text-left text-secondary-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Proveedor</th>
              <th className="px-4 py-3 font-medium">Último precio</th>
              <th className="px-4 py-3 font-medium">Contra tu costo</th>
            </tr>
          </thead>
          <tbody>
            {prices.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-muted-foreground" colSpan={4}>
                  Todavía no hay precios anotados.
                </td>
              </tr>
            ) : (
              prices.map((row) => {
                const cost = Number(row.product?.cost_price ?? 0);
                const amount = Number(row.price);
                const tone = amount < cost ? "más barato" : amount > cost ? "más caro" : "igual";
                const toneClass =
                  amount < cost
                    ? "bg-secondary text-primary"
                    : amount > cost
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground";

                return (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{row.product?.name ?? "Producto"}</td>
                    <td className="px-4 py-3">{row.supplier?.name ?? "Proveedor"}</td>
                    <td className="px-4 py-3">{money.format(amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${toneClass}`}>
                        {tone} · costo {money.format(cost)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <form className="grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:grid-cols-3" onSubmit={saveQuote}>
        <div className="sm:col-span-3">
          <h3 className="font-semibold">Cotización encontrada</h3>
          <p className="text-sm text-muted-foreground">Pega el nombre y el precio. El producto lo eliges tú.</p>
        </div>
        <Field label="Nombre encontrado" required value={foundName} onChange={(event) => setFoundName(event.target.value)} />
        <Field label="Precio encontrado" type="number" min="0" step="1" required value={foundPrice} onChange={(event) => setFoundPrice(event.target.value)} />
        <Field label="De dónde salió" value={sourceName} onChange={(event) => setSourceName(event.target.value)} />
        <Button type="submit" variant="secondary" className="h-11 sm:col-span-3" disabled={pending}>
          Guardar cotización
        </Button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="bg-accent/40 text-left text-accent-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Encontrado</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Producto</th>
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-muted-foreground" colSpan={3}>
                  No hay cotizaciones por asignar.
                </td>
              </tr>
            ) : (
              quotes.map((quote) => (
                <tr key={quote.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="font-medium">{quote.found_name}</div>
                    <div className="text-xs text-muted-foreground">{quote.price_source?.name ?? "Anotación manual"}</div>
                  </td>
                  <td className="px-4 py-3">{money.format(Number(quote.found_price))}</td>
                  <td className="px-4 py-3">
                    {quote.product ? (
                      <span className="font-medium text-primary">{quote.product.name}</span>
                    ) : (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                        <div className="min-w-40 flex-1">
                          <SelectField
                            label="Asignar"
                            value={assignments[quote.id] ?? ""}
                            placeholder="Elige el producto"
                            onValueChange={(value) => setAssignments((previous) => ({ ...previous, [quote.id]: value }))}
                            options={products.map((product) => ({ value: String(product.id), label: product.name }))}
                          />
                        </div>
                        <Button type="button" size="sm" disabled={pending || !assignments[quote.id]} onClick={() => assignQuote(quote)}>
                          Asignar
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
