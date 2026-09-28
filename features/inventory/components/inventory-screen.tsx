"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductFormDialog, type ProductDraft } from "@/features/inventory/components/product-form-dialog";
import { ProductTable } from "@/features/inventory/components/product-table";
import { api, errorMessage } from "@/lib/api";
import { clearSession, readSession, type Category, type Product, type Session, type Unit } from "@/lib/session";

export function InventoryScreen() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  const variableWeight = session?.business.preset?.config.variable_weight === true;
  const asksExpiration = session?.business.preset?.config.requires_expiration === true;

  useEffect(() => {
    const current = readSession();
    if (!current) {
      router.replace("/");
      return;
    }

    setSession(current);

    Promise.all([
      api<Category[]>("/categories", {}, current.token),
      api<Unit[]>("/units", {}, current.token),
      api<Product[]>("/products", {}, current.token),
    ])
      .then(([categoryRows, unitRows, productRows]) => {
        setCategories(categoryRows);
        setUnits(unitRows);
        setProducts(productRows);
      })
      .catch((caught) => setError(errorMessage(caught)));
  }, [router]);

  const visibleProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return products;
    }

    return products.filter((product) => product.name.toLowerCase().includes(term) || product.category?.name.toLowerCase().includes(term));
  }, [products, query]);

  const lowStock = products.filter((product) => Number(product.current_stock) <= Number(product.minimum_stock)).length;

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setDialogOpen(true);
  }

  async function save(draft: ProductDraft) {
    if (!session) {
      return;
    }

    const product = await api<Product>(
      editing ? `/products/${editing.id}` : "/products",
      { method: editing ? "PATCH" : "POST", body: JSON.stringify(draft) },
      session.token,
    );

    setProducts((previous) =>
      editing
        ? previous.map((item) => (item.id === product.id ? product : item))
        : [...previous, product].sort((a, b) => a.name.localeCompare(b.name, "es")),
    );
  }

  async function remove(product: Product) {
    if (!session) {
      return;
    }

    await api(`/products/${product.id}`, { method: "DELETE" }, session.token);
    setProducts((previous) => previous.filter((item) => item.id !== product.id));
  }

  function signOut() {
    if (session) {
      void api("/logout", { method: "POST" }, session.token).catch(() => undefined);
    }
    clearSession();
    router.replace("/");
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-svh bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] uppercase text-muted-foreground">Tenderos</p>
            <h1 className="text-xl font-semibold tracking-tight">{session.business.name}</h1>
          </div>
          <Button type="button" variant="outline" onClick={signOut}>
            Salir
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Inventario</h2>
            <p className="text-sm text-muted-foreground">
              {session.user.full_name} · {products.length} productos
              {lowStock > 0 ? ` · ${lowStock} en stock bajo` : ""}
            </p>
          </div>
          <Button type="button" size="lg" className="h-11" onClick={openCreate}>
            Agregar producto
          </Button>
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre o categoría"
          className="h-11 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:max-w-sm"
        />

        {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

        <ProductTable
          products={visibleProducts}
          emptyTitle={query.trim() ? "Nada coincide con la búsqueda" : "Todavía no hay productos"}
          emptyHint={query.trim() ? "Prueba con otro nombre o categoría." : "Agrega el primero con el botón de arriba."}
          onEdit={openEdit}
          onRemove={remove}
        />
      </main>

      <ProductFormDialog
        open={dialogOpen}
        product={editing}
        categories={categories}
        units={units}
        variableWeight={variableWeight}
        asksExpiration={asksExpiration}
        onOpenChange={setDialogOpen}
        onSubmit={save}
      />
    </div>
  );
}
