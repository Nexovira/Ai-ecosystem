import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Send, Mail, ShieldCheck, Layers, FileText } from 'lucide-react';
import { Container } from '../components/common/Container';
import { Button } from '../components/common/Button';
import { useRouter } from '../context/RouterContext';
import { RoutePath } from '../types';

interface FutureScopeViewProps {
  route: RoutePath;
}

export const FutureScopeView: React.FC<FutureScopeViewProps> = ({ route }) => {
  const { navigate } = useRouter();
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errorMessage, setErrorMessage] = useState('');

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.email || !contactForm.message) {
      setErrorMessage('Please provide both your email address and message.');
      return;
    }
    setErrorMessage('');
    setContactSubmitted(true);
  };

  const renderContent = () => {
    switch (route) {
      case '/ai':
        return {
          tag: 'Area 01 · Intelligence',
          title: 'Nexovira AI Ecosystem',
          summary: 'Intelligent experiences designed to help users explore, create and solve.',
          phase1Status: 'Phase 1 establishes the interface taxonomy, prompt routing architecture, and conversational console framework.',
          futureScope: [
            'Context-aware query resolution across Nexovira pillars',
            'Autonomous learning guidance and curriculum matching',
            'Product recommendations grounded in real catalog inventory',
            'Integrated client-side and server-side reasoning modules',
          ],
        };

      case '/marketplace':
        return {
          tag: 'Area 02 · Hardware & Devices',
          title: 'Nexovira Marketplace',
          summary: 'Appliances, electronics and technology products for modern living and work.',
          phase1Status: 'Phase 1 establishes category hierarchy, device taxonomy, and placeholder layouts without fictitious inventory.',
          futureScope: [
            'Verified hardware catalog with real supplier pipelines',
            'Secure transactional checkout and logistics tracking',
            'Device compatibility guides and warranty registries',
            'Curated consumer tech and energy-efficient appliances',
          ],
        };

      case '/services':
        return {
          tag: 'Area 03 · Solutions & Craft',
          title: 'Nexovira Tech & Services',
          summary: 'Technology and digital expertise for projects, solutions and professional services.',
          phase1Status: 'Phase 1 defines the service discipline taxonomy (Web, UI/UX, Cloud, Prompt Engineering, Writing).',
          futureScope: [
            'End-to-end client engagement and project scope scoping',
            'Direct collaboration with vetted domain specialists',
            'Structured project delivery milestones and asset registries',
            'Enterprise digital transformation roadmaps',
          ],
        };

      case '/academy':
        return {
          tag: 'Area 04 · Learning & Mastery',
          title: 'Nexovira Academy',
          summary: 'Courses, applied learning experiences, and future scholarship opportunities.',
          phase1Status: 'Phase 1 maps out the core curriculum tracks, pedagogical model, and scholarship architecture.',
          futureScope: [
            'Project-based technical courses (Software, AI, UX Design)',
            'Direct mentorship and community challenge cohorts',
            'Merit and need-based scholarship applications',
            'Verified certification credentials and skill profiles',
          ],
        };

      case '/digital-products':
        return {
          tag: 'Area 05 · Engineered Resources',
          title: 'Nexovira Digital Products',
          summary: 'Digital resources, publications and downloadable products.',
          phase1Status: 'Phase 1 provides the downloadable asset specification and asset schema.',
          futureScope: [
            'Production-ready UI/UX component design systems',
            'Full-stack architecture blueprints and boilerplate modules',
            'Engineering playbooks and technical publications',
            'Asset license management and version updates',
          ],
        };

      case '/about':
        return {
          tag: 'Company · Horizon Gateway',
          title: 'About Nexovira',
          summary: 'Many Possibilities → One Intelligent Ecosystem.',
          phase1Status: 'Founded on the principle of convergence: uniting fragmented digital disciplines into one coherent, elevated ecosystem.',
          futureScope: [
            'Clean, disciplined technology infrastructure',
            'Zero artificial noise, verified capabilities only',
            'Long-term independent roadmap built in phased releases',
            'Global accessibility and merit-first opportunities',
          ],
        };

      default:
        return null;
    }
  };

  // Specific view for Contact
  if (route === '/contact') {
    return (
      <div className="py-16 sm:py-24 bg-[#01213D] min-h-[70vh]">
        <Container size="default">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-xs font-mono text-[#08E6F9] hover:underline mb-8 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Ecosystem</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5 space-y-5">
              <div className="text-xs font-mono tracking-widest text-[#08E6F9] uppercase">
                Direct Inquiries
              </div>
              <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
                Connect with Nexovira
              </h1>
              <p className="text-sm text-[#CCD2D9] leading-relaxed">
                For partnerships, enterprise inquiries, or questions about the Nexovira ecosystem roadmap, get in touch directly.
              </p>

              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[#011B33] border border-[#0682F4]/20">
                  <Mail className="w-5 h-5 text-[#08E6F9]" />
                  <div>
                    <div className="text-xs text-[#CCD2D9]/60 font-mono">Official Inquiries</div>
                    <a
                      href="mailto:nexoviratech@gmail.com"
                      className="text-sm font-semibold text-white hover:text-[#08E6F9] transition-colors"
                    >
                      nexoviratech@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-8">
                {contactSubmitted ? (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-[#0682F4]/20 border border-[#08E6F9] flex items-center justify-center text-[#08E6F9] mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="font-display font-bold text-xl text-white">
                      Message Received
                    </h3>
                    <p className="text-sm text-[#CCD2D9] max-w-md mx-auto">
                      Thank you for reaching out. The Nexovira core team will review your inquiry and follow up shortly via your email.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setContactSubmitted(false);
                        setContactForm({ name: '', email: '', subject: '', message: '' });
                      }}
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <h3 className="font-display font-bold text-lg text-white mb-2">
                      Inquiry Form
                    </h3>

                    {errorMessage && (
                      <div className="p-3 rounded-lg bg-[#01213D] border border-red-500/40 text-xs text-[#CCD2D9]">
                        {errorMessage}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="Full name"
                        className="w-full bg-[#01213D] text-white text-sm px-4 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="you@domain.com"
                        className="w-full bg-[#01213D] text-white text-sm px-4 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                        Subject / Topic
                      </label>
                      <input
                        type="text"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        placeholder="Ecosystem partnership, services inquiry, or media"
                        className="w-full bg-[#01213D] text-white text-sm px-4 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                        Message *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder="How can Nexovira collaborate with or assist you?"
                        className="w-full bg-[#01213D] text-white text-sm px-4 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none resize-none"
                      />
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        fullWidth
                      >
                        <Send className="w-4 h-4" />
                        <span>Submit Inquiry</span>
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Legal views (Privacy / Terms)
  if (route === '/privacy' || route === '/terms') {
    const isPrivacy = route === '/privacy';
    return (
      <div className="py-16 sm:py-24 bg-[#01213D] min-h-[70vh]">
        <Container size="narrow">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-xs font-mono text-[#08E6F9] hover:underline mb-8 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Ecosystem</span>
          </button>

          <div className="space-y-6">
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#08E6F9] uppercase">
              {isPrivacy ? <ShieldCheck className="w-4 h-4 text-[#08E6F9]" /> : <FileText className="w-4 h-4 text-[#08E6F9]" />}
              <span>{isPrivacy ? 'Privacy & Data Governance Charter' : 'Terms of Ecosystem Service & Commerce'}</span>
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
              {isPrivacy ? 'Nexovira Global Privacy Policy' : 'Nexovira Master Terms of Service'}
            </h1>

            <p className="text-xs font-mono text-[#CCD2D9]/60">
              Ecosystem Release · Effective October 2026 · Production Certified
            </p>

            <div className="space-y-6 text-sm text-[#CCD2D9] leading-relaxed pt-4 border-t border-[#0682F4]/20">
              {isPrivacy ? (
                <>
                  <section className="space-y-2">
                    <h2 className="text-base font-semibold text-white">1. Data Controller & Architectural Principles</h2>
                    <p>
                      Nexovira operates under strict principles of data minimization and verifiable accountability. We only collect the minimal personal data required to authenticate accounts, process lawful transactions, maintain the double-entry financial ledger, and provide seamless cross-pillar service.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-base font-semibold text-white">2. Categories of Information Processed</h2>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      <li><strong>Identity & Account Data:</strong> Email address, hashed credentials, profile name, and system role.</li>
                      <li><strong>Commercial & Transactional Records:</strong> Order line items, fulfillment addresses, payment status tokens, and wallet ledger balances.</li>
                      <li><strong>Educational & Service Records:</strong> Academy course enrollments, milestone submissions, and expert project communications.</li>
                      <li><strong>System Telemetry:</strong> Anonymized API latency percentiles, error traces, and cache cluster metrics for system reliability.</li>
                    </ul>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-base font-semibold text-white">3. Zero Card Storage & Payment Gateway Architecture</h2>
                    <p>
                      Nexovira does not store credit/debit card numbers or CVV codes on our servers. All card payment transactions are processed directly through PCI-DSS Level 1 certified gateways (Paystack, Flutterwave) using encrypted tokenization.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-base font-semibold text-white">4. Cookies & Session Storage</h2>
                    <p>
                      We utilize secure HTTP-only cookies and local storage solely for session authentication, CSRF defense, and cart state preservation. Nexovira does not employ third-party ad retargeting trackers or monetize user data.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-base font-semibold text-white">5. User Data Rights & Erasure</h2>
                    <p>
                      Users retain the right to inspect their personal data, request corrections, or request account closure. Certain transaction records and double-entry accounting journals must be retained for legal and financial audit compliance as mandated by regulatory standards.
                    </p>
                  </section>
                </>
              ) : (
                <>
                  <section className="space-y-2">
                    <h2 className="text-base font-semibold text-white">1. Scope of the Nexovira Ecosystem</h2>
                    <p>
                      Nexovira is a unified digital ecosystem providing product commerce, professional tech services, online education, downloadable content, affiliate partnerships, and financial wallet infrastructure. By accessing or using the platform, you agree to these Master Terms.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-base font-semibold text-white">2. Accounts, Security & Authorization</h2>
                    <p>
                      Users are responsible for safeguarding their login credentials. Any unauthorized access or suspicious activity must be reported immediately. Nexovira reserves the right to restrict or suspend accounts violating ecosystem security, attempting privilege escalation, or engaging in fraudulent behavior.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-base font-semibold text-white">3. Orders, Pricing & Server-Authoritative Billing</h2>
                    <p>
                      All orders and fees are calculated server-side. Client-side price tampering or checkout manipulation is strictly prohibited and results in immediate transaction termination and account review. Payments are confirmed only after gateway webhook verification.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-base font-semibold text-white">4. Digital Products & DRM Licensing</h2>
                    <p>
                      Purchases of digital assets, design blueprints, or guides grant the purchaser a non-exclusive, non-transferable single-seat license. Redistribution, resale, or unauthorized sharing of downloadable assets or entitlement tokens is strictly prohibited.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-base font-semibold text-white">5. Nexovira Academy & Learning Ethics</h2>
                    <p>
                      Enrollment grants access to course materials for the enrolled student. Course sharing, automated scraping of curriculum lessons, or fraudulent scholarship applications constitute grounds for immediate enrollment revocation without refund.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-base font-semibold text-white">6. Affiliate & Referral Governance</h2>
                    <p>
                      Affiliate partners must adhere to transparent, ethical marketing standards. Self-referrals, misleading spam advertising, or automated click injection are strictly forbidden and result in commission forfeiture and affiliate termination.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-base font-semibold text-white">7. Dispute Resolution & Refunds</h2>
                    <p>
                      Physical merchandise returns must be initiated within 7 calendar days of confirmed delivery in original packaging. Digital products that have been downloaded are non-refundable unless verified defective. Services dispute funds remain protected in escrow until management arbitration is finalized.
                    </p>
                  </section>
                </>
              )}
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const content = renderContent();
  if (!content) return null;

  return (
    <div className="py-16 sm:py-24 bg-[#01213D] min-h-[70vh]">
      <Container size="default">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-mono text-[#08E6F9] hover:underline mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Ecosystem</span>
        </button>

        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#08E6F9] uppercase">
            <Layers className="w-4 h-4" />
            <span>{content.tag}</span>
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight">
            {content.title}
          </h1>

          <p className="text-base sm:text-lg text-[#CCD2D9] leading-relaxed">
            {content.summary}
          </p>

          {/* Phase 1 Status Callout */}
          <div className="p-5 rounded-xl bg-[#011B33] border border-[#0682F4]/30 space-y-2">
            <span className="text-xs font-mono text-[#08E6F9] uppercase tracking-wider block">
              Phase 1 Architectural Scope
            </span>
            <p className="text-sm text-white font-medium leading-relaxed">
              {content.phase1Status}
            </p>
          </div>

          {/* Future Capabilities Blueprint */}
          <div className="space-y-4 pt-4">
            <h3 className="font-display font-semibold text-lg text-white">
              Upcoming Capabilities (Future Phases)
            </h3>
            <ul className="space-y-3">
              {content.futureScope.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-sm text-[#CCD2D9] p-3 rounded-lg bg-[#011629]/60 border border-[#0682F4]/15"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#08E6F9] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-8 border-t border-[#0682F4]/20 flex flex-wrap gap-4">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/contact')}
            >
              <span>Inquire About {content.title}</span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/')}
            >
              <span>Explore All Disciplines</span>
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
};
