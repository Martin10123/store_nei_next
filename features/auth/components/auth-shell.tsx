import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="grid min-h-svh flex-1 bg-background lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar px-12 py-14 text-sidebar-foreground lg:flex">
        <div className="pointer-events-none absolute -top-20 -right-16 size-72 rounded-full bg-accent/40" />
        <div className="pointer-events-none absolute bottom-8 -left-12 size-48 rounded-full bg-primary/50" />
        <p className="relative text-sm font-semibold tracking-[0.18em] text-sidebar-primary uppercase">Tenderos</p>
        <div className="relative max-w-sm">
          <h2 className="text-4xl font-semibold tracking-tight">Tu tienda, en orden.</h2>
          <p className="mt-4 text-base leading-7 text-sidebar-foreground/80">
            Inventario, precios y stock de un vistazo. Empieza con tu tipo de negocio y las categorías ya vienen listas.
          </p>
        </div>
        <p className="relative text-sm text-sidebar-foreground/70">Hecho para el negocio de barrio.</p>
      </aside>
      <main className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <p className="mb-8 text-sm font-semibold tracking-[0.18em] text-primary uppercase lg:hidden">Tenderos</p>
          <div className="mb-8 flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
          {children}
          <div className="mt-8 text-sm text-muted-foreground">{footer}</div>
        </div>
      </main>
    </div>
  );
}
