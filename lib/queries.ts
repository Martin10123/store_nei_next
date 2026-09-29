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
  dashboard: ["dashboard"],
  alerts: ["alerts"],
  suppliers: ["suppliers"],
  supplierPrices: ["supplier-prices"],
  priceQuotes: ["price-quotes"],
  endCustomers: ["end-customers"],
  deliveryOrders: ["delivery-orders"],
  whatsapp: ["whatsapp-messages"],
  branches: ["branches"],
  business: ["business"],
};

export function useStoreQuery<T>(key: readonly string[], path: string, enabled = true) {
  const session = useSession();

  return useQuery({
    queryKey: key,
    queryFn: () => api<T>(path, {}, session?.token),
    enabled: Boolean(session?.token) && enabled,
  });
}
