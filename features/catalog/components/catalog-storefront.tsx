"use client";

import { useQuery } from "@tanstack/react-query";
import { api, errorMessage } from "@/lib/api";
import { money } from "@/lib/money";

type Catalog = {
  business: { name: string; public_slug: string };
  products: { name: string; sale_price: string; in_stock: boolean }[];
};

export function CatalogStorefront({ slug }: { slug: string }) {
  const catalogQuery = useQuery({
    queryKey: ["public-catalog", slug],
    queryFn: () => api<Catalog>(`/public/${slug}/products`),
    enabled: Boolean(slug),
  });
  const catalog = catalogQuery.data;
  const products = catalog?.products ?? [];

  return (
    <div className="min-h-svh bg-background">
      <header className="bg-sidebar px-4 py-8 text-sidebar-foreground">
        <div className="mx-auto w-full max-w-5xl">
          <p className="text-xs font-semibold tracking-[0.16em] text-sidebar-primary uppercase">Tenderos</p>
          <h1 className="mt-2 text-3xl font-semibold">{catalog?.business.name ?? "Catálogo"}</h1>
          <p className="mt-2 max-w-xl text-sm text-sidebar-foreground/80">
            Lo que hay en la tienda ahora. El pedido se confirma en el local, con el stock reservado hasta la entrega.
          </p>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
        {catalogQuery.isPending ? <p className="text-sm text-muted-foreground">Cargando el mostrador…</p> : null}
        {catalogQuery.error ? (
          <p className="rounded-2xl bg-destructive/10 px-4 py-6 text-sm text-destructive">
            {errorMessage(catalogQuery.error) || "No encontramos esa tienda."}
          </p>
        ) : null}
        {!catalogQuery.isPending && !catalogQuery.error && products.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            Esta tienda todavía no publica productos.
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article key={product.name} className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
              <h2 className="text-lg font-semibold">{product.name}</h2>
              <div className="mt-4 flex items-end justify-between gap-3">
                <p className="text-xl font-semibold text-primary">{money.format(Number(product.sale_price))}</p>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${product.in_stock ? "bg-secondary text-primary" : "bg-accent text-accent-foreground"}`}>
                  {product.in_stock ? "En stock" : "Agotado"}
                </span>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
