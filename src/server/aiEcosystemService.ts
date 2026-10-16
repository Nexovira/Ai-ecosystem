import {
  AiCapabilityId,
  AiCapabilityDefinition,
  AiMessage,
  AiConversationSession,
  AiSystemStatus,
  AiAssistantRequest,
  AiAssistantResponse,
  SellerListingOptimizationRequest,
  SellerListingOptimizationResponse,
} from '../types/ai';
import { commerceService } from './commerceService';
import { academyService } from './academyService';
import { servicesService } from './servicesService';
import { digitalProductService } from './digitalProductService';
import { reviewService } from './reviewService';

export class AiEcosystemService {
  private sessions: Map<string, AiConversationSession> = new Map();
  private requestCounts: { total: number; errors: number; date: string } = {
    total: 0,
    errors: 0,
    date: new Date().toISOString().slice(0, 10),
  };

  // Modular Capability Definitions
  private capabilities: Map<AiCapabilityId, AiCapabilityDefinition> = new Map([
    [
      'ECOSYSTEM_ASSISTANT',
      {
        id: 'ECOSYSTEM_ASSISTANT',
        name: 'Nexovira Ecosystem Navigator',
        category: 'NAVIGATION',
        description: 'Contextual ecosystem assistant answering platform inquiries and routing members across marketplace, academy, and services.',
        targetUsers: ['Visitors', 'Customers', 'Sellers', 'Learners'],
        isEnabled: true,
        rateLimitPerMin: 30,
        dailyQuotaPerUser: 100,
        privacyClassification: 'PUBLIC_READ',
        modelAlias: 'gemini-3.8-flash',
      },
    ],
    [
      'MARKETPLACE_DISCOVERY',
      {
        id: 'MARKETPLACE_DISCOVERY',
        name: 'Natural Language Product Search & Comparison',
        category: 'COMMERCE',
        description: 'Interprets member requirements and matches them to verified published marketplace inventory.',
        targetUsers: ['Shoppers', 'Procurement'],
        isEnabled: true,
        rateLimitPerMin: 30,
        dailyQuotaPerUser: 100,
        privacyClassification: 'PUBLIC_READ',
        modelAlias: 'gemini-3.8-flash',
      },
    ],
    [
      'ACADEMY_LEARNING_COMPANION',
      {
        id: 'ACADEMY_LEARNING_COMPANION',
        name: 'Academy Study & Curriculum Guide',
        category: 'EDUCATION',
        description: 'Assists enrolled learners with curriculum exploration, terminology explanations, and course selection.',
        targetUsers: ['Students', 'Scholars'],
        isEnabled: true,
        rateLimitPerMin: 20,
        dailyQuotaPerUser: 80,
        privacyClassification: 'USER_ISOLATED',
        modelAlias: 'gemini-3.8-flash',
      },
    ],
    [
      'SELLER_LISTING_OPTIMIZER',
      {
        id: 'SELLER_LISTING_OPTIMIZER',
        name: 'Merchant Product Copy & Tag Optimizer',
        category: 'CREATION',
        description: 'Drafts high-conversion product titles, feature specifications, and search tags for verified merchants.',
        targetUsers: ['Verified Sellers', 'Creators'],
        requiredRole: ['SELLER', 'ADMIN', 'SUPER_ADMIN'],
        isEnabled: true,
        rateLimitPerMin: 15,
        dailyQuotaPerUser: 50,
        privacyClassification: 'MERCHANT_OWNED',
        modelAlias: 'gemini-3.8-flash',
      },
    ],
    [
      'SERVICES_PROJECT_SCOPER',
      {
        id: 'SERVICES_PROJECT_SCOPER',
        name: 'Tech & Digital Services Scope Architect',
        category: 'SERVICES',
        description: 'Refines client project briefs, recommends service categories, and suggests technical specifications.',
        targetUsers: ['Clients', 'Businesses'],
        isEnabled: true,
        rateLimitPerMin: 20,
        dailyQuotaPerUser: 50,
        privacyClassification: 'USER_ISOLATED',
        modelAlias: 'gemini-3.8-flash',
      },
    ],
    [
      'REVIEWS_SUMMARY_ANALYZER',
      {
        id: 'REVIEWS_SUMMARY_ANALYZER',
        name: 'Review Highlights & Sentiment Summarizer',
        category: 'TRUST',
        description: 'Summarizes verified buyer feedback and rating distributions for products and experts.',
        targetUsers: ['Shoppers', 'Merchants'],
        isEnabled: true,
        rateLimitPerMin: 20,
        dailyQuotaPerUser: 50,
        privacyClassification: 'PUBLIC_READ',
        modelAlias: 'gemini-3.8-flash',
      },
    ],
  ]);

  /**
   * Check if Gemini API credentials exist
   */
  public isConfigured(): boolean {
    const key = process.env.GEMINI_API_KEY;
    return Boolean(key && key !== 'MY_GEMINI_API_KEY' && key.trim().length > 0);
  }

  /**
   * System status for management governance
   */
  public getSystemStatus(): AiSystemStatus {
    const today = new Date().toISOString().slice(0, 10);
    if (this.requestCounts.date !== today) {
      this.requestCounts = { total: 0, errors: 0, date: today };
    }

    return {
      isConfigured: this.isConfigured(),
      provider: 'Google GenAI SDK (@google/genai)',
      activeModel: 'gemini-3.8-flash',
      capabilities: Array.from(this.capabilities.values()),
      totalRequestsToday: this.requestCounts.total,
      errorsCountToday: this.requestCounts.errors,
    };
  }

  /**
   * Toggle capability status (Management Governance)
   */
  public setCapabilityStatus(id: AiCapabilityId, isEnabled: boolean): boolean {
    const cap = this.capabilities.get(id);
    if (!cap) return false;
    cap.isEnabled = isEnabled;
    return true;
  }

  /**
   * Core Conversational Assistant Engine with Real Context Grounding
   */
  public async handleAssistantQuery(
    req: AiAssistantRequest,
    actor?: { userId?: string; role?: string }
  ): Promise<AiAssistantResponse> {
    const today = new Date().toISOString().slice(0, 10);
    if (this.requestCounts.date !== today) {
      this.requestCounts = { total: 0, errors: 0, date: today };
    }
    this.requestCounts.total++;

    const capabilityId = req.capabilityId || 'ECOSYSTEM_ASSISTANT';
    const capability = this.capabilities.get(capabilityId);

    if (!capability || !capability.isEnabled) {
      return {
        success: false,
        available: false,
        sessionId: req.sessionId || 'sess_default',
        error: `The ${capability?.name || capabilityId} capability is currently disabled by platform administrators.`,
      };
    }

    // Role check if capability has requiredRole
    if (capability.requiredRole && capability.requiredRole.length > 0) {
      if (!actor?.role || !capability.requiredRole.includes(actor.role)) {
        return {
          success: false,
          available: false,
          sessionId: req.sessionId || 'sess_default',
          error: 'Access Denied: Your account role does not have permission to invoke this AI capability.',
        };
      }
    }

    // Honest fallback if no API key is provided
    if (!this.isConfigured()) {
      return {
        success: false,
        available: false,
        sessionId: req.sessionId || 'sess_default',
        error: 'Nexovira AI Assistant is currently offline (API key not configured in environment). Please consult standard documentation or navigation menus.',
      };
    }

    // Retrieve or initialize conversation session
    const sessionId = req.sessionId || `ai_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        userId: actor?.userId,
        capabilityId,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.sessions.set(sessionId, session);
    }

    // Record user message
    const userMsg: AiMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: req.message.trim(),
      timestamp: new Date().toISOString(),
    };
    session.messages.push(userMsg);

    try {
      // 1. Gather Authorized Platform Grounding Context
      const [products, digitalProducts] = await Promise.all([
        commerceService.getAllProductsForManagement(),
        digitalProductService.getAllProductsForManagement(),
      ]);

      const publicProducts = products
        .filter((p) => p.productStatus === 'PUBLISHED')
        .slice(0, 10)
        .map((p) => ({
          name: p.name,
          category: p.category,
          price: `₦${p.price.toLocaleString()} NGN`,
          availability: p.availabilityStatus,
        }));

      const publicDigital = (digitalProducts.products || [])
        .filter((d) => d.status === 'PUBLISHED')
        .slice(0, 8)
        .map((d) => ({
          title: d.title,
          category: d.categoryName,
          price: d.isFree ? 'Free' : `₦${d.price.toLocaleString()} NGN`,
        }));

      // Dynamic Context Prompt Assembly
      const systemInstruction = `You are the official Nexovira AI Ecosystem Assistant.
Your mission is to provide accurate, helpful, and concise guidance about Nexovira's platform offerings:
1. MARKETPLACE: Physical tech hardware (Appliances, Electronics, Computing, Phones, Home Tech) with secure escrow checkout and delivery in Nigeria.
2. ACADEMY: World-class technology education (Software Engineering, UI/UX, Cloud, Data Science) with merit-based scholarship applications.
3. TECH & SERVICES: On-demand vetted tech experts and managed delivery for web/mobile development, branding, and cloud architecture.
4. DIGITAL PRODUCTS: Instant-download architectural blueprints, code starter kits, guides, and developer templates with cryptographically watermarked downloads.
5. AFFILIATE PROGRAM: Earn 10% commissions referring customers using unique links with automated wallet payout requests.
6. WALLET & PAYMENTS: Multi-balance escrow wallet (Available, Pending, Held), Paystack/Flutterwave gateway processing, and unified transaction accounting.

VERIFIED ACTIVE PRODUCTS IN STOCK:
${JSON.stringify(publicProducts, null, 2)}

VERIFIED DIGITAL PUBLICATIONS:
${JSON.stringify(publicDigital, null, 2)}

STRICT PLATFORM RULES:
- Never fabricate prices, discounts, unlisted products, or false promises.
- All transactions are in Nigerian Naira (NGN).
- You cannot initiate payments or modify database records.
- Suggest navigation links using format: [Page Name](/path) e.g. [Marketplace](/marketplace), [Academy](/academy), [Services](/services), [Digital Products](/digital-products), [Affiliate Hub](/affiliate).
- Maintain a professional, encouraging, and tech-forward tone adhering to Nexovira's brand ethos.`;

      // Call Google GenAI SDK
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      // Build message sequence (recent 6 messages for context)
      const recentHistory = session.messages.slice(-6).map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `${systemInstruction}\n\nCONVERSATION CONTEXT:\n${recentHistory}\n\nAssistant:`,
        });
      } catch (err: any) {
        if (err?.message?.includes('503') || err?.status === 'UNAVAILABLE') {
          // Model high load retry with gemini-flash-latest alias
          response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: `${systemInstruction}\n\nCONVERSATION CONTEXT:\n${recentHistory}\n\nAssistant:`,
          });
        } else {
          throw err;
        }
      }

      const responseText = response.text?.trim() || 'I am ready to assist you across the Nexovira ecosystem. What would you like to explore?';

      // Detect relevant navigation links
      const contextLinks: { label: string; url: string }[] = [];
      const lower = responseText.toLowerCase() + ' ' + req.message.toLowerCase();
      if (lower.includes('marketplace') || lower.includes('product') || lower.includes('laptop') || lower.includes('tv')) {
        contextLinks.push({ label: 'Explore Marketplace', url: '/marketplace' });
      }
      if (lower.includes('academy') || lower.includes('course') || lower.includes('scholarship') || lower.includes('learn')) {
        contextLinks.push({ label: 'Nexovira Academy', url: '/academy' });
      }
      if (lower.includes('service') || lower.includes('expert') || lower.includes('project') || lower.includes('developer')) {
        contextLinks.push({ label: 'Tech & Services', url: '/services' });
      }
      if (lower.includes('digital') || lower.includes('download') || lower.includes('kit') || lower.includes('template')) {
        contextLinks.push({ label: 'Digital Content Library', url: '/digital-products' });
      }
      if (lower.includes('affiliate') || lower.includes('commission') || lower.includes('refer')) {
        contextLinks.push({ label: 'Affiliate Program', url: '/affiliate' });
      }

      // Record assistant message
      const asstMsg: AiMessage = {
        id: `msg_a_${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString(),
        contextLinks,
        suggestedPrompts: [
          'What computing laptops are available?',
          'How do Academy scholarships work?',
          'How can I sell products on Nexovira?',
          'What are the affiliate commission rates?',
        ],
      };
      session.messages.push(asstMsg);
      session.updatedAt = new Date().toISOString();

      return {
        success: true,
        available: true,
        sessionId,
        message: responseText,
        contextLinks,
        suggestedPrompts: asstMsg.suggestedPrompts,
      };
    } catch (err: unknown) {
      this.requestCounts.errors++;
      console.error('Gemini Assistant execution failure:', err);
      const msg = err instanceof Error ? err.message : String(err);

      // Graceful degraded mode when external provider reports temporary high load (503)
      if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
        const fallbackText = `Our upstream AI intelligence provider is currently experiencing temporary peak demand. Here is verified information from our live ecosystem directory:\n\n` +
          `• **Marketplace**: You can browse verified computing workstations, smart lifestyle electronics, and mobile technology directly with secure Paystack/Flutterwave escrow checkout.\n` +
          `• **Nexovira Academy**: Explore our cohort curriculums or submit a merit scholarship application.\n` +
          `• **Tech & Services**: Connect with vetted tech experts for web engineering, cloud infrastructure, and product design.\n` +
          `• **Digital Products**: Download developer blueprints, design tokens, and cloud compliance checklists.`;

        const fallbackLinks = [
          { label: 'Browse Marketplace', url: '/marketplace' },
          { label: 'Nexovira Academy', url: '/academy' },
          { label: 'Tech & Services', url: '/services' },
          { label: 'Digital Products', url: '/digital-products' },
        ];

        return {
          success: true,
          available: true,
          sessionId,
          message: fallbackText,
          contextLinks: fallbackLinks,
          suggestedPrompts: [
            'What computing laptops are available?',
            'How do Academy scholarships work?',
            'What are the affiliate commission rates?',
          ],
        };
      }

      return {
        success: false,
        available: true,
        sessionId,
        error: `AI processing notice: ${msg}`,
      };
    }
  }

  /**
   * Seller Product Copy & Tag Optimizer
   */
  public async optimizeSellerListing(
    req: SellerListingOptimizationRequest,
    actor: { userId: string; role: string }
  ): Promise<SellerListingOptimizationResponse> {
    const capability = this.capabilities.get('SELLER_LISTING_OPTIMIZER');
    if (!capability || !capability.isEnabled) {
      return {
        success: false,
        available: false,
        optimizedTitle: req.currentTitle || '',
        optimizedDescription: req.currentDescription || '',
        keyHighlights: [],
        suggestedTags: [],
        readabilityScore: 'N/A',
        error: 'Seller copy optimization is disabled by management.',
      };
    }

    if (!['SELLER', 'ADMIN', 'SUPER_ADMIN'].includes(actor.role)) {
      return {
        success: false,
        available: false,
        optimizedTitle: req.currentTitle || '',
        optimizedDescription: req.currentDescription || '',
        keyHighlights: [],
        suggestedTags: [],
        readabilityScore: 'N/A',
        error: 'Forbidden: Only registered merchants can use the listing optimizer.',
      };
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        available: false,
        optimizedTitle: req.currentTitle || '',
        optimizedDescription: req.currentDescription || '',
        keyHighlights: [],
        suggestedTags: [],
        readabilityScore: 'N/A',
        error: 'AI Provider key not configured.',
      };
    }

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const prompt = `You are the Nexovira Commerce Listing Optimization Engine.
Rewrite and optimize the following merchant listing for clarity, high conversion, and SEO in the Nigerian tech market:

Current Title: ${req.currentTitle || 'Untitled Product'}
Current Description: ${req.currentDescription || 'No description provided'}
Category: ${req.targetCategory || 'Technology'}
Features: ${(req.bulletFeatures || []).join(', ') || 'Standard specifications'}
Price: ₦${req.price || 0} NGN

Respond in strict JSON with schema:
{
  "optimizedTitle": "Compelling, accurate product title under 80 characters",
  "optimizedDescription": "Professional 2-paragraph description highlighting benefits, quality, and use case",
  "keyHighlights": ["Highlight 1", "Highlight 2", "Highlight 3", "Highlight 4"],
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "readabilityScore": "Grade A+ (Clear & Professional)"
}`;

      const res = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(res.text || '{}');
      return {
        success: true,
        available: true,
        optimizedTitle: parsed.optimizedTitle || req.currentTitle || '',
        optimizedDescription: parsed.optimizedDescription || req.currentDescription || '',
        keyHighlights: parsed.keyHighlights || [],
        suggestedTags: parsed.suggestedTags || [],
        readabilityScore: parsed.readabilityScore || 'High',
      };
    } catch (err: unknown) {
      console.error('Error optimizing listing:', err);
      const msg = err instanceof Error ? err.message : 'Optimization error';
      return {
        success: false,
        available: true,
        optimizedTitle: req.currentTitle || '',
        optimizedDescription: req.currentDescription || '',
        keyHighlights: [],
        suggestedTags: [],
        readabilityScore: 'N/A',
        error: msg,
      };
    }
  }

  /**
   * Delete session history (Privacy Right to Erasure)
   */
  public deleteSession(sessionId: string, userId?: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    if (session.userId && userId && session.userId !== userId) {
      throw new Error('Forbidden: Cannot delete another user session');
    }
    this.sessions.delete(sessionId);
    return true;
  }
}

export const aiEcosystemService = new AiEcosystemService();
