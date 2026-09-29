"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductFormDialog, type ProductDraft } from "@/features/inventory/components/product-form-dialog";
import { ProductTable } from "@/features/inventory/components/product-table";
import { api, errorMessage } from "@/lib/api";
import { queryKeys, useStoreQuery } from "@/lib/queries";
import { useSession } from "@/lib/use-session";
import type { Category, Product, Unit } from "@/lib/session";

export function InventoryScreen() {
  const session = useSession();
  const queryClient = useQueryClient();
  const productsQuery = useStoreQuery<Product[]>(queryKeys.products, "/products");
  const categoriesQuery = useStoreQuery<Category[]>(queryKeys.categories, "/categories");
  const unitsQuery = useStoreQuery<Unit[]>(queryKeys.units, "/units");
  const products = productsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const units = unitsQuery.data ?? [];
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  const variableWeight = session?.business.preset?.config.variable_weight === true;
  const asksExpiration = session?.business.preset?.config.requires_expiration === true;

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

    queryClient.setQueryData<Product[]>(queryKeys.products, (previous = []) =>
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
    queryClient.setQueryData<Product[]>(queryKeys.products, (previous = []) => previous.filter((item) => item.id !== product.id));
  }

  const loadError = productsQuery.error ?? categoriesQuery.error ?? unitsQuery.error;

  return (
    <>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Inventario</h2>
            <p className="text-sm text-muted-foreground">
              {products.length} productos
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
          className="h-11 w-full rounded-xl border border-input bg-card px-3 text-base shadow-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:max-w-sm"
        />

        {loadError || error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error ?? errorMessage(loadError)}</p> : null}

        <ProductTable
          products={visibleProducts}
          emptyTitle={query.trim() ? "Nada coincide con la búsqueda" : "Todavía no hay productos"}
          emptyHint={query.trim() ? "Prueba con otro nombre o categoría." : "Agrega el primero con el botón de arriba."}
          onEdit={openEdit}
          onRemove={remove}
        />

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
    </>
  );
}
