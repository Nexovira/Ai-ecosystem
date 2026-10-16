import React, { useState, useEffect, useRef } from 'react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { AiMessage, AiCapabilityId, AiSystemStatus } from '../../types/ai';
import {
  Sparkles,
  Send,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ShoppingBag,
  GraduationCap,
  Briefcase,
  BookOpen,
  Share2,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

export const AiAssistantPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [activeCapability, setActiveCapability] = useState<AiCapabilityId>('ECOSYSTEM_ASSISTANT');
  const [systemStatus, setSystemStatus] = useState<AiSystemStatus | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check AI status
    fetch('/api/ai/status')
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setSystemStatus(res.status);
      })
      .catch(() => {});

    // Initial greeting message
    const initialSession = `sess_${Date.now()}`;
    setSessionId(initialSession);
    setMessages([
      {
        id: 'msg_welcome',
        role: 'assistant',
        content: `Hello! I am the Nexovira AI Ecosystem Assistant. I can help guide you across our verified marketplace hardware, academy curriculums and scholarships, digital download kits, and tech services. How can I assist you today?`,
        timestamp: new Date().toISOString(),
        suggestedPrompts: [
          'What laptops are available in the marketplace?',
          'How do Academy merit scholarships work?',
          'How do I hire a verified tech expert?',
          'What architectural digital kits can I download?',
        ],
        contextLinks: [
          { label: 'Browse Marketplace', url: '/marketplace' },
          { label: 'Explore Academy', url: '/academy' },
          { label: 'Tech & Services', url: '/services' },
        ],
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    setErrorNotice(null);
    const userMsg: AiMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (user) {
        headers['x-user-id'] = user.uid;
        headers['x-user-role'] = profile?.role || 'CUSTOMER';
      }

      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: text,
          sessionId,
          capabilityId: activeCapability,
        }),
      });

      const data = await res.json();
      if (!data.success && data.error) {
        setErrorNotice(data.error);
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: 'assistant',
            content: data.error,
            timestamp: new Date().toISOString(),
          },
        ]);
        return;
      }

      if (data.sessionId) setSessionId(data.sessionId);

      const asstMsg: AiMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: data.message || 'I processed your query.',
        timestamp: new Date().toISOString(),
        contextLinks: data.contextLinks || [],
        suggestedPrompts: data.suggestedPrompts || [],
      };

      setMessages((prev) => [...prev, asstMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reach AI service';
      setErrorNotice(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `clear_${Date.now()}`,
        role: 'assistant',
        content: 'Conversation history reset. What would you like to explore next?',
        timestamp: new Date().toISOString(),
        suggestedPrompts: [
          'Show me verified tech products in stock',
          'Explain the 10% affiliate referral commission',
          'How do digital product downloads work?',
        ],
      },
    ]);
  };

  return (
    <div className="py-8 sm:py-12 bg-[#000000] min-h-[85vh] text-white">
      <Container size="default">
        {/* Header Bar */}
        <div className="max-w-4xl mx-auto space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#0682F4]/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0682F4] to-[#08E6F9] flex items-center justify-center text-[#01213D] shadow-lg shadow-[#0682F4]/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl sm:text-2xl text-white tracking-tight flex items-center gap-2">
                  <span>Nexovira AI Assistant</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0682F4]/20 text-[#08E6F9] border border-[#0682F4]/40">
                    Gemini 3.8 Flash
                  </span>
                </h1>
                <p className="text-xs text-[#CCD2D9]/70">
                  Grounded across live marketplace inventory, academy programs, tech services, and creator kits.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearHistory}
                className="px-3 py-1.5 rounded-xl text-xs font-mono text-[#CCD2D9] hover:text-white bg-[#011B33] border border-[#0682F4]/30 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Reset Chat</span>
              </button>
            </div>
          </div>

          {/* Offline / Key Notice */}
          {systemStatus && !systemStatus.isConfigured && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>
                Note: GEMINI_API_KEY is currently unset or in placeholder mode. The assistant will report status and guide members using verified fallback directory links.
              </span>
            </div>
          )}
        </div>

        {/* Chat Interface Console */}
        <div className="max-w-4xl mx-auto bg-[#011B33] border border-[#0682F4]/30 rounded-2xl shadow-2xl flex flex-col h-[650px] overflow-hidden">
          
          {/* Chat Message Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-lg bg-[#0682F4]/20 border border-[#0682F4]/40 flex items-center justify-center text-[#08E6F9] shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-3 ${
                      isUser
                        ? 'bg-[#0682F4] text-white rounded-tr-none font-medium'
                        : 'bg-[#01213D] border border-[#0682F4]/30 text-[#CCD2D9] rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line text-white/90">{m.content}</p>

                    {/* Grounded Navigation Links */}
                    {m.contextLinks && m.contextLinks.length > 0 && (
                      <div className="pt-2 border-t border-[#0682F4]/20 flex flex-wrap gap-2">
                        {m.contextLinks.map((link: { label: string; url: string }, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => navigate(link.url as any)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#011629] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[11px] font-mono text-[#08E6F9] transition cursor-pointer"
                          >
                            <span>{link.label}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 justify-start items-center text-xs text-[#08E6F9] font-mono">
                <div className="w-8 h-8 rounded-lg bg-[#0682F4]/20 border border-[#0682F4]/40 flex items-center justify-center text-[#08E6F9] shrink-0">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </div>
                <span>Analyzing ecosystem records and drafting response...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Starter Chips */}
          <div className="px-4 sm:px-6 py-2.5 bg-[#011629] border-t border-[#0682F4]/20 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
            <span className="text-[10px] font-mono uppercase text-[#CCD2D9]/50 shrink-0">Suggested:</span>
            {[
              'Compare top laptops',
              'Explain Academy scholarships',
              'Hire a web developer',
              'Digital architecture kits',
            ].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
                className="px-2.5 py-1 rounded-lg bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#CCD2D9] hover:text-white text-[11px] font-mono whitespace-nowrap transition cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Message Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 sm:p-4 bg-[#011B33] border-t border-[#0682F4]/30 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about marketplace stock, courses, expert booking, or digital downloads..."
              disabled={loading}
              className="flex-1 bg-[#01213D] text-white text-xs sm:text-sm px-4 py-3 rounded-xl border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none transition disabled:opacity-50"
            />
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={!inputMessage.trim() || loading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Container>
    </div>
  );
};
