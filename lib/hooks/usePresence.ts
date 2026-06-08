"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export function usePresence(groupId: string, userName: string) {
  const supabase = createClient();

  const [onlineCount, setOnlineCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const channelRef = useRef<any>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  // Keep userName in a ref so setTyping/stopTyping always use the latest value
  const userNameRef = useRef(userName);
  useEffect(() => {
    userNameRef.current = userName;
  }, [userName]);

  useEffect(() => {
    // Wait until BOTH are ready
    if (!groupId || !userName) return;

    // Clean up any existing channel before creating a new one
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const room = supabase.channel(`presence:${groupId}`);

    room
      .on("presence", { event: "sync" }, () => {
        const state = room.presenceState();

        const latestByUser = new Map<string, boolean>();

        Object.values(state).forEach((presences: any[]) => {
            const latest = presences[presences.length - 1];
            if (!latest?.userName) return;
            latestByUser.set(latest.userName, latest.typing === true);
        });

        setOnlineCount(latestByUser.size);

        const typingUsersList = Array.from(latestByUser.entries())
          .filter(([name, typing]) => typing === true && name !== userNameRef.current)
          .map(([name]) => name);

        setTypingUsers(typingUsersList);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await room.track({
            userName,
            typing: false,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = room;

    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      supabase.removeChannel(room);
      channelRef.current = null;
    };
  }, [groupId, userName]); // 👈 userName in deps — re-runs once name loads

  const setTyping = async () => {
    if (!channelRef.current) return;
    await channelRef.current.track({ userName: userNameRef.current, typing: true });

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(async () => {
      if (!channelRef.current) return;
      await channelRef.current.track({ userName: userNameRef.current, typing: false });
    }, 1500);
  };

  const stopTyping = async () => {
    if (!channelRef.current) return;
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = null;
    }
    await channelRef.current.track({ userName: userNameRef.current, typing: false });
  };

  return { onlineCount, typingUsers, setTyping, stopTyping };
}