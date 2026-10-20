"use client";
import { useEffect, useState } from "react";
import type { NavigationSummary } from "../types";
import { createClient } from "@/lib/supabase/client";
import { usePathname } from "next/navigation";

export function useNavigationSummary(initialSummary: NavigationSummary | null) {
  const pathname = usePathname();
  const [summary, setSummary] = useState<NavigationSummary | null>(initialSummary);
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
        // A failed refresh does not mean the player signed out.
      }
    };
    const update = () => { void refresh(); };
    update();
    const { data: { subscription } } = createClient().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        generation++;
        setSummary({ authenticated: false, greetingName: null, friendRequests: 0, invites: 0, friends: 0 });
      } else if (event === "SIGNED_IN") {
        setSummary((current) => current?.authenticated ? current : null);
        update();
      } else if (event === "USER_UPDATED") update();
    });
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
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("focus", update);
      window.removeEventListener("online", update);
      window.removeEventListener("showup:network-changed", update);
    };
  }, [pathname]);
  return summary;
}
