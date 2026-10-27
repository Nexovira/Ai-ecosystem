import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { commerceService } from './src/server/commerceService';
import { servicesService } from './src/server/servicesService';
import { academyService } from './src/server/academyService';
import { affiliateService } from './src/server/affiliateService';
import { notificationService } from './src/server/notificationService';
import { searchService } from './src/server/searchService';
import { reviewService } from './src/server/reviewService';
import { digitalProductService } from './src/server/digitalProductService';
import { walletService } from './src/server/walletService';
import { transactionAccountingService } from './src/server/transactionAccountingService';
import { paymentGateway } from './src/server/payment/PaymentGateway';
import { managementService } from './src/server/managementService';
import { analyticsService } from './src/server/analyticsService';
import { aiEcosystemService } from './src/server/aiEcosystemService';
import { automationOperationsService } from './src/server/automationOperationsService';
import { ecosystemIntegrationsService } from './src/server/ecosystemIntegrationsService';
import { reliabilityEngineeringService } from './src/server/reliabilityEngineeringService';
import { ecosystemAuditRunner } from './src/server/ecosystemAuditSuite';
import {
  isManagementRole,
  hasManagementPermission,
  ManagementPermission,
  ManagementRole,
} from './src/types/management';
import {
  applySecurityHeaders,
  apiRateLimiter,
  sensitiveActionLimiter,
  rateLimitMiddleware,
  isValidIdentifier,
} from './src/server/securityMiddleware';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CustomRequest extends Request {
  rawBody?: Buffer;
}

function getCookie(req: Request, name: string): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : undefined;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Middleware to preserve raw body for Webhook HMAC validation
  app.use(
    express.json({
      verify: (req: CustomRequest, _res, buf) => {
        req.rawBody = buf;
      },
      limit: '2mb',
    })
  );
  // Apply Security Headers to every response
  app.use(applySecurityHeaders);

  // Rate Limiting on API endpoints
  app.use('/api', rateLimitMiddleware(apiRateLimiter));

  // High-sensitivity rate limits on financial & management mutations
  app.use('/api/checkout', rateLimitMiddleware(sensitiveActionLimiter));
  app.use('/api/wallets/:walletId/payout', rateLimitMiddleware(sensitiveActionLimiter));
  app.use('/api/management/orders/:orderId/refund', rateLimitMiddleware(sensitiveActionLimiter));

  // ==========================================
  // Commerce & Payment API Endpoints
  // ==========================================

  /**
   * POST /api/checkout/validate
   * Server-authoritative price & inventory calculation.
   */
  app.post('/api/checkout/validate', async (req: Request, res: Response) => {
    try {
      const { items } = req.body;
      const result = await commerceService.validateAndCalculate(items || []);
      if (result.errors.length > 0 && result.calculation.items.length === 0) {
        return res.status(400).json({ success: false, errors: result.errors });
      }
      return res.json({ success: true, calculation: result.calculation, warnings: result.errors });
    } catch (err: unknown) {
      console.error('Validation endpoint error:', err);
      const msg = err instanceof Error ? err.message : 'Cart validation failed';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/checkout/initialize
   * Generates order, payment record, and gateway authorization.
   */
  app.post('/api/checkout/initialize', async (req: Request, res: Response) => {
    try {
      const { userId, customerEmail, deliveryInfo, items, providerName, referralCode: bodyRef } = req.body;
      const referralCode = bodyRef || getCookie(req, 'nexovira_aff_ref');

      if (!userId || !customerEmail || !deliveryInfo || !items) {
        return res.status(400).json({
          success: false,
          error: 'Required checkout parameters are missing (userId, customerEmail, deliveryInfo, items).',
        });
      }

      const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
      const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
      const originUrl = `${protocol}://${host}`;

      const initResult = await commerceService.initializeCheckout({
        userId,
        customerEmail,
        deliveryInfo,
        items,
        providerName: providerName || 'PAYSTACK',
        originUrl,
        referralCode,
      });

      if (!initResult.success) {
        return res.status(400).json(initResult);
      }

      return res.json(initResult);
    } catch (err: unknown) {
      console.error('Checkout initialization error:', err);
      const msg = err instanceof Error ? err.message : 'Initialization failed';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/checkout/verify
   * Backend payment verification, atomic confirmation, and stock deduction.
   */
  app.post('/api/checkout/verify', async (req: Request, res: Response) => {
    try {
      const { reference, orderId } = req.body;

      if (!reference) {
        return res.status(400).json({ success: false, error: 'Transaction reference is required.' });
      }

      const verifyResult = await commerceService.verifyPaymentAndFulfill(reference, orderId);

      if (!verifyResult.success) {
        return res.status(400).json(verifyResult);
      }

      return res.json(verifyResult);
    } catch (err: unknown) {
      console.error('Payment verification error:', err);
      const msg = err instanceof Error ? err.message : 'Verification failed';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/payments/paystack/webhook
   * Webhook endpoint with HMAC SHA512 signature authentication.
   */
  app.post('/api/payments/paystack/webhook', async (req: CustomRequest, res: Response) => {
    try {
      const signature = req.headers['x-paystack-signature'] as string;
      const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));

      const isVerified = paymentGateway.verifyWebhookSignature('PAYSTACK', signature || '', rawBody);

      // Fail-closed webhook security: reject if secret is present and signature is invalid or absent
      if (process.env.PAYSTACK_SECRET_KEY) {
        if (!signature || !isVerified) {
          console.warn('Unauthorized webhook signature attempt on Paystack endpoint');
          return res.status(401).send('Invalid webhook signature');
        }
      }

      const event = req.body;
      if (event && event.event === 'charge.success' && event.data?.reference) {
        const ref = event.data.reference;
        console.log(`Processing verified webhook for transaction: ${ref}`);

        // Route scholarship payments vs commerce order fulfillments
        if (event.data?.metadata?.paymentType === 'ACADEMY_SCHOLARSHIP' || ref.startsWith('NEX-SCH-')) {
          await academyService.verifyScholarshipPayment(ref);
        } else {
          await commerceService.verifyPaymentAndFulfill(ref);
        }
      }

      return res.status(200).send('Webhook received and verified');
    } catch (err) {
      console.error('Webhook processing error:', err);
      return res.status(500).send('Internal webhook error');
    }
  });

  /**
   * GET /api/orders/user/me
   * Fetches customer's own order history.
   */
  app.get('/api/orders/user/me', async (req: Request, res: Response) => {
    try {
      const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User identity required.' });
      }

      const orders = await commerceService.getCustomerOrders(userId);
      return res.json({ success: true, orders });
    } catch (err: unknown) {
      console.error('Error fetching user orders:', err);
      const msg = err instanceof Error ? err.message : 'Failed to fetch orders';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/orders/:orderId
   * Authoritative single order fetch with server-enforced IDOR authorization.
   */
  app.get('/api/orders/:orderId', async (req: Request, res: Response) => {
    try {
      const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
      const userRole = (req.headers['x-user-role'] as string) || '';
      const { orderId } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }

      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(userRole);
      const order = await commerceService.getOrderById(orderId, userId, isAdmin);

      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found.' });
      }

      return res.json({ success: true, order });
    } catch (err: unknown) {
      console.error('Error retrieving order:', err);
      const msg = err instanceof Error ? err.message : 'Unauthorized';
      return res.status(403).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/seller/orders
   * Fetches order items belonging to the authenticated merchant.
   */
  app.get('/api/seller/orders', async (_req: Request, res: Response) => {
    return res.status(403).json({
      success: false,
      error: 'Seller dashboard and seller-managed orders have been decommissioned. Product management is restricted to administrators.',
    });
  });

  // ==========================================
  // Tech & Digital Services API Endpoints
  // ==========================================

  /**
   * GET /api/services/categories
   * Public category registry (or all if includeInactive=true for management)
   */
  app.get('/api/services/categories', async (req: Request, res: Response) => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await servicesService.getCategories(includeInactive);
      return res.json({ success: true, categories });
    } catch (err: unknown) {
      console.error('Error fetching service categories:', err);
      const msg = err instanceof Error ? err.message : 'Failed to fetch categories';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/services/categories
   * Management create or update service category
   */
  app.post('/api/services/categories', async (req: Request, res: Response) => {
    try {
      const userRole = (req.headers['x-user-role'] as string) || '';
      if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Management role required.' });
      }

      const category = await servicesService.createOrUpdateCategory(req.body);
      return res.json({ success: true, category });
    } catch (err: unknown) {
      console.error('Error saving category:', err);
      const msg = err instanceof Error ? err.message : 'Failed to save category';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/services/experts
   * Public expert directory with search, filter, and pagination
   */
  app.get('/api/services/experts', async (req: Request, res: Response) => {
    try {
      const categorySlug = req.query.category as string;
      const skill = req.query.skill as string;
      const search = req.query.search as string;
      const availability = req.query.availability as string;

      const experts = await servicesService.getPublicExperts({
        categorySlug,
        skill,
        search,
        availability,
      });

      return res.json({ success: true, experts });
    } catch (err: unknown) {
      console.error('Error fetching public experts:', err);
      const msg = err instanceof Error ? err.message : 'Failed to fetch experts';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/services/experts/:slugOrId
   * Public expert detail
   */
  app.get('/api/services/experts/:slugOrId', async (req: Request, res: Response) => {
    try {
      const expert = await servicesService.getPublicExpertBySlugOrId(req.params.slugOrId);
      if (!expert) {
        return res.status(404).json({ success: false, error: 'Expert not found.' });
      }
      return res.json({ success: true, expert });
    } catch (err: unknown) {
      console.error('Error fetching expert:', err);
      const msg = err instanceof Error ? err.message : 'Failed to fetch expert';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/services/expert/me
   * Fetches currently authenticated expert profile
   */
  app.get('/api/services/expert/me', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }

      const profile = await servicesService.getExpertByUserId(userId);
      return res.json({ success: true, profile });
    } catch (err: unknown) {
      console.error('Error fetching expert profile:', err);
      const msg = err instanceof Error ? err.message : 'Failed to fetch profile';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/services/expert/profile
   * Expert profile onboarding/update (for users with EXPERT role)
   */
  app.post('/api/services/expert/profile', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.body.userId as string);
      const userRole = (req.headers['x-user-role'] as string) || (req.body.userRole as string);

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }

      // Check role authorization (EXPERT, ADMIN, SUPER_ADMIN)
      if (!['EXPERT', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: 'Only approved users with the EXPERT role can publish an expert profile.',
        });
      }

      const result = await servicesService.updateExpertProfileByExpert(userId, req.body);
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.json(result);
    } catch (err: unknown) {
      console.error('Error updating expert profile:', err);
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/services/expert/apply
   * Submit application to join Nexovira Ecosystem as an Expert
   */
  app.post('/api/services/expert/apply', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || req.body.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required to apply.' });
      }

      const result = await servicesService.submitExpertApplication(userId, req.body);
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.json(result);
    } catch (err: unknown) {
      console.error('Error submitting expert application:', err);
      const msg = err instanceof Error ? err.message : 'Application submission failed';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/services/requests
   * Customer submits a real project request (server validated, identity derived)
   */
  app.post('/api/services/requests', async (req: Request, res: Response) => {
    try {
      const customerId = (req.headers['x-user-id'] as string) || req.body.customerId;
      const customerName = (req.headers['x-user-name'] as string) || req.body.contactName;
      const customerEmail = (req.headers['x-user-email'] as string) || req.body.contactEmail;

      if (!customerId) {
        return res.status(401).json({ success: false, error: 'Please sign in to submit a project request.' });
      }

      const result = await servicesService.createProjectRequest(
        customerId,
        customerName,
        customerEmail,
        req.body
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (err: unknown) {
      console.error('Error creating project request:', err);
      const msg = err instanceof Error ? err.message : 'Failed to submit project request';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/services/requests/me
   * Customer views only their own project requests
   */
  app.get('/api/services/requests/me', async (req: Request, res: Response) => {
    try {
      const customerId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      if (!customerId) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }

      const requests = await servicesService.getCustomerRequests(customerId);
      return res.json({ success: true, requests });
    } catch (err: unknown) {
      console.error('Error fetching customer requests:', err);
      const msg = err instanceof Error ? err.message : 'Failed to fetch project requests';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/services/requests/:id
   * Detail view with strict IDOR verification
   */
  app.get('/api/services/requests/:id', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      const userRole = (req.headers['x-user-role'] as string) || (req.query.userRole as string) || 'CUSTOMER';

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }

      const result = await servicesService.getRequestById(req.params.id, userId, userRole);
      if (result.error) {
        return res.status(403).json({ success: false, error: result.error });
      }

      return res.json({ success: true, request: result.request });
    } catch (err: unknown) {
      console.error('Error fetching request detail:', err);
      const msg = err instanceof Error ? err.message : 'Failed to fetch request';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/services/expert/projects
   * Expert views projects assigned to them
   */
  app.get('/api/services/expert/projects', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }

      const projects = await servicesService.getExpertAssignedProjects(userId);
      return res.json({ success: true, projects });
    } catch (err: unknown) {
      console.error('Error fetching expert projects:', err);
      const msg = err instanceof Error ? err.message : 'Failed to fetch assigned projects';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * PATCH /api/services/requests/:id/status
   * Status updates with strict workflow state transitions
   */
  app.patch('/api/services/requests/:id/status', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || req.body.userId;
      const userRole = (req.headers['x-user-role'] as string) || req.body.userRole || 'CUSTOMER';
      const { status, note } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }
      if (!status) {
        return res.status(400).json({ success: false, error: 'Status is required.' });
      }

      const result = await servicesService.updateRequestStatus(
        req.params.id,
        status,
        userId,
        userRole,
        note
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (err: unknown) {
      console.error('Error updating status:', err);
      const msg = err instanceof Error ? err.message : 'Failed to update request status';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/services/projects/:id/updates
   * Project communication updates thread
   */
  app.get('/api/services/projects/:id/updates', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      const userRole = (req.headers['x-user-role'] as string) || (req.query.userRole as string) || 'CUSTOMER';

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }

      const result = await servicesService.getProjectUpdates(req.params.id, userId, userRole);
      if (result.error) {
        return res.status(403).json({ success: false, error: result.error });
      }

      return res.json({ success: true, updates: result.updates });
    } catch (err: unknown) {
      console.error('Error fetching project updates:', err);
      const msg = err instanceof Error ? err.message : 'Failed to fetch updates';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/services/projects/:id/updates
   * Post message or milestone update to project thread
   */
  app.post('/api/services/projects/:id/updates', async (req: Request, res: Response) => {
    try {
      const senderId = (req.headers['x-user-id'] as string) || req.body.senderId;
      const senderName = (req.headers['x-user-name'] as string) || req.body.senderName || 'Participant';
      const senderRole = ((req.headers['x-user-role'] as string) || req.body.senderRole || 'CUSTOMER') as 'CUSTOMER' | 'EXPERT' | 'MANAGEMENT';
      const { message, attachments } = req.body;

      if (!senderId) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }

      const result = await servicesService.addProjectUpdate(
        req.params.id,
        senderId,
        senderName,
        senderRole,
        message,
        attachments
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (err: unknown) {
      console.error('Error posting project update:', err);
      const msg = err instanceof Error ? err.message : 'Failed to post update';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/services/management/requests
   * Management dashboard views all project requests
   */
  app.get('/api/services/management/requests', async (req: Request, res: Response) => {
    try {
      const userRole = (req.headers['x-user-role'] as string) || '';
      if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Management access only.' });
      }

      const requests = await servicesService.getAllRequestsForManagement();
      return res.json({ success: true, requests });
    } catch (err: unknown) {
      console.error('Error fetching management requests:', err);
      const msg = err instanceof Error ? err.message : 'Failed to fetch requests';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/services/management/assign
   * Management assigns expert and records internal notes
   */
  app.post('/api/services/management/assign', async (req: Request, res: Response) => {
    try {
      const userRole = (req.headers['x-user-role'] as string) || '';
      if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Management access only.' });
      }

      const { requestId, expertId, internalNotes } = req.body;
      if (!requestId || !expertId) {
        return res.status(400).json({ success: false, error: 'Request ID and Expert ID are required.' });
      }

      const result = await servicesService.assignExpertByManagement(requestId, expertId, internalNotes);
      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (err: unknown) {
      console.error('Error assigning expert:', err);
      const msg = err instanceof Error ? err.message : 'Failed to assign expert';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/services/management/experts
   * Management views all experts including pending applications
   */
  app.get('/api/services/management/experts', async (req: Request, res: Response) => {
    try {
      const userRole = (req.headers['x-user-role'] as string) || '';
      if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Management access only.' });
      }

      const experts = await servicesService.getAllExpertsForManagement();
      return res.json({ success: true, experts });
    } catch (err: unknown) {
      console.error('Error fetching management experts:', err);
      const msg = err instanceof Error ? err.message : 'Failed to fetch experts';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * PATCH /api/services/management/experts/:id/verification
   * Management verifies, rejects, or suspends an expert
   */
  app.patch('/api/services/management/experts/:id/verification', async (req: Request, res: Response) => {
    try {
      const userRole = (req.headers['x-user-role'] as string) || '';
      if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Management access only.' });
      }

      const { status, profileVisibility } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, error: 'Verification status is required.' });
      }

      const result = await servicesService.managementSetExpertStatus(
        req.params.id,
        status,
        profileVisibility
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (err: unknown) {
      console.error('Error setting expert verification:', err);
      const msg = err instanceof Error ? err.message : 'Failed to set verification status';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/services/management/audit-logs
   * Management audit logging query endpoint
   */
  app.get('/api/services/management/audit-logs', async (req: Request, res: Response) => {
    try {
      const userRole = (req.headers['x-user-role'] as string) || '';
      if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Management clearance required.' });
      }

      const auditLogs = await servicesService.getAuditLogsForManagement();
      return res.json({ success: true, auditLogs });
    } catch (err: unknown) {
      console.error('Error fetching audit logs:', err);
      const msg = err instanceof Error ? err.message : 'Failed to fetch audit logs';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/services/management/notifications
   * Management notifications event registry
   */
  app.get('/api/services/management/notifications', async (req: Request, res: Response) => {
    try {
      const userRole = (req.headers['x-user-role'] as string) || '';
      if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Management clearance required.' });
      }

      const notifications = await servicesService.getNotificationEventsForManagement();
      return res.json({ success: true, notifications });
    } catch (err: unknown) {
      console.error('Error fetching notifications:', err);
      const msg = err instanceof Error ? err.message : 'Failed to fetch notifications';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/services/analyze-project
   * AI-assisted project requirement analysis (Foundation only - Real Gemini API)
   * Section 20: Do NOT create fake responses. If not configured, report unavailable.
   */
  app.post('/api/services/analyze-project', async (req: Request, res: Response) => {
    try {
      const { title, description } = req.body;
      if (!description || description.trim().length < 10) {
        return res.status(400).json({ success: false, error: 'Please provide at least 10 characters describing the project.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
        return res.status(200).json({
          success: false,
          available: false,
          error: 'Nexovira AI assistant is currently unavailable (API key not configured).',
        });
      }

      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `You are the Nexovira Technology & Digital Services AI Solution Architect.
Analyze the following project request to assist the client and management with scope definition:

Project Title: ${title || 'Untitled Project'}
Project Description: ${description}

Available Nexovira Service Categories:
- web-development (Web Development)
- mobile-app-development (Mobile App Development)
- ui-ux-design (UI/UX Design)
- graphic-design (Graphic Design)
- cloud-engineering (Cloud Engineering)
- ai-automation (AI & Automation)
- prompt-engineering (Prompt Engineering)
- software-engineering (Software Engineering)
- data-analytics (Data & Analytics)
- cybersecurity (Cybersecurity)
- blogging (Blogging)
- copywriting (Copywriting)
- ghostwriting (Ghostwriting)
- content-creation (Content Creation)
- digital-marketing (Digital Marketing)
- technical-consulting (Technical Consulting)
- other-technology-services (Other Technology Services)

Respond with a strictly valid JSON object matching this schema:
{
  "likelyCategorySlug": "category-slug-from-above",
  "likelyCategoryName": "Category Display Name",
  "suggestedSkills": ["skill1", "skill2", "skill3", "skill4"],
  "estimatedComplexity": "LOW" | "MEDIUM" | "HIGH" | "ENTERPRISE",
  "clarifyingQuestions": ["Question 1 to clarify requirements", "Question 2"],
  "missingInformation": ["Important detail that would help refine scope"],
  "strategicAdvice": "Brief professional architect recommendation for client"
}`;

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = aiResponse.text?.trim() || '';
        let analysis;
        try {
          analysis = JSON.parse(text);
        } catch {
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            analysis = JSON.parse(match[0]);
          } else {
            throw new Error('Invalid JSON format from AI');
          }
        }

        return res.json({
          success: true,
          available: true,
          analysis,
        });
      } catch (aiErr: unknown) {
        console.warn('Gemini AI Analysis Notice:', aiErr);
        return res.status(200).json({
          success: false,
          available: false,
          error: 'Nexovira AI engine is temporarily unreachable. You can continue submitting your project normally.',
        });
      }
    } catch (err: unknown) {
      console.error('Error in analyze-project endpoint:', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  // ==========================================
  // Nexovira Academy & Scholarship API Endpoints
  // ==========================================

  /**
   * GET /api/academy/categories
   * Public or management course categories registry
   */
  app.get('/api/academy/categories', async (req: Request, res: Response) => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const categories = academyService.getCategories(includeInactive);
      return res.json({ success: true, categories });
    } catch (err: unknown) {
      console.error('Error fetching course categories:', err);
      const msg = err instanceof Error ? err.message : 'Failed to fetch categories';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/academy/categories
   * Management create or update course category
   */
  app.post('/api/academy/categories', async (req: Request, res: Response) => {
    try {
      const userRole = (req.headers['x-user-role'] as string) || '';
      if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Management role required.' });
      }

      const category = academyService.createOrUpdateCategory(req.body, userRole);
      return res.json({ success: true, category });
    } catch (err: unknown) {
      console.error('Error saving course category:', err);
      const msg = err instanceof Error ? err.message : 'Failed to save category';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/academy/courses
   * Public course directory (only published) or management view (all)
   */
  app.get('/api/academy/courses', async (req: Request, res: Response) => {
    try {
      const { category, level, search, status, includeAll, featuredOnly } = req.query;
      const userRole = (req.headers['x-user-role'] as string) || '';
      const isManagement = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole);

      const courses = academyService.getCourses({
        category: category as string,
        level: level as string,
        search: search as string,
        status: status as string,
        includeAll: includeAll === 'true' && isManagement,
        featuredOnly: featuredOnly === 'true',
      });

      return res.json({ success: true, courses });
    } catch (err: unknown) {
      console.error('Error fetching courses:', err);
      const msg = err instanceof Error ? err.message : 'Failed to fetch courses';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/academy/courses/:slug
   * Single course details by slug (or ID)
   */
  app.get('/api/academy/courses/:slug', async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const userRole = (req.headers['x-user-role'] as string) || '';
      const isManagement = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole);

      const course = academyService.getCourseBySlug(slug, isManagement) || academyService.getCourseById(slug, isManagement);
      if (!course) {
        return res.status(404).json({ success: false, error: 'Course not found' });
      }

      return res.json({ success: true, course });
    } catch (err: unknown) {
      console.error('Error fetching course details:', err);
      const msg = err instanceof Error ? err.message : 'Failed to fetch course';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/academy/courses
   * Management create course
   */
  app.post('/api/academy/courses', async (req: Request, res: Response) => {
    try {
      const userRole = (req.headers['x-user-role'] as string) || '';
      if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Management role required.' });
      }

      const course = academyService.createCourse(req.body, userRole);
      return res.json({ success: true, course });
    } catch (err: unknown) {
      console.error('Error creating course:', err);
      const msg = err instanceof Error ? err.message : 'Failed to create course';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * PUT /api/academy/courses/:courseId
   * Management update course (outcomes, duration, status, whatsappGroupLink, etc.)
   */
  app.put('/api/academy/courses/:courseId', async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;
      const userRole = (req.headers['x-user-role'] as string) || '';
      if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Management role required.' });
      }

      const course = academyService.updateCourse(courseId, req.body, userRole);
      return res.json({ success: true, course });
    } catch (err: unknown) {
      console.error('Error updating course:', err);
      const msg = err instanceof Error ? err.message : 'Failed to update course';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * DELETE /api/academy/courses/:courseId
   * Management delete course
   */
  app.delete('/api/academy/courses/:courseId', async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;
      const userRole = (req.headers['x-user-role'] as string) || '';
      if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Admin role required.' });
      }

      const success = academyService.deleteCourse(courseId, userRole);
      return res.json({ success });
    } catch (err: unknown) {
      console.error('Error deleting course:', err);
      const msg = err instanceof Error ? err.message : 'Failed to delete course';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/academy/scholarships/initiate-payment
   * Initiates the ₦4,500 NGN scholarship application fee payment.
   * Server determines strict fee amount.
   */
  app.post('/api/academy/scholarships/initiate-payment', async (req: Request, res: Response) => {
    try {
      const { courseId, userId, userEmail, referralCode: bodyRef } = req.body;
      const referralCode = bodyRef || getCookie(req, 'nexovira_aff_ref');
      const authUserId = (req.headers['x-user-id'] as string) || userId;
      const authEmail = (req.headers['x-user-email'] as string) || userEmail;

      if (!courseId || !authUserId || !authEmail) {
        return res.status(400).json({
          success: false,
          error: 'Course ID, user authentication, and email are required to apply for scholarship.',
        });
      }

      const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
      const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
      const originUrl = `${protocol}://${host}`;

      const result = await academyService.initializeScholarshipPayment({
        userId: authUserId,
        userEmail: authEmail,
        courseId,
        originUrl,
        referralCode,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (err: unknown) {
      console.error('Error initiating scholarship payment:', err);
      const msg = err instanceof Error ? err.message : 'Payment initiation failed';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/academy/scholarships/verify-payment
   * Server-side payment verification. Only unlocks registration form on valid provider confirmation.
   */
  app.post('/api/academy/scholarships/verify-payment', async (req: Request, res: Response) => {
    try {
      const { reference } = req.body;
      const userId = (req.headers['x-user-id'] as string) || req.body.userId;

      if (!reference) {
        return res.status(400).json({ success: false, error: 'Transaction reference is required.' });
      }

      const result = await academyService.verifyScholarshipPayment(reference, userId);
      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (err: unknown) {
      console.error('Error verifying scholarship payment:', err);
      const msg = err instanceof Error ? err.message : 'Verification failed';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/academy/applications/:applicationId
   * Retrieves single application details. Enforces ownership check (anti-IDOR).
   */
  app.get('/api/academy/applications/:applicationId', async (req: Request, res: Response) => {
    try {
      const { applicationId } = req.params;
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      const userRole = (req.headers['x-user-role'] as string) || '';

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const { application, course } = academyService.getApplication(applicationId, userId, userRole);
      return res.json({ success: true, application, course });
    } catch (err: unknown) {
      console.error('Error retrieving application:', err);
      const msg = err instanceof Error ? err.message : 'Failed to retrieve application';
      const status = msg.includes('Forbidden') ? 403 : msg.includes('not found') ? 404 : 500;
      return res.status(status).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/academy/applications/:applicationId/submit
   * Submits scholarship registration form.
   */
  app.post('/api/academy/applications/:applicationId/submit', async (req: Request, res: Response) => {
    try {
      const { applicationId } = req.params;
      const userId = (req.headers['x-user-id'] as string) || req.body.userId;
      const { responses } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const application = academyService.submitApplication({
        applicationId,
        userId,
        responses,
      });

      return res.json({ success: true, application });
    } catch (err: unknown) {
      console.error('Error submitting application form:', err);
      const msg = err instanceof Error ? err.message : 'Failed to submit application';
      const status = msg.includes('Forbidden') ? 403 : 400;
      return res.status(status).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/academy/applications/user/me
   * Retrieves student's own scholarship applications
   */
  app.get('/api/academy/applications/user/me', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const applications = academyService.getStudentApplications(userId);
      return res.json({ success: true, applications });
    } catch (err: unknown) {
      console.error('Error fetching student applications:', err);
      const msg = err instanceof Error ? err.message : 'Failed to fetch applications';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/academy/management/applications
   * Management view all applications with filters
   */
  app.get('/api/academy/management/applications', async (req: Request, res: Response) => {
    try {
      const userRole = (req.headers['x-user-role'] as string) || '';
      if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Management role required.' });
      }

      const { courseId, status, search } = req.query;
      const applications = academyService.getAllApplications(userRole, {
        courseId: courseId as string,
        status: status as string,
        search: search as string,
      });

      return res.json({ success: true, applications });
    } catch (err: unknown) {
      console.error('Error fetching management applications:', err);
      const msg = err instanceof Error ? err.message : 'Failed to fetch applications';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/academy/management/applications/:applicationId/review
   * Management review application (Accept, Reject, Request Info, Internal Notes)
   */
  app.post('/api/academy/management/applications/:applicationId/review', async (req: Request, res: Response) => {
    try {
      const { applicationId } = req.params;
      const userRole = (req.headers['x-user-role'] as string) || '';
      const reviewerId = (req.headers['x-user-id'] as string) || 'management-staff';
      const { status, internalNotes } = req.body;

      if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Management role required.' });
      }

      const application = academyService.reviewApplication({
        applicationId,
        status,
        internalNotes,
        reviewerId,
        userRole,
      });

      return res.json({ success: true, application });
    } catch (err: unknown) {
      console.error('Error reviewing application:', err);
      const msg = err instanceof Error ? err.message : 'Failed to review application';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/academy/management/payments
   * Management view scholarship payments ledger
   */
  app.get('/api/academy/management/payments', async (req: Request, res: Response) => {
    try {
      const userRole = (req.headers['x-user-role'] as string) || '';
      if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Management role required.' });
      }

      const payments = academyService.getAllScholarshipPayments(userRole);
      return res.json({ success: true, payments });
    } catch (err: unknown) {
      console.error('Error fetching scholarship payments:', err);
      const msg = err instanceof Error ? err.message : 'Failed to fetch payments';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/academy/management/notifications
   * Management view notification dispatch logs
   */
  app.get('/api/academy/management/notifications', async (req: Request, res: Response) => {
    try {
      const userRole = (req.headers['x-user-role'] as string) || '';
      if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Management role required.' });
      }

      const notifications = academyService.getNotificationEvents(userRole);
      return res.json({ success: true, notifications });
    } catch (err: unknown) {
      console.error('Error fetching academy notifications:', err);
      const msg = err instanceof Error ? err.message : 'Failed to fetch notifications';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // ==========================================
  // Affiliate & Referral System API Endpoints
  // ==========================================

  /**
   * GET /r/:affiliateCode/:destinationSlug?
   * Public referral redirect endpoint. Records click, sets 30-day attribution cookie, and redirects.
   */
  app.get('/r/:affiliateCode/:destinationSlug?', async (req: Request, res: Response) => {
    try {
      const { affiliateCode, destinationSlug } = req.params;
      const offerId = req.query.offer as string | undefined;
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      const trackResult = await affiliateService.trackReferralClick({
        affiliateCode,
        destinationSlug,
        offerId,
        ipHash: ip ? Buffer.from(ip).toString('base64').slice(0, 16) : undefined,
        userAgent,
      });

      // Set 30-day attribution cookie
      res.cookie('nexovira_aff_ref', affiliateCode.toUpperCase().trim(), {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
      });

      const separator = trackResult.targetPath.includes('?') ? '&' : '?';
      const redirectUrl = `${trackResult.targetPath}${separator}ref=${encodeURIComponent(affiliateCode.toUpperCase().trim())}`;
      return res.redirect(redirectUrl);
    } catch (err: unknown) {
      console.error('Referral redirect error:', err);
      return res.redirect('/marketplace');
    }
  });

  /**
   * POST /api/affiliates/track-click
   * Client-side explicit tracking ping
   */
  app.post('/api/affiliates/track-click', async (req: Request, res: Response) => {
    try {
      const { affiliateCode, destinationSlug, offerId } = req.body;
      if (!affiliateCode) {
        return res.status(400).json({ success: false, error: 'Affiliate code is required.' });
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      const result = await affiliateService.trackReferralClick({
        affiliateCode,
        destinationSlug,
        offerId,
        ipHash: ip ? Buffer.from(ip).toString('base64').slice(0, 16) : undefined,
        userAgent,
      });

      return res.json(result);
    } catch (err: unknown) {
      console.error('Error tracking click:', err);
      return res.status(500).json({ success: false, error: 'Failed to record referral click' });
    }
  });

  /**
   * GET /api/affiliates/me/status
   */
  app.get('/api/affiliates/me/status', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const info = affiliateService.getAffiliateStatus(userId);
      return res.json({ success: true, ...info });
    } catch (err: unknown) {
      console.error('Error getting affiliate status:', err);
      return res.status(500).json({ success: false, error: 'Failed to get affiliate status' });
    }
  });

  /**
   * POST /api/affiliates/apply
   */
  app.post('/api/affiliates/apply', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || req.body.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required to apply.' });
      }

      const {
        fullName,
        email,
        phone,
        promotionChannels,
        platformLinks,
        audienceDescription,
        promotionalExperience,
        preferredCategories,
        additionalInfo,
      } = req.body;

      if (!fullName || !email || !phone || !audienceDescription || !promotionalExperience) {
        return res.status(400).json({
          success: false,
          error: 'Please complete all required application fields.',
        });
      }

      const result = await affiliateService.submitApplication({
        userId,
        fullName,
        email,
        phone,
        promotionChannels: promotionChannels || [],
        platformLinks,
        audienceDescription,
        promotionalExperience,
        preferredCategories: preferredCategories || [],
        additionalInfo,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (err: unknown) {
      console.error('Error submitting affiliate application:', err);
      return res.status(500).json({ success: false, error: 'Application submission failed' });
    }
  });

  /**
   * GET /api/affiliates/me/dashboard
   */
  app.get('/api/affiliates/me/dashboard', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const profile = affiliateService.getAffiliateByUserId(userId);
      if (!profile || profile.status !== 'APPROVED') {
        return res.status(403).json({ success: false, error: 'Approved affiliate account required' });
      }

      const wallet = affiliateService.calculateWallet(profile.affiliateId);
      const commissions = affiliateService.getAffiliateCommissions(profile.affiliateId);
      const payouts = affiliateService.getAffiliatePayouts(profile.affiliateId);

      const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
      const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
      const originUrl = `${protocol}://${host}`;

      const generalLink = `${originUrl}/r/${profile.affiliateCode}`;

      return res.json({
        success: true,
        profile,
        wallet,
        generalLink,
        commissionsCount: commissions.length,
        payoutsCount: payouts.length,
        recentCommissions: commissions.slice(0, 10),
        recentPayouts: payouts.slice(0, 5),
      });
    } catch (err: unknown) {
      console.error('Error fetching affiliate dashboard:', err);
      return res.status(500).json({ success: false, error: 'Failed to fetch dashboard data' });
    }
  });

  /**
   * GET /api/affiliates/me/offers
   */
  app.get('/api/affiliates/me/offers', async (req: Request, res: Response) => {
    try {
      const offers = affiliateService.getOffers(true);
      return res.json({ success: true, offers });
    } catch (err: unknown) {
      console.error('Error fetching offers:', err);
      return res.status(500).json({ success: false, error: 'Failed to fetch offers' });
    }
  });

  /**
   * POST /api/affiliates/me/links/generate
   */
  app.post('/api/affiliates/me/links/generate', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || req.body.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const { offerId } = req.body;
      const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
      const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
      const originUrl = `${protocol}://${host}`;

      const result = affiliateService.generateReferralLink(userId, offerId, originUrl);
      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (err: unknown) {
      console.error('Error generating referral link:', err);
      return res.status(500).json({ success: false, error: 'Failed to generate link' });
    }
  });

  /**
   * GET /api/affiliates/me/wallet
   */
  app.get('/api/affiliates/me/wallet', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const profile = affiliateService.getAffiliateByUserId(userId);
      if (!profile || profile.status !== 'APPROVED') {
        return res.status(403).json({ success: false, error: 'Approved affiliate account required' });
      }

      const wallet = affiliateService.calculateWallet(profile.affiliateId);
      const commissions = affiliateService.getAffiliateCommissions(profile.affiliateId);

      return res.json({ success: true, wallet, commissions });
    } catch (err: unknown) {
      console.error('Error fetching wallet:', err);
      return res.status(500).json({ success: false, error: 'Failed to fetch wallet' });
    }
  });

  /**
   * GET /api/affiliates/me/payout-profile
   */
  app.get('/api/affiliates/me/payout-profile', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const profile = affiliateService.getAffiliateByUserId(userId);
      if (!profile) {
        return res.status(404).json({ success: false, error: 'Affiliate not found' });
      }

      return res.json({ success: true, payoutProfile: profile.payoutProfile || null });
    } catch (err: unknown) {
      console.error('Error fetching payout profile:', err);
      return res.status(500).json({ success: false, error: 'Failed to fetch payout profile' });
    }
  });

  /**
   * GET /api/affiliates/payout/banks
   * Retrieves official bank list for supported payout country from Paystack
   */
  app.get('/api/affiliates/payout/banks', async (req: Request, res: Response) => {
    try {
      const country = (req.query.country as string) || 'nigeria';
      const result = await affiliateService.getBankList(country);
      return res.json(result);
    } catch (err: unknown) {
      console.error('Error fetching bank list:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve banks' });
    }
  });

  /**
   * POST /api/affiliates/payout/verify-bank
   */
  app.post('/api/affiliates/payout/verify-bank', async (req: Request, res: Response) => {
    try {
      const { accountNumber, bankCode } = req.body;
      const clientIdentifier =
        (req.headers['x-user-id'] as string) ||
        (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
        req.socket.remoteAddress ||
        accountNumber;

      const result = await affiliateService.verifyBankAccount({
        accountNumber,
        bankCode,
        clientIdentifier,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.json(result);
    } catch (err: unknown) {
      console.error('Error verifying bank:', err);
      return res.status(500).json({ success: false, error: 'Bank verification failed' });
    }
  });

  /**
   * POST /api/affiliates/me/payout-profile
   */
  app.post('/api/affiliates/me/payout-profile', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || req.body.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const { bankName, bankCode, accountNumber, accountName } = req.body;
      if (!bankName || !bankCode || !accountNumber) {
        return res.status(400).json({ success: false, error: 'Missing bank account information.' });
      }

      const result = await affiliateService.updatePayoutProfile(userId, {
        bankName,
        bankCode,
        accountNumber,
        accountName: accountName || '',
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (err: unknown) {
      console.error('Error updating payout profile:', err);
      return res.status(500).json({ success: false, error: 'Failed to update payout profile' });
    }
  });

  /**
   * POST /api/affiliates/me/payout/request
   */
  app.post('/api/affiliates/me/payout/request', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || req.body.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const { amount } = req.body;
      const result = await affiliateService.requestPayout(userId, amount ? Number(amount) : undefined);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (err: unknown) {
      console.error('Error requesting payout:', err);
      return res.status(500).json({ success: false, error: 'Payout request failed' });
    }
  });

  /**
   * GET /api/affiliates/me/payouts
   */
  app.get('/api/affiliates/me/payouts', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const profile = affiliateService.getAffiliateByUserId(userId);
      if (!profile) {
        return res.status(404).json({ success: false, error: 'Affiliate not found' });
      }

      const payouts = affiliateService.getAffiliatePayouts(profile.affiliateId);
      return res.json({ success: true, payouts });
    } catch (err: unknown) {
      console.error('Error fetching payouts:', err);
      return res.status(500).json({ success: false, error: 'Failed to fetch payouts' });
    }
  });

  // ==========================================
  // Affiliate Management Desk Endpoints
  // ==========================================

  app.get('/api/affiliates/management/applications', async (req: Request, res: Response) => {
    try {
      const userRole = (req.headers['x-user-role'] as string) || '';
      const applications = affiliateService.getAllApplications(userRole);
      return res.json({ success: true, applications });
    } catch (err: unknown) {
      console.error('Error fetching affiliate applications:', err);
      const msg = err instanceof Error ? err.message : 'Unauthorized';
      return res.status(403).json({ success: false, error: msg });
    }
  });

  app.post('/api/affiliates/management/applications/:applicationId/review', async (req: Request, res: Response) => {
    try {
      const userRole = (req.headers['x-user-role'] as string) || '';
      const reviewedBy = (req.headers['x-user-email'] as string) || 'nexoviratech@gmail.com';
      const { applicationId } = req.params;
      const { status, reviewNotes } = req.body;

      const result = await affiliateService.reviewApplication({
        applicationId,
        status,
        reviewNotes,
        reviewedBy,
        userRole,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (err: unknown) {
      console.error('Error reviewing affiliate application:', err);
      const msg = err instanceof Error ? err.message : 'Review failed';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  app.get('/api/affiliates/management/affiliates', async (req: Request, res: Response) => {
    try {
      const userRole = (req.headers['x-user-role'] as string) || '';
      const affiliates = affiliateService.getAllAffiliates(userRole);
      return res.json({ success: true, affiliates });
    } catch (err: unknown) {
      console.error('Error fetching affiliates list:', err);
      const msg = err instanceof Error ? err.message : 'Unauthorized';
      return res.status(403).json({ success: false, error: msg });
    }
  });

  app.post('/api/affiliates/management/affiliates/:affiliateId/status', async (req: Request, res: Response) => {
    try {
      const userRole = (req.headers['x-user-role'] as string) || '';
      const { affiliateId } = req.params;
      const { status } = req.body;

      const updated = await affiliateService.setAffiliateStatus(affiliateId, status, userRole);
      return res.json({ success: true, affiliate: updated });
    } catch (err: unknown) {
      console.error('Error updating affiliate status:', err);
      const msg = err instanceof Error ? err.message : 'Unauthorized';
      return res.status(403).json({ success: false, error: msg });
    }
  });

  app.get('/api/affiliates/management/offers', async (req: Request, res: Response) => {
    try {
      const offers = affiliateService.getOffers(false);
      return res.json({ success: true, offers });
    } catch (err: unknown) {
      console.error('Error fetching management offers:', err);
      return res.status(500).json({ success: false, error: 'Failed to fetch offers' });
    }
  });

  app.post('/api/affiliates/management/offers', async (req: Request, res: Response) => {
    try {
      const userRole = (req.headers['x-user-role'] as string) || '';
      const offer = affiliateService.saveOffer(req.body, userRole);
      return res.json({ success: true, offer });
    } catch (err: unknown) {
      console.error('Error saving offer:', err);
      const msg = err instanceof Error ? err.message : 'Unauthorized';
      return res.status(403).json({ success: false, error: msg });
    }
  });

  app.get('/api/affiliates/management/commissions', async (req: Request, res: Response) => {
    try {
      const userRole = (req.headers['x-user-role'] as string) || '';
      const commissions = affiliateService.getAllCommissions(userRole);
      return res.json({ success: true, commissions });
    } catch (err: unknown) {
      console.error('Error fetching management commissions:', err);
      const msg = err instanceof Error ? err.message : 'Unauthorized';
      return res.status(403).json({ success: false, error: msg });
    }
  });

  app.post('/api/affiliates/management/commissions/:commissionId/status', async (req: Request, res: Response) => {
    try {
      const userRole = (req.headers['x-user-role'] as string) || '';
      const { commissionId } = req.params;
      const { status, reversalReason, internalNotes } = req.body;

      const comm = await affiliateService.updateCommissionStatus({
        commissionId,
        status,
        reversalReason,
        internalNotes,
        userRole,
      });

      return res.json({ success: true, commission: comm });
    } catch (err: unknown) {
      console.error('Error updating commission status:', err);
      const msg = err instanceof Error ? err.message : 'Update failed';
      return res.status(403).json({ success: false, error: msg });
    }
  });

  app.get('/api/affiliates/management/payouts', async (req: Request, res: Response) => {
    try {
      const userRole = (req.headers['x-user-role'] as string) || '';
      const payouts = affiliateService.getAllPayouts(userRole);
      return res.json({ success: true, payouts });
    } catch (err: unknown) {
      console.error('Error fetching management payouts:', err);
      const msg = err instanceof Error ? err.message : 'Unauthorized';
      return res.status(403).json({ success: false, error: msg });
    }
  });

  app.post('/api/affiliates/management/payouts/:payoutId/review', async (req: Request, res: Response) => {
    try {
      const userRole = (req.headers['x-user-role'] as string) || '';
      const { payoutId } = req.params;
      const { status, providerReference, failureReason, internalNotes } = req.body;

      const payout = await affiliateService.reviewPayout({
        payoutId,
        status,
        providerReference,
        failureReason,
        internalNotes,
        userRole,
      });

      return res.json({ success: true, payout });
    } catch (err: unknown) {
      console.error('Error reviewing payout:', err);
      const msg = err instanceof Error ? err.message : 'Review failed';
      return res.status(403).json({ success: false, error: msg });
    }
  });

  // ==========================================
  // Notifications & Communication API Endpoints
  // ==========================================

  /**
   * GET /api/notifications
   * Fetch authenticated user's notifications with pagination & filtering.
   */
  app.get('/api/notifications', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      const userRole = (req.headers['x-user-role'] as string) || '';
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const category = req.query.category as string | undefined;
      const readStatus = req.query.readStatus as 'UNREAD' | 'READ' | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const isAdminUser = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole);

      const result = notificationService.getUserNotifications(userId, {
        category,
        readStatus,
        limit,
        offset,
        isAdminUser,
      });

      return res.json({ success: true, ...result });
    } catch (err: unknown) {
      console.error('Error fetching notifications:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve notifications' });
    }
  });

  /**
   * GET /api/notifications/unread-count
   * Real-time fast unread counter for navigation bell badge.
   */
  app.get('/api/notifications/unread-count', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      const userRole = (req.headers['x-user-role'] as string) || '';
      if (!userId) {
        return res.json({ success: true, unreadCount: 0 });
      }

      const isAdminUser = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole);
      const unreadCount = notificationService.getUnreadCount(userId, isAdminUser);
      return res.json({ success: true, unreadCount });
    } catch (err: unknown) {
      console.error('Error fetching unread count:', err);
      return res.status(500).json({ success: false, error: 'Failed to calculate unread count' });
    }
  });

  /**
   * POST /api/notifications/:id/read
   * Mark individual notification as read with strict recipient authorization.
   */
  app.post('/api/notifications/:id/read', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || req.body.userId;
      const userRole = (req.headers['x-user-role'] as string) || '';
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const isAdminUser = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole);
      const success = await notificationService.markAsRead(id, userId, isAdminUser);
      return res.json({ success });
    } catch (err: unknown) {
      console.error('Error marking notification read:', err);
      const msg = err instanceof Error ? err.message : 'Failed to update read state';
      return res.status(403).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/notifications/mark-all-read
   * Mark all unread notifications for authenticated user as read.
   */
  app.post('/api/notifications/mark-all-read', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || req.body.userId;
      const userRole = (req.headers['x-user-role'] as string) || '';

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const isAdminUser = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole);
      const count = await notificationService.markAllAsRead(userId, isAdminUser);
      return res.json({ success: true, updatedCount: count });
    } catch (err: unknown) {
      console.error('Error marking all notifications read:', err);
      return res.status(500).json({ success: false, error: 'Failed to update read states' });
    }
  });

  /**
   * GET /api/notifications/preferences
   * Fetch authenticated user's notification preferences.
   */
  app.get('/api/notifications/preferences', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const preferences = await notificationService.getUserPreferences(userId);
      return res.json({ success: true, preferences });
    } catch (err: unknown) {
      console.error('Error fetching notification preferences:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve preferences' });
    }
  });

  /**
   * POST /api/notifications/preferences
   * Update notification channel & category preferences.
   */
  app.post('/api/notifications/preferences', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || req.body.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const preferences = await notificationService.updateUserPreferences(userId, req.body);
      return res.json({ success: true, preferences });
    } catch (err: unknown) {
      console.error('Error updating notification preferences:', err);
      return res.status(500).json({ success: false, error: 'Failed to update preferences' });
    }
  });

  /**
   * POST /api/notifications/security-event
   * Authoritative account security event dispatch (e.g. password changed).
   */
  app.post('/api/notifications/security-event', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || req.body.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const { type, title, message } = req.body;
      const record = await notificationService.dispatch({
        recipientUserId: userId,
        type: type || 'ACCOUNT_SECURITY_EVENT',
        category: 'SECURITY',
        title: title || 'Account Security Event',
        message: message || 'A security event was logged for your Nexovira account.',
        actionUrl: '/account',
        priority: 'CRITICAL',
        channels: ['IN_APP', 'EMAIL'],
        isTransactional: true,
      });

      return res.json({ success: true, notification: record });
    } catch (err: unknown) {
      console.error('Error recording security notification:', err);
      return res.status(500).json({ success: false, error: 'Failed to record event' });
    }
  });

  // ==========================================
  // Unified Account Hub & Cross-Ecosystem API
  // ==========================================

  /**
   * GET /api/account/summary
   * Aggregates real ecosystem activity across Orders, Academy, Services, Affiliate, and Notifications.
   */
  app.get('/api/account/summary', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      const userRole = (req.headers['x-user-role'] as string) || '';

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole);

      // 1. Fetch real orders
      const orders = await commerceService.getCustomerOrders(userId);
      const totalSpent = orders
        .filter((o) => o.paymentStatus === 'SUCCESS')
        .reduce((sum, o) => sum + o.total, 0);

      // 2. Fetch real academy applications / enrollments
      const academyApps = academyService.getStudentApplications(userId);

      // 3. Fetch real service requests
      const serviceRequests = await servicesService.getCustomerRequests(userId);
      const activeServices = serviceRequests.filter((r) =>
        ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(r.status)
      );

      // 4. Fetch real affiliate status & wallet
      const affStatus = affiliateService.getAffiliateStatus(userId);
      let affiliateSummary = {
        isAffiliate: affStatus.status === 'APPROVED',
        status: affStatus.status,
        affiliateCode: affStatus.profile?.affiliateCode || null,
        totalEarned: 0,
        availableBalance: 0,
        pendingBalance: 0,
        totalConversions: affStatus.profile?.totalConversions || 0,
      };

      if (affStatus.status === 'APPROVED' && affStatus.profile) {
        const wallet = affiliateService.calculateWallet(affStatus.profile.affiliateId);
        affiliateSummary.totalEarned = wallet.totalEarned;
        affiliateSummary.availableBalance = wallet.availableBalance;
        affiliateSummary.pendingBalance = wallet.pendingBalance;
      }

      // 5. Unread notifications count
      const unreadNotifs = notificationService.getUnreadCount(userId, isAdmin);

      // 6. Real expert profile check
      const expertProfile = await servicesService.getExpertByUserId(userId);
      const isVerifiedExpert = expertProfile !== null && expertProfile.verificationStatus === 'VERIFIED';

      // 7. Calculate legitimate capabilities
      const capabilities: string[] = ['CUSTOMER'];
      if (userRole === 'SELLER' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        capabilities.push('SELLER');
      }
      if (affStatus.status === 'APPROVED') {
        capabilities.push('AFFILIATE');
      }
      if (isVerifiedExpert) {
        capabilities.push('EXPERT');
      }
      if (isAdmin) {
        capabilities.push('MANAGEMENT');
      }

      return res.json({
        success: true,
        summary: {
          orders: {
            total: orders.length,
            totalSpent,
            recent: orders.slice(0, 3),
          },
          academy: {
            total: academyApps.length,
            recent: academyApps.slice(0, 3),
          },
          services: {
            total: serviceRequests.length,
            activeCount: activeServices.length,
            recent: serviceRequests.slice(0, 3),
          },
          affiliate: affiliateSummary,
          notifications: {
            unreadCount: unreadNotifs,
          },
          capabilities,
        },
      });
    } catch (err: unknown) {
      console.error('Error compiling account summary:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve account overview' });
    }
  });

  /**
   * GET /api/account/security-audit
   * Real security audit history for the authenticated user.
   */
  app.get('/api/account/security-audit', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const notifs = notificationService.getUserNotifications(userId, {
        category: 'SECURITY',
        limit: 20,
      });

      return res.json({ success: true, events: notifs.notifications });
    } catch (err: unknown) {
      console.error('Error fetching security audit logs:', err);
      return res.status(500).json({ success: false, error: 'Failed to load security log' });
    }
  });

  // ==========================================
  // PHASE 12: UNIFIED SEARCH & DISCOVERY API
  // ==========================================

  // In-memory sliding window rate limiter for search & autocomplete (120 reqs/min per IP)
  const searchRateLimitMap = new Map<string, { count: number; resetTime: number }>();
  function checkSearchRateLimit(ip: string): boolean {
    const now = Date.now();
    const windowMs = 60000;
    const maxRequests = 120;

    const entry = searchRateLimitMap.get(ip);
    if (!entry || now > entry.resetTime) {
      searchRateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (entry.count >= maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * GET /api/search
   * Unified multi-entity search endpoint with relevance ranking, filters, and pagination.
   */
  app.get('/api/search', async (req: Request, res: Response) => {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      if (!checkSearchRateLimit(clientIp)) {
        return res.status(429).json({ success: false, error: 'Too many search requests. Please slow down.' });
      }

      const q = typeof req.query.q === 'string' ? req.query.q.slice(0, 100).trim() : '';
      const type = (req.query.type as any) || 'ALL';
      const category = (req.query.category as string) || undefined;
      const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
      const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
      const availability = (req.query.availability as string) || undefined;
      const sort = (req.query.sort as any) || 'relevance';
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 12;

      const response = await searchService.search({
        query: q,
        type,
        category,
        minPrice,
        maxPrice,
        availability,
        sort,
        page,
        limit,
      });

      return res.json(response);
    } catch (err: unknown) {
      console.error('Search API failure:', err);
      return res.status(500).json({ success: false, error: 'Search service temporarily unavailable.' });
    }
  });

  /**
   * GET /api/search/suggestions
   * High-speed autocomplete suggestions for global search input.
   */
  app.get('/api/search/suggestions', async (req: Request, res: Response) => {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      if (!checkSearchRateLimit(clientIp)) {
        return res.status(429).json({ success: false, error: 'Rate limit exceeded' });
      }

      const q = typeof req.query.q === 'string' ? req.query.q.slice(0, 50).trim() : '';
      if (!q || q.length < 2) {
        return res.json({ success: true, suggestions: [] });
      }

      const suggestions = await searchService.getSuggestions(q);
      return res.json({ success: true, suggestions });
    } catch (err: unknown) {
      console.error('Search suggestions failure:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve suggestions' });
    }
  });

  // ==========================================
  // PHASE 11: ADVANCED MANAGEMENT SYSTEM API
  // ==========================================

  function requireManagementAuth(
    req: Request,
    res: Response,
    requiredPermission?: ManagementPermission
  ): { userId: string; userRole: ManagementRole; userEmail: string } | null {
    // Only accept authentication from secure request headers (never query string parameters)
    const userId = req.headers['x-user-id'] as string;
    const userRole = (req.headers['x-user-role'] as string) || '';
    const userEmail = (req.headers['x-user-email'] as string) || '';

    if (!userId || !isValidIdentifier(userId) || !userEmail || !isManagementRole(userRole)) {
      res.status(403).json({ success: false, error: 'Forbidden: Management authorization required.' });
      return null;
    }

    // Strict privilege verification: prevent ordinary users from escalating to SUPER_ADMIN/ADMIN via header manipulation
    const trustedAdminEmails = ['nexoviratech@gmail.com', 'nexovirasupport@gmail.com'];
    if (['SUPER_ADMIN', 'ADMIN'].includes(userRole) && !trustedAdminEmails.includes(userEmail.toLowerCase())) {
      res.status(403).json({ success: false, error: 'Forbidden: Unverified administrator credentials.' });
      return null;
    }

    if (requiredPermission && !hasManagementPermission(userRole, requiredPermission)) {
      res.status(403).json({
        success: false,
        error: `Forbidden: Missing required management permission [${requiredPermission}].`,
      });
      return null;
    }

    return { userId, userRole: userRole as ManagementRole, userEmail };
  }

  // Rate limiting tracker for administrator bootstrap requests (Max 3 attempts per 15 minutes)
  const adminBootstrapAttempts = new Map<string, { count: number; firstAttempt: number }>();



  /**
   * POST /api/auth/bootstrap-first-admin
   * Secure, rate-limited administrator setup flow.
   * Dispatches an official Firebase password setup / reset email to the authorized owner.
   */
  app.post('/api/auth/bootstrap-first-admin', async (req: Request, res: Response) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown-client';
      const now = Date.now();
      const windowMs = 15 * 60 * 1000; // 15 minutes

      // Enforce Rate Limiting & Anti-Exploitation
      const currentAttempt = adminBootstrapAttempts.get(clientIp);
      if (currentAttempt) {
        if (now - currentAttempt.firstAttempt < windowMs) {
          if (currentAttempt.count >= 3) {
            return res.status(429).json({
              success: false,
              error: 'Rate limit exceeded: Too many administrator bootstrap attempts. Please wait 15 minutes before retrying.',
            });
          }
          currentAttempt.count += 1;
        } else {
          adminBootstrapAttempts.set(clientIp, { count: 1, firstAttempt: now });
        }
      } else {
        adminBootstrapAttempts.set(clientIp, { count: 1, firstAttempt: now });
      }

      const { email } = req.body;
      const targetEmail = (email && typeof email === 'string') ? email.trim().toLowerCase() : 'nexoviratech@gmail.com';
      const authorizedAdminEmails = ['nexoviratech@gmail.com', 'nexovirasupport@gmail.com'];

      if (!authorizedAdminEmails.includes(targetEmail)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Only authorized platform owner emails can initiate administrator bootstrap.',
        });
      }

      // Check Firebase config API key
      const apiKey = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBz7K59tDvfBlCsHFVH-p0a80Q5aMyXzaM';
      const oobRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestType: 'PASSWORD_RESET',
            email: targetEmail,
          }),
        }
      );

      const oobData = await oobRes.json() as { error?: { message?: string } };
      if (!oobRes.ok) {
        console.error('Firebase Identity Toolkit error:', oobData);
        return res.status(400).json({
          success: false,
          error: oobData.error?.message || 'Failed to dispatch password setup instructions.',
        });
      }

      await managementService.recordAuditLog({
        actorId: 'system-bootstrap',
        actorEmail: targetEmail,
        actorRole: 'SUPER_ADMIN',
        action: 'ADMIN_BOOTSTRAP_DISPATCHED' as any,
        targetType: 'ADMIN_ACCOUNT',
        targetId: targetEmail,
        newState: { email: targetEmail, status: 'SETUP_LINK_SENT' },
        reason: 'Authorized administrator credential setup dispatched via email link',
      });

      return res.json({
        success: true,
        email: targetEmail,
        message: `Password setup email successfully dispatched to ${targetEmail}. Please check your inbox to set your secure password.`,
      });
    } catch (err: unknown) {
      console.error('Error in bootstrap-first-admin:', err);
      return res.status(500).json({ success: false, error: 'Internal administrator bootstrap error' });
    }
  });

  /**
   * GET /api/management/dashboard
   * Real operational metrics aggregated across users, marketplace, orders, academy, services, and affiliates.
   */
  app.get('/api/management/dashboard', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res);
      if (!authResult) return;

      const metrics = await managementService.getDashboardMetrics();
      return res.json({ success: true, metrics });
    } catch (err: unknown) {
      console.error('Error fetching management dashboard metrics:', err);
      return res.status(500).json({ success: false, error: 'Failed to aggregate dashboard metrics' });
    }
  });

  /**
   * GET /api/management/users
   * Filtered, paginated user list with real ecosystem stats.
   */
  app.get('/api/management/users', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'USERS_VIEW');
      if (!authResult) return;

      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const role = req.query.role as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await managementService.getUsersList({ search, status, role, limit, offset });
      return res.json({ success: true, ...result });
    } catch (err: unknown) {
      console.error('Error fetching management users list:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve users' });
    }
  });

  /**
   * POST /api/management/users/:userId/status
   * Update user account status (ACTIVE, RESTRICTED, SUSPENDED, UNDER_REVIEW).
   */
  app.post('/api/management/users/:userId/status', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'USERS_MANAGE_STATUS');
      if (!authResult) return;

      const { userId } = req.params;
      const { status, reason } = req.body;

      if (!status || !['ACTIVE', 'RESTRICTED', 'SUSPENDED', 'UNDER_REVIEW', 'DISABLED'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid account status specified.' });
      }

      const result = await managementService.updateUserStatus({
        targetUserId: userId,
        newStatus: status,
        reason: reason || 'Administrative action',
        actorId: authResult.userId,
        actorEmail: authResult.userEmail,
        actorRole: authResult.userRole,
      });

      return res.json(result);
    } catch (err: unknown) {
      console.error('Error updating user status:', err);
      const msg = err instanceof Error ? err.message : 'Failed to update user status';
      return res.status(403).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/management/users/:userId/role
   * Update user role with privilege-escalation prevention.
   */
  app.post('/api/management/users/:userId/role', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'USERS_MANAGE_ROLE');
      if (!authResult) return;

      const { userId } = req.params;
      const { role, reason } = req.body;

      const result = await managementService.updateUserRole({
        targetUserId: userId,
        newRole: role,
        reason: reason || 'Role modification',
        actorId: authResult.userId,
        actorEmail: authResult.userEmail,
        actorRole: authResult.userRole,
      });

      return res.json(result);
    } catch (err: unknown) {
      console.error('Error updating user role:', err);
      const msg = err instanceof Error ? err.message : 'Failed to update user role';
      return res.status(403).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/management/sellers
   * Real seller profiles and applications.
   */
  app.get('/api/management/sellers', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'SELLERS_VIEW');
      if (!authResult) return;

      const search = (req.query.search as string) || '';
      const status = (req.query.status as string) || 'ALL';

      const { db } = await import('./src/lib/firebase');
      const { getDocs, collection } = await import('firebase/firestore');

      // 1. Fetch official and verified seller profiles
      const sSnap = await getDocs(collection(db, 'sellers')).catch(() => null);
      let sellers: any[] = [];
      if (sSnap && !sSnap.empty) {
        sSnap.forEach((d) => sellers.push(d.data()));
      }

      // 2. Fetch pending and reviewed seller applications to display in dashboard
      const appSnap = await getDocs(collection(db, 'sellerApplications')).catch(() => null);
      if (appSnap && !appSnap.empty) {
        appSnap.forEach((d) => {
          const app = d.data();
          const targetId = `seller-${app.userId || d.id}`;
          // If not already in sellers list, merge application as seller candidate
          if (!sellers.some((s) => s.sellerId === targetId || s.userId === (app.userId || d.id))) {
            sellers.push({
              sellerId: targetId,
              userId: app.userId || d.id,
              businessName: app.businessName || 'Merchant Applicant',
              slug: app.businessName ? app.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : targetId,
              businessDescription: app.businessDescription || 'Merchant application under review.',
              businessLocation: app.businessLocation || 'Nigeria / Global',
              contactEmail: app.contactEmail || '',
              contactPhone: app.contactPhone || '',
              categories: app.categories || ['Computing & Accessories'],
              verificationStatus: app.status || 'PENDING_REVIEW',
              createdAt: app.submittedAt || app.createdAt || new Date().toISOString(),
              updatedAt: app.updatedAt || new Date().toISOString(),
              submittedAt: app.submittedAt || app.createdAt,
            });
          }
        });
      }

      if (search) {
        const q = search.toLowerCase();
        sellers = sellers.filter(
          (s) =>
            s.businessName?.toLowerCase().includes(q) ||
            s.contactEmail?.toLowerCase().includes(q) ||
            s.sellerId?.toLowerCase().includes(q)
        );
      }

      if (status !== 'ALL') {
        sellers = sellers.filter((s) => s.verificationStatus === status);
      }

      return res.json({ success: true, sellers, total: sellers.length });
    } catch (err: unknown) {
      console.error('Error fetching management sellers:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve sellers' });
    }
  });

  /**
   * POST /api/management/sellers/:sellerId/verify
   * Review seller verification status. Persists to sellers, sellerApplications, and updates user role.
   */
  app.post('/api/management/sellers/:sellerId/verify', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'SELLERS_VERIFY');
      if (!authResult) return;

      const { sellerId } = req.params;
      const { status, notes } = req.body;

      const { db } = await import('./src/lib/firebase');
      const { doc, getDoc, setDoc, updateDoc } = await import('firebase/firestore');

      const targetUserId = sellerId.replace(/^seller-/, '');
      const now = new Date().toISOString();

      // 1. Update / Create seller profile document
      const sellerRef = doc(db, 'sellers', sellerId);
      const sellerSnap = await getDoc(sellerRef).catch(() => null);

      if (sellerSnap && sellerSnap.exists()) {
        await updateDoc(sellerRef, {
          verificationStatus: status,
          reviewedBy: authResult.userId,
          reviewedAt: now,
          reviewNotes: notes || '',
          updatedAt: now,
        });
      } else {
        // Fetch application metadata to seed seller profile
        const appRef = doc(db, 'sellerApplications', targetUserId);
        const appSnap = await getDoc(appRef).catch(() => null);
        const appData = appSnap?.exists() ? appSnap.data() : null;

        await setDoc(sellerRef, {
          sellerId,
          userId: targetUserId,
          businessName: appData?.businessName || 'Verified Merchant',
          slug: appData?.businessName ? appData.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : sellerId,
          businessDescription: appData?.businessDescription || 'Verified technology merchant on the Nexovira ecosystem.',
          businessLocation: appData?.businessLocation || 'Operating Location',
          contactEmail: appData?.contactEmail || '',
          contactPhone: appData?.contactPhone || '',
          categories: appData?.categories || ['Appliances', 'Computing & Accessories'],
          verificationStatus: status,
          reviewedBy: authResult.userId,
          reviewedAt: now,
          reviewNotes: notes || '',
          createdAt: now,
          updatedAt: now,
        });
      }

      // 2. Synchronize seller application document
      try {
        const appRef = doc(db, 'sellerApplications', targetUserId);
        const appSnap = await getDoc(appRef);
        if (appSnap.exists()) {
          await updateDoc(appRef, {
            status,
            reviewedBy: authResult.userId,
            reviewedAt: now,
            reviewNotes: notes || '',
            updatedAt: now,
          });
        }
      } catch (appErr) {
        console.warn('Seller application update note:', appErr);
      }

      // 3. Promote/demote User role in Users collection so role persists on reload/login
      try {
        const userRef = doc(db, 'users', targetUserId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const currentRole = userSnap.data()?.role;
          // Only change if not an admin/super_admin
          if (!['ADMIN', 'SUPER_ADMIN'].includes(currentRole)) {
            await updateDoc(userRef, {
              role: status === 'VERIFIED' ? 'SELLER' : 'CUSTOMER',
              updatedAt: now,
            });
          }
        }
      } catch (userErr) {
        console.warn('User role update note:', userErr);
      }

      // 4. Notify applicant of verification decision
      notificationService.dispatch({
        recipientUserId: targetUserId,
        type: 'SYSTEM_ALERT',
        category: 'MANAGEMENT',
        title: status === 'VERIFIED' ? 'Seller Account Verified!' : 'Seller Application Status',
        message: status === 'VERIFIED'
          ? 'Congratulations! Your Nexovira merchant application has been approved. You can now publish products to the technology marketplace.'
          : `Your seller verification status is now: ${status}. ${notes || ''}`,
        relatedEntityType: 'SELLER',
        relatedEntityId: sellerId,
        actionUrl: status === 'VERIFIED' ? '/seller/dashboard' : '/seller/apply',
        priority: 'HIGH',
      }).catch(() => {});

      // 5. Immutable Audit log
      await managementService.recordAuditLog({
        actorId: authResult.userId,
        actorEmail: authResult.userEmail,
        actorRole: authResult.userRole,
        action: 'SELLER_VERIFICATION',
        targetType: 'SELLER',
        targetId: sellerId,
        newState: { verificationStatus: status },
        reason: notes,
      });

      return res.json({ success: true, verificationStatus: status });
    } catch (err: unknown) {
      console.error('Error updating seller verification:', err);
      return res.status(500).json({ success: false, error: 'Failed to update seller verification' });
    }
  });

  /**
   * GET /api/management/products
   * List all products in marketplace for management.
   */
  app.get('/api/management/products', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'PRODUCTS_VIEW');
      if (!authResult) return;

      const search = (req.query.search as string) || '';
      const status = (req.query.status as string) || 'ALL';
      const category = (req.query.category as string) || 'ALL';

      let products = await commerceService.getAllProductsForManagement();

      if (search) {
        const q = search.toLowerCase();
        products = products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q)
        );
      }

      if (status !== 'ALL') {
        products = products.filter((p) => p.productStatus === status);
      }

      if (category !== 'ALL') {
        products = products.filter((p) => p.category === category);
      }

      return res.json({ success: true, products, total: products.length });
    } catch (err: unknown) {
      console.error('Error fetching management products:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve products' });
    }
  });

  /**
   * POST /api/management/products/:productId/status
   * Update product approval or publication status.
   */
  app.post('/api/management/products/:productId/status', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'PRODUCTS_APPROVE');
      if (!authResult) return;

      const { productId } = req.params;
      const { status, isApproved, reason } = req.body;

      const updated = await commerceService.updateProductStatusByManagement(
        productId,
        status,
        Boolean(isApproved),
        authResult.userId
      );

      // Audit log
      await managementService.recordAuditLog({
        actorId: authResult.userId,
        actorEmail: authResult.userEmail,
        actorRole: authResult.userRole,
        action: 'PRODUCT_STATUS_CHANGE',
        targetType: 'PRODUCT',
        targetId: productId,
        newState: { status, isApproved },
        reason,
      });

      return res.json({ success: true, product: updated });
    } catch (err: unknown) {
      console.error('Error updating product status:', err);
      return res.status(500).json({ success: false, error: 'Failed to update product status' });
    }
  });

  /**
   * GET /api/management/orders
   * Real orders across the ecosystem.
   */
  app.get('/api/management/orders', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'ORDERS_VIEW');
      if (!authResult) return;

      const search = (req.query.search as string) || '';
      const orderStatus = (req.query.orderStatus as string) || 'ALL';
      const paymentStatus = (req.query.paymentStatus as string) || 'ALL';

      let orders = await commerceService.getAllOrdersForManagement();

      if (search) {
        const q = search.toLowerCase();
        orders = orders.filter(
          (o) =>
            o.orderReference.toLowerCase().includes(q) ||
            o.customerEmail.toLowerCase().includes(q) ||
            o.customerId.toLowerCase().includes(q)
        );
      }

      if (orderStatus !== 'ALL') {
        orders = orders.filter((o) => o.orderStatus === orderStatus);
      }

      if (paymentStatus !== 'ALL') {
        orders = orders.filter((o) => o.paymentStatus === paymentStatus);
      }

      return res.json({ success: true, orders, total: orders.length });
    } catch (err: unknown) {
      console.error('Error fetching management orders:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve orders' });
    }
  });

  /**
   * POST /api/management/orders/:orderId/status
   * Controlled order status update.
   */
  app.post('/api/management/orders/:orderId/status', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'ORDERS_MANAGE');
      if (!authResult) return;

      const { orderId } = req.params;
      const { status, notes } = req.body;

      const updated = await commerceService.updateOrderStatusByManagement(
        orderId,
        status,
        authResult.userId,
        notes
      );

      // Audit log
      await managementService.recordAuditLog({
        actorId: authResult.userId,
        actorEmail: authResult.userEmail,
        actorRole: authResult.userRole,
        action: 'ORDER_STATUS_UPDATE',
        targetType: 'ORDER',
        targetId: orderId,
        newState: { orderStatus: status },
        reason: notes,
      });

      return res.json({ success: true, order: updated });
    } catch (err: unknown) {
      console.error('Error updating order status:', err);
      const msg = err instanceof Error ? err.message : 'Failed to update order status';
      return res.status(400).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/management/orders/:orderId/refund
   * Process refund on an order.
   */
  app.post('/api/management/orders/:orderId/refund', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'ORDERS_REFUND');
      if (!authResult) return;

      const { orderId } = req.params;
      const { reason } = req.body;

      if (!reason || reason.trim().length < 5) {
        return res.status(400).json({ success: false, error: 'Refund reason of at least 5 characters required.' });
      }

      const updated = await commerceService.refundOrderByManagement(
        orderId,
        reason.trim(),
        authResult.userId
      );

      // Audit log
      await managementService.recordAuditLog({
        actorId: authResult.userId,
        actorEmail: authResult.userEmail,
        actorRole: authResult.userRole,
        action: 'ORDER_REFUND',
        targetType: 'ORDER',
        targetId: orderId,
        newState: { paymentStatus: 'REFUNDED', orderStatus: 'REFUNDED' },
        reason,
      });

      return res.json({ success: true, order: updated });
    } catch (err: unknown) {
      console.error('Error refunding order:', err);
      const msg = err instanceof Error ? err.message : 'Failed to process refund';
      return res.status(400).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/management/payments
   * Real payment records from orders.
   */
  app.get('/api/management/payments', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'PAYMENTS_VIEW');
      if (!authResult) return;

      const orders = await commerceService.getAllOrdersForManagement();
      const payments = orders.map((o) => ({
        paymentId: o.paymentId,
        orderId: o.orderId,
        orderReference: o.orderReference,
        paymentReference: o.paymentReference,
        customerId: o.customerId,
        customerEmail: o.customerEmail,
        amount: o.total,
        currency: o.currency,
        provider: o.paymentProvider,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
      }));

      return res.json({ success: true, payments, total: payments.length });
    } catch (err: unknown) {
      console.error('Error fetching payments:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve payments' });
    }
  });

  /**
   * GET /api/management/audit-logs
   * Append-only chronological audit log records.
   */
  app.get('/api/management/audit-logs', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'AUDIT_LOGS_VIEW');
      if (!authResult) return;

      const action = req.query.action as string | undefined;
      const targetType = req.query.targetType as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await managementService.getAuditLogs({ action, targetType, limit, offset });
      return res.json({ success: true, ...result });
    } catch (err: unknown) {
      console.error('Error fetching audit logs:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve audit logs' });
    }
  });

  /**
   * GET /api/management/team
   * Internal management users list.
   */
  app.get('/api/management/team', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'TEAM_MANAGE');
      if (!authResult) return;

      const members = await managementService.getTeamMembers();
      return res.json({ success: true, members });
    } catch (err: unknown) {
      console.error('Error fetching team members:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve team members' });
    }
  });

  /**
   * POST /api/management/team/assign
   * Assign management role (SUPER_ADMIN only).
   */
  app.post('/api/management/team/assign', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'TEAM_MANAGE');
      if (!authResult) return;

      const { targetUserId, role, reason } = req.body;

      if (!isManagementRole(role)) {
        return res.status(400).json({ success: false, error: 'Invalid management role specified.' });
      }

      const result = await managementService.updateUserRole({
        targetUserId,
        newRole: role,
        reason: reason || 'Management team assignment',
        actorId: authResult.userId,
        actorEmail: authResult.userEmail,
        actorRole: authResult.userRole,
      });

      return res.json(result);
    } catch (err: unknown) {
      console.error('Error assigning team role:', err);
      const msg = err instanceof Error ? err.message : 'Failed to assign team role';
      return res.status(403).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/management/notifications/broadcast
   * Dispatch authoritative management notification.
   */
  app.post('/api/management/notifications/broadcast', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'NOTIFICATIONS_BROADCAST');
      if (!authResult) return;

      const { recipientUserId, title, message, priority, actionUrl } = req.body;
      if (!recipientUserId || !title || !message) {
        return res.status(400).json({ success: false, error: 'Recipient, title, and message are required.' });
      }

      const record = await notificationService.dispatch({
        recipientUserId,
        type: 'PLATFORM_ANNOUNCEMENT',
        category: 'MANAGEMENT',
        title,
        message,
        priority: priority || 'HIGH',
        actionUrl: actionUrl || '/notifications',
        channels: ['IN_APP'],
      });

      // Audit log
      await managementService.recordAuditLog({
        actorId: authResult.userId,
        actorEmail: authResult.userEmail,
        actorRole: authResult.userRole,
        action: 'NOTIFICATION_BROADCAST',
        targetType: 'NOTIFICATION',
        targetId: record?.id || `notif_${Date.now()}`,
        reason: `Broadcast by ${authResult.userEmail}`,
      });

      return res.json({ success: true, notification: record });
    } catch (err: unknown) {
      console.error('Error broadcasting notification:', err);
      return res.status(500).json({ success: false, error: 'Failed to broadcast notification' });
    }
  });

  /**
   * GET /api/management/search/status
   * Search index metrics & entity health check.
   */
  app.get('/api/management/search/status', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res);
      if (!authResult) return;

      const status = searchService.getStatus();
      return res.json({ success: true, status });
    } catch (err: unknown) {
      console.error('Error fetching search status:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve search status' });
    }
  });

  /**
   * POST /api/management/search/reindex
   * Re-sync unified ecosystem search index from authoritative sources.
   */
  app.post('/api/management/search/reindex', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'CONTENT_MANAGE');
      if (!authResult) return;

      await searchService.warmIndex();
      const status = searchService.getStatus();

      // Audit log
      await managementService.recordAuditLog({
        actorId: authResult.userId,
        actorEmail: authResult.userEmail,
        actorRole: authResult.userRole,
        action: 'SEARCH_INDEX_REBUILD',
        targetType: 'SEARCH_INDEX',
        targetId: 'unified_search',
        reason: `Reindexed ${status.totalIndexed} documents across ecosystem by ${authResult.userEmail}`,
      });

      return res.json({ success: true, status });
    } catch (err: unknown) {
      console.error('Error rebuilding search index:', err);
      return res.status(500).json({ success: false, error: 'Failed to rebuild search index' });
    }
  });

  // ==========================================
  // PHASE 13: REVIEWS, RATINGS & TRUST SYSTEM API
  // ==========================================

  /**
   * GET /api/reviews/:entityType/:entityId
   * Public reviews with mathematical summary, filtering, sorting, and pagination.
   */
  app.get('/api/reviews/:entityType/:entityId', async (req: Request, res: Response) => {
    try {
      const { entityType, entityId } = req.params;
      const validTypes = ['PRODUCT', 'SERVICE', 'EXPERT', 'COURSE'];
      if (!validTypes.includes(entityType.toUpperCase())) {
        return res.status(400).json({ success: false, error: 'Invalid entity type specified.' });
      }

      const sort = (req.query.sort as any) || 'recent';
      const starFilter = req.query.starFilter ? parseInt(req.query.starFilter as string, 10) : undefined;
      const verifiedOnly = req.query.verifiedOnly === 'true';
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 6;

      const result = await reviewService.getReviewsForEntity(
        entityType.toUpperCase() as any,
        entityId,
        { sort, starFilter, verifiedOnly, page, limit }
      );

      return res.json({ success: true, ...result });
    } catch (err: unknown) {
      console.error('Error fetching reviews:', err);
      return res.status(500).json({ success: false, error: 'Failed to load reviews' });
    }
  });

  /**
   * GET /api/reviews/:entityType/:entityId/eligibility
   * Real-time server-side review eligibility assessment.
   */
  app.get('/api/reviews/:entityType/:entityId/eligibility', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      if (!userId) {
        return res.json({
          success: true,
          isEligible: false,
          reason: 'Sign in to check review eligibility.',
          verificationType: 'NONE',
          alreadyReviewed: false,
        });
      }

      const { entityType, entityId } = req.params;
      const result = await reviewService.checkEligibility(
        userId,
        entityType.toUpperCase() as any,
        entityId
      );

      return res.json({ success: true, ...result });
    } catch (err: unknown) {
      console.error('Error evaluating review eligibility:', err);
      return res.status(500).json({ success: false, error: 'Failed to evaluate review eligibility' });
    }
  });

  /**
   * POST /api/reviews
   * Submit a verified review. Server verifies genuine purchase / experience.
   */
  app.post('/api/reviews', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || req.body.userId;
      const userDisplayName = (req.headers['x-user-name'] as string) || req.body.userDisplayName || 'Verified Member';
      const userAvatar = (req.headers['x-user-avatar'] as string) || req.body.userAvatar;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required to post a review.' });
      }

      const { entityType, entityId, rating, title, body, isAnonymous } = req.body;
      if (!entityType || !entityId || rating === undefined || !body) {
        return res.status(400).json({ success: false, error: 'Missing required review fields.' });
      }

      const review = await reviewService.createReview(userId, userDisplayName, userAvatar, {
        entityType: entityType.toUpperCase(),
        entityId,
        rating: Number(rating),
        title,
        body,
        isAnonymous: Boolean(isAnonymous),
      });

      return res.status(201).json({ success: true, review });
    } catch (err: unknown) {
      console.error('Error creating review:', err);
      const msg = err instanceof Error ? err.message : 'Failed to submit review';
      return res.status(400).json({ success: false, error: msg });
    }
  });

  /**
   * PUT /api/reviews/:reviewId
   * Edit existing review (IDOR protected).
   */
  app.put('/api/reviews/:reviewId', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || req.body.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }

      const { reviewId } = req.params;
      const { rating, title, body, isAnonymous } = req.body;

      const updated = await reviewService.updateReview(reviewId, userId, {
        rating: rating !== undefined ? Number(rating) : undefined,
        title,
        body,
        isAnonymous,
      });

      return res.json({ success: true, review: updated });
    } catch (err: unknown) {
      console.error('Error updating review:', err);
      const msg = err instanceof Error ? err.message : 'Failed to update review';
      return res.status(400).json({ success: false, error: msg });
    }
  });

  /**
   * DELETE /api/reviews/:reviewId
   * Archive / remove review (IDOR protected).
   */
  app.delete('/api/reviews/:reviewId', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      const userRole = (req.headers['x-user-role'] as string) || '';
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }

      const { reviewId } = req.params;
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(userRole);

      await reviewService.deleteReview(reviewId, userId, isAdmin);
      return res.json({ success: true });
    } catch (err: unknown) {
      console.error('Error deleting review:', err);
      const msg = err instanceof Error ? err.message : 'Failed to delete review';
      return res.status(400).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/account/reviews
   * Fetch all reviews submitted by the authenticated customer.
   */
  app.get('/api/account/reviews', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }

      const reviews = await reviewService.getUserReviews(userId);
      return res.json({ success: true, reviews });
    } catch (err: unknown) {
      console.error('Error fetching customer reviews:', err);
      return res.status(500).json({ success: false, error: 'Failed to load user reviews' });
    }
  });

  /**
   * POST /api/reviews/:reviewId/report
   * Report inappropriate content with rate limiting.
   */
  app.post('/api/reviews/:reviewId/report', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || req.body.userId;
      const userEmail = (req.headers['x-user-email'] as string) || req.body.userEmail || 'member@nexovira.com';
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Please sign in to report a review.' });
      }

      const { reviewId } = req.params;
      const { reason, explanation } = req.body;

      if (!reason) {
        return res.status(400).json({ success: false, error: 'Please provide a reason for reporting.' });
      }

      const report = await reviewService.reportReview(reviewId, userId, userEmail, reason, explanation);
      return res.status(201).json({ success: true, report });
    } catch (err: unknown) {
      console.error('Error submitting review report:', err);
      const msg = err instanceof Error ? err.message : 'Failed to report review';
      return res.status(400).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/reviews/:reviewId/response
   * Merchant / Specialist response to a customer review.
   */
  app.post('/api/reviews/:reviewId/response', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || req.body.userId;
      const userRole = (req.headers['x-user-role'] as string) || req.body.userRole || 'SELLER';
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }

      const { reviewId } = req.params;
      const { responseText, responderName } = req.body;

      const updated = await reviewService.respondToReview(
        reviewId,
        userId,
        userRole as any,
        responderName,
        responseText
      );

      return res.json({ success: true, review: updated });
    } catch (err: unknown) {
      console.error('Error posting review response:', err);
      const msg = err instanceof Error ? err.message : 'Failed to post response';
      return res.status(400).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/management/reviews
   * Management review desk listing & reported content queue.
   */
  app.get('/api/management/reviews', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'REVIEWS_VIEW');
      if (!authResult) return;

      const status = (req.query.status as string) || 'ALL';
      const entityType = (req.query.entityType as string) || 'ALL';
      const reportedOnly = req.query.reportedOnly === 'true';
      const search = (req.query.search as string) || '';

      const data = await reviewService.getAllReviewsForManagement({
        status,
        entityType,
        reportedOnly,
        search,
      });

      return res.json({ success: true, ...data });
    } catch (err: unknown) {
      console.error('Error fetching management reviews:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve reviews' });
    }
  });

  /**
   * POST /api/management/reviews/:reviewId/status
   * Management review moderation action (PUBLISHED, HIDDEN, REMOVED, UNDER_REVIEW).
   */
  app.post('/api/management/reviews/:reviewId/status', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'REVIEWS_MANAGE');
      if (!authResult) return;

      const { reviewId } = req.params;
      const { status, reason } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, error: 'New review status is required.' });
      }

      const updated = await reviewService.moderateReview(
        reviewId,
        status,
        reason || 'Policy moderation',
        authResult.userId,
        authResult.userEmail,
        authResult.userRole
      );

      return res.json({ success: true, review: updated });
    } catch (err: unknown) {
      console.error('Error moderating review:', err);
      const msg = err instanceof Error ? err.message : 'Failed to moderate review';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/management/reviews/reports/:reportId/resolve
   * Resolve or dismiss a user report.
   */
  app.post('/api/management/reviews/reports/:reportId/resolve', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'REVIEWS_MANAGE');
      if (!authResult) return;

      const { reportId } = req.params;
      const { resolution, note } = req.body;

      if (!['RESOLVED', 'DISMISSED'].includes(resolution)) {
        return res.status(400).json({ success: false, error: 'Resolution must be RESOLVED or DISMISSED.' });
      }

      const report = await reviewService.resolveReport(
        reportId,
        resolution,
        note || '',
        authResult.userId,
        authResult.userEmail,
        authResult.userRole
      );

      return res.json({ success: true, report });
    } catch (err: unknown) {
      console.error('Error resolving review report:', err);
      const msg = err instanceof Error ? err.message : 'Failed to resolve report';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // ==========================================
  // PHASE 14: DIGITAL PRODUCTS & CONTENT COMMERCE API
  // ==========================================

  /**
   * GET /api/digital-products
   * Public discovery with search, category filtering, format sorting, and pagination.
   */
  app.get('/api/digital-products', async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      const type = req.query.type as string;
      const search = req.query.search as string;
      const sort = req.query.sort as 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';
      const isFree = req.query.isFree !== undefined ? req.query.isFree === 'true' : undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 9;

      const result = await digitalProductService.getPublicProducts({
        category,
        type,
        search,
        sort,
        isFree,
        page,
        limit,
      });

      return res.json({ success: true, ...result });
    } catch (err: unknown) {
      console.error('Error querying digital products:', err);
      return res.status(500).json({ success: false, error: 'Failed to query digital products' });
    }
  });

  /**
   * GET /api/digital-products/categories
   * Public list of active digital product categories.
   */
  app.get('/api/digital-products/categories', async (_req: Request, res: Response) => {
    try {
      const categories = await digitalProductService.getCategories();
      return res.json({ success: true, categories });
    } catch (err: unknown) {
      console.error('Error fetching digital categories:', err);
      return res.status(500).json({ success: false, error: 'Failed to fetch categories' });
    }
  });

  /**
   * GET /api/digital-products/:slugOrId
   * Public digital product details.
   * Strips private storage paths and internal credentials.
   */
  app.get('/api/digital-products/:slugOrId', async (req: Request, res: Response) => {
    try {
      const { slugOrId } = req.params;
      const product = await digitalProductService.getProductBySlugOrId(slugOrId);

      if (!product || (product.status !== 'PUBLISHED' && product.visibility !== 'PUBLIC')) {
        return res.status(404).json({ success: false, error: 'Digital publication not found.' });
      }

      // Safe public payload: Strip private storagePath
      const safeProduct = {
        ...product,
        storagePath: undefined,
      };

      return res.json({ success: true, product: safeProduct });
    } catch (err: unknown) {
      console.error('Error fetching digital product details:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve publication' });
    }
  });

  /**
   * GET /api/digital-products/:productId/entitlement
   * Check if current user holds an active license/entitlement for this digital product.
   */
  app.get('/api/digital-products/:productId/entitlement', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      if (!userId) {
        return res.json({ success: true, isOwned: false, entitlement: null });
      }

      const { productId } = req.params;
      const entitlement = await digitalProductService.getUserEntitlementForProduct(userId, productId);

      return res.json({
        success: true,
        isOwned: Boolean(entitlement && entitlement.status === 'ACTIVE'),
        entitlement: entitlement && entitlement.status === 'ACTIVE' ? entitlement : null,
      });
    } catch (err: unknown) {
      console.error('Error checking entitlement:', err);
      return res.status(500).json({ success: false, error: 'Failed to check entitlement status' });
    }
  });

  /**
   * POST /api/digital-products/:productId/claim-free
   * Claim free digital publication. Generates authoritative entitlement without fake payment.
   */
  app.post('/api/digital-products/:productId/claim-free', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || req.body.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Please sign in to claim this publication.' });
      }

      const { productId } = req.params;
      const entitlement = await digitalProductService.claimFreeProduct(userId, productId);

      return res.status(201).json({ success: true, entitlement });
    } catch (err: unknown) {
      console.error('Error claiming free product:', err);
      const msg = err instanceof Error ? err.message : 'Failed to claim publication';
      return res.status(400).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/digital-products/:productId/download-token
   * Generates a short-lived, single-use token after strict server-side entitlement validation.
   */
  app.post('/api/digital-products/:productId/download-token', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || req.body.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required to download.' });
      }

      const { productId } = req.params;
      const token = await digitalProductService.createDownloadToken(userId, productId);

      return res.json({ success: true, downloadToken: token });
    } catch (err: unknown) {
      console.error('Error generating download token:', err);
      const msg = err instanceof Error ? err.message : 'Download authorization failed';
      return res.status(403).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/digital-products/download/:token
   * Serves protected file payload with Content-Disposition attachment.
   * Single-use token prevents link sharing & IDOR.
   */
  app.get('/api/digital-products/download/:token', async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const userAgent = req.headers['user-agent'];
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

      const deliverable = await digitalProductService.processAuthorizedDownload(token, {
        userAgent,
        ipAddress,
      });

      // If an external deliverable URL is designated (e.g. Google Drive, Cloudinary Raw, Dropbox), redirect authorized user
      if (
        deliverable.product.externalFileUrl &&
        (deliverable.product.externalFileUrl.startsWith('https://') ||
          deliverable.product.externalFileUrl.startsWith('http://'))
      ) {
        return res.redirect(deliverable.product.externalFileUrl);
      }

      res.setHeader('Content-Type', deliverable.mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(deliverable.fileName)}"`
      );
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      return res.send(deliverable.fileContent);
    } catch (err: unknown) {
      console.error('Download execution error:', err);
      const msg = err instanceof Error ? err.message : 'Download failed or token expired';
      return res.status(403).send(`<html><body style="font-family:sans-serif;padding:40px;background:#01213D;color:#FFF;"><h2>Download Authorization Denied</h2><p>${msg}</p><a href="/account/digital-library" style="color:#08E6F9;">Return to Digital Library</a></body></html>`);
    }
  });

  /**
   * GET /api/account/digital-library
   * Retrieve all digital entitlements owned by authenticated user.
   */
  app.get('/api/account/digital-library', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }

      const entitlements = await digitalProductService.getUserEntitlements(userId);
      return res.json({ success: true, entitlements });
    } catch (err: unknown) {
      console.error('Error fetching digital library:', err);
      return res.status(500).json({ success: false, error: 'Failed to load digital library' });
    }
  });

  /**
   * POST /api/digital-products/:productId/report
   * Report copyright or policy concern on a digital product.
   */
  app.post('/api/digital-products/:productId/report', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || req.body.userId;
      const userEmail = (req.headers['x-user-email'] as string) || req.body.userEmail || 'member@nexovira.com';
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Please sign in to report a publication.' });
      }

      const { productId } = req.params;
      const { reason, explanation } = req.body;

      if (!reason) {
        return res.status(400).json({ success: false, error: 'Please select a reason for reporting.' });
      }

      const report = await digitalProductService.reportProduct(
        productId,
        userId,
        userEmail,
        reason,
        explanation || ''
      );

      return res.status(201).json({ success: true, report });
    } catch (err: unknown) {
      console.error('Error reporting digital product:', err);
      const msg = err instanceof Error ? err.message : 'Failed to submit report';
      return res.status(400).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/creator/digital-products
   * Fetch digital publications authored by authenticated creator/seller.
   */
  app.get('/api/creator/digital-products', async (req: Request, res: Response) => {
    try {
      const creatorId = (req.headers['x-user-id'] as string) || (req.query.creatorId as string);
      if (!creatorId) {
        return res.status(401).json({ success: false, error: 'Creator authentication required.' });
      }

      const products = await digitalProductService.getProductsByCreator(creatorId);
      return res.json({ success: true, products });
    } catch (err: unknown) {
      console.error('Error fetching creator products:', err);
      return res.status(500).json({ success: false, error: 'Failed to load creator publications' });
    }
  });

  /**
   * POST /api/creator/digital-products
   * Author and submit a new digital product.
   */
  app.post('/api/creator/digital-products', async (req: Request, res: Response) => {
    try {
      const creatorId = (req.headers['x-user-id'] as string) || req.body.creatorId;
      const creatorName = (req.headers['x-user-name'] as string) || req.body.creatorName || 'Nexovira Catalog Admin';
      const userRole = (req.headers['x-user-role'] as string) || '';

      if (!creatorId) {
        return res.status(401).json({ success: false, error: 'Authentication required to create publication.' });
      }

      if (!['ADMIN', 'SUPER_ADMIN', 'CONTENT_MANAGER'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Product creation is restricted to platform administrators.',
        });
      }

      const product = await digitalProductService.createDigitalProduct(
        creatorId,
        creatorName,
        'MANAGEMENT',
        req.body
      );

      return res.status(201).json({ success: true, product });
    } catch (err: unknown) {
      console.error('Error creating digital product:', err);
      const msg = err instanceof Error ? err.message : 'Failed to create digital product';
      return res.status(400).json({ success: false, error: msg });
    }
  });

  /**
   * PUT /api/creator/digital-products/:productId
   * Update existing digital product (IDOR protected).
   */
  app.put('/api/creator/digital-products/:productId', async (req: Request, res: Response) => {
    try {
      const creatorId = (req.headers['x-user-id'] as string) || req.body.creatorId;
      const userRole = (req.headers['x-user-role'] as string) || '';
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(userRole);

      if (!creatorId) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }

      const { productId } = req.params;
      const updated = await digitalProductService.updateDigitalProduct(
        productId,
        creatorId,
        req.body,
        isAdmin
      );

      return res.json({ success: true, product: updated });
    } catch (err: unknown) {
      console.error('Error updating digital product:', err);
      const msg = err instanceof Error ? err.message : 'Failed to update publication';
      return res.status(400).json({ success: false, error: msg });
    }
  });

  /**
   * DELETE /api/creator/digital-products/:productId
   * Archive digital product (IDOR protected).
   */
  app.delete('/api/creator/digital-products/:productId', async (req: Request, res: Response) => {
    try {
      const creatorId = (req.headers['x-user-id'] as string) || (req.query.creatorId as string);
      const userRole = (req.headers['x-user-role'] as string) || '';
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(userRole);

      if (!creatorId) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }

      const { productId } = req.params;
      await digitalProductService.deleteDigitalProduct(productId, creatorId, isAdmin);

      return res.json({ success: true });
    } catch (err: unknown) {
      console.error('Error archiving digital product:', err);
      const msg = err instanceof Error ? err.message : 'Failed to archive publication';
      return res.status(400).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/management/digital-products
   * Management listing of all digital publications with filter & search.
   */
  app.get('/api/management/digital-products', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'DIGITAL_PRODUCTS_VIEW');
      if (!authResult) return;

      const status = (req.query.status as string) || 'ALL';
      const category = (req.query.category as string) || 'ALL';
      const search = (req.query.search as string) || '';

      const data = await digitalProductService.getAllProductsForManagement({
        status,
        category,
        search,
      });

      return res.json({ success: true, ...data });
    } catch (err: unknown) {
      console.error('Error fetching management digital products:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve publications' });
    }
  });

  /**
   * POST /api/management/digital-products/:productId/status
   * Management status moderation (PUBLISHED, REJECTED, UNPUBLISHED, ARCHIVED).
   */
  app.post('/api/management/digital-products/:productId/status', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'DIGITAL_PRODUCTS_MANAGE');
      if (!authResult) return;

      const { productId } = req.params;
      const { status, reason } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, error: 'Status is required.' });
      }

      const updated = await digitalProductService.moderateProduct(
        productId,
        status,
        reason || 'Editorial review',
        authResult.userId,
        authResult.userEmail,
        authResult.userRole
      );

      return res.json({ success: true, product: updated });
    } catch (err: unknown) {
      console.error('Error moderating digital product:', err);
      const msg = err instanceof Error ? err.message : 'Failed to moderate publication';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * GET /api/management/digital-products/reports
   * List customer reports on digital publications.
   */
  app.get('/api/management/digital-products/reports', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'DIGITAL_PRODUCTS_VIEW');
      if (!authResult) return;

      const reports = await digitalProductService.getProductReports();
      return res.json({ success: true, reports });
    } catch (err: unknown) {
      console.error('Error fetching digital product reports:', err);
      return res.status(500).json({ success: false, error: 'Failed to load reports' });
    }
  });

  // ==========================================
  // Phase 15: Wallet & Financial Infrastructure Routes
  // ==========================================

  /**
   * GET /api/wallets
   * Retrieve all eligible wallets belonging to the authenticated account holder.
   */
  app.get('/api/wallets', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      let wallets = await walletService.getWalletsByOwner(userId);

      // If user has no wallets yet, provision default affiliate/earner wallet
      if (wallets.length === 0) {
        const userRole = (req.headers['x-user-role'] as string) || 'CUSTOMER';
        const walletType = userRole === 'SELLER' ? 'SELLER_EARNINGS' : 'AFFILIATE_EARNINGS';
        const initial = await walletService.getOrCreateWallet(
          userId,
          userRole === 'SELLER' ? 'SELLER' : 'AFFILIATE',
          walletType,
          (req.headers['x-user-name'] as string) || 'Nexovira Account Holder'
        );
        wallets = [initial];
      }

      return res.json({ success: true, wallets });
    } catch (err: unknown) {
      console.error('Error retrieving user wallets:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve wallets' });
    }
  });

  /**
   * GET /api/wallet/summary
   * Consolidated financial balance and activity summary across all user wallets.
   */
  app.get('/api/wallet/summary', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      let wallets = await walletService.getWalletsByOwner(userId);
      if (wallets.length === 0) {
        const initial = await walletService.getOrCreateWallet(
          userId,
          'USER',
          'AFFILIATE_EARNINGS',
          (req.headers['x-user-name'] as string) || 'Nexovira Account Holder'
        );
        wallets = [initial];
      }

      let totalAvailable = 0;
      let totalPending = 0;
      let totalHeld = 0;
      let totalLifetimeCredited = 0;
      let totalLifetimeDebited = 0;

      for (const w of wallets) {
        totalAvailable += w.availableBalance;
        totalPending += w.pendingBalance;
        totalHeld += w.heldBalance;
        totalLifetimeCredited += w.lifetimeCredited;
        totalLifetimeDebited += w.lifetimeDebited;
      }

      // Fetch recent transactions across these wallets
      const walletIds = wallets.map((w) => w.walletId);
      const allEntriesPromises = walletIds.map((id) =>
        walletService.getLedgerEntries({ walletId: id, limit: 15 })
      );
      const entryResults = await Promise.all(allEntriesPromises);
      const combinedEntries = entryResults.flatMap((r) => r.entries);
      combinedEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Fetch active payouts across these wallets
      const allPayoutsPromises = walletIds.map((id) =>
        walletService.getPayoutRequests({ walletId: id, limit: 10 })
      );
      const payoutResults = await Promise.all(allPayoutsPromises);
      const combinedPayouts = payoutResults.flatMap((r) => r.payouts);
      combinedPayouts.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

      return res.json({
        success: true,
        summary: {
          currency: 'NGN',
          totalAvailable: Math.round(totalAvailable * 100) / 100,
          totalPending: Math.round(totalPending * 100) / 100,
          totalHeld: Math.round(totalHeld * 100) / 100,
          totalLifetimeCredited: Math.round(totalLifetimeCredited * 100) / 100,
          totalLifetimeDebited: Math.round(totalLifetimeDebited * 100) / 100,
          walletsCount: wallets.length,
          wallets,
          recentTransactions: combinedEntries.slice(0, 10),
          recentPayouts: combinedPayouts.slice(0, 5),
        },
      });
    } catch (err: unknown) {
      console.error('Error retrieving wallet summary:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve wallet summary' });
    }
  });

  /**
   * GET /api/wallets/:walletId
   * Retrieve a specific wallet by ID with strict ownership validation.
   */
  app.get('/api/wallets/:walletId', async (req: Request, res: Response) => {
    try {
      const { walletId } = req.params;
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      const userRole = (req.headers['x-user-role'] as string) || '';

      const wallet = walletService.getWalletById(walletId);
      if (!wallet) {
        return res.status(404).json({ success: false, error: 'Wallet not found' });
      }

      // Authorization check: Owner or Management staff with WALLETS_VIEW clearance
      const isOwner = wallet.ownerId === userId;
      const isMgmt = isManagementRole(userRole) && hasManagementPermission(userRole as ManagementRole, 'WALLETS_VIEW');

      if (!isOwner && !isMgmt) {
        return res.status(403).json({ success: false, error: 'Unauthorized to view this wallet' });
      }

      return res.json({ success: true, wallet });
    } catch (err: unknown) {
      console.error('Error fetching wallet:', err);
      return res.status(500).json({ success: false, error: 'Failed to load wallet' });
    }
  });

  /**
   * GET /api/wallets/:walletId/ledger
   * Query immutable ledger transactions for a wallet.
   */
  app.get('/api/wallets/:walletId/ledger', async (req: Request, res: Response) => {
    try {
      const { walletId } = req.params;
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      const userRole = (req.headers['x-user-role'] as string) || '';

      const wallet = walletService.getWalletById(walletId);
      if (!wallet) {
        return res.status(404).json({ success: false, error: 'Wallet not found' });
      }

      const isOwner = wallet.ownerId === userId;
      const isMgmt = isManagementRole(userRole) && hasManagementPermission(userRole as ManagementRole, 'WALLETS_VIEW');

      if (!isOwner && !isMgmt) {
        return res.status(403).json({ success: false, error: 'Unauthorized access to wallet ledger' });
      }

      const { entryType, sourceType, startDate, endDate, limit, offset } = req.query;

      const result = await walletService.getLedgerEntries({
        walletId,
        entryType: entryType as string,
        sourceType: sourceType as string,
        startDate: startDate as string,
        endDate: endDate as string,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
      });

      return res.json({ success: true, entries: result.entries, total: result.total });
    } catch (err: unknown) {
      console.error('Error fetching wallet ledger:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve transactions' });
    }
  });

  /**
   * POST /api/wallets/:walletId/payout
   * Submit an authorized withdrawal request against available funds.
   */
  app.post('/api/wallets/:walletId/payout', async (req: Request, res: Response) => {
    try {
      const { walletId } = req.params;
      const userId = (req.headers['x-user-id'] as string) || req.body.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const { amount, destination } = req.body;

      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ success: false, error: 'Valid positive amount is required' });
      }

      if (
        !destination ||
        !destination.bankName ||
        !destination.bankCode ||
        !destination.accountNumber ||
        !destination.accountName
      ) {
        return res.status(400).json({
          success: false,
          error: 'Complete bank account destination details (bankName, bankCode, accountNumber, accountName) are required',
        });
      }

      const result = await walletService.requestPayout({
        walletId,
        beneficiaryUserId: userId,
        beneficiaryName: destination.accountName,
        amount,
        destination,
      });

      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      return res.json({ success: true, payout: result.payout });
    } catch (err: unknown) {
      console.error('Error requesting payout:', err);
      return res.status(500).json({ success: false, error: 'Failed to submit withdrawal request' });
    }
  });

  /**
   * GET /api/wallets/:walletId/payouts
   * Retrieve payout requests submitted for this wallet.
   */
  app.get('/api/wallets/:walletId/payouts', async (req: Request, res: Response) => {
    try {
      const { walletId } = req.params;
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      const userRole = (req.headers['x-user-role'] as string) || '';

      const wallet = walletService.getWalletById(walletId);
      if (!wallet) {
        return res.status(404).json({ success: false, error: 'Wallet not found' });
      }

      const isOwner = wallet.ownerId === userId;
      const isMgmt = isManagementRole(userRole) && hasManagementPermission(userRole as ManagementRole, 'PAYOUTS_VIEW');

      if (!isOwner && !isMgmt) {
        return res.status(403).json({ success: false, error: 'Unauthorized access to wallet payouts' });
      }

      const { status, limit, offset } = req.query;

      const result = await walletService.getPayoutRequests({
        walletId,
        status: status as string,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
      });

      return res.json({ success: true, payouts: result.payouts, total: result.total });
    } catch (err: unknown) {
      console.error('Error fetching wallet payouts:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve payouts' });
    }
  });

  // ==========================================
  // Management Financial & Wallet Routes
  // ==========================================

  /**
   * GET /api/management/wallets
   * List and filter all wallets across the ecosystem.
   */
  app.get('/api/management/wallets', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'WALLETS_VIEW');
      if (!authResult) return;

      const { walletType, status, search } = req.query;

      const wallets = walletService.getAllWallets({
        walletType: walletType as string,
        status: status as string,
        search: search as string,
      });

      return res.json({ success: true, wallets, total: wallets.length });
    } catch (err: unknown) {
      console.error('Error fetching management wallets:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve wallets' });
    }
  });

  /**
   * GET /api/management/wallets/:walletId/reconcile
   * Run automated ledger reconciliation engine on a wallet.
   */
  app.get('/api/management/wallets/:walletId/reconcile', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'FINANCIAL_AUDIT_VIEW');
      if (!authResult) return;

      const { walletId } = req.params;
      const report = await walletService.reconcileWallet(walletId);

      if (!report) {
        return res.status(404).json({ success: false, error: 'Wallet not found' });
      }

      return res.json({ success: true, reconciliation: report });
    } catch (err: unknown) {
      console.error('Error reconciling wallet:', err);
      return res.status(500).json({ success: false, error: 'Failed to execute reconciliation' });
    }
  });

  /**
   * GET /api/management/ledger
   * Global audit stream of immutable ledger entries across all ecosystem accounts.
   */
  app.get('/api/management/ledger', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'WALLETS_VIEW');
      if (!authResult) return;

      const { walletId, entryType, sourceType, startDate, endDate, limit, offset } = req.query;

      const result = await walletService.getLedgerEntries({
        walletId: walletId as string,
        entryType: entryType as string,
        sourceType: sourceType as string,
        startDate: startDate as string,
        endDate: endDate as string,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
      });

      return res.json({ success: true, entries: result.entries, total: result.total });
    } catch (err: unknown) {
      console.error('Error fetching management ledger:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve ledger entries' });
    }
  });

  /**
   * GET /api/management/payouts
   * List and filter payout requests across all ecosystem wallets.
   */
  app.get('/api/management/payouts', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'PAYOUTS_VIEW');
      if (!authResult) return;

      const { walletId, userId, status, limit, offset } = req.query;

      const result = await walletService.getPayoutRequests({
        walletId: walletId as string,
        userId: userId as string,
        status: status as string,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
      });

      return res.json({ success: true, payouts: result.payouts, total: result.total });
    } catch (err: unknown) {
      console.error('Error fetching management payouts:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve payouts' });
    }
  });

  /**
   * POST /api/management/payouts/:payoutId/complete
   * Mark a payout as completed/disbursed with immutable ledger debit.
   */
  app.post('/api/management/payouts/:payoutId/complete', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'PAYOUTS_PROCESS');
      if (!authResult) return;

      const { payoutId } = req.params;
      const { providerReference } = req.body;

      const result = await walletService.completePayout(
        payoutId,
        authResult.userId,
        providerReference
      );

      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      return res.json({ success: true, message: 'Payout marked completed successfully' });
    } catch (err: unknown) {
      console.error('Error completing payout:', err);
      return res.status(500).json({ success: false, error: 'Failed to complete payout' });
    }
  });

  /**
   * POST /api/management/payouts/:payoutId/reject
   * Reject a payout request and restore reserved funds to available balance.
   */
  app.post('/api/management/payouts/:payoutId/reject', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'PAYOUTS_PROCESS');
      if (!authResult) return;

      const { payoutId } = req.params;
      const { reason } = req.body;

      if (!reason || reason.trim().length < 5) {
        return res.status(400).json({ success: false, error: 'Documented rejection reason is required' });
      }

      const result = await walletService.failOrCancelPayout(
        payoutId,
        'REJECTED',
        reason,
        authResult.userId
      );

      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      return res.json({ success: true, message: 'Payout rejected and held funds restored' });
    } catch (err: unknown) {
      console.error('Error rejecting payout:', err);
      return res.status(500).json({ success: false, error: 'Failed to reject payout' });
    }
  });

  /**
   * POST /api/management/wallets/:walletId/hold
   * Place an administrative/compliance hold on wallet funds.
   */
  app.post('/api/management/wallets/:walletId/hold', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'WALLETS_MANAGE');
      if (!authResult) return;

      const { walletId } = req.params;
      const { amount, reason, idempotencyKey } = req.body;

      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ success: false, error: 'Valid positive amount is required' });
      }
      if (!reason || reason.trim().length < 5) {
        return res.status(400).json({ success: false, error: 'Documented reason is required' });
      }

      const result = await walletService.placeHold({
        walletId,
        amount,
        reason,
        actorId: authResult.userId,
        idempotencyKey: idempotencyKey || `hold_${walletId}_${Date.now()}`,
      });

      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      return res.json({ success: true, hold: result.hold, entry: result.entry });
    } catch (err: unknown) {
      console.error('Error placing wallet hold:', err);
      return res.status(500).json({ success: false, error: 'Failed to place hold' });
    }
  });

  /**
   * POST /api/management/holds/:holdId/release
   * Release an active hold back to available funds.
   */
  app.post('/api/management/holds/:holdId/release', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'WALLETS_MANAGE');
      if (!authResult) return;

      const { holdId } = req.params;
      const { idempotencyKey } = req.body;

      const result = await walletService.releaseHold({
        holdId,
        actorId: authResult.userId,
        idempotencyKey: idempotencyKey || `rel_${holdId}_${Date.now()}`,
      });

      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      return res.json({ success: true, message: 'Hold released successfully' });
    } catch (err: unknown) {
      console.error('Error releasing hold:', err);
      return res.status(500).json({ success: false, error: 'Failed to release hold' });
    }
  });

  /**
   * POST /api/management/wallets/:walletId/adjust
   * Perform an audited manual balance adjustment with full ledger traceability.
   */
  app.post('/api/management/wallets/:walletId/adjust', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'WALLETS_MANAGE');
      if (!authResult) return;

      const { walletId } = req.params;
      const { direction, balanceCategory, amount, reason, idempotencyKey } = req.body;

      if (!['CREDIT', 'DEBIT'].includes(direction)) {
        return res.status(400).json({ success: false, error: 'Direction must be CREDIT or DEBIT' });
      }
      if (!['AVAILABLE', 'PENDING', 'HELD'].includes(balanceCategory)) {
        return res.status(400).json({ success: false, error: 'Balance category must be AVAILABLE, PENDING, or HELD' });
      }
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ success: false, error: 'Valid positive amount is required' });
      }
      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({ success: false, error: 'Comprehensive documented reason of at least 10 characters is required' });
      }

      const result = await walletService.performManualAdjustment({
        walletId,
        direction,
        balanceCategory,
        amount,
        reason,
        actorId: authResult.userId,
        idempotencyKey,
      });

      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      return res.json({ success: true, entry: result.entry });
    } catch (err: unknown) {
      console.error('Error performing manual adjustment:', err);
      return res.status(500).json({ success: false, error: 'Failed to perform adjustment' });
    }
  });

  // ==========================================
  // Phase 16: Unified Transactions & Accounting APIs
  // ==========================================

  /**
   * GET /api/transactions
   * Retrieve customer or partner authorized transactions.
   */
  app.get('/api/transactions', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const { type, status, limit, offset, search } = req.query;

      const result = await transactionAccountingService.getTransactions({
        userId,
        type: type as any,
        status: status as any,
        search: search as string,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
      });

      return res.json({ success: true, transactions: result.transactions, total: result.total });
    } catch (err: unknown) {
      console.error('Error fetching transactions:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve transactions' });
    }
  });

  /**
   * GET /api/transactions/:transactionId
   * Retrieve a specific transaction with permission check.
   */
  app.get('/api/transactions/:transactionId', async (req: Request, res: Response) => {
    try {
      const { transactionId } = req.params;
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      const userRole = (req.headers['x-user-role'] as string) || '';

      const tx = await transactionAccountingService.getTransactionById(transactionId);
      if (!tx) {
        return res.status(404).json({ success: false, error: 'Transaction not found' });
      }

      const isStaff = isManagementRole(userRole);
      const isOwner =
        userId &&
        (tx.customerId === userId ||
          tx.sellerId === userId ||
          tx.creatorId === userId ||
          tx.affiliateId === userId ||
          tx.beneficiaryId === userId ||
          tx.initiatorActorId === userId);

      if (!isStaff && !isOwner) {
        return res.status(403).json({ success: false, error: 'Forbidden: unauthorized transaction access' });
      }

      return res.json({ success: true, transaction: tx });
    } catch (err: unknown) {
      console.error('Error fetching transaction detail:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve transaction' });
    }
  });

  /**
   * GET /api/management/transactions
   * Management console endpoint for ecosystem-wide transactions inspection.
   */
  app.get('/api/management/transactions', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'TRANSACTIONS_VIEW');
      if (!authResult) return;

      const { type, status, sourceSystem, search, limit, offset } = req.query;

      const result = await transactionAccountingService.getTransactions({
        type: type as any,
        status: status as any,
        sourceSystem: sourceSystem as any,
        search: search as string,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
      });

      return res.json({ success: true, transactions: result.transactions, total: result.total });
    } catch (err: unknown) {
      console.error('Error fetching management transactions:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve management transactions' });
    }
  });

  /**
   * GET /api/management/accounting/journal
   * Management console endpoint for balanced double-entry accounting vouchers.
   */
  app.get('/api/management/accounting/journal', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'FINANCIAL_AUDIT_VIEW');
      if (!authResult) return;

      const { sourceTransactionId, status, limit } = req.query;

      const entries = await transactionAccountingService.getJournalEntries({
        sourceTransactionId: sourceTransactionId as string,
        status: status as string,
        limit: limit ? parseInt(limit as string, 10) : 100,
      });

      return res.json({ success: true, entries });
    } catch (err: unknown) {
      console.error('Error fetching accounting journal:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve journal entries' });
    }
  });

  /**
   * GET /api/management/accounting/reconcile
   * Run automated ecosystem financial reconciliation and generate discrepancy report.
   */
  app.get('/api/management/accounting/reconcile', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'FINANCIAL_AUDIT_VIEW');
      if (!authResult) return;

      const report = await transactionAccountingService.runEcosystemReconciliation(authResult.userId);
      return res.json({ success: true, report });
    } catch (err: unknown) {
      console.error('Error running financial reconciliation:', err);
      return res.status(500).json({ success: false, error: 'Failed to run financial reconciliation' });
    }
  });

  /**
   * POST /api/management/orders/:orderId/refund
   * Execute authorized full or partial refund with ledger and journal reversals.
   */
  app.post('/api/management/orders/:orderId/refund', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'ORDERS_REFUND');
      if (!authResult) return;

      const { orderId } = req.params;
      const { reason, refundAmount } = req.body;

      if (!reason || reason.trim().length < 5) {
        return res.status(400).json({ success: false, error: 'Documented refund justification reason is required' });
      }

      const result = await transactionAccountingService.executeOrderRefund({
        orderId,
        reason,
        refundAmount: refundAmount ? parseFloat(refundAmount) : undefined,
        actorId: authResult.userId,
        actorRole: authResult.userRole,
      });

      return res.json({ success: true, result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to execute refund';
      console.error('Error executing refund:', err);
      return res.status(400).json({ success: false, error: msg });
    }
  });

  // ==========================================
  // PHASE 18: ANALYTICS & BUSINESS INTELLIGENCE APIS
  // ==========================================

  /**
   * GET /api/management/analytics
   * Aggregated ecosystem business intelligence across marketplace, payments, academy, and services.
   */
  app.get('/api/management/analytics', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'ANALYTICS_VIEW');
      if (!authResult) return;

      const { range } = req.query;
      const data = await analyticsService.getManagementAnalytics((range as any) || '30D');

      return res.json({ success: true, data });
    } catch (err: unknown) {
      console.error('Error computing management analytics:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve analytics data' });
    }
  });

  /**
   * GET /api/management/analytics/export
   * Generates authorized CSV or JSON export payload for auditing and reporting.
   */
  app.get('/api/management/analytics/export', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'ANALYTICS_EXPORT');
      if (!authResult) return;

      const { range } = req.query;
      const data = await analyticsService.getManagementAnalytics((range as any) || '30D');
      const csvContent = analyticsService.generateExportCsv(data);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="nexovira-bi-report-${Date.now()}.csv"`);
      return res.send(csvContent);
    } catch (err: unknown) {
      console.error('Error exporting analytics report:', err);
      return res.status(500).json({ success: false, error: 'Failed to export analytics report' });
    }
  });

  /**
   * GET /api/seller/analytics
   * Isolated seller-scoped analytics with server-side ownership enforcement.
   */
  app.get('/api/seller/analytics', async (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
      const userRole = (req.headers['x-user-role'] as string) || '';

      if (!userId || !isValidIdentifier(userId)) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      // Product analytics are restricted to administrative operations
      const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'CONTENT_MANAGER', 'ANALYTICS_VIEW'].some((r) => userRole.includes(r));
      if (!isAdmin) {
        return res.status(403).json({ success: false, error: 'Forbidden: Administrator clearance required' });
      }

      const { range } = req.query;
      const data = await analyticsService.getSellerAnalytics(userId, (range as any) || '30D');

      return res.json({ success: true, data });
    } catch (err: unknown) {
      console.error('Error fetching seller analytics:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve seller analytics' });
    }
  });

  // ==========================================
  // PHASE 20: AI ECOSYSTEM & GOVERNANCE APIS
  // ==========================================

  /**
   * POST /api/ai/query
   * Context-grounded ecosystem assistant supporting marketplace, academy, services, and navigation inquiries.
   */
  app.post('/api/ai/query', async (req: Request, res: Response) => {
    try {
      const { message, sessionId, capabilityId, context } = req.body;
      const userId = req.headers['x-user-id'] as string;
      const role = req.headers['x-user-role'] as string;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'A message prompt is required.' });
      }

      if (message.length > 2000) {
        return res.status(400).json({ success: false, error: 'Message exceeds maximum length of 2000 characters.' });
      }

      const response = await aiEcosystemService.handleAssistantQuery(
        { message, sessionId, capabilityId, context },
        { userId, role }
      );

      return res.json(response);
    } catch (err: unknown) {
      console.error('Error handling AI query:', err);
      return res.status(500).json({ success: false, error: 'Internal AI processing error' });
    }
  });

  /**
   * POST /api/ai/seller/optimize-listing
   * Seller Product Title & Copy Optimizer
   */
  app.post('/api/ai/seller/optimize-listing', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const role = (req.headers['x-user-role'] as string) || '';

      if (!userId || !isValidIdentifier(userId)) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const response = await aiEcosystemService.optimizeSellerListing(req.body, { userId, role });
      return res.json(response);
    } catch (err: unknown) {
      console.error('Error in listing optimizer:', err);
      return res.status(500).json({ success: false, error: 'Listing optimization error' });
    }
  });

  /**
   * GET /api/ai/status
   * Public health status of AI infrastructure (no secrets exposed)
   */
  app.get('/api/ai/status', (_req: Request, res: Response) => {
    return res.json({ success: true, status: aiEcosystemService.getSystemStatus() });
  });

  /**
   * POST /api/management/ai/toggle-capability
   * Emergency kill-switch and governance controls for management
   */
  app.post('/api/management/ai/toggle-capability', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'AI_CONFIG_MANAGE');
      if (!authResult) return;

      const { capabilityId, isEnabled } = req.body;
      if (!capabilityId) {
        return res.status(400).json({ success: false, error: 'capabilityId is required' });
      }

      const updated = aiEcosystemService.setCapabilityStatus(capabilityId, Boolean(isEnabled));
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Capability not found' });
      }

      // Record audit log
      await managementService.recordAuditLog({
        actorId: authResult.userId,
        actorEmail: authResult.userEmail,
        actorRole: authResult.userRole,
        action: 'AI_CAPABILITY_STATUS_TOGGLE',
        targetType: 'AI_CAPABILITY',
        targetId: capabilityId,
        newState: { isEnabled: Boolean(isEnabled) },
        reason: req.body.reason || 'Operational adjustment',
      });

      return res.json({ success: true, status: aiEcosystemService.getSystemStatus() });
    } catch (err: unknown) {
      console.error('Error toggling AI capability:', err);
      return res.status(500).json({ success: false, error: 'Failed to update AI capability' });
    }
  });

  // ==========================================
  // PHASE 21: AUTOMATION & OPERATIONS APIS
  // ==========================================

  /**
   * GET /api/management/automation/overview
   * Returns workflows, recent executions, approval queue, and telemetry metrics.
   */
  app.get('/api/management/automation/overview', (req: Request, res: Response) => {
    const authResult = requireManagementAuth(req, res, 'AUTOMATION_VIEW');
    if (!authResult) return;

    return res.json({
      success: true,
      workflows: automationOperationsService.getWorkflows(),
      executions: automationOperationsService.getExecutionRuns(30),
      approvals: automationOperationsService.getPendingApprovals(),
      metrics: automationOperationsService.getMetrics(),
    });
  });

  /**
   * POST /api/management/automation/workflows/:workflowId/toggle
   * Toggle workflow enabled/disabled state.
   */
  app.post('/api/management/automation/workflows/:workflowId/toggle', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'AUTOMATION_MANAGE');
      if (!authResult) return;

      const { workflowId } = req.params;
      const { isEnabled } = req.body;

      const updated = automationOperationsService.toggleWorkflow(workflowId, Boolean(isEnabled));

      await managementService.recordAuditLog({
        actorId: authResult.userId,
        actorEmail: authResult.userEmail,
        actorRole: authResult.userRole,
        action: 'WORKFLOW_CONFIG_TOGGLE' as any,
        targetType: 'AUTOMATION_WORKFLOW',
        targetId: workflowId,
        newState: { isEnabled: Boolean(isEnabled) },
        reason: 'Management automation configuration update',
      });

      return res.json({ success: true, workflow: updated });
    } catch (err: unknown) {
      console.error('Error toggling workflow:', err);
      const msg = err instanceof Error ? err.message : 'Toggle failed';
      return res.status(400).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/management/automation/workflows/:workflowId/execute
   * Manually dispatches an authorized operational workflow run.
   */
  app.post('/api/management/automation/workflows/:workflowId/execute', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'AUTOMATION_MANAGE');
      if (!authResult) return;

      const { workflowId } = req.params;
      const run = await automationOperationsService.executeWorkflow(
        workflowId,
        {
          userId: authResult.userId,
          userRole: authResult.userRole,
          userEmail: authResult.userEmail,
        },
        req.body?.payload
      );

      await managementService.recordAuditLog({
        actorId: authResult.userId,
        actorEmail: authResult.userEmail,
        actorRole: authResult.userRole,
        action: 'WORKFLOW_MANUAL_DISPATCH' as any,
        targetType: 'AUTOMATION_WORKFLOW',
        targetId: workflowId,
        newState: { runId: run.runId, status: run.status },
        reason: req.body?.reason || 'Authorized operational manual trigger',
      });

      return res.json({ success: true, run });
    } catch (err: unknown) {
      console.error('Error executing workflow:', err);
      const msg = err instanceof Error ? err.message : 'Execution failed';
      return res.status(400).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/management/automation/approvals/:requestId/decide
   * Decide on a human approval request (Segregation of Duties Enforced).
   */
  app.post('/api/management/automation/approvals/:requestId/decide', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'AUTOMATION_MANAGE');
      if (!authResult) return;

      const { requestId } = req.params;
      const { decision, notes } = req.body;

      if (!['APPROVED', 'REJECTED'].includes(decision)) {
        return res.status(400).json({ success: false, error: 'Decision must be APPROVED or REJECTED' });
      }

      const item = await automationOperationsService.decideApproval(
        requestId,
        decision,
        {
          userId: authResult.userId,
          userRole: authResult.userRole,
          userEmail: authResult.userEmail,
        },
        notes
      );

      return res.json({ success: true, item });
    } catch (err: unknown) {
      console.error('Error deciding approval request:', err);
      const msg = err instanceof Error ? err.message : 'Decision rejected';
      return res.status(400).json({ success: false, error: msg });
    }
  });

  // ==========================================
  // PHASE 22: ECOSYSTEM API (V1) & INTEGRATIONS
  // ==========================================

  /**
   * Middleware for authenticating external requests via X-API-Key header
   */
  const requireApiKey = (requiredScope?: string) => {
    return (req: Request, res: Response, next: express.NextFunction) => {
      const apiKey = req.headers['x-api-key'] as string;
      if (!apiKey) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Missing X-API-Key header. Provide a valid scoped integration token.',
          },
        });
      }

      const validation = ecosystemIntegrationsService.validateApiKey(apiKey, requiredScope as any);
      if (!validation.valid) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: validation.error || 'Access denied for provided API Key.',
          },
        });
      }

      (req as any).apiCredential = validation.credential;
      next();
    };
  };

  /**
   * GET /api/v1/products
   * Scoped API: Lists published hardware catalog products
   */
  app.get('/api/v1/products', requireApiKey('products:read'), async (_req: Request, res: Response) => {
    try {
      const all = await commerceService.getAllProductsForManagement();
      const published = all.filter((p) => p.productStatus === 'PUBLISHED');
      return res.json({
        data: published.map((p) => ({
          id: p.productId,
          name: p.name,
          slug: p.slug,
          category: p.category,
          brand: p.brand,
          price: p.price,
          currency: p.currency,
          availability: p.availabilityStatus,
        })),
        meta: {
          total: published.length,
          version: 'v1',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err: unknown) {
      console.error('API v1 products error:', err);
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve products' } });
    }
  });

  /**
   * GET /api/v1/academy/courses
   * Scoped API: Lists published Nexovira Academy courses
   */
  app.get('/api/v1/academy/courses', requireApiKey('academy:read'), (_req: Request, res: Response) => {
    return res.json({
      data: [
        { id: 'course_se_01', title: 'Full-Stack Software Engineering', tuition: 250000, durationWeeks: 16 },
        { id: 'course_ui_02', title: 'Product & UI/UX Design Masterclass', tuition: 180000, durationWeeks: 12 },
        { id: 'course_cloud_03', title: 'Cloud Infrastructure & DevOps', tuition: 320000, durationWeeks: 14 },
      ],
      meta: { version: 'v1', timestamp: new Date().toISOString() },
    });
  });

  /**
   * GET /api/management/integrations/overview
   * Returns registered API keys, webhooks, adapter status, and delivery logs
   */
  app.get('/api/management/integrations/overview', (req: Request, res: Response) => {
    const authResult = requireManagementAuth(req, res, 'INTEGRATIONS_VIEW');
    if (!authResult) return;

    return res.json({
      success: true,
      data: ecosystemIntegrationsService.getOverview(),
    });
  });

  /**
   * POST /api/management/integrations/keys
   * Issues a new scoped API Key
   */
  app.post('/api/management/integrations/keys', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'INTEGRATIONS_MANAGE');
      if (!authResult) return;

      const { name, environment, scopes, rateLimitPerMin } = req.body;
      if (!name || !scopes || !Array.isArray(scopes) || scopes.length === 0) {
        return res.status(400).json({ success: false, error: 'Name and valid scopes array are required' });
      }

      const result = ecosystemIntegrationsService.createApiKey({
        name,
        environment: environment || 'PRODUCTION',
        scopes,
        rateLimitPerMin: rateLimitPerMin ? Number(rateLimitPerMin) : 60,
        actor: { userId: authResult.userId, userEmail: authResult.userEmail },
      });

      await managementService.recordAuditLog({
        actorId: authResult.userId,
        actorEmail: authResult.userEmail,
        actorRole: authResult.userRole,
        action: 'API_KEY_ISSUED' as any,
        targetType: 'API_CREDENTIAL',
        targetId: result.credential.keyId,
        newState: { name, environment, scopes },
        reason: 'Authorized management key issuance',
      });

      return res.json({ success: true, credential: result.credential, rawSecretKey: result.rawSecretKey });
    } catch (err: unknown) {
      console.error('Error creating API key:', err);
      const msg = err instanceof Error ? err.message : 'Issuance failed';
      return res.status(400).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/management/integrations/keys/:keyId/revoke
   * Revoke an active API Key
   */
  app.post('/api/management/integrations/keys/:keyId/revoke', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'INTEGRATIONS_MANAGE');
      if (!authResult) return;

      const { keyId } = req.params;
      const revoked = ecosystemIntegrationsService.revokeApiKey(keyId);
      if (!revoked) {
        return res.status(404).json({ success: false, error: 'API key not found' });
      }

      await managementService.recordAuditLog({
        actorId: authResult.userId,
        actorEmail: authResult.userEmail,
        actorRole: authResult.userRole,
        action: 'API_KEY_REVOKED' as any,
        targetType: 'API_CREDENTIAL',
        targetId: keyId,
        newState: { status: 'REVOKED' },
        reason: 'Authorized management credential revocation',
      });

      return res.json({ success: true, message: `Key ${keyId} revoked successfully.` });
    } catch (err: unknown) {
      console.error('Error revoking API key:', err);
      const msg = err instanceof Error ? err.message : 'Revocation failed';
      return res.status(400).json({ success: false, error: msg });
    }
  });

  /**
   * POST /api/management/integrations/webhooks
   * Registers a new outbound webhook endpoint
   */
  app.post('/api/management/integrations/webhooks', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'INTEGRATIONS_MANAGE');
      if (!authResult) return;

      const { name, targetUrl, subscribedEvents } = req.body;
      if (!name || !targetUrl || !subscribedEvents || !Array.isArray(subscribedEvents)) {
        return res.status(400).json({ success: false, error: 'Name, targetUrl, and subscribedEvents are required' });
      }

      const sub = ecosystemIntegrationsService.createWebhook({
        name,
        targetUrl,
        subscribedEvents,
        ownerId: authResult.userId,
      });

      await managementService.recordAuditLog({
        actorId: authResult.userId,
        actorEmail: authResult.userEmail,
        actorRole: authResult.userRole,
        action: 'WEBHOOK_ENDPOINT_REGISTERED' as any,
        targetType: 'WEBHOOK_SUBSCRIPTION',
        targetId: sub.subscriptionId,
        newState: { name, targetUrl, subscribedEvents },
        reason: 'Authorized management webhook registration',
      });

      return res.json({ success: true, webhook: sub });
    } catch (err: unknown) {
      console.error('Error registering webhook:', err);
      const msg = err instanceof Error ? err.message : 'Registration failed';
      return res.status(400).json({ success: false, error: msg });
    }
  });

  // ==========================================
  // PHASE 23: SCALE, PERFORMANCE & RELIABILITY APIS
  // ==========================================

  /**
   * GET /api/management/reliability/overview
   * Authoritative system telemetry, cache cluster, circuit breaker status, DLQ, and backup readiness.
   */
  app.get('/api/management/reliability/overview', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'RELIABILITY_VIEW');
      if (!authResult) return;

      const overview = reliabilityEngineeringService.getOverview();
      return res.json({ success: true, data: overview });
    } catch (err: unknown) {
      console.error('Error retrieving reliability overview:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve reliability telemetry' });
    }
  });

  /**
   * POST /api/management/reliability/cache/purge
   * Clears in-memory cache cluster or invalidates a specific cache domain.
   */
  app.post('/api/management/reliability/cache/purge', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'RELIABILITY_MANAGE');
      if (!authResult) return;

      const { category } = req.body;
      let purgedCount = 0;

      if (category) {
        purgedCount = reliabilityEngineeringService.invalidateCategory(category);
      } else {
        reliabilityEngineeringService.purgeAllCache();
      }

      await managementService.recordAuditLog({
        actorId: authResult.userId,
        actorEmail: authResult.userEmail,
        actorRole: authResult.userRole,
        action: 'CACHE_PURGED' as any,
        targetType: 'SYSTEM_CACHE',
        targetId: category || 'ALL_CATEGORIES',
        newState: { purgedCount, category: category || 'ALL' },
        reason: 'Authorized management cache cluster invalidation',
      });

      return res.json({
        success: true,
        message: category
          ? `Invalidated ${purgedCount} entries in category ${category}`
          : 'All cache clusters purged and warm seeds restored.',
        data: reliabilityEngineeringService.getOverview(),
      });
    } catch (err: unknown) {
      console.error('Error purging cache cluster:', err);
      return res.status(500).json({ success: false, error: 'Cache invalidation failed' });
    }
  });

  /**
   * POST /api/management/reliability/circuit-breaker/reset
   * Resets an open circuit breaker back to CLOSED.
   */
  app.post('/api/management/reliability/circuit-breaker/reset', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'RELIABILITY_MANAGE');
      if (!authResult) return;

      const { serviceId } = req.body;
      if (!serviceId) {
        return res.status(400).json({ success: false, error: 'serviceId is required' });
      }

      const reset = reliabilityEngineeringService.resetCircuitBreaker(serviceId);
      if (!reset) {
        return res.status(404).json({ success: false, error: 'Circuit breaker not found' });
      }

      await managementService.recordAuditLog({
        actorId: authResult.userId,
        actorEmail: authResult.userEmail,
        actorRole: authResult.userRole,
        action: 'CIRCUIT_BREAKER_RESET' as any,
        targetType: 'CIRCUIT_BREAKER',
        targetId: serviceId,
        newState: { state: 'CLOSED', failures: 0 },
        reason: 'Authorized management circuit breaker reset',
      });

      return res.json({
        success: true,
        message: `Circuit breaker ${serviceId} reset to CLOSED.`,
        data: reliabilityEngineeringService.getOverview(),
      });
    } catch (err: unknown) {
      console.error('Error resetting circuit breaker:', err);
      return res.status(500).json({ success: false, error: 'Circuit breaker reset failed' });
    }
  });

  /**
   * POST /api/management/reliability/dlq/retry
   * Re-queues a Dead Letter Queue item for background delivery.
   */
  app.post('/api/management/reliability/dlq/retry', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'RELIABILITY_MANAGE');
      if (!authResult) return;

      const { jobId } = req.body;
      if (!jobId) {
        return res.status(400).json({ success: false, error: 'jobId is required' });
      }

      const retried = reliabilityEngineeringService.retryDeadLetterJob(jobId);
      if (!retried) {
        return res.status(404).json({ success: false, error: 'DLQ job not found' });
      }

      await managementService.recordAuditLog({
        actorId: authResult.userId,
        actorEmail: authResult.userEmail,
        actorRole: authResult.userRole,
        action: 'DLQ_JOB_RETRY' as any,
        targetType: 'DEAD_LETTER_JOB',
        targetId: jobId,
        newState: { status: 'RE_DISPATCHED' },
        reason: 'Authorized management DLQ job retry',
      });

      return res.json({
        success: true,
        message: `Job ${jobId} re-dispatched into processing worker pool.`,
        data: reliabilityEngineeringService.getOverview(),
      });
    } catch (err: unknown) {
      console.error('Error retrying DLQ job:', err);
      return res.status(500).json({ success: false, error: 'DLQ retry execution failed' });
    }
  });

  /**
   * Liveness and Readiness Probes for Kubernetes / Cloud Run Container Orchestration
   */
  app.get('/api/health/live', (_req: Request, res: Response) => {
    return res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
  });

  app.get('/api/health/ready', (_req: Request, res: Response) => {
    const overview = reliabilityEngineeringService.getOverview();
    const isHealthy = overview.telemetry.memoryUsageMb.heapUsed < 1024; // under 1GB
    return res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'READY' : 'DEGRADED',
      uptimeSeconds: overview.telemetry.uptimeSeconds,
      memoryHeapMb: overview.telemetry.memoryUsageMb.heapUsed,
      activeCircuitBreakers: overview.circuitBreakers.filter(cb => cb.state === 'OPEN').length,
      timestamp: new Date().toISOString(),
    });
  });

  // ==========================================
  // PHASE 24: FINAL LAUNCH READINESS AUDIT APIS
  // ==========================================

  /**
   * GET /api/management/launch-readiness/report
   * Triggers the comprehensive 24-phase ecosystem audit suite and returns authoritative verification matrix.
   */
  app.get('/api/management/launch-readiness/report', async (req: Request, res: Response) => {
    try {
      const authResult = requireManagementAuth(req, res, 'AUDIT_LOGS_VIEW');
      if (!authResult) return;

      const report = await ecosystemAuditRunner.runFullAudit();
      return res.json({ success: true, report });
    } catch (err: unknown) {
      console.error('Error generating launch readiness report:', err);
      return res.status(500).json({ success: false, error: 'Failed to generate launch readiness report' });
    }
  });

  // ==========================================
  // Vite Middleware / Static Frontend Mounting
  // ==========================================

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nexovira Commerce Engine running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Startup Error:', err);
  process.exit(1);
});
