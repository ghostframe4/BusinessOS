"use client";

import { useEffect, useState } from "react";

/** Espelha `LiveActivity` de app/api/activity/route.ts. */
export interface LiveActivity {
  slug: string;
  action: "read" | "write";
  entityId: string | null;
  title: string | null;
  ts: number;
}

/** Intervalo de polling — curto o bastante para parecer "ao vivo". */
const POLL_MS = 1500;

/**
 * Faz polling de `/api/activity` e devolve os agentes operando AGORA no terminal
 * (batimentos dentro da janela do servidor). Some sozinho quando o agente para,
 * porque o proprio endpoint deixa de retornar batimentos expirados.
 *
 * Tolerante a falhas: um fetch que erra mantem o ultimo estado (sem "piscar").
 */
export function useLiveActivity(): LiveActivity[] {
  const [active, setActive] = useState<LiveActivity[]>([]);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    async function poll(): Promise<void> {
      try {
        const res = await fetch("/api/activity", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { active?: LiveActivity[] };
        if (alive && Array.isArray(data.active)) setActive(data.active);
      } catch {
        // rede/abort: mantem o ultimo estado ate o proximo ciclo.
      }
    }

    void poll();
    const timer = setInterval(() => void poll(), POLL_MS);
    return () => {
      alive = false;
      controller.abort();
      clearInterval(timer);
    };
  }, []);

  return active;
}
