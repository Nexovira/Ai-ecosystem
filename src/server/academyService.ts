import {
  Course,
  CourseCategory,
  ScholarshipPayment,
  ScholarshipApplication,
  ScholarshipApplicationStatus,
  ApplicationResponses,
  AcademyNotificationEvent,
  AcademyNotificationType,
} from '../types/academy';
import { INITIAL_COURSES, INITIAL_COURSE_CATEGORIES } from '../data/academyCatalog';
import { paymentGateway } from './payment/PaymentGateway';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { affiliateService } from './affiliateService';
import { notificationService } from './notificationService';

export class AcademyService {
  private courses: Map<string, Course> = new Map();
  private categories: Map<string, CourseCategory> = new Map();
  private payments: Map<string, ScholarshipPayment> = new Map();
  private applications: Map<string, ScholarshipApplication> = new Map();
  private notificationEvents: AcademyNotificationEvent[] = [];
  private isInitialized = false;

  constructor() {
    this.seedData();
  }

  private async seedData() {
    if (this.isInitialized) return;

    // Seed default categories
    INITIAL_COURSE_CATEGORIES.forEach((cat) => {
      this.categories.set(cat.id, { ...cat });
    });

    // Seed default courses
    INITIAL_COURSES.forEach((crs) => {
      this.courses.set(crs.courseId, { ...crs });
    });

    // Non-blocking attempt to read any Firestore overrides if present
    try {
      if (db) {
        const catSnap = await getDocs(collection(db, 'courseCategories')).catch(() => null);
        if (catSnap && !catSnap.empty) {
          catSnap.forEach((doc) => {
            const data = doc.data() as CourseCategory;
            this.categories.set(data.id || doc.id, { ...data, id: data.id || doc.id });
          });
        }

        const crsSnap = await getDocs(collection(db, 'courses')).catch(() => null);
        if (crsSnap && !crsSnap.empty) {
          crsSnap.forEach((doc) => {
            const data = doc.data() as Course;
            this.courses.set(data.courseId || doc.id, { ...data, courseId: data.courseId || doc.id });
          });
        }
      }
    } catch {
      // In-memory defaults are safe and active
    }

    this.isInitialized = true;
  }

  // ==========================================
  // Notifications & Audit
  // ==========================================
  public dispatchNotification(
    type: AcademyNotificationType,
    recipient: string,
    recipientType: 'STUDENT' | 'MANAGEMENT',
    message: string,
    metadata?: Record<string, unknown>
  ): AcademyNotificationEvent {
    const event: AcademyNotificationEvent = {
      eventId: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      recipient,
      recipientType,
      applicationId: metadata?.applicationId as string,
      applicationReference: metadata?.applicationReference as string,
      courseId: metadata?.courseId as string,
      courseTitle: metadata?.courseTitle as string,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.notificationEvents.unshift(event);
    if (this.notificationEvents.length > 500) {
      this.notificationEvents.pop();
    }

    // Clean logging & integration point for email infrastructure
    console.log(`[ACADEMY NOTIFICATION] [${type}] to ${recipientType} (${recipient}): ${message}`);

    // Bridge to authoritative centralized notificationService
    if (recipientType === 'STUDENT') {
      const notifType = type === 'PAYMENT_SUCCESSFUL' ? 'COURSE_PURCHASED'
        : type === 'APPLICATION_ACCEPTED' ? 'COURSE_ENROLLMENT_CONFIRMED'
        : 'COURSE_STATUS_CHANGED';

      notificationService.dispatch({
        recipientUserId: recipient,
        type: notifType,
        category: 'ACADEMY',
        title: `Nexovira Academy: ${type.replace(/_/g, ' ')}`,
        message,
        relatedEntityType: 'ACADEMY_APPLICATION',
        relatedEntityId: (metadata?.applicationId as string) || (metadata?.courseId as string),
        actionUrl: '/account/academy',
        priority: type === 'APPLICATION_ACCEPTED' ? 'HIGH' : 'NORMAL',
        idempotencyKey: `acad_${event.eventId}`,
      }).catch(() => {});
    } else if (recipientType === 'MANAGEMENT') {
      notificationService.dispatchToManagement({
        type: 'SYSTEM_ALERT',
        category: 'MANAGEMENT',
        title: `Academy Alert: ${type.replace(/_/g, ' ')}`,
        message,
        relatedEntityType: 'ACADEMY_APPLICATION',
        relatedEntityId: (metadata?.applicationId as string) || (metadata?.courseId as string),
        actionUrl: '/management/academy',
        priority: 'NORMAL',
        idempotencyKey: `acad_mgmt_${event.eventId}`,
      }).catch(() => {});
    }

    return event;
  }

  public getNotificationEvents(userRole?: string): AcademyNotificationEvent[] {
    if (!userRole || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
      return [];
    }
    return [...this.notificationEvents];
  }

  // ==========================================
  // Categories Management
  // ==========================================
  public getCategories(includeInactive = false): CourseCategory[] {
    const list = Array.from(this.categories.values());
    const filtered = includeInactive ? list : list.filter((c) => c.isActive);
    return filtered.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public createOrUpdateCategory(data: Partial<CourseCategory>, userRole: string): CourseCategory {
    if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
      throw new Error('Forbidden: Management access required to configure course categories');
    }

    const id = data.id || `cat-${(data.name || 'new').toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    const slug = data.slug || (data.name || 'new').toLowerCase().replace(/[^a-z0-9]/g, '-');
    const existing = this.categories.get(id);

    const category: CourseCategory = {
      id,
      name: data.name || existing?.name || 'New Category',
      slug,
      description: data.description || existing?.description || '',
      icon: data.icon || existing?.icon || 'Code',
      isActive: data.isActive !== undefined ? data.isActive : true,
      displayOrder: data.displayOrder !== undefined ? data.displayOrder : existing?.displayOrder || 10,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.categories.set(id, category);
    return category;
  }

  // ==========================================
  // Course Management
  // ==========================================
  public getCourses(options?: {
    category?: string;
    level?: string;
    search?: string;
    status?: string;
    includeAll?: boolean;
    featuredOnly?: boolean;
  }): Course[] {
    let list = Array.from(this.courses.values());

    // Public request: strictly return PUBLISHED courses only
    if (!options?.includeAll) {
      list = list.filter((c) => c.status === 'PUBLISHED');
    } else if (options?.status) {
      list = list.filter((c) => c.status === options.status);
    }

    if (options?.featuredOnly) {
      list = list.filter((c) => c.isFeatured);
    }

    if (options?.category) {
      const catLower = options.category.toLowerCase();
      list = list.filter((c) => c.category.toLowerCase() === catLower || c.categoryName?.toLowerCase() === catLower);
    }

    if (options?.level && options.level !== 'ALL') {
      list = list.filter((c) => c.level.toLowerCase() === options.level?.toLowerCase());
    }

    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.shortDescription.toLowerCase().includes(q) ||
          c.fullDescription.toLowerCase().includes(q) ||
          c.instructorName.toLowerCase().includes(q) ||
          c.learningOutcomes.some((o) => o.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getCourseBySlug(slug: string, includeAll = false): Course | null {
    const course = Array.from(this.courses.values()).find((c) => c.slug === slug);
    if (!course) return null;
    if (!includeAll && course.status !== 'PUBLISHED') return null;
    return course;
  }

  public getCourseById(courseId: string, includeAll = false): Course | null {
    const course = this.courses.get(courseId);
    if (!course) return null;
    if (!includeAll && course.status !== 'PUBLISHED') return null;
    return course;
  }

  public createCourse(data: Partial<Course>, userRole: string): Course {
    if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
      throw new Error('Forbidden: Management role required to create courses');
    }

    const title = data.title || 'Untitled Course';
    const slug = data.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const courseId = `crs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Resolve category name
    const categoryObj = Array.from(this.categories.values()).find((c) => c.slug === data.category || c.id === data.category);

    const newCourse: Course = {
      courseId,
      title,
      slug,
      shortDescription: data.shortDescription || '',
      fullDescription: data.fullDescription || '',
      courseImage: data.courseImage || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop',
      category: data.category || 'web-development',
      categoryName: categoryObj?.name || 'General',
      instructorName: data.instructorName || 'Nexovira Faculty',
      instructorTitle: data.instructorTitle || 'Senior Technology Mentor',
      instructorProfile: data.instructorProfile || '',
      instructorImage: data.instructorImage || '',
      duration: data.duration || '8 Weeks',
      level: data.level || 'All Levels',
      requirements: data.requirements || ['Laptop with internet access', 'Commitment to practical assignments'],
      learningOutcomes: data.learningOutcomes || ['Production-ready technical skills', 'Real capstone projects'],
      scholarshipFee: 4500, // Strictly enforced server-side
      currency: 'NGN',
      whatsappGroupLink: data.whatsappGroupLink || '',
      status: data.status || 'DRAFT',
      isFeatured: !!data.isFeatured,
      applicationsOpen: data.applicationsOpen !== undefined ? data.applicationsOpen : true,
      syllabus: data.syllabus || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.courses.set(courseId, newCourse);
    return newCourse;
  }

  public updateCourse(courseId: string, updates: Partial<Course>, userRole: string): Course {
    if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
      throw new Error('Forbidden: Management role required to update courses');
    }

    const course = this.courses.get(courseId);
    if (!course) {
      throw new Error(`Course not found: ${courseId}`);
    }

    // Category name resolution if category changed
    let categoryName = course.categoryName;
    if (updates.category) {
      const cat = Array.from(this.categories.values()).find((c) => c.slug === updates.category || c.id === updates.category);
      if (cat) categoryName = cat.name;
    }

    const updated: Course = {
      ...course,
      ...updates,
      categoryName,
      scholarshipFee: 4500, // strictly enforce ₦4,500
      currency: 'NGN',
      updatedAt: new Date().toISOString(),
    };

    this.courses.set(courseId, updated);
    return updated;
  }

  public deleteCourse(courseId: string, userRole: string): boolean {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      throw new Error('Forbidden: Super Admin or Admin role required to delete courses');
    }
    return this.courses.delete(courseId);
  }

  // ==========================================
  // Scholarship Payment & Registration Flow
  // ==========================================

  /**
   * Initializes a scholarship payment for a course.
   * Enforces server-side fee of ₦4,500 NGN.
   * Handles duplicate application protections.
   */
  public async initializeScholarshipPayment(params: {
    userId: string;
    userEmail: string;
    courseId: string;
    originUrl: string;
    referralCode?: string;
  }): Promise<{
    success: boolean;
    alreadyCompleted?: boolean;
    alreadyPaid?: boolean;
    applicationId?: string;
    paymentId?: string;
    reference?: string;
    authorizationUrl?: string;
    isTestMode?: boolean;
    amount?: number;
    currency?: string;
    message?: string;
  }> {
    const { userId, userEmail, courseId, originUrl } = params;

    const course = this.courses.get(courseId);
    if (!course) {
      return { success: false, message: 'Specified course does not exist.' };
    }

    if (course.status !== 'PUBLISHED') {
      return { success: false, message: 'This course is not published.' };
    }

    if (!course.applicationsOpen) {
      return { success: false, message: 'Scholarship applications are currently closed for this course.' };
    }

    // 1. Duplicate Check: Check existing application for this user and course
    const existingApp = Array.from(this.applications.values()).find(
      (app) => app.userId === userId && app.courseId === courseId
    );

    if (existingApp) {
      // If already paid and registration form is pending, do not charge again! Unlock form!
      if (existingApp.status === 'PAYMENT_SUCCESS_FORM_PENDING' || existingApp.status === 'FORM_IN_PROGRESS') {
        return {
          success: true,
          alreadyPaid: true,
          applicationId: existingApp.applicationId,
          message: 'Payment already verified for this course. Registration form is unlocked.',
        };
      }

      // If already submitted/under review/accepted, return current status
      if (['SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED'].includes(existingApp.status)) {
        return {
          success: true,
          alreadyCompleted: true,
          applicationId: existingApp.applicationId,
          message: `Application already submitted. Current status: ${existingApp.status.replace(/_/g, ' ')}.`,
        };
      }
    }

    // 2. Strict Server-Authoritative Amount
    const feeAmount = 4500; // ₦4,500 NGN strictly enforced
    const currency = 'NGN';
    const reference = `NEX-SCH-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const paymentId = `pay-sch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // 3. Create or reuse payment intent
    const paymentRecord: ScholarshipPayment = {
      paymentId,
      userId,
      courseId,
      provider: 'PAYSTACK',
      providerReference: reference,
      amount: feeAmount,
      currency,
      paymentStatus: 'PENDING',
      referralCode: params.referralCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.payments.set(paymentId, paymentRecord);

    // 4. Initialize transaction with Paystack Provider
    const callbackUrl = `${originUrl}/academy/courses/${course.slug}?verify_payment=true&reference=${encodeURIComponent(
      reference
    )}`;

    const paystackResult = await paymentGateway.initializePayment('PAYSTACK', {
      email: userEmail,
      amount: feeAmount,
      currency,
      reference,
      callbackUrl,
      metadata: {
        paymentType: 'ACADEMY_SCHOLARSHIP',
        userId,
        courseId,
        courseTitle: course.title,
        paymentId,
        referralCode: params.referralCode,
      },
    });

    if (!paystackResult.success) {
      paymentRecord.paymentStatus = 'FAILED';
      this.dispatchNotification(
        'PAYMENT_FAILED',
        userEmail,
        'STUDENT',
        `Failed to initialize scholarship payment for ${course.title}`,
        { courseId, reference }
      );
      return { success: false, message: paystackResult.message || 'Payment initialization failed.' };
    }

    return {
      success: true,
      paymentId,
      reference,
      authorizationUrl: paystackResult.authorizationUrl,
      isTestMode: paystackResult.isTestMode,
      amount: feeAmount,
      currency,
    };
  }

  /**
   * Verifies scholarship payment server-side.
   * Strictly confirms the transaction before unlocking registration form.
   */
  public async verifyScholarshipPayment(
    reference: string,
    currentUserId?: string
  ): Promise<{
    success: boolean;
    verified: boolean;
    applicationId?: string;
    courseId?: string;
    courseSlug?: string;
    amount?: number;
    error?: string;
  }> {
    if (!reference) {
      return { success: false, verified: false, error: 'Payment reference is required.' };
    }

    // 1. Verify with Provider
    const verifyResult = await paymentGateway.verifyPayment('PAYSTACK', reference);
    if (!verifyResult.success || verifyResult.status !== 'SUCCESS') {
      return {
        success: false,
        verified: false,
        error: verifyResult.gatewayResponse || 'Payment verification failed with provider.',
      };
    }

    // 2. Find payment record by reference
    let payment = Array.from(this.payments.values()).find((p) => p.providerReference === reference);
    if (!payment) {
      // Create if webhook arrived before query
      const newPaymentId = `pay-sch-${Date.now()}`;
      payment = {
        paymentId: newPaymentId,
        userId: currentUserId || 'unknown-user',
        courseId: 'unknown-course',
        provider: 'PAYSTACK',
        providerReference: reference,
        amount: verifyResult.amount || 4500,
        currency: 'NGN',
        paymentStatus: 'SUCCESS',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        verifiedDate: new Date().toISOString(),
      };
      this.payments.set(newPaymentId, payment);
    } else {
      payment.paymentStatus = 'SUCCESS';
      payment.verifiedDate = new Date().toISOString();
      payment.updatedAt = new Date().toISOString();
    }

    const course = this.courses.get(payment.courseId);

    // 3. Find or Create Application in PAYMENT_SUCCESS_FORM_PENDING state
    let application = Array.from(this.applications.values()).find(
      (app) => app.paymentId === payment?.paymentId || (app.userId === payment?.userId && app.courseId === payment?.courseId)
    );

    if (!application) {
      const applicationId = `sch-app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const applicationReference = `NEX-SCH-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      application = {
        applicationId,
        applicationReference,
        userId: payment.userId,
        courseId: payment.courseId,
        courseTitle: course?.title || 'Nexovira Academy Course',
        courseSlug: course?.slug || '',
        paymentId: payment.paymentId,
        fullName: '',
        email: '',
        phone: '',
        responses: {},
        status: 'PAYMENT_SUCCESS_FORM_PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.applications.set(applicationId, application);
      payment.applicationId = applicationId;
    } else {
      if (application.status === 'PAYMENT_PENDING') {
        application.status = 'PAYMENT_SUCCESS_FORM_PENDING';
        application.updatedAt = new Date().toISOString();
      }
    }

    // 4. Dispatch notification events
    this.dispatchNotification(
      'PAYMENT_SUCCESSFUL',
      payment.userId,
      'STUDENT',
      `Payment of ₦4,500 successfully verified for ${course?.title || 'course'}. Registration form unlocked.`,
      {
        applicationId: application.applicationId,
        applicationReference: application.applicationReference,
        courseId: payment.courseId,
        reference,
      }
    );

    this.dispatchNotification(
      'PAYMENT_SUCCESSFUL',
      'nexoviratech@gmail.com',
      'MANAGEMENT',
      `Scholarship fee received (₦4,500) for course ${course?.title || payment.courseId} [Ref: ${reference}]`,
      {
        applicationId: application.applicationId,
        userId: payment.userId,
        reference,
      }
    );

    // 5. Record affiliate commission if valid referralCode was attached
    const referralCode = payment.referralCode;
    if (referralCode) {
      try {
        await affiliateService.recordAcademyCommission({
          applicationId: application.applicationId,
          applicationReference: application.applicationReference,
          customerUserId: payment.userId,
          courseId: payment.courseId,
          amount: payment.amount,
          referralCode,
        });
      } catch (commErr) {
        console.warn('Affiliate academy commission calculation notice:', commErr);
      }
    }

    return {
      success: true,
      verified: true,
      applicationId: application.applicationId,
      courseId: payment.courseId,
      courseSlug: course?.slug,
      amount: payment.amount,
    };
  }

  // ==========================================
  // Application Management & IDOR Protections
  // ==========================================

  /**
   * Retrieves an application by ID with strict ownership validation (anti-IDOR).
   */
  public getApplication(
    applicationId: string,
    currentUserId: string,
    userRole?: string
  ): { application: ScholarshipApplication; course: Course | null } {
    const application = this.applications.get(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    const isManagement = userRole && ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole);
    // Strict Access Control: Authenticated user must own the application or be authorized management
    if (application.userId !== currentUserId && !isManagement) {
      throw new Error('Forbidden: Unauthorized access to application data.');
    }

    const course = this.courses.get(application.courseId) || null;

    // Student view: omit internal management notes
    if (!isManagement) {
      const sanitizedApp = { ...application };
      delete sanitizedApp.internalNotes;
      return { application: sanitizedApp, course };
    }

    return { application: { ...application }, course };
  }

  /**
   * Submits the registration form for an unlocked application.
   */
  public submitApplication(params: {
    applicationId: string;
    userId: string;
    responses: ApplicationResponses;
  }): ScholarshipApplication {
    const { applicationId, userId, responses } = params;
    const application = this.applications.get(applicationId);

    if (!application) {
      throw new Error('Application not found');
    }

    // IDOR Protection: Only the application owner can submit
    if (application.userId !== userId) {
      throw new Error('Forbidden: Unauthorized application modification.');
    }

    // Verification check: Must have paid before submitting registration
    const payment = this.payments.get(application.paymentId);
    if (
      application.status !== 'PAYMENT_SUCCESS_FORM_PENDING' &&
      application.status !== 'FORM_IN_PROGRESS' &&
      payment?.paymentStatus !== 'SUCCESS'
    ) {
      throw new Error('Registration form is locked. A verified ₦4,500 scholarship payment is required.');
    }

    // Validate required fields
    if (
      !responses.fullName ||
      !responses.email ||
      !responses.phone ||
      !responses.country ||
      !responses.state ||
      !responses.whyJoin ||
      !responses.educationalBackground
    ) {
      throw new Error('Please fill in all required registration fields.');
    }

    application.fullName = responses.fullName;
    application.email = responses.email;
    application.phone = responses.phone;
    application.responses = responses;
    application.status = 'SUBMITTED';
    application.submittedDate = new Date().toISOString();
    application.updatedAt = new Date().toISOString();

    const course = this.courses.get(application.courseId);

    // Dispatch notifications
    this.dispatchNotification(
      'APPLICATION_SUBMITTED',
      application.email,
      'STUDENT',
      `Your scholarship application for ${course?.title || 'Nexovira Academy'} has been submitted. Reference: ${application.applicationReference}`,
      {
        applicationId: application.applicationId,
        applicationReference: application.applicationReference,
        courseId: application.courseId,
      }
    );

    this.dispatchNotification(
      'APPLICATION_RECEIVED',
      'nexoviratech@gmail.com',
      'MANAGEMENT',
      `New scholarship application submitted by ${responses.fullName} (${responses.email}) for ${course?.title || 'course'}. Ref: ${application.applicationReference}`,
      {
        applicationId: application.applicationId,
        applicationReference: application.applicationReference,
        courseId: application.courseId,
        applicantName: responses.fullName,
      }
    );

    return application;
  }

  /**
   * Fetches all scholarship applications for a student.
   */
  public getStudentApplications(userId: string): Array<{
    application: ScholarshipApplication;
    course: Course | null;
    payment: ScholarshipPayment | null;
  }> {
    const userApps = Array.from(this.applications.values()).filter((a) => a.userId === userId);

    return userApps
      .map((app) => {
        const course = this.courses.get(app.courseId) || null;
        const payment = this.payments.get(app.paymentId) || null;
        const sanitizedApp = { ...app };
        delete sanitizedApp.internalNotes; // Strips internal staff notes
        return {
          application: sanitizedApp,
          course,
          payment,
        };
      })
      .sort((a, b) => new Date(b.application.createdAt).getTime() - new Date(a.application.createdAt).getTime());
  }

  /**
   * Management: View all applications with filtering and search.
   */
  public getAllApplications(
    userRole: string,
    filters?: { courseId?: string; status?: string; search?: string }
  ): Array<{
    application: ScholarshipApplication;
    course: Course | null;
    payment: ScholarshipPayment | null;
  }> {
    if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
      throw new Error('Forbidden: Management role required to view all applications.');
    }

    let list = Array.from(this.applications.values());

    if (filters?.courseId) {
      list = list.filter((a) => a.courseId === filters.courseId);
    }

    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter((a) => a.status === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.applicationReference.toLowerCase().includes(q) ||
          a.fullName.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.phone.toLowerCase().includes(q) ||
          (a.courseTitle && a.courseTitle.toLowerCase().includes(q))
      );
    }

    return list
      .map((app) => {
        const course = this.courses.get(app.courseId) || null;
        const payment = this.payments.get(app.paymentId) || null;
        return { application: { ...app }, course, payment };
      })
      .sort((a, b) => new Date(b.application.createdAt).getTime() - new Date(a.application.createdAt).getTime());
  }

  /**
   * Management: Review application (Accept, Reject, Request Info, Add Notes).
   */
  public reviewApplication(params: {
    applicationId: string;
    status: ScholarshipApplicationStatus;
    internalNotes?: string;
    reviewerId: string;
    userRole: string;
  }): ScholarshipApplication {
    const { applicationId, status, internalNotes, reviewerId, userRole } = params;

    if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
      throw new Error('Forbidden: Management access required to review applications.');
    }

    const application = this.applications.get(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    application.status = status;
    if (internalNotes !== undefined) {
      application.internalNotes = internalNotes;
    }
    application.reviewedDate = new Date().toISOString();
    application.reviewedBy = reviewerId;
    application.updatedAt = new Date().toISOString();

    const course = this.courses.get(application.courseId);

    // Notifications on review decisions
    if (status === 'ACCEPTED') {
      this.dispatchNotification(
        'APPLICATION_ACCEPTED',
        application.email,
        'STUDENT',
        `Congratulations! Your scholarship application for ${course?.title || 'the course'} has been ACCEPTED. Join the WhatsApp community to begin.`,
        {
          applicationId: application.applicationId,
          applicationReference: application.applicationReference,
          courseId: application.courseId,
          whatsappGroupLink: course?.whatsappGroupLink,
        }
      );
    } else if (status === 'REJECTED') {
      this.dispatchNotification(
        'APPLICATION_REJECTED',
        application.email,
        'STUDENT',
        `Your scholarship application for ${course?.title || 'the course'} has been reviewed and declined at this time.`,
        {
          applicationId: application.applicationId,
          applicationReference: application.applicationReference,
        }
      );
    }

    return application;
  }

  /**
   * Management: View all scholarship payments.
   */
  public getAllScholarshipPayments(userRole: string): Array<{
    payment: ScholarshipPayment;
    course: Course | null;
    application: ScholarshipApplication | null;
  }> {
    if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
      throw new Error('Forbidden: Management role required to view payment records.');
    }

    return Array.from(this.payments.values())
      .map((p) => {
        const course = this.courses.get(p.courseId) || null;
        const application = p.applicationId ? this.applications.get(p.applicationId) || null : null;
        return { payment: p, course, application };
      })
      .sort((a, b) => new Date(b.payment.createdAt).getTime() - new Date(a.payment.createdAt).getTime());
  }
}

export const academyService = new AcademyService();
