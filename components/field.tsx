import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

const control =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function Field({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <input className={control} {...props} />
    </label>
  );
}

export function SelectField({
  label,
  children,
  ...props
}: { label: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <select className={control} {...props}>
        {children}
      </select>
    </label>
  );
}
