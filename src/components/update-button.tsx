"use client";

import { useEffect, useState } from "react";
import { hasNewVersion } from "@/lib/version";

const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "local";

async function remoteVersion(): Promise<string | null> {
  const response = await fetch(`/api/version?t=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) return null;
  const body = (await response.json()) as { version?: string };
  return typeof body.version === "string" ? body.version : null;
}

function reloadApp() {
  const url = new URL(window.location.href);
  url.searchParams.set("v", Date.now().toString());
  window.location.replace(url.toString());
}

export function useUpdateAvailable() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function look() {
      try {
        const remote = await remoteVersion();
        if (!cancelled) setAvailable(hasNewVersion(currentVersion, remote));
      } catch {
        if (!cancelled) setAvailable(false);
      }
    }

    void look();
    const timer = window.setInterval(() => void look(), 60_000);
    window.addEventListener("focus", look);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", look);
    };
  }, []);

  return available;
}

export function UpdateCartel() {
  const available = useUpdateAvailable();
  if (!available) return null;

  return (
    <div className="fixed inset-x-0 top-3 z-50 px-3">
      <div className="glass mx-auto flex max-w-xl items-center justify-between gap-3 rounded-full px-4 py-2">
        <p className="text-sm font-medium">Hay código nuevo</p>
        <button type="button" onClick={reloadApp} className="rounded-full bg-ink px-4 py-1.5 text-sm font-semibold text-paper">
          Actualizar
        </button>
      </div>
    </div>
  );
}

export function UpdateButton() {
  return (
    <button type="button" onClick={reloadApp} className="rounded-full border border-line bg-card px-3 py-1.5 text-sm font-semibold">
      Actualizar
    </button>
  );
}
