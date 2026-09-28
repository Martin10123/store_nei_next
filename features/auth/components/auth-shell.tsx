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
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary px-12 py-14 text-primary-foreground lg:flex">
        <p className="text-sm font-semibold tracking-[0.18em] uppercase">Tenderos</p>
        <div className="max-w-sm">
          <h2 className="text-4xl font-semibold tracking-tight">Tu tienda, en orden.</h2>
          <p className="mt-4 text-base leading-7 text-primary-foreground/80">
            Inventario, precios y stock de un vistazo. Empieza con tu tipo de negocio y las categorías ya vienen listas.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/70">Hecho para el negocio de barrio.</p>
      </aside>
      <main className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <p className="mb-8 text-sm font-semibold tracking-[0.18em] uppercase lg:hidden">Tenderos</p>
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
