"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, ImagePlus, Loader2 } from "lucide-react";

interface ChatMessage {
  id: string;
  user_id: string;
  message: string | null;
  photo_url: string | null;
  created_at: string;
  profile: {
    display_name: string;
    avatar_url: string | null;
  } | null;
}

interface ChatPanelProps {
  tournamentId: string;
  userId: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    month: "short",
    day: "numeric",
  });
}

export function ChatPanel({ tournamentId, userId }: ChatPanelProps) {
  const supabase = React.useMemo(() => createClient(), []);
  const { toast } = useToast();

  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [inputValue, setInputValue] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch messages
  const fetchMessages = React.useCallback(async () => {
    const { data } = await supabase
      .from("chat_messages")
      .select("id, user_id, message, photo_url, created_at, profile:profiles(display_name, avatar_url)")
      .eq("tournament_id", tournamentId)
      .order("created_at", { ascending: true })
      .limit(200);

    const normalized: ChatMessage[] = (data ?? []).map((m: any) => ({
      ...m,
      profile: Array.isArray(m.profile) ? m.profile[0] : m.profile,
    }));

    setMessages(normalized);
    setLoading(false);
    setTimeout(scrollToBottom, 100);
  }, [supabase, tournamentId, scrollToBottom]);

  // Subscribe to real-time
  React.useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`chat-${tournamentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        async (payload) => {
          // Fetch the new message with profile join
          const { data } = await supabase
            .from("chat_messages")
            .select("id, user_id, message, photo_url, created_at, profile:profiles(display_name, avatar_url)")
            .eq("id", payload.new.id)
            .single();

          if (data) {
            const msg: ChatMessage = {
              ...data,
              profile: Array.isArray((data as any).profile) ? (data as any).profile[0] : (data as any).profile,
            };
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            setTimeout(scrollToBottom, 100);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, tournamentId, fetchMessages, scrollToBottom]);

  // Send text message
  async function handleSend() {
    const text = inputValue.trim();
    if (!text) return;

    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      tournament_id: tournamentId,
      user_id: userId,
      message: text,
    });

    if (error) {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
    } else {
      setInputValue("");
    }
    setSending(false);
  }

  // Handle Enter key
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Handle photo upload
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Only images are allowed.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum 5MB allowed.", variant: "destructive" });
      return;
    }

    setSending(true);

    // Resize image client-side
    const resized = await resizeImage(file, 1920, 0.8);

    // Upload to Supabase Storage
    const fileName = `${tournamentId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("chat-photos")
      .upload(fileName, resized, { contentType: "image/jpeg" });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setSending(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("chat-photos").getPublicUrl(fileName);

    // Insert chat message with photo
    const { error } = await supabase.from("chat_messages").insert({
      tournament_id: tournamentId,
      user_id: userId,
      photo_url: urlData.publicUrl,
    });

    if (error) {
      toast({ title: "Failed to send photo", description: error.message, variant: "destructive" });
    }

    setSending(false);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Group messages by date
  let lastDate = "";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] min-h-[400px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-1 px-1">
        {messages.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No messages yet. Start the conversation!
          </p>
        )}

        {messages.map((msg) => {
          const date = formatDate(msg.created_at);
          let showDateDivider = false;
          if (date !== lastDate) {
            showDateDivider = true;
            lastDate = date;
          }

          const isOwn = msg.user_id === userId;
          const name = msg.profile?.display_name ?? "Player";

          return (
            <React.Fragment key={msg.id}>
              {showDateDivider && (
                <div className="flex items-center gap-2 py-2">
                  <div className="flex-1 border-t" />
                  <span className="text-[10px] text-muted-foreground">{date}</span>
                  <div className="flex-1 border-t" />
                </div>
              )}

              <div className={`flex gap-2 py-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                {!isOwn && (
                  <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                    <AvatarImage src={msg.profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                  {!isOwn && (
                    <span className="text-[10px] text-muted-foreground mb-0.5 px-1">{name}</span>
                  )}
                  <div
                    className={`rounded-xl px-3 py-1.5 text-sm ${
                      isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.message && <p className="whitespace-pre-wrap break-words">{msg.message}</p>}
                    {msg.photo_url && (
                      <img
                        src={msg.photo_url}
                        alt="Shared photo"
                        className="mt-1 max-w-full rounded-lg max-h-64 object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground px-1 mt-0.5">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t pt-3 mt-2">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
          >
            <ImagePlus className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
            size="icon"
            className="shrink-0"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Resize an image file client-side. Returns a Blob in JPEG format.
 */
async function resizeImage(file: File, maxWidth: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Could not get canvas context"));
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}
