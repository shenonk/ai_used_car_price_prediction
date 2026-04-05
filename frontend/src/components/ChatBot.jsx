import React, { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const quickReplies = [
  {
    id: "sell-car",
    label: "Sell a Car",
    response: "To sell, click 'Marketplace' in the sidebar and use the 'Publish Ad' button!",
  },
  {
    id: "ai-accuracy",
    label: "AI Accuracy",
    response: "Our model is 87% accurate based on current Sri Lankan market data.",
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
  const [botMessage, setBotMessage] = useState(() => getGreetingForPath(window.location.pathname));

  useEffect(() => {
    const pathname = window.location.pathname;
    setIsOpen(false);
    setBotMessage(getGreetingForPath(pathname));
  }, [location.pathname]);

  const scrollToContactForm = () => {
    window.setTimeout(() => {
      const contactSection = document.getElementById("contact-us-section");
      contactSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  const handleQuickReply = (replyId) => {
    if (replyId === "talk-human") {
      setIsOpen(false);

      if (window.location.pathname === "/help") {
        scrollToContactForm();
        return;
      }

      navigate("/help");
      scrollToContactForm();
      return;
    }

    const selectedReply = quickReplies.find((reply) => reply.id === replyId);
    if (selectedReply?.response) {
      setBotMessage(selectedReply.response);
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

          <div className="space-y-5 px-5 py-5">
            <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-blue-300/10 bg-[#102f57]/85 px-4 py-3 text-sm leading-relaxed text-slate-100 shadow-inner shadow-blue-950/20">
              {botMessage}
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
