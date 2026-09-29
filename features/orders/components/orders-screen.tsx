"use client";

import Link from "next/link";
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

type Me = {
  business: {
    name: string;
    public_slug: string | null;
  };
};

type EndCustomer = {
  id: number;
  name: string;
  phone: string;
};

type DeliveryOrder = {
  id: number;
  status: "pending" | "confirmed" | "in_transit" | "delivered" | "cancelled";
  delivery_address: string;
  total: string;
  payment_method: "cash" | "card";
  end_customer: { id: number; name: string; phone: string } | null;
  lines: { id: number; quantity: string; product: { name: string } | null }[];
};

const statusLabels = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  in_transit: "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export function OrdersScreen() {
  const session = useSession();
  const queryClient = useQueryClient();
  const profileQuery = useStoreQuery<Me>(queryKeys.business, "/me");
  const customersQuery = useStoreQuery<EndCustomer[]>(queryKeys.endCustomers, "/end-customers");
  const ordersQuery = useStoreQuery<DeliveryOrder[]>(queryKeys.deliveryOrders, "/delivery-orders");
  const productsQuery = useStoreQuery<Product[]>(queryKeys.products, "/products");
  const customers = customersQuery.data ?? [];
  const orders = ordersQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const slug = profileQuery.data?.business.public_slug ?? "";
  const [publicSlug, setPublicSlug] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [lines, setLines] = useState<{ product_id: number; name: string; quantity: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const productValue = productId || (products[0] ? String(products[0].id) : "");
  const customerValue = customerId || (customers[0] ? String(customers[0].id) : "");

  function rememberOrder(order: DeliveryOrder) {
    queryClient.setQueryData<DeliveryOrder[]>(queryKeys.deliveryOrders, (previous = []) => [
      order,
      ...previous.filter((item) => item.id !== order.id),
    ]);
  }

  async function publishSlug(event: FormEvent) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const business = await api<Me["business"]>(
        "/business",
        { method: "PATCH", body: JSON.stringify({ public_slug: publicSlug }) },
        session.token,
      );
      queryClient.setQueryData<Me>(queryKeys.business, (current) => (current ? { ...current, business: { ...current.business, ...business } } : current));
      setPublicSlug("");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  async function createCustomer(event: FormEvent) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const customer = await api<EndCustomer>(
        "/end-customers",
        { method: "POST", body: JSON.stringify({ name: customerName, phone: customerPhone }) },
        session.token,
      );
      queryClient.setQueryData<EndCustomer[]>(queryKeys.endCustomers, (previous = []) =>
        [...previous, customer].sort((a, b) => a.name.localeCompare(b.name, "es")),
      );
      setCustomerName("");
      setCustomerPhone("");
      setCustomerId(String(customer.id));
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  function addLine() {
    const product = products.find((item) => item.id === Number(productValue));
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

  async function createOrder(event: FormEvent) {
    event.preventDefault();
    if (!session || !customerValue || lines.length === 0) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const order = await api<DeliveryOrder>(
        "/delivery-orders",
        {
          method: "POST",
          body: JSON.stringify({
            end_customer_id: Number(customerValue),
            delivery_address: address,
            payment_method: paymentMethod,
            lines: lines.map((line) => ({ product_id: line.product_id, quantity: line.quantity })),
          }),
        },
        session.token,
      );
      rememberOrder(order);
      setLines([]);
      setAddress("");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  async function act(order: DeliveryOrder, action: "confirm" | "deliver" | "cancel") {
    if (!session) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const updated = await api<DeliveryOrder>(`/delivery-orders/${order.id}/${action}`, { method: "POST" }, session.token);
      rememberOrder(updated);
      if (action === "deliver" || action === "cancel" || action === "confirm") {
        queryClient.invalidateQueries({ queryKey: queryKeys.products });
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Pedidos a domicilio</h2>
        <p className="text-sm text-muted-foreground">Confirmar aparta el stock. Entregar crea la venta y lo descuenta una sola vez.</p>
      </div>
      <form className="grid gap-4 rounded-2xl border border-primary/20 bg-secondary p-4 sm:grid-cols-[1fr_auto] sm:items-end" onSubmit={publishSlug}>
        <Field
          label="Enlace del catálogo"
          placeholder="mi-tienda"
          value={publicSlug || slug}
          onChange={(event) => setPublicSlug(event.target.value)}
        />
        <Button type="submit" className="h-11" disabled={pending}>
          Publicar
        </Button>
        {slug ? (
          <p className="text-sm sm:col-span-2">
            Catálogo público:{" "}
            <Link href={`/catalog/${slug}`} prefetch={false} className="font-medium text-primary underline-offset-4 hover:underline">
              /catalog/{slug}
            </Link>
          </p>
        ) : (
          <p className="text-sm text-secondary-foreground sm:col-span-2">Todavía no hay un enlace público. Usa letras minúsculas y guiones.</p>
        )}
      </form>
      <form className="grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:grid-cols-[1fr_12rem_auto] sm:items-end" onSubmit={createCustomer}>
        <Field label="Cliente" required value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
        <Field label="Teléfono" required value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
        <Button type="submit" variant="outline" className="h-11" disabled={pending}>
          Agregar cliente
        </Button>
      </form>
      <form className="grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm" onSubmit={createOrder}>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Cliente"
            value={customerValue}
            placeholder="Agrega un cliente"
            onValueChange={setCustomerId}
            options={customers.map((customer) => ({ value: String(customer.id), label: customer.name }))}
          />
          <SelectField
            label="Pago al entregar"
            value={paymentMethod}
            onValueChange={setPaymentMethod}
            options={[
              { value: "cash", label: "Efectivo" },
              { value: "card", label: "Tarjeta" },
            ]}
          />
        </div>
        <Field label="Dirección" required value={address} onChange={(event) => setAddress(event.target.value)} />
        <div className="grid gap-4 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
          <SelectField
            label="Producto"
            value={productValue}
            onValueChange={setProductId}
            options={products.map((product) => ({ value: String(product.id), label: product.name }))}
          />
          <Field label="Cantidad" type="number" min="0.001" step="0.001" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          <Button type="button" variant="outline" className="h-11" onClick={addLine}>
            Agregar
          </Button>
        </div>
        <ul className="flex flex-col gap-2 text-sm">
          {lines.length === 0 ? <li className="text-muted-foreground">El pedido todavía no tiene productos.</li> : null}
          {lines.map((line) => (
            <li key={line.product_id} className="flex justify-between rounded-lg bg-muted/50 px-3 py-2">
              <span>
                {line.name} · {line.quantity}
              </span>
              <button type="button" className="text-muted-foreground" onClick={() => setLines((previous) => previous.filter((item) => item.product_id !== line.product_id))}>
                Quitar
              </button>
            </li>
          ))}
        </ul>
        <Button type="submit" size="lg" className="h-11 w-fit" disabled={pending || lines.length === 0 || !customerValue}>
          Crear pedido
        </Button>
      </form>
      {error || ordersQuery.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error ?? errorMessage(ordersQuery.error)}</p>
      ) : null}
      <div className="flex flex-col gap-3">
        {orders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-sm text-muted-foreground">Todavía no hay pedidos a domicilio.</p>
        ) : null}
        {orders.map((order) => (
          <article key={order.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{order.end_customer?.name ?? "Cliente"}</p>
                <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
                <p className="mt-1 text-sm">{order.lines.map((line) => `${line.product?.name ?? "Producto"} × ${Number(line.quantity)}`).join(", ")}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-primary">{money.format(Number(order.total))}</p>
                <p className="text-xs font-medium tracking-wide text-accent-foreground uppercase">{statusLabels[order.status]}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {order.status === "pending" ? (
                <Button type="button" size="sm" disabled={pending} onClick={() => act(order, "confirm")}>
                  Confirmar
                </Button>
              ) : null}
              {order.status === "confirmed" ? (
                <Button type="button" size="sm" disabled={pending} onClick={() => act(order, "deliver")}>
                  Entregar
                </Button>
              ) : null}
              {order.status === "pending" || order.status === "confirmed" ? (
                <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => act(order, "cancel")}>
                  Cancelar
                </Button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
