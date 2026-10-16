import dotenv from 'dotenv';
dotenv.config();
import { ecosystemAuditRunner } from './ecosystemAuditSuite';

async function main() {
  console.log('====================================================');
  console.log('NEXOVIRA ECOSYSTEM: PHASE 24 LAUNCH READINESS AUDIT');
  console.log('====================================================\n');

  const report = await ecosystemAuditRunner.runFullAudit();

  console.log(`Executed ${report.totalTests} tests in ${report.executionDurationMs}ms.`);
  console.log(`Status: ${report.overallStatus}`);
  console.log(`Passed: ${report.passedCount} | Failed: ${report.failedCount} | Warnings: ${report.warningCount}\n`);

  console.log('--- TEST ASSERTION DETAILS ---');
  for (const res of report.results) {
    const symbol = res.status === 'PASSED' ? '✓ [PASS]' : '✗ [FAIL]';
    console.log(`${symbol} [${res.suiteName}] ${res.testName} (${res.durationMs}ms)`);
    console.log(`       Details: ${res.details}`);
    if (res.error) {
      console.log(`       Error: ${res.error}`);
    }
  }

  console.log('\n--- 24-PHASE COMPLETION MATRIX ---');
  for (const pm of report.phaseMatrix) {
    console.log(`Phase ${pm.phase.toString().padStart(2, '0')}: [${pm.status}] ${pm.name}`);
  }

  console.log('\n====================================================');
  console.log(`FINAL LAUNCH DECISION: ${report.overallStatus}`);
  console.log('====================================================');
  process.exit(0);
}

main().catch((err) => {
  console.error('Audit failed with unexpected error:', err);
  process.exit(1);
});
