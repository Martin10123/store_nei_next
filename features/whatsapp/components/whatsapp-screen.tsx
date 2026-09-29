"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api";
import { queryKeys, useStoreQuery } from "@/lib/queries";
import { useSession } from "@/lib/use-session";

type WhatsappMessage = {
  id: number;
  phone_number: string;
  direction: "inbound" | "outbound";
  body: string;
  detected_intent: string | null;
  created_at: string;
};

type SendResult = {
  inbound: WhatsappMessage;
  outbound: WhatsappMessage;
  reply: string;
};

export function WhatsappScreen() {
  const session = useSession();
  const queryClient = useQueryClient();
  const messagesQuery = useStoreQuery<WhatsappMessage[]>(queryKeys.whatsapp, "/whatsapp/messages");
  const messages = messagesQuery.data ?? [];
  const [phone, setPhone] = useState("");
  const [body, setBody] = useState("ventas de hoy");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const result = await api<SendResult>(
        "/whatsapp/messages",
        { method: "POST", body: JSON.stringify({ phone_number: phone, body }) },
        session.token,
      );
      queryClient.setQueryData<WhatsappMessage[]>(queryKeys.whatsapp, (previous = []) => [...previous, result.inbound, result.outbound]);
      setBody("");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">WhatsApp de prueba</h2>
        <p className="text-sm text-muted-foreground">
          Simula un mensaje del tendero. Puedes pedir las ventas de hoy, el saldo de un fiado o escribir “vender 1 arroz”.
        </p>
      </div>
      <form className="grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm" onSubmit={send}>
        <Field label="Teléfono" required value={phone} onChange={(event) => setPhone(event.target.value)} />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Mensaje</span>
          <textarea
            className="min-h-24 w-full rounded-lg border border-input bg-card px-3 py-2 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            required
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {["ventas de hoy", "saldo de Pedro", "vender 1 arroz"].map((sample) => (
            <button
              key={sample}
              type="button"
              className="rounded-full bg-accent px-3 py-1.5 text-sm text-accent-foreground"
              onClick={() => setBody(sample)}
            >
              {sample}
            </button>
          ))}
        </div>
        <Button type="submit" size="lg" className="h-11 w-fit" disabled={pending}>
          {pending ? "Enviando…" : "Enviar prueba"}
        </Button>
      </form>
      {error || messagesQuery.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error ?? errorMessage(messagesQuery.error)}</p>
      ) : null}
      <div className="flex min-h-64 flex-col gap-3 rounded-2xl border border-border bg-secondary/40 p-4">
        {messages.length === 0 ? (
          <p className="m-auto max-w-sm text-center text-sm text-muted-foreground">
            La bitácora está vacía. Un mensaje de prueba aparece aquí, con la respuesta de la tienda.
          </p>
        ) : null}
        {messages.map((message) => {
          const outbound = message.direction === "outbound";
          return (
            <div key={message.id} className={`flex ${outbound ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${outbound ? "bg-primary text-primary-foreground" : "border border-border bg-card"}`}
              >
                <p>{message.body}</p>
                <p className={`mt-1 text-xs ${outbound ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{message.phone_number}</p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
