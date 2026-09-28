export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  errors?: Record<string, string[]>;

  constructor(message: string, errors?: Record<string, string[]>) {
    super(message);
    this.errors = errors;
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const first = error.errors ? Object.values(error.errors)[0]?.[0] : undefined;
    return first ?? error.message;
  }

  return "No pudimos conectar con el servidor.";
}

export async function api<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}/api${path}`, { ...options, headers });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.message ?? "Error", data.errors);
  }

  return data as T;
}
