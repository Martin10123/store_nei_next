export type PresetConfig = {
  requires_expiration?: boolean;
  variable_weight?: boolean;
};

export type Preset = {
  id: number;
  name: string;
  description: string | null;
  config: PresetConfig;
};

export type Business = {
  id: number;
  name: string;
  business_type_preset_id: number;
  preset?: Preset;
};

export type User = {
  id: number;
  full_name: string;
  email: string;
  role: string;
};

export type Session = {
  token: string;
  user: User;
  business: Business;
};

export type Category = {
  id: number;
  name: string;
  business_id: number | null;
};

export type Unit = {
  id: number;
  name: string;
  abbreviation: string;
};

export type Product = {
  id: number;
  name: string;
  category_id: number | null;
  unit_of_measure_id: number;
  barcode: string | null;
  cost_price: string;
  sale_price: string;
  current_stock: string;
  minimum_stock: string;
  expiration_date: string | null;
  category: { id: number; name: string } | null;
  unit_of_measure: { id: number; name: string; abbreviation: string } | null;
};

const KEY = "tenderos.session";

let cachedRaw: string | null | undefined;
let cachedSession: Session | null = null;

export function readSession(): Session | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(KEY);
  if (raw === cachedRaw) {
    return cachedSession;
  }

  cachedRaw = raw;
  if (!raw) {
    cachedSession = null;
    return cachedSession;
  }

  try {
    cachedSession = JSON.parse(raw) as Session;
  } catch {
    cachedSession = null;
  }

  return cachedSession;
}

export function saveSession(session: Session) {
  const raw = JSON.stringify(session);
  localStorage.setItem(KEY, raw);
  cachedRaw = raw;
  cachedSession = session;
}

export function clearSession() {
  localStorage.removeItem(KEY);
  cachedRaw = null;
  cachedSession = null;
}
