"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSession } from "@/lib/use-session";

export const queryKeys = {
  products: ["products"],
  categories: ["categories"],
  units: ["units"],
  movements: ["inventory-movements"],
  customers: ["credit-customers"],
  sales: ["sales"],
  closes: ["daily-closes"],
};

export function useStoreQuery<T>(key: readonly string[], path: string, enabled = true) {
  const session = useSession();

  return useQuery({
    queryKey: key,
    queryFn: () => api<T>(path, {}, session?.token),
    enabled: Boolean(session?.token) && enabled,
  });
}
