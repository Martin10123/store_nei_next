"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { api, errorMessage } from "@/lib/api";
import { saveSession, type Preset, type Session } from "@/lib/session";

const labels: Record<string, string> = {
  fruit_shop: "Frutería",
  deli: "Salsamentaria",
  liquor_store: "Licorería",
  supermarket: "Megatienda",
  corner_store: "Tienda de barrio",
};

export function RegisterForm() {
  const router = useRouter();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [presetId, setPresetId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    api<Preset[]>("/presets")
      .then((data) => {
        setPresets(data);
        if (data[0]) {
          setPresetId(String(data[0].id));
        }
      })
      .catch((caught) => setError(errorMessage(caught)));
  }, []);

  async function createStore(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const session = await api<Session>("/register", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          password_confirmation: passwordConfirmation,
          business_name: businessName,
          business_type_preset_id: Number(presetId),
        }),
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
      title="Crea tu tienda"
      subtitle="Elige el tipo de negocio. Las categorías iniciales se cargan solas."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href="/" className="font-medium text-foreground underline-offset-4 hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={createStore}>
        <Field label="Tu nombre" required value={fullName} onChange={(event) => setFullName(event.target.value)} />
        <Field label="Correo" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Contraseña"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Field
            label="Confirmar contraseña"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
          />
        </div>
        <button
          type="button"
          className="self-start text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          onClick={() => setShowPassword((current) => !current)}
        >
          {showPassword ? "Ocultar contraseña" : "Ver contraseña"}
        </button>
        <Field label="Nombre de la tienda" required value={businessName} onChange={(event) => setBusinessName(event.target.value)} />
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Tipo de negocio</legend>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => {
              const selected = presetId === String(preset.id);
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setPresetId(String(preset.id))}
                  className={`rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                    selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"
                  }`}
                >
                  <span className="block font-medium">{labels[preset.name] ?? preset.name}</span>
                  {preset.description ? (
                    <span className={`mt-1 block text-xs leading-4 ${selected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {preset.description}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </fieldset>
        {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
        <Button type="submit" size="lg" className="mt-2 h-11 w-full" disabled={pending || !presetId}>
          {pending ? "Creando…" : "Crear tienda"}
        </Button>
      </form>
    </AuthShell>
  );
}
