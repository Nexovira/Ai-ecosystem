import React from 'react';
import { ArrowRight, BookOpen, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import { Container } from '../common/Container';
import { Button } from '../common/Button';
import { useRouter } from '../../context/RouterContext';

export const AcademyPreview: React.FC = () => {
  const { navigate } = useRouter();

  const tracks = [
    {
      title: 'Practical Software Engineering',
      desc: 'Master full-stack architectures, modern web runtimes, and resilient systems design.',
    },
    {
      title: 'AI & Workflow Automation',
      desc: 'Harness LLMs, structured prompting, and autonomous agents for real-world impact.',
    },
    {
      title: 'Product Design & User Experience',
      desc: 'Build accessible, conversion-driven design systems from wireframe to deployment.',
    },
    {
      title: 'Digital Creation & Modern Business',
      desc: 'Transform technical craft into sustainable digital products and professional practices.',
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-[#01213D] border-b border-[#0682F4]/15 relative">
      <Container size="wide">
        <div className="bg-gradient-to-b from-[#011B33] to-[#011629] border border-[#0682F4]/30 rounded-2xl p-8 sm:p-14 lg:p-16 relative overflow-hidden shadow-2xl">
          
          {/* Subtle top ambient line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#08E6F9]/50 to-transparent" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#08E6F9] uppercase">
                <span>Nexovira Academy</span>
                <span aria-hidden="true">·</span>
                <span>Future Learning Sphere</span>
              </div>

              <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight leading-tight">
                LEARN. BUILD. GROW.
              </h2>

              <p className="text-base sm:text-lg text-[#CCD2D9] font-normal leading-relaxed">
                Nexovira Academy is being developed as an applied learning environment.
                Focused on hands-on craft, real engineering principles, and future
                scholarship pathways for emerging innovators.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {tracks.map((track) => (
                  <div key={track.title} className="p-4 rounded-lg bg-[#01213D]/80 border border-[#0682F4]/20 space-y-1">
                    <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#08E6F9] shrink-0" />
                      <span>{track.title}</span>
                    </div>
                    <p className="text-xs text-[#CCD2D9]/70 leading-normal pl-5.5">
                      {track.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/academy')}
                >
                  <span>Explore Academy Overview</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <span className="text-xs font-mono text-[#CCD2D9]/60">
                  Course enrollment and scholarship applications open in future phases.
                </span>
              </div>
            </div>

            {/* Right Card / Visual Pillar */}
            <div className="lg:col-span-5">
              <div className="bg-[#01213D] border border-[#0682F4]/40 rounded-xl p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="flex items-center justify-between pb-4 border-b border-[#0682F4]/20">
                  <span className="text-xs font-mono uppercase tracking-widest text-[#08E6F9]">
                    Academy Model
                  </span>
                  <Award className="w-5 h-5 text-[#0682F4]" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0682F4]/20 border border-[#0682F4]/40 flex items-center justify-center text-[#08E6F9] shrink-0 mt-0.5">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Project-First Curriculum</h4>
                      <p className="text-xs text-[#CCD2D9]/70 mt-0.5 leading-relaxed">
                        Practical problem-solving instead of passive memorization.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0682F4]/20 border border-[#0682F4]/40 flex items-center justify-center text-[#08E6F9] shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Scholarship Access Foundation</h4>
                      <p className="text-xs text-[#CCD2D9]/70 mt-0.5 leading-relaxed">
                        Structured pipelines to empower high-potential learners globally.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#0682F4]/20 text-[11px] text-[#CCD2D9]/60 font-mono">
                  Phase 1 Preview · Independent Learning Foundation
                </div>
              </div>
            </div>

          </div>
        </div>
      </Container>
    </section>
  );
};
