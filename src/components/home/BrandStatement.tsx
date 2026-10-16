import React from 'react';
import { Container } from '../common/Container';

export const BrandStatement: React.FC = () => {
  return (
    <section className="py-24 sm:py-36 bg-[#01213D] border-b border-[#0682F4]/15 relative overflow-hidden">
      {/* Subtle geometric horizon background lines */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <div className="w-[800px] h-[800px] border border-[#08E6F9] rounded-full" />
        <div className="w-[600px] h-[600px] border border-[#0682F4] rounded-full absolute" />
      </div>

      <Container size="default" className="relative z-10 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-xs font-mono tracking-[0.25em] text-[#08E6F9] uppercase">
            Core Philosophy
          </div>

          <h2 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight [text-wrap:balance]">
            BUILT FOR WHAT COMES NEXT.
          </h2>

          <p className="text-base sm:text-xl text-[#CCD2D9] max-w-2xl mx-auto leading-relaxed font-normal [text-wrap:balance]">
            Nexovira is being built as an evolving technology ecosystem —
            connecting useful digital experiences under one intelligent
            platform.
          </p>

          <div className="pt-6 flex items-center justify-center gap-3 text-xs font-mono text-[#CCD2D9]/60">
            <span>Modular</span>
            <span aria-hidden="true" className="text-[#0682F4]">/</span>
            <span>Intelligent</span>
            <span aria-hidden="true" className="text-[#0682F4]">/</span>
            <span>Independent</span>
          </div>
        </div>
      </Container>
    </section>
  );
};
