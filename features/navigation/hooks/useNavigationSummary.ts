"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function useNavigationSummary() {
  const pathname = usePathname();
  const [summary, setSummary] = useState({ authenticated: false, friendRequests: 0, invites: 0 });
  useEffect(() => {
    let active = true;
    let generation = 0;
    const refresh = async () => {
      const request = ++generation;
      try {
        const response = await fetch("/api/navigation", { cache: "no-store" });
        if (!response.ok) throw new Error("Navigation unavailable");
        const next = await response.json();
        if (active && request === generation) setSummary(next);
      } catch {
        if (active && request === generation) setSummary({ authenticated: false, friendRequests: 0, invites: 0 });
      }
    };
    const update = () => { void refresh(); };
    update();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") update();
    }, 10000);
    const channel = typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel("showup-navigation") : null;
    if (channel) channel.onmessage = update;
    window.addEventListener("focus", update);
    window.addEventListener("online", update);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("showup:network-changed", update);
    return () => {
      active = false;
      window.clearInterval(timer);
      channel?.close();
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("focus", update);
      window.removeEventListener("online", update);
      window.removeEventListener("showup:network-changed", update);
    };
  }, [pathname]);
  return summary;
}
