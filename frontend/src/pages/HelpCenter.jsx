import React, { useState } from 'react';
import { 
  Search, 
  BookOpen, 
  CreditCard, 
  ShieldCheck, 
  PlayCircle, 
  ChevronDown, 
  ChevronUp, 
  MessageCircle, 
  Mail,
  HelpCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const HelpCenter = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const categories = [
    {
      id: 'financing',
      title: 'Financing Basics',
      icon: <BookOpen className="w-8 h-8" />,
      description: 'Learn about loans, leasing, and credit requirements.'
    },
    {
      id: 'payments',
      title: 'Payment Methods',
      icon: <CreditCard className="w-8 h-8" />,
      description: 'Manage your bank details and payment schedules.'
    },
    {
      id: 'security',
      title: 'Account Security',
      icon: <ShieldCheck className="w-8 h-8" />,
      description: 'Keep your personal and financial data safe.'
    },
    {
      id: 'tutorials',
      title: 'App Tutorials',
      icon: <PlayCircle className="w-8 h-8" />,
      description: 'Step-by-step guides on using AutoValueLK.'
    }
  ];

  const faqs = [
    {
      id: 1,
      question: "How do I apply for vehicle financing?",
      answer: "You can apply directly through our 'Financing' page. Simply select your preferred lender, enter your details, and submit the application. Our team will review it within 24-48 hours."
    },
    {
      id: 2,
      question: "What are the current interest rates?",
      answer: "Interest rates vary by lender and based on your credit profile. Currently, they range from 8.5% to 14.2% per annum. You can compare real-time rates on our comparison table."
    },
    {
      id: 3,
      question: "How do I update my bank details?",
      answer: "Navigate to Settings > Payment Methods. From there, you can add, remove, or update your linked bank accounts for seamless transactions."
    }
  ];

  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] p-8 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Header Section */}
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
              className="w-full bg-[#1e293b]/50 border border-slate-700/50 py-4 pl-14 pr-6 rounded-full outline-none transition-all duration-300 focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/20 backdrop-blur-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <div 
              key={cat.id}
              className="group p-8 rounded-2xl border border-slate-700/50 bg-[#1e293b]/40 backdrop-blur-lg transition-all duration-300 hover:-translate-y-2 hover:border-[#3B82F6]/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] cursor-pointer"
            >
              <div className="w-16 h-16 rounded-xl bg-blue-500/10 flex items-center justify-center text-[#3B82F6] mb-6 group-hover:scale-110 transition-transform">
                {cat.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{cat.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{cat.description}</p>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="space-y-8 glass p-8 md:p-12 rounded-3xl">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold mb-2">Frequently Asked Questions</h2>
            <p className="text-slate-400">Quick answers to common questions about our platform.</p>
          </div>
          
          <div className="grid gap-4">
            {faqs.map((faq) => (
              <div 
                key={faq.id}
                className={`border border-slate-700/50 rounded-2xl overflow-hidden transition-all duration-300 ${openFaq === faq.id ? 'bg-[#1e293b]/60 border-slate-600/50' : 'bg-transparent'}`}
              >
                <button 
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
                >
                  <span className="text-lg font-medium">{faq.question}</span>
                  {openFaq === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-[#3B82F6]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                  )}
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${openFaq === faq.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="p-6 pt-0 text-slate-400 leading-relaxed border-t border-slate-700/30 mt-2">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support CTA */}
        <div className="flex flex-col items-center justify-center space-y-8 py-12 border-t border-slate-800/50">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
            <p className="text-slate-400">Our support team is available 24/7 to assist you.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <button className="flex-1 flex items-center justify-center gap-2 bg-[#3B82F6] hover:bg-[#2563eb] text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-[1.02] shadow-[0_4px_20px_rgba(59,130,246,0.3)]">
              <MessageCircle className="w-5 h-5" />
              Chat with Support
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-transparent border border-white/20 hover:bg-white/5 text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-[1.02]">
              <Mail className="w-5 h-5" />
              Email Us
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HelpCenter;
