"use client";

import { useSyncExternalStore } from "react";
import { readSession } from "@/lib/session";

function subscribe() {
  return () => undefined;
}

function emptySession() {
  return null;
}

export function useSession() {
  return useSyncExternalStore(subscribe, readSession, emptySession);
}
