import React, { useState } from "react";
import {
  Search,
  BookOpen,
  CreditCard,
  ShieldCheck,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  Mail,
} from "lucide-react";

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");

  const categories = [
    {
      id: "financing",
      title: "Financing Basics",
      icon: <BookOpen className="w-8 h-8" />,
      description: "Learn about loans, leasing, and credit requirements.",
      keywords: ["loan", "leasing", "finance", "credit", "interest"],
      route: "/financing",
    },
    {
      id: "payments",
      title: "Payment Methods",
      icon: <CreditCard className="w-8 h-8" />,
      description: "Manage your bank details and payment schedules.",
      keywords: ["payment", "bank", "schedule", "installment", "details"],
      route: "/settings",
    },
    {
      id: "security",
      title: "Account Security",
      icon: <ShieldCheck className="w-8 h-8" />,
      description: "Keep your personal and financial data safe.",
      keywords: ["password", "security", "account", "login", "safe"],
      route: "/settings",
    },
    {
      id: "tutorials",
      title: "App Tutorials",
      icon: <PlayCircle className="w-8 h-8" />,
      description: "Step-by-step guides on using AutoValueLK.",
      keywords: ["guide", "tutorial", "results", "price", "dashboard"],
      route: "/price-check",
    },
  ];

  const faqs = [
    {
      id: 1,
      category: "financing",
      question: "How do I apply for vehicle financing?",
      answer:
        "You can apply through the Financing page. Compare lenders, review the estimated monthly cost, and continue with the provider that best matches your budget.",
    },
    {
      id: 2,
      category: "financing",
      question: "What are the current interest rates?",
      answer:
        "Interest rates vary by lender and your profile. The Financing page shows the currently available provider rates stored in the system for comparison.",
    },
    {
      id: 3,
      category: "payments",
      question: "How do I update my bank details?",
      answer:
        "Go to Settings to manage your saved preferences and account-related options. Payment and profile-related changes can be reviewed there.",
    },
    {
      id: 4,
      category: "security",
      question: "Where can I change my password?",
      answer:
        "Open Settings and use the Security tab to update your password and keep your account protected.",
    },
    {
      id: 5,
      category: "tutorials",
      question: "How do I start a vehicle price check?",
      answer:
        "Open Price Check, enter the vehicle details, and submit the form to generate a predicted vehicle value and related results.",
    },
  ];

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredCategories = categories.filter((cat) => {
    if (!normalizedQuery) return true;

    const haystack = `${cat.title} ${cat.description} ${cat.keywords.join(" ")}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const haystack = `${faq.question} ${faq.answer}`.toLowerCase();
    const matchesSearch = !normalizedQuery || haystack.includes(normalizedQuery);
    return matchesCategory && matchesSearch;
  });

  const handleCategoryClick = (category) => {
    setSelectedCategory(category.id);
    setOpenFaq(null);
  };

  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitSuccess("");
    setSubmitError("");
    setIsSubmitting(true);

    const payload = {
      user_name: formData.full_name.trim(),
      user_email: formData.email.trim(),
      message: formData.message.trim(),
      status: "open",
    };

    try {
      const response = await fetch("http://localhost:5000/api/support-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send support ticket.");
      }
    } catch (error) {
      setSubmitError(error.message || "We couldn't send your message right now. Please try again in a moment.");
      setIsSubmitting(false);
      return;
    }

    setFormData({
      full_name: "",
      email: "",
      message: "",
    });
    setSubmitSuccess("Thank you! Our support team will contact you shortly.");
    setIsSubmitting(false);
    window.setTimeout(() => {
      setSubmitSuccess("");
    }, 4000);
  };

  const isFormValid =
    formData.full_name.trim() &&
    formData.email.trim() &&
    formData.message.trim();

  return (
    <div className="theme-app-bg min-h-screen p-8 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-8 py-10">
          <h1 className="text-5xl font-bold tracking-tight">
            How can we <span className="gradient-text">help you?</span>
          </h1>

          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#3B82F6] transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search for articles, guides, or keywords..."
              className="w-full bg-[#1e293b]/50 border border-slate-700/50 py-4 pl-14 pr-6 rounded-full outline-none transition-all duration-300 focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/20 backdrop-blur-md theme-text-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {selectedCategory !== "all" && (
            <div className="flex items-center justify-center gap-3 text-sm">
              <span className="theme-text-secondary">
                Filtering by {categories.find((cat) => cat.id === selectedCategory)?.title}
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className="text-[#3B82F6] hover:text-blue-300 transition-colors"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCategories.map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => handleCategoryClick(cat)}
              className={`group p-8 rounded-2xl border backdrop-blur-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] text-left ${
                selectedCategory === cat.id
                  ? "border-[#3B82F6]/60 bg-[#1e293b]/70"
                  : "border-slate-700/50 bg-[#1e293b]/40 hover:border-[#3B82F6]/50"
              } cursor-pointer`}
            >
              <div className="w-16 h-16 rounded-xl bg-blue-500/10 flex items-center justify-center text-[#3B82F6] mb-6 group-hover:scale-110 transition-transform">
                {cat.icon}
              </div>
              <h3 className="theme-text-primary text-xl font-semibold mb-3">{cat.title}</h3>
              <p className="theme-text-secondary text-sm leading-relaxed">{cat.description}</p>
            </button>
          ))}
        </div>

        <div className="space-y-8 glass p-8 md:p-12 rounded-3xl">
          <div className="text-center md:text-left">
            <h2 className="theme-text-primary text-3xl font-bold mb-2">Frequently Asked Questions</h2>
            <p className="theme-text-secondary">Quick answers to common questions about our platform.</p>
          </div>

          <div className="grid gap-4">
            {filteredFaqs.length === 0 ? (
              <div className="theme-surface-soft rounded-2xl p-6 text-center">
                <p className="theme-text-primary text-lg font-medium">No matching help articles found.</p>
                <p className="theme-text-secondary mt-2">Try another keyword or clear the category filter.</p>
              </div>
            ) : (
              filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                    openFaq === faq.id ? "theme-surface border border-slate-600/50" : "theme-surface-soft"
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full p-6 flex items-center justify-between text-left transition-colors hover:bg-slate-800/30"
                  >
                    <span className="theme-text-primary text-lg font-medium">{faq.question}</span>
                    {openFaq === faq.id ? (
                      <ChevronUp className="w-5 h-5 text-[#3B82F6]" />
                    ) : (
                      <ChevronDown className="theme-text-muted w-5 h-5" />
                    )}
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      openFaq === faq.id ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="theme-text-secondary theme-divider mt-2 border-t p-6 pt-0 leading-relaxed">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div
          id="contact-us-section"
          className="flex flex-col items-center justify-center space-y-8 py-12 border-t border-slate-800/50 scroll-mt-24"
        >
          <div className="text-center">
            <h2 className="theme-text-primary text-2xl font-bold mb-2">Contact Us</h2>
            <p className="theme-text-secondary">Our support team is available 24/7 to assist you.</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Full Name"
                required
                className="w-full bg-[#1e293b]/50 border border-slate-700/50 py-4 px-5 rounded-xl outline-none transition-all duration-300 focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/20 backdrop-blur-md"
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email Address"
                required
                className="w-full bg-[#1e293b]/50 border border-slate-700/50 py-4 px-5 rounded-xl outline-none transition-all duration-300 focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/20 backdrop-blur-md"
              />
            </div>

            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Tell us how we can help..."
              required
              rows="6"
              className="w-full bg-[#1e293b]/50 border border-slate-700/50 py-4 px-5 rounded-2xl outline-none transition-all duration-300 focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/20 backdrop-blur-md resize-none"
            />

            <div className="flex flex-col items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 font-semibold text-white transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: isSubmitting || !isFormValid
                    ? "linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)"
                    : "linear-gradient(135deg, #2563eb 0%, #0891b2 100%)",
                  boxShadow: isSubmitting || !isFormValid
                    ? "none"
                    : "0 14px 30px rgba(37, 99, 235, 0.22)",
                }}
              >
                <Mail className="w-5 h-5" />
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>

              {submitSuccess && <p className="text-emerald-400 text-sm text-center">{submitSuccess}</p>}
              {submitError && <p className="text-rose-400 text-sm text-center">{submitError}</p>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
