"use client";

import { type SortingState } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table/flex-render";
import {
  getCoreRowModel,
  getSortedRowModel,
  legacyCreateColumnHelper,
  useLegacyTable,
  type LegacyColumnDef,
} from "@tanstack/react-table/legacy";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/session";

const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const columnHelper = legacyCreateColumnHelper<Product>();

type ProductTableProps = {
  products: Product[];
  emptyTitle: string;
  emptyHint: string;
  onEdit: (product: Product) => void;
  onRemove: (product: Product) => void;
};

export function ProductTable({ products, emptyTitle, emptyHint, onEdit, onRemove }: ProductTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () =>
      [
      columnHelper.accessor("name", {
        header: "Producto",
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor((row) => row.category?.name ?? "Sin categoría", {
        id: "category",
        header: "Categoría",
      }),
      columnHelper.accessor("current_stock", {
        header: "Stock",
        cell: (info) => {
          const product = info.row.original;
          const stock = Number(product.current_stock);
          const minimum = Number(product.minimum_stock);
          const low = stock <= minimum;
          return (
            <span className={low ? "font-medium text-destructive" : undefined}>
              {stock} {product.unit_of_measure?.abbreviation}
            </span>
          );
        },
      }),
      columnHelper.accessor("sale_price", {
        header: "Precio",
        cell: (info) => money.format(Number(info.getValue())),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        enableSorting: false,
        cell: (info) => (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onEdit(info.row.original)}>
              Editar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(info.row.original)}>
              Quitar
            </Button>
          </div>
        ),
      }),
    ] as unknown as LegacyColumnDef<Product>[],
    [onEdit, onRemove],
  );

  const table = useLegacyTable({
    data: products,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/30 bg-card px-6 py-16 text-center shadow-sm">
        <p className="font-medium">{emptyTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
      <table className="w-full min-w-[40rem] border-collapse text-sm">
        <thead className="bg-secondary text-left text-secondary-foreground">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-4 py-3 font-medium">
                  {header.isPlaceholder ? null : (
                    <button
                      type="button"
                      className={header.column.getCanSort() ? "hover:text-foreground" : "cursor-default"}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" ? " ↑" : null}
                      {header.column.getIsSorted() === "desc" ? " ↓" : null}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-t border-border transition-colors hover:bg-muted/40">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
