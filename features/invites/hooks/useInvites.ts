"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { notifyNavigationChanged } from "@/lib/navigation-events";
import { useAuth } from "@/lib/hooks/useAuth";
import { fetchInvites, respondToInvite } from "../data/invitesRepository";
import { MatchInvite } from "../types";
export function useInvites() {
  const router = useRouter();
  const { sessionUser, loading: authLoading } = useAuth();
  const userId = sessionUser?.id;
  const [invites, setInvites] = useState<MatchInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const busy = useRef(false);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    if (!userId) return;
    const request = ++generation.current;
    setLoading(true);
    try {
      const next = await fetchInvites(userId);
      if (request === generation.current) {
        setInvites(next);
        setError("");
      }
    } catch (cause) {
      if (request === generation.current)
        setError((cause as Error).message || "Could not load invitations.");
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [userId]);
  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      router.replace("/login?next=%2Finvites");
      return;
    }
    const update = () => void refresh();
    update();
    window.addEventListener("focus", update);
    window.addEventListener("online", update);
    return () => {
      generation.current++;
      window.removeEventListener("focus", update);
      window.removeEventListener("online", update);
    };
  }, [authLoading, userId, router, refresh]);
  const respond = async (id: string, action: "accept" | "decline") => {
    if (busy.current) return;
    busy.current = true;
    setBusyId(id);
    try {
      const result = await respondToInvite(id, action);
      notifyNavigationChanged();
      setInvites((current) => current.filter((invite) => invite.id !== id));
      toast.success(
        action === "accept" ? "Invite accepted." : "Invite declined.",
      );
      if (action === "accept" && result?.game_id)
        router.push(`/groups/${result.game_id}`);
    } catch (cause) {
      toast.error(
        (cause as Error).message || "Could not respond to this invite.",
      );
    } finally {
      busy.current = false;
      setBusyId("");
    }
  };
  return {
    invites,
    loading: loading || authLoading,
    error,
    busyId,
    refresh,
    respond,
  };
}
