import React, { useState } from 'react';
import { Search, ArrowRight, Sparkles, Info } from 'lucide-react';
import { Container } from '../common/Container';
import { Button } from '../common/Button';
import { useRouter } from '../../context/RouterContext';
import { RoutePath } from '../../types';

export const AiInterfacePreview: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const { navigate } = useRouter();

  const examplePrompts: { text: string; targetRoute: RoutePath; category: string }[] = [
    { text: 'Find a course for me', targetRoute: '/academy', category: 'Academy' },
    { text: 'Help me choose a product', targetRoute: '/marketplace', category: 'Marketplace' },
    { text: 'I need a website for my business', targetRoute: '/services', category: 'Tech & Services' },
    { text: 'What can I learn here?', targetRoute: '/academy', category: 'Academy' },
  ];

  const handleSelectPrompt = (prompt: typeof examplePrompts[0]) => {
    navigate('/ai');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate('/ai');
  };

  return (
    <section className="py-16 sm:py-24 bg-[#011B33]/60 border-b border-[#0682F4]/20 relative">
      <Container size="default">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-8">
          <div className="flex items-center justify-center gap-2 text-xs font-mono tracking-widest text-[#08E6F9] uppercase">
            <span>Interface Architecture</span>
            <span aria-hidden="true">·</span>
            <span>Upcoming Intelligence</span>
          </div>

          <h2 className="font-display font-bold text-2xl sm:text-4xl text-white tracking-tight">
            ASK NEXOVIRA
          </h2>

          <p className="text-sm sm:text-base text-[#CCD2D9] max-w-xl mx-auto font-normal">
            A future intelligent interface designed to connect queries across learning,
            commerce, services, and digital creation.
          </p>
        </div>

        {/* Visual Preview Console Container */}
        <div className="max-w-2xl mx-auto bg-[#01213D] border border-[#0682F4]/30 rounded-2xl p-4 sm:p-7 shadow-xl shadow-[#011629]/60 relative">
          
          {/* Phase 1 Advisory Header */}
          <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-3 mb-5 text-xs text-[#CCD2D9]/70">
            <span className="flex items-center gap-1.5 text-[#08E6F9] font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Visual Interface Preview</span>
            </span>
            <span>Phase 1 Architecture</span>
          </div>

          {/* Search Query Form */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-[#0682F4] pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setStatusMessage(null);
                }}
                placeholder="What would you like to explore today?"
                className="w-full bg-[#011629] text-white text-sm sm:text-base pl-12 pr-28 py-3.5 rounded-xl border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none focus:ring-2 focus:ring-[#08E6F9]/20 placeholder:text-[#CCD2D9]/40 transition-colors"
              />
              <div className="absolute right-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="h-9 px-3 text-xs"
                >
                  <span>Inquire</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </form>

          {/* Example Prompts (Functional Tabs/Buttons) */}
          <div className="mt-5 space-y-2">
            <div className="text-xs text-[#CCD2D9]/60 font-medium">
              Try an ecosystem inquiry:
            </div>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((prompt) => {
                const isSelected = selectedPrompt === prompt.text;
                return (
                  <button
                    key={prompt.text}
                    type="button"
                    onClick={() => handleSelectPrompt(prompt)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer text-left whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#0682F4]/30 text-white border-[#08E6F9]'
                        : 'bg-[#011629]/80 text-[#CCD2D9] border-[#0682F4]/20 hover:border-[#08E6F9]/50 hover:text-white'
                    }`}
                  >
                    "{prompt.text}"
                  </button>
                );
              })}
            </div>
          </div>

          {/* Honest Status & Mapping Callout */}
          {statusMessage && (
            <div className="mt-5 p-3.5 rounded-lg bg-[#011629] border border-[#0682F4]/30 text-xs text-[#CCD2D9] flex items-start gap-2.5 animate-in fade-in duration-200">
              <Info className="w-4 h-4 text-[#08E6F9] shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="leading-relaxed">{statusMessage}</p>
                {selectedPrompt && (
                  <div className="pt-1">
                    <button
                      onClick={() => {
                        const target = examplePrompts.find((p) => p.text === selectedPrompt);
                        if (target) navigate(target.targetRoute);
                      }}
                      className="text-[#08E6F9] hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      <span>Explore this ecosystem area</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Architectural transparency note */}
          <p className="mt-4 text-[11px] text-[#CCD2D9]/50 text-center">
            Zero synthetic simulation · Future phases will introduce live model inference across ecosystem databases
          </p>
        </div>
      </Container>
    </section>
  );
};
