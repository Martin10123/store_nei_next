"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api";
import { saveSession, type Session } from "@/lib/session";
import { AuthShell } from "@/features/auth/components/auth-shell";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const session = await api<Session>("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      saveSession(session);
      router.push("/products");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Entrar"
      subtitle="Abre el panel de tu tienda."
      footer={
        <>
          ¿Todavía no tienes tienda?{" "}
          <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
            Crearla
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={signIn}>
        <Field label="Correo" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <div className="flex flex-col gap-2">
          <Field
            label="Contraseña"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="button"
            className="self-start text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? "Ocultar contraseña" : "Ver contraseña"}
          </button>
        </div>
        {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
        <Button type="submit" size="lg" className="mt-2 h-11 w-full" disabled={pending}>
          {pending ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </AuthShell>
  );
}
