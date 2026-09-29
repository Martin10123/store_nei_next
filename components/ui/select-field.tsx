"use client";

import { Select } from "@base-ui/react/select";
import { useMemo } from "react";

const trigger =
  "flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 text-left text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-[placeholder]:text-muted-foreground";

type Option = {
  value: string;
  label: string;
};

type SelectFieldProps = {
  label: string;
  value: string;
  options: Option[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
};

export function SelectField({ label, value, options, onValueChange, placeholder = "Elige una opción", required }: SelectFieldProps) {
  const itemsKey = options.map((option) => `${option.value}:${option.label}`).join("|");
  const items = useMemo(() => options, [itemsKey]);

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <Select.Root
        value={value || null}
        items={items}
        required={required}
        onValueChange={(next) => {
          const chosen = next ?? "";
          if (chosen !== value) {
            onValueChange(chosen);
          }
        }}
      >
        <Select.Trigger className={trigger}>
          <Select.Value placeholder={placeholder} />
          <Select.Icon className="text-muted-foreground">
            <Chevron />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className="z-50 outline-none" sideOffset={6}>
            <Select.Popup className="max-h-64 w-[var(--anchor-width)] overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-lg outline-none">
              <Select.List>
                {items.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-muted data-[selected]:font-medium"
                  >
                    <Select.ItemText>{option.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
