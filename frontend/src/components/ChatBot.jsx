import React, { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const quickReplies = [
  {
    id: "sell-car",
    label: "Sell a Car",
  },
  {
    id: "ai-accuracy",
    label: "AI Accuracy",
  },
  {
    id: "talk-human",
    label: "Talk to Human",
  },
];

const getGreetingForPath = (pathname) => {
  if (pathname === "/price-check") {
    return "Need help valuing your car? Our AI uses 2026 Sri Lankan market trends.";
  }

  if (pathname === "/marketplace") {
    return "Looking for a deal? I can help you filter by brand or price.";
  }

  return "Hi there! I'm the AutoValue Assistant. How can I help you today?";
};

const ChatBot = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [contactMode, setContactMode] = useState(false);
  const [contactDraft, setContactDraft] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSendingTicket, setIsSendingTicket] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: getGreetingForPath(window.location.pathname),
    },
  ]);
  const messagesEndRef = useRef(null);

  const currentGreeting = useMemo(() => getGreetingForPath(location.pathname), [location.pathname]);

  useEffect(() => {
    setIsOpen(false);
    setDraft("");
    setContactMode(false);
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: currentGreeting,
      },
    ]);
  }, [currentGreeting]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages]);

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        if (!user) return;
        setContactDraft((current) => ({
          ...current,
          name: current.name || user.username || user.email?.split("@")[0] || "",
          email: current.email || user.email || "",
        }));
      })
      .catch(() => {});
  }, []);

  const scrollToContactForm = () => {
    window.setTimeout(() => {
      const contactSection = document.getElementById("contact-us-section");
      contactSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  const handleQuickReply = (replyId) => {
    if (replyId === "talk-human") {
      setContactMode(true);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Send your message here and it will appear in the admin Contact Messages inbox.",
        },
      ]);
      return;
    }

    const selectedReply = quickReplies.find((reply) => reply.id === replyId);
    if (selectedReply) {
      sendMessage(selectedReply.label);
    }
  };

  const sendMessage = async (message) => {
    const content = message.trim();
    if (!content) return;

    const outgoingHistory = messages
      .filter((item) => item.role === "user" || item.role === "assistant")
      .slice(-8)
      .map((item) => ({
        role: item.role,
        content: item.content,
      }));

    const typingId = crypto.randomUUID();
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        content,
      },
      {
        id: typingId,
        role: "assistant",
        content: "Thinking...",
        isPending: true,
      },
    ]);
    setDraft("");

    try {
      setIsAsking(true);
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          history: outgoingHistory,
          pathname: location.pathname,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.detail?.error || "The assistant could not answer right now.");
      }

      setMessages((current) =>
        current.map((item) =>
          item.id === typingId
            ? {
                ...item,
                content: result.message || "I could not find an answer for that.",
                isPending: false,
              }
            : item
        )
      );
    } catch (error) {
      setMessages((current) =>
        current.map((item) =>
          item.id === typingId
            ? {
                ...item,
                content: error.message || "The assistant is unavailable right now. Please try again.",
                isPending: false,
              }
            : item
        )
      );
    } finally {
      setIsAsking(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(draft);
  };

  const handleContactChange = (event) => {
    const { name, value } = event.target;
    setContactDraft((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const submitContactTicket = async (event) => {
    event.preventDefault();

    const payload = {
      user_name: contactDraft.name.trim(),
      user_email: contactDraft.email.trim(),
      message: contactDraft.message.trim(),
      status: "open",
    };

    if (!payload.user_name || !payload.user_email || !payload.message) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Please add your name, email, and message before sending it to admin.",
        },
      ]);
      return;
    }

    try {
      setIsSendingTicket(true);
      const response = await fetch(`${API_BASE_URL}/api/support-ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to send your message right now.");
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: payload.message,
        },
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Done. Your message was sent to admin and is now in Contact Messages.",
        },
      ]);
      setContactDraft((current) => ({
        ...current,
        message: "",
      }));
      setContactMode(false);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: error.message || "Unable to send your message right now. Please try again.",
        },
      ]);
    } finally {
      setIsSendingTicket(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-4 sm:bottom-6 sm:right-6">
      {isOpen && (
        <div
          className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-blue-400/20 bg-[#0f2747]/75 shadow-[0_20px_60px_rgba(15,39,71,0.45)]"
          style={{ backdropFilter: "blur(10px)" }}
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200/70">Support Bot</p>
              <h3 className="mt-1 text-lg font-semibold text-white">AutoValue Assistant</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close support bot"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4 px-5 py-5">
            <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-inner ${
                      message.role === "user"
                        ? "rounded-br-md border border-cyan-300/10 bg-cyan-500/20 text-cyan-50 shadow-cyan-950/20"
                        : "rounded-bl-md border border-blue-300/10 bg-[#102f57]/85 text-slate-100 shadow-blue-950/20"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex flex-wrap gap-3">
              {quickReplies.map((reply) => (
                <button
                  key={reply.id}
                  type="button"
                  onClick={() => handleQuickReply(reply.id)}
                  className="rounded-full border border-blue-300/15 bg-white/5 px-4 py-2 text-sm font-medium text-blue-50 transition hover:border-blue-300/35 hover:bg-blue-400/15"
                >
                  {reply.label}
                </button>
              ))}
            </div>

            {contactMode ? (
              <form onSubmit={submitContactTicket} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    name="name"
                    value={contactDraft.name}
                    onChange={handleContactChange}
                    placeholder="Your name"
                    className="min-w-0 rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-blue-300/45"
                  />
                  <input
                    type="email"
                    name="email"
                    value={contactDraft.email}
                    onChange={handleContactChange}
                    placeholder="Email"
                    className="min-w-0 rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-blue-300/45"
                  />
                </div>
                <textarea
                  name="message"
                  value={contactDraft.message}
                  onChange={handleContactChange}
                  placeholder="Message to admin"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-blue-300/45"
                />
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setContactMode(false);
                      if (window.location.pathname === "/help") {
                        scrollToContactForm();
                        return;
                      }
                      navigate("/help");
                      scrollToContactForm();
                    }}
                    className="rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
                  >
                    Full form
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSendingTicket}
                  >
                    <Send className="h-3.5 w-3.5" />
                    {isSendingTicket ? "Sending..." : "Send to Admin"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Ask about prices, ads, loans..."
                  className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-blue-300/45 focus:bg-white/10"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-blue-300/20 bg-blue-500 text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!draft.trim() || isAsking}
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="relative">
        <span className="pointer-events-none absolute inset-0 rounded-full bg-[#2563eb]/35 animate-ping"></span>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? "Hide support bot" : "Open support bot"}
          className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#2563eb] text-white shadow-[0_16px_40px_rgba(37,99,235,0.4)] transition hover:scale-105 hover:bg-[#1d4ed8]"
        >
          <MessageCircle className="h-7 w-7" />
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
