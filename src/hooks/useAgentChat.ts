import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export function useAgentChat(agentId: string, conversationId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing messages via tRPC
  const messagesQuery = trpc.agentChat.getMessages.useQuery(
    { conversationId: conversationId! },
    { enabled: !!conversationId }
  );

  useEffect(() => {
    if (messagesQuery.data) {
      setMessages(
        messagesQuery.data.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content || "",
          created_at: m.createdAt?.toISOString?.() ?? String(m.createdAt),
        }))
      );
    }
  }, [messagesQuery.data]);

  // Realtime subscription for live agent messages
  useEffect(() => {
    if (!agentId || !conversationId) return;

    const channel = supabase
      .channel(`agent:${conversationId}`)
      .on("broadcast", { event: "message" }, ({ payload }) => {
        setMessages((prev) => {
          const newMsg: ChatMessage = {
            id: payload.id || crypto.randomUUID(),
            role: payload.role || "assistant",
            content: payload.content,
            created_at: payload.created_at || new Date().toISOString(),
          };
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        if (payload.role === "assistant") setIsLoading(false);
      })
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, conversationId]);

  const sendMessageMutation = trpc.agentChat.sendMessage.useMutation();

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId) return;

      setIsLoading(true);
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Send via tRPC (persists to DB), agent response comes via WebSocket
      sendMessageMutation.mutate({ conversationId, content });
    },
    [conversationId, sendMessageMutation]
  );

  return { messages, sendMessage, isConnected, isLoading };
}
