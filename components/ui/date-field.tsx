"use client";

import { Popover } from "@base-ui/react/popover";
import { useState } from "react";

const weekdays = ["L", "M", "X", "J", "V", "S", "D"];
const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

type DateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function toIso(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function sameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

export function DateField({ label, value, onChange }: DateFieldProps) {
  const selected = value ? parseDate(value) : null;
  const [visible, setVisible] = useState(() => selected ?? new Date());
  const [open, setOpen] = useState(false);

  const year = visible.getFullYear();
  const month = visible.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];

  function pick(day: number) {
    onChange(toIso(new Date(year, month, day)));
    setOpen(false);
  }

  const formatted = selected
    ? selected.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
    : "Elige una fecha";

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <Popover.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            setVisible(selected ?? new Date());
          }
        }}
      >
        <Popover.Trigger className="flex h-11 w-full items-center justify-between rounded-lg border border-input bg-card px-3 text-left text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <span className={selected ? undefined : "text-muted-foreground"}>{formatted}</span>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner className="z-50" sideOffset={6}>
            <Popover.Popup className="w-72 rounded-xl border border-border bg-card p-3 shadow-lg outline-none">
              <div className="mb-3 flex items-center justify-between">
                <button type="button" className="rounded-lg px-2 py-1 hover:bg-muted" onClick={() => setVisible(new Date(year, month - 1, 1))}>
                  ‹
                </button>
                <p className="text-sm font-medium">
                  {months[month]} {year}
                </p>
                <button type="button" className="rounded-lg px-2 py-1 hover:bg-muted" onClick={() => setVisible(new Date(year, month + 1, 1))}>
                  ›
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
                {weekdays.map((day) => (
                  <span key={day} className="py-1">
                    {day}
                  </span>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {cells.map((day, index) =>
                  day ? (
                    <button
                      key={day}
                      type="button"
                      onClick={() => pick(day)}
                      className={`h-8 rounded-lg text-sm hover:bg-secondary ${selected && sameDay(selected, new Date(year, month, day)) ? "bg-primary text-primary-foreground hover:bg-primary" : ""}`}
                    >
                      {day}
                    </button>
                  ) : (
                    <span key={`empty-${index}`} />
                  ),
                )}
              </div>
              {value ? (
                <button
                  type="button"
                  className="mt-2 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                >
                  Quitar fecha
                </button>
              ) : null}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
