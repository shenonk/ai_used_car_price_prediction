import React, { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../utils/auth";
import { supabase } from "../utils/supabaseClient";

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
    if (name === "email") return;
    setContactDraft((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const submitContactTicket = async (event) => {
    event.preventDefault();

    const payload = {
      user_name: contactDraft.name.trim(),
      message: contactDraft.message.trim(),
      status: "open",
    };

    if (!payload.user_name || !contactDraft.email.trim() || !payload.message) {
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
      const { data } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token;
      if (!accessToken) {
        throw new Error("Please sign in before sending a message to admin.");
      }

      const response = await fetch(`${API_BASE_URL}/api/support-ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
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
    <div className="chatbot-shell">
      {isOpen && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <div>
              <p className="chatbot-eyebrow">Support Bot</p>
              <h3>AutoValue Assistant</h3>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close support bot" className="chatbot-close">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="chatbot-content">
            <div className="chatbot-messages">
              {messages.map((message) => (
                <div key={message.id} className={`chatbot-message-wrap ${message.role === "user" ? "chatbot-message-wrap--user" : ""}`}>
                  <div className={`chatbot-message ${message.role === "user" ? "chatbot-message--user" : "chatbot-message--assistant"} ${message.isPending ? "chatbot-message--pending" : ""}`}>
                    {message.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="chatbot-quick-replies">
              {quickReplies.map((reply) => (
                <button key={reply.id} type="button" onClick={() => handleQuickReply(reply.id)} className="chatbot-chip">
                  {reply.label}
                </button>
              ))}
            </div>

            {contactMode ? (
              <form onSubmit={submitContactTicket} className="chatbot-contact-form">
                <div className="chatbot-contact-grid">
                  <input type="text" name="name" value={contactDraft.name} onChange={handleContactChange} placeholder="Your name" className="chatbot-input" />
                  <input type="email" name="email" value={contactDraft.email} onChange={handleContactChange} placeholder="Email" readOnly className="chatbot-input" />
                </div>
                <textarea name="message" value={contactDraft.message} onChange={handleContactChange} placeholder="Message to admin" rows={3} className="chatbot-input chatbot-textarea" />
                <div className="chatbot-contact-actions">
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
                    className="chatbot-secondary-button"
                  >
                    Full form
                  </button>
                  <button type="submit" className="chatbot-primary-button" disabled={isSendingTicket}>
                    <Send className="h-3.5 w-3.5" />
                    {isSendingTicket ? "Sending..." : "Send to Admin"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="chatbot-input-row">
                <input type="text" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask about prices, ads, loans..." className="chatbot-input chatbot-input--message" />
                <button type="submit" aria-label="Send message" className="chatbot-send" disabled={!draft.trim() || isAsking}>
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="chatbot-launcher-wrap">
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} aria-label={isOpen ? "Hide support bot" : "Open support bot"} className="chatbot-launcher">
          <MessageCircle className="relative h-7 w-7" />
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
