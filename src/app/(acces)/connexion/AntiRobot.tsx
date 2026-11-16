"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
  }
}

/** Le widget anti-robot de Cloudflare, chargé seulement s'il est configuré. */
export function AntiRobot({ cle, surJeton }: { cle: string; surJeton: (jeton: string) => void }) {
  const zone = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let id: string | null = null;
    const afficher = () => {
      if (id || !zone.current || !window.turnstile) return;
      id = window.turnstile.render(zone.current, {
        sitekey: cle,
        callback: surJeton,
        "expired-callback": () => surJeton(""),
        "error-callback": () => surJeton(""),
        "refresh-expired": "auto",
        language: "fr",
        appearance: "interaction-only",
      });
    };
    const existant = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
    const script = existant ?? document.createElement("script");
    if (!existant) {
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.dataset.turnstile = "1";
      document.head.appendChild(script);
    }
    script.addEventListener("load", afficher);
    afficher();
    return () => {
      script.removeEventListener("load", afficher);
      if (id) window.turnstile?.remove(id);
    };
  }, [cle, surJeton]);

  return <div ref={zone} className="flex justify-center empty:hidden" />;
}

