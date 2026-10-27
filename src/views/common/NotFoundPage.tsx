import React, { useEffect } from 'react';
import {
  Compass,
  ArrowLeft,
  Home,
  ShoppingBag,
  GraduationCap,
  Wrench,
  Sparkles,
  Search,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { useRouter } from '../../context/RouterContext';

interface NotFoundPageProps {
  requestedPath?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ requestedPath }) => {
  const { navigate } = useRouter();

  useEffect(() => {
    document.title = '404 - Page Not Found | NEXOVIRA';
  }, []);

  const displayPath = requestedPath || (typeof window !== 'undefined' ? window.location.pathname : '');

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 bg-[#01213D]">
      <Container size="narrow">
        <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden backdrop-blur-sm">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#08E6F9]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#0682F4]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Compass Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-[#01213D] border border-[#0682F4]/40 flex items-center justify-center text-[#08E6F9] mx-auto mb-6 shadow-inner">
            <Compass className="w-8 h-8 animate-pulse" />
          </div>

          {/* 404 Status Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0682F4]/10 border border-[#0682F4]/30 text-[#08E6F9] text-xs font-mono font-semibold tracking-wider uppercase mb-4">
            <span>HTTP 404 · Unrecognized Route</span>
          </div>

          <h1 className="font-display font-bold text-3xl sm:text-4xl text-white mb-3">
            Destination Not Found
          </h1>

          <p className="text-sm sm:text-base text-[#CCD2D9] max-w-md mx-auto mb-4 leading-relaxed">
            The requested destination within the Nexovira ecosystem does not exist or has been relocated.
          </p>

          {displayPath && (
            <div className="inline-block px-3 py-1.5 rounded-lg bg-[#01213D] border border-[#0682F4]/20 text-[#08E6F9] text-xs font-mono mb-8 max-w-full truncate">
              {displayPath}
            </div>
          )}

          {/* Core Action */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Return to Home</span>
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/marketplace')}
              className="gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Marketplace</span>
            </Button>
          </div>

          {/* Quick Ecosystem Landmarks */}
          <div className="pt-8 border-t border-[#0682F4]/15">
            <p className="text-xs font-semibold text-[#CCD2D9]/70 uppercase tracking-wider mb-4">
              Explore Active Ecosystem Pillars
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => navigate('/services')}
                className="p-3 rounded-xl bg-[#01213D]/70 hover:bg-[#0682F4]/15 border border-[#0682F4]/20 hover:border-[#08E6F9]/40 text-[#CCD2D9] hover:text-white transition flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <Wrench className="w-4 h-4 text-[#08E6F9]" />
                <span className="font-medium">Services</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/academy')}
                className="p-3 rounded-xl bg-[#01213D]/70 hover:bg-[#0682F4]/15 border border-[#0682F4]/20 hover:border-[#08E6F9]/40 text-[#CCD2D9] hover:text-white transition flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-[#08E6F9]" />
                <span className="font-medium">Academy</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/ai')}
                className="p-3 rounded-xl bg-[#01213D]/70 hover:bg-[#0682F4]/15 border border-[#0682F4]/20 hover:border-[#08E6F9]/40 text-[#CCD2D9] hover:text-white transition flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#08E6F9]" />
                <span className="font-medium">AI Intelligence</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/search')}
                className="p-3 rounded-xl bg-[#01213D]/70 hover:bg-[#0682F4]/15 border border-[#0682F4]/20 hover:border-[#08E6F9]/40 text-[#CCD2D9] hover:text-white transition flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <Search className="w-4 h-4 text-[#08E6F9]" />
                <span className="font-medium">Search</span>
              </button>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};
