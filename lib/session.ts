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

export function readSession(): Session | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}
