"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useEffect, useState, type FormEvent } from "react";
import { Field, SelectField } from "@/components/field";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api";
import type { Category, Product, Unit } from "@/lib/session";

const empty = {
  name: "",
  category_id: "",
  unit_of_measure_id: "",
  barcode: "",
  cost_price: "",
  sale_price: "",
  current_stock: "",
  minimum_stock: "",
  expiration_date: "",
};

export type ProductDraft = {
  name: string;
  category_id: number | null;
  unit_of_measure_id: number;
  barcode: string | null;
  cost_price: number;
  sale_price: number;
  current_stock: number;
  minimum_stock: number;
  expiration_date: string | null;
};

type ProductFormDialogProps = {
  open: boolean;
  product: Product | null;
  categories: Category[];
  units: Unit[];
  variableWeight: boolean;
  asksExpiration: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (draft: ProductDraft) => Promise<void>;
};

export function ProductFormDialog({
  open,
  product,
  categories,
  units,
  variableWeight,
  asksExpiration,
  onOpenChange,
  onSubmit,
}: ProductFormDialogProps) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setError(null);
    if (product) {
      setForm({
        name: product.name,
        category_id: product.category_id ? String(product.category_id) : "",
        unit_of_measure_id: String(product.unit_of_measure_id),
        barcode: product.barcode ?? "",
        cost_price: String(Number(product.cost_price)),
        sale_price: String(Number(product.sale_price)),
        current_stock: String(Number(product.current_stock)),
        minimum_stock: String(Number(product.minimum_stock)),
        expiration_date: product.expiration_date ?? "",
      });
      return;
    }

    setForm({
      ...empty,
      category_id: categories[0] ? String(categories[0].id) : "",
      unit_of_measure_id: units[0] ? String(units[0].id) : "",
    });
  }, [open, product, categories, units]);

  function change(field: keyof typeof empty, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      await onSubmit({
        name: form.name,
        category_id: form.category_id ? Number(form.category_id) : null,
        unit_of_measure_id: Number(form.unit_of_measure_id),
        barcode: form.barcode || null,
        cost_price: form.cost_price === "" ? 0 : Number(form.cost_price),
        sale_price: Number(form.sale_price),
        current_stock: form.current_stock === "" ? 0 : Number(form.current_stock),
        minimum_stock: form.minimum_stock === "" ? 0 : Number(form.minimum_stock),
        expiration_date: form.expiration_date || null,
      });
      onOpenChange(false);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-foreground/40" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[min(40rem,calc(100vh-2rem))] w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-background p-6 outline-none">
          <Dialog.Title className="text-xl font-semibold tracking-tight">
            {product ? "Editar producto" : "Nuevo producto"}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            {product ? "Actualiza precios, stock o la categoría." : "El producto entra al inventario de esta tienda."}
          </Dialog.Description>
          <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={save}>
            <div className="sm:col-span-2">
              <Field label="Nombre" required value={form.name} onChange={(event) => change("name", event.target.value)} />
            </div>
            <SelectField label="Categoría" value={form.category_id} onChange={(event) => change("category_id", event.target.value)}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </SelectField>
            <SelectField label="Unidad" required value={form.unit_of_measure_id} onChange={(event) => change("unit_of_measure_id", event.target.value)}>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.abbreviation})
                </option>
              ))}
            </SelectField>
            <Field label="Código de barras" value={form.barcode} onChange={(event) => change("barcode", event.target.value)} />
            <Field label="Precio de costo" type="number" min="0" step="1" value={form.cost_price} onChange={(event) => change("cost_price", event.target.value)} />
            <Field label="Precio de venta" type="number" min="0" step="1" required value={form.sale_price} onChange={(event) => change("sale_price", event.target.value)} />
            <Field label="Stock actual" type="number" min="0" step={variableWeight ? "0.001" : "1"} value={form.current_stock} onChange={(event) => change("current_stock", event.target.value)} />
            <Field label="Stock mínimo" type="number" min="0" step={variableWeight ? "0.001" : "1"} value={form.minimum_stock} onChange={(event) => change("minimum_stock", event.target.value)} />
            {asksExpiration ? (
              <Field label="Vencimiento" type="date" value={form.expiration_date} onChange={(event) => change("expiration_date", event.target.value)} />
            ) : null}
            {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2">{error}</p> : null}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Dialog.Close
                type="button"
                className="inline-flex h-11 items-center rounded-lg px-3 text-sm font-medium hover:bg-muted"
              >
                Cancelar
              </Dialog.Close>
              <Button type="submit" size="lg" className="h-11" disabled={pending}>
                {pending ? "Guardando…" : product ? "Guardar cambios" : "Agregar"}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
