"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";


export function useGroupChat(groupId: string) {
  const supabase = createClient();

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select(
          `
          *,
          sender:users(
            id,
            name
          )
        `,
        )
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });

      setMessages(data || []);
      setLoading(false);
    };

    loadMessages();

    const channel = supabase
      .channel(`chat-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("messages")
            .select(
              `
              *,
              sender:users(
                id,
                name
              )
            `,
            )
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data]);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  const sendMessage = async (senderId: string, content: string) => {
    return supabase.from("messages").insert({
      group_id: groupId,
      sender_id: senderId,
      content,
    });
  };

  return {
    messages,
    loading,
    sendMessage,
  };
}
