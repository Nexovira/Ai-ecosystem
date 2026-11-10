import { db } from '../src/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { servicesService } from '../src/server/servicesService';
import { ServiceRequestSubmissionPayload } from '../src/types/services';
import firebaseConfig from '../firebase-applet-config.json';

async function runTechProjectAudit() {
  console.log('================================================================');
  console.log('NEXOVIRA TECH PROJECT SUBMISSION PRODUCTION VERIFICATION');
  console.log(`Target Project: ${firebaseConfig.projectId}`);
  console.log(`Target Database: ${firebaseConfig.firestoreDatabaseId}`);
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`✓ [PASS] ${name}`);
      if (details) console.log(`       Details: ${details}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${name}`);
      if (details) console.error(`       Failure: ${details}`);
      failed++;
    }
  }

  const testUserId = `usr-test-client-${Date.now()}`;
  const testCustomerEmail = `client.${Date.now()}@nexovira-audit.ng`;
  const testCustomerName = 'Chief Emmanuel Adebayo';
  let createdRequestId: string | null = null;

  try {
    // 1. Validation Tests: Empty or invalid input
    console.log('\n--- 1. SERVER-SIDE INPUT VALIDATION ---');
    const invalidShortTitle: ServiceRequestSubmissionPayload = {
      categoryId: 'cat-web-development',
      projectTitle: 'AI', // Too short
      description: 'This is a long enough description that exceeds twenty characters.',
      goals: 'Transform our business enterprise architecture.',
      budgetMin: 500000,
      budgetMax: 1000000,
      requiredSkills: [],
      currency: 'NGN',
      preferredTimeline: 'Flexible',
      priority: 'MEDIUM',
    };
    const shortTitleRes = await servicesService.createProjectRequest(
      testUserId,
      testCustomerName,
      testCustomerEmail,
      invalidShortTitle
    );
    assert(
      'Short Title Rejection',
      Boolean(!shortTitleRes.success && shortTitleRes.error?.includes('at least 5 characters')),
      shortTitleRes.error
    );

    const invalidBudget: ServiceRequestSubmissionPayload = {
      categoryId: 'cat-web-development',
      projectTitle: 'Enterprise ERP System Development',
      description: 'Detailed description exceeding the twenty characters requirement easily.',
      goals: 'Implement complete ERP operations across all facilities.',
      budgetMin: 1500000,
      budgetMax: 500000, // Max < Min
      requiredSkills: [],
      currency: 'NGN',
      preferredTimeline: 'Flexible',
      priority: 'MEDIUM',
    };
    const invalidBudgetRes = await servicesService.createProjectRequest(
      testUserId,
      testCustomerName,
      testCustomerEmail,
      invalidBudget
    );
    assert(
      'Invalid Budget Range Rejection',
      Boolean(!invalidBudgetRes.success && invalidBudgetRes.error?.includes('greater than or equal to minimum')),
      invalidBudgetRes.error
    );

    // 2. Real Submission Workflow
    console.log('\n--- 2. AUTHORITATIVE PROJECT CREATION & FIRESTORE PERSISTENCE ---');
    const validSubmission: ServiceRequestSubmissionPayload = {
      categoryId: 'cat-web-development',
      projectTitle: 'Nexovira Cloud Portal & Enterprise Architecture',
      description: 'We require a scalable web application with modern security, Firebase persistence, and real-time operations telemetry.',
      goals: 'Expand commercial digital footprint across West Africa with 99.9% uptime and zero-loss transactions.',
      requiredSkills: ['React', 'TypeScript', 'Cloud Infrastructure', 'Firebase'],
      budgetMin: 1200000,
      budgetMax: 2500000,
      currency: 'NGN',
      preferredTimeline: '2-4 weeks',
      priority: 'HIGH',
      contactName: testCustomerName,
      contactEmail: testCustomerEmail,
      contactPhone: '+234 803 123 4567',
    };

    const submitRes = await servicesService.createProjectRequest(
      testUserId,
      testCustomerName,
      testCustomerEmail,
      validSubmission
    );

    assert(
      'Submission Execution Result',
      submitRes.success && Boolean(submitRes.request?.requestId),
      `Generated ID: ${submitRes.request?.requestId}, Reference: ${submitRes.request?.requestReference}`
    );

    if (submitRes.request) {
      createdRequestId = submitRes.request.requestId;

      // 3. Inspect Production Firestore directly
      console.log('\n--- 3. DIRECT PRODUCTION FIRESTORE DOCUMENT VERIFICATION ---');
      const docRef = doc(db, 'projectRequests', createdRequestId);
      const docSnap = await getDoc(docRef);

      assert(
        'Firestore Document Exists',
        docSnap.exists(),
        `Document path: projectRequests/${createdRequestId}`
      );

      if (docSnap.exists()) {
        const stored = docSnap.data();
        assert(
          'Customer ID Binding Integrity',
          stored.customerId === testUserId,
          `Stored customerId: ${stored.customerId}`
        );
        assert(
          'Reference Code Generation',
          Boolean(stored.requestReference && stored.requestReference.startsWith('NXR-REQ-')),
          `Reference: ${stored.requestReference}`
        );
        assert(
          'Budget Consistency',
          stored.budgetMin === 1200000 && stored.budgetMax === 2500000 && stored.currency === 'NGN',
          `Budget: ₦${stored.budgetMin.toLocaleString()} - ₦${stored.budgetMax.toLocaleString()} ${stored.currency}`
        );
        assert(
          'Status Initial State',
          stored.status === 'SUBMITTED',
          `Status: ${stored.status}`
        );

        // 4. Verify Welcome Update Subcollection
        const updateSnap = await getDocs(collection(db, 'projectRequests', createdRequestId, 'updates'));
        assert(
          'System Welcome Update in Subcollection',
          !updateSnap.empty,
          `Found ${updateSnap.size} initial update thread record(s)`
        );
      }

      // 5. Customer Retrieval & IDOR Isolation
      console.log('\n--- 4. DATA RETRIEVAL & IDOR AUTHORIZATION GATES ---');
      const ownerRead = await servicesService.getRequestById(createdRequestId, testUserId, 'CUSTOMER');
      assert(
        'Customer Owner Can Read Own Project',
        Boolean(ownerRead.request && !ownerRead.error),
        `Retrieved: ${ownerRead.request?.projectTitle}`
      );

      const unauthorizedUser = 'usr-unauthorized-intruder';
      const unauthorizedRead = await servicesService.getRequestById(createdRequestId, unauthorizedUser, 'CUSTOMER');
      assert(
        'IDOR Security Gate Rejects Non-Owner User',
        Boolean(unauthorizedRead.error?.includes('Access denied')),
        `Denied with: ${unauthorizedRead.error}`
      );

      const adminRead = await servicesService.getRequestById(createdRequestId, 'usr-admin-ops', 'ADMIN');
      assert(
        'Administrator Can Read Project',
        Boolean(adminRead.request && !adminRead.error),
        `Admin access verified for management audit`
      );

      const customerProjects = await servicesService.getCustomerRequests(testUserId);
      assert(
        'Customer History Directory Contains Project',
        customerProjects.some((p) => p.requestId === createdRequestId),
        `Found ${customerProjects.length} project(s) for customer ${testUserId}`
      );

      // 6. Management Directory Verification
      const allProjects = await servicesService.getAllRequestsForManagement();
      assert(
        'Management Queue Contains Project',
        allProjects.some((p) => p.requestId === createdRequestId),
        `Total management queue volume: ${allProjects.length}`
      );

      // 7. Status Machine Progression Test
      console.log('\n--- 5. STATUS LIFECYCLE PROGRESSION ---');
      const cancelRes = await servicesService.updateRequestStatus(
        createdRequestId,
        'CANCELLED',
        testUserId,
        'CUSTOMER',
        'Customer requested project hold'
      );
      assert(
        'Customer Cancellation of Submitted Project',
        cancelRes.success,
        `Status updated to CANCELLED`
      );

      const cancelledDoc = await getDoc(docRef);
      assert(
        'Cancelled Status Persisted to Firestore',
        cancelledDoc.data()?.status === 'CANCELLED',
        `Current Firestore status: ${cancelledDoc.data()?.status}`
      );
    }
  } catch (err) {
    console.error('Audit exception:', err);
    assert('Execution completed without unhandled exceptions', false, String(err));
  } finally {
    // Teardown
    if (createdRequestId) {
      try {
        await deleteDoc(doc(db, 'projectRequests', createdRequestId));
        console.log(`\nCleaned up audit test project record: ${createdRequestId}`);
      } catch (cleanErr) {
        console.warn('Cleanup warning:', cleanErr);
      }
    }
  }

  console.log('\n================================================================');
  console.log(`AUDIT FINISHED: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTechProjectAudit().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
