"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api";
import { money } from "@/lib/money";
import { queryKeys, useStoreQuery } from "@/lib/queries";
import { useSession } from "@/lib/use-session";

type CreditCustomer = {
  id: number;
  full_name: string;
  phone: string | null;
  document_number: string | null;
  current_balance: string;
  credit_limit: string | null;
  is_active: boolean;
};

type CreditMovement = {
  id: number;
  movement_type: "charge" | "payment";
  amount: string;
  created_at: string;
};

const movementLabels = { charge: "Cargo", payment: "Abono" };

export function CreditsScreen() {
  const session = useSession();
  const queryClient = useQueryClient();
  const customersQuery = useStoreQuery<CreditCustomer[]>(queryKeys.customers, "/credit-customers");
  const customers = customersQuery.data ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const movementsQuery = useStoreQuery<CreditMovement[]>(
    ["credit-movements", String(selectedId ?? "")],
    `/credit-customers/${selectedId ?? 0}/movements`,
    selectedId !== null,
  );
  const movements = selectedId ? (movementsQuery.data ?? []) : [];
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [payment, setPayment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const selected = customers.find((customer) => customer.id === selectedId) ?? null;

  async function createCustomer(event: FormEvent) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const customer = await api<CreditCustomer>(
        "/credit-customers",
        {
          method: "POST",
          body: JSON.stringify({
            full_name: fullName,
            phone: phone || null,
            document_number: documentNumber || null,
            credit_limit: creditLimit === "" ? null : Number(creditLimit),
          }),
        },
        session.token,
      );
      queryClient.setQueryData<CreditCustomer[]>(queryKeys.customers, (previous = []) =>
        [...previous, customer].sort((a, b) => a.full_name.localeCompare(b.full_name, "es")),
      );
      setFullName("");
      setPhone("");
      setDocumentNumber("");
      setCreditLimit("");
      setSelectedId(customer.id);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  async function registerPayment(event: FormEvent) {
    event.preventDefault();
    if (!session || !selected) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const result = await api<{ customer: CreditCustomer; movement: CreditMovement }>(
        `/credit-customers/${selected.id}/payments`,
        { method: "POST", body: JSON.stringify({ amount: Number(payment) }) },
        session.token,
      );
      queryClient.setQueryData<CreditCustomer[]>(queryKeys.customers, (previous = []) =>
        previous.map((customer) => (customer.id === result.customer.id ? result.customer : customer)),
      );
      queryClient.setQueryData<CreditMovement[]>(["credit-movements", String(selected.id)], (previous = []) => [result.movement, ...previous]);
      setPayment("");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Fiados</h2>
        <p className="text-sm text-muted-foreground">Saldo, abonos e historial de cada cliente.</p>
      </div>
      <form className="grid gap-4 rounded-2xl border border-border bg-card shadow-sm p-4 sm:grid-cols-2" onSubmit={createCustomer}>
        <Field label="Nombre" required value={fullName} onChange={(event) => setFullName(event.target.value)} />
        <Field label="Teléfono" value={phone} onChange={(event) => setPhone(event.target.value)} />
        <Field label="Documento" value={documentNumber} onChange={(event) => setDocumentNumber(event.target.value)} />
        <Field label="Límite de crédito" type="number" min="0" step="1" value={creditLimit} onChange={(event) => setCreditLimit(event.target.value)} />
        <Button type="submit" size="lg" className="h-11 sm:col-span-2" disabled={pending}>
          {pending ? "Guardando…" : "Agregar fiado"}
        </Button>
      </form>
      {error || customersQuery.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error ?? errorMessage(customersQuery.error)}</p>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="bg-secondary text-left text-secondary-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Teléfono</th>
              <th className="px-4 py-3 font-medium">Saldo</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-muted-foreground" colSpan={4}>
                  Todavía no hay fiados.
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{customer.full_name}</td>
                  <td className="px-4 py-3">{customer.phone}</td>
                  <td className="px-4 py-3">{money.format(Number(customer.current_balance))}</td>
                  <td className="px-4 py-3 text-right">
                    <Button type="button" variant="outline" size="sm" onClick={() => setSelectedId(customer.id)}>
                      Ver
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {selected ? (
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card shadow-sm p-4">
          <h3 className="font-semibold">
            {selected.full_name} · {money.format(Number(selected.current_balance))}
          </h3>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={registerPayment}>
            <div className="sm:w-48">
              <Field label="Abono" type="number" min="1" step="1" required value={payment} onChange={(event) => setPayment(event.target.value)} />
            </div>
            <Button type="submit" className="h-11" disabled={pending}>
              Registrar abono
            </Button>
          </form>
          <ul className="flex flex-col gap-2 text-sm">
            {movements.length === 0 ? <li className="text-muted-foreground">Sin movimientos.</li> : null}
            {movements.map((movement) => (
              <li key={movement.id} className="flex justify-between border-t border-border py-2">
                <span>{movementLabels[movement.movement_type]}</span>
                <span>{money.format(Number(movement.amount))}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
