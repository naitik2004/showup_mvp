"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export function usePresence(groupId: string, userName: string) {
  const supabase = createClient();

  const [onlineCount, setOnlineCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [channel, setChannel] = useState<any>(null);

  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!groupId || !userName) return;

    const room = supabase.channel(`presence:${groupId}`);

    room
      .on("presence", { event: "sync" }, () => {
        const state = room.presenceState();

        const users: any[] = Object.values(state).flat() as any[];

        // Remove duplicates
        const uniqueUsers: any[] = [];

        users.forEach((user: any) => {
        if (
            !uniqueUsers.find(
            (u: any) => u.userName === user.userName
            )
        ) {
            uniqueUsers.push(user);
        }
        });

        setOnlineCount(uniqueUsers.length);

        const typing = uniqueUsers
          .filter(
            (u: any) =>
              u.typing === true &&
              u.userName !== userName
          )
          .map((u: any) => u.userName);

        setTypingUsers(typing);
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

    setChannel(room);

    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }

      supabase.removeChannel(room);
    };
  }, [groupId, userName]);

  const setTyping = async () => {
    if (!channel) return;

    await channel.track({
      userName,
      typing: true,
      online_at: new Date().toISOString(),
    });

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = setTimeout(async () => {
      await channel.track({
        userName,
        typing: false,
        online_at: new Date().toISOString(),
      });
    }, 1000);
  };

  const stopTyping = async () => {
    if (!channel) return;

    await channel.track({
      userName,
      typing: false,
      online_at: new Date().toISOString(),
    });

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
  };

  return {
    onlineCount,
    typingUsers,
    setTyping,
    stopTyping,
  };
}