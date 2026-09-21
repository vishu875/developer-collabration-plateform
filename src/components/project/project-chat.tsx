"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, ArrowLeft, Users, MessageSquare } from "lucide-react";
import Link from "next/link";

type Sender = {
  id: string;
  username: string;
  profilePicture: string;
};

type Message = {
  id: string;
  content: string;
  messageType: string;
  createdAt: string;
  sender: Sender;
};

type TeamMember = {
  id: string;
  username: string;
  profilePicture: string;
  bio: string;
};

type ProjectChatProps = {
  projectSlug: string;
  projectTitle: string;
  currentUserId: string;
};

export default function ProjectChat({
  projectSlug,
  projectTitle,
  currentUserId,
}: ProjectChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (silent = false): Promise<void> => {
    try {
      const res = await fetch(`/api/projects/${projectSlug}/messages`);
      if (!res.ok) {
        throw new Error("Failed to load project chat history");
      }
      const data = await res.json();

      // Determine if we need to auto-scroll (e.g., if there are new messages)
      const hasNewMessages = data.length > messages.length;

      setMessages(data);

      if (hasNewMessages || !silent) {
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load chat.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchTeamMembers = async (): Promise<void> => {
    try {
      const res = await fetch(`/api/projects/${projectSlug}/members`);
      if (!res.ok) {
        throw new Error("Failed to load team members");
      }
      const data = await res.json();
      setTeamMembers(data.members || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!ignore) {
        await fetchMessages();
        await fetchTeamMembers();
      }
    })();

    // Poll for new messages every 3 seconds
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 3000);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectSlug]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sending) return;

    setSending(true);
    const messageToSend = content;
    setContent("");

    try {
      const res = await fetch(`/api/projects/${projectSlug}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageToSend }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }

      const newMessage = await res.json();
      setMessages((prev) => [...prev, newMessage]);

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        <p className="text-xs text-zinc-500">Loading chat workspace...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 flex flex-col h-[78vh] gap-4">
      {/* Chat header */}
      <div className="glass rounded-t-2xl p-4 flex items-center justify-between border border-zinc-800 bg-zinc-950/40">
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${projectSlug}`}
            className="p-2 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-850 transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
          <div>
            <h1 className="font-bold text-white text-sm sm:text-base truncate max-w-[200px] sm:max-w-sm">
              {projectTitle}
            </h1>
            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1 mt-0.5">
              <Users className="h-3 w-3" />
              Team Chatroom
            </p>
          </div>
        </div>
      </div>

      {/* Main chat area with messages and team members */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Messages area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto glass p-6 space-y-4 min-h-0 border border-zinc-800 bg-zinc-950/20 custom-scrollbar rounded-t-2xl">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-center text-xs">
            {error}
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-2">
            <MessageSquare className="h-8 w-8 opacity-30 text-zinc-400" />
            <p className="text-xs text-zinc-500">No messages yet. Send a greeting to start the collaboration!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.sender.id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[80%] ${
                  isSelf ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {!isSelf && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={msg.sender.profilePicture}
                    alt={msg.sender.username}
                    className="w-7 h-7 rounded-full border border-zinc-850 object-cover mt-1 shrink-0"
                  />
                )}
                <div>
                  {!isSelf && (
                    <span className="text-[9px] text-zinc-550 pl-1 block mb-0.5">
                      @{msg.sender.username}
                    </span>
                  )}
                  <div
                    className={`p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                      isSelf
                        ? "bg-zinc-100 text-zinc-950 font-medium rounded-tr-none"
                        : "bg-zinc-950 text-zinc-200 border border-zinc-900 rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span
                    className={`text-[8px] text-zinc-650 mt-1 block px-1 ${
                      isSelf ? "text-right" : "text-left"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <form onSubmit={handleSendMessage} className="glass rounded-b-2xl p-4 border border-zinc-800 border-t-0 bg-zinc-950/40 flex gap-3">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your message here..."
          className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
        />
          <button
            type="submit"
            disabled={!content.trim() || sending}
            className="btn-primary rounded-xl px-5 py-3 transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
        </div>

        {/* Team Members Sidebar */}
        <div className="w-64 hidden lg:flex flex-col gap-4">
          {/* Toggle button for mobile */}
          <button
            onClick={() => setShowMembers(!showMembers)}
            className="lg:hidden w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white transition-colors text-xs font-semibold"
          >
            <Users className="h-4 w-4" />
            {showMembers ? "Hide" : "Show"} Team
          </button>

          {/* Members list */}
          <div className="glass rounded-2xl p-4 border border-zinc-800 bg-zinc-950/40 h-full overflow-y-auto custom-scrollbar">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" />
              In This Room
            </h3>
            <div className="space-y-2.5">
              {teamMembers.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">No team members</p>
              ) : (
                teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={member.profilePicture}
                      alt={member.username}
                      className="w-8 h-8 rounded-full border border-zinc-800 object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-200 truncate">
                        @{member.username}
                      </p>
                      {member.bio && (
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                          {member.bio.substring(0, 40)}...
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
