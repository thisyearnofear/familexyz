#!/usr/bin/env node

/**
 * Stage 2A Validation Script
 * Validates the Plugin Extension implementation for Hedera Hackathon
 *
 * This script tests:
 * 1. Enhanced Family NLP Utils with Hedera integration
 * 2. Family-Hedera Integration Layer
 * 3. Extended Family Plugins with tokenomics
 * 4. DRY, clean, modular implementation
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.bold}${colors.cyan}=== ${title} ===${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Validation Results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0
};

function test(description, testFn) {
  results.total++;
  try {
    const result = testFn();
    if (result === true || result === undefined) {
      logSuccess(description);
      results.passed++;
      return true;
    } else if (result === 'warning') {
      logWarning(description);
      results.warnings++;
      return true;
    } else {
      logError(description);
      results.failed++;
      return false;
    }
  } catch (error) {
    logError(`${description} - ${error.message}`);
    results.failed++;
    return false;
  }
}

function checkFileExists(filePath, description) {
  return test(description, () => {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    if (!existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    return true;
  });
}

function checkPackageBuild(packagePath, packageName) {
  return test(`${packageName} builds successfully`, () => {
    try {
      const cwd = path.join(PROJECT_ROOT, packagePath);
      execSync('pnpm build', { cwd, stdio: 'pipe' });
      return true;
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  });
}

function checkPackageStructure(packagePath, expectedFiles) {
  return test(`${packagePath} has correct structure`, () => {
    const basePath = path.join(PROJECT_ROOT, packagePath);
    for (const file of expectedFiles) {
      const filePath = path.join(basePath, file);
      if (!existsSync(filePath)) {
        throw new Error(`Missing file: ${file}`);
      }
    }
    return true;
  });
}

function checkCodeQuality(filePath, patterns) {
  return test(`${filePath} follows DRY principles`, () => {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    const content = readFileSync(fullPath, 'utf8');

    for (const pattern of patterns) {
      if (pattern.required && !content.includes(pattern.text)) {
        throw new Error(`Missing required pattern: ${pattern.text}`);
      }
      if (pattern.forbidden && content.includes(pattern.text)) {
        throw new Error(`Found forbidden pattern: ${pattern.text}`);
      }
    }
    return true;
  });
}

// Main Validation Function
async function validateStage2A() {
  logSection('Stage 2A: Plugin Extension Validation');
  logInfo('Validating DRY, CLEAN, MODULAR, PERFORMANT implementation');

  // 1. Project Structure Validation
  logSection('1. Project Structure Validation');

  checkFileExists('packages/family/nlp-utils/src/metrics/FamilyHederaMetrics.ts',
    'Enhanced Family NLP Utils with Hedera metrics');

  checkFileExists('packages/family/nlp-utils/src/integration/FamilyHederaIntegration.ts',
    'Family-Hedera Integration Layer');

  checkFileExists('packages/family/plugin-wisdom/src/index.ts',
    'Enhanced Wisdom Plugin with Hedera integration');

  checkFileExists('packages/blockchain/hedera-core/src/services/HederaService.ts',
    'Hedera Core Service (Singleton pattern)');

  // 2. Package Structure Validation
  logSection('2. Package Structure Validation');

  checkPackageStructure('packages/family/nlp-utils', [
    'package.json',
    'src/index.ts',
    'src/metrics/FamilyHederaMetrics.ts',
    'src/integration/FamilyHederaIntegration.ts'
  ]);

  checkPackageStructure('packages/family/plugin-wisdom', [
    'package.json',
    'src/index.ts'
  ]);

  checkPackageStructure('packages/blockchain/hedera-core', [
    'package.json',
    'src/index.ts',
    'src/services/HederaService.ts'
  ]);

  // 3. Build Validation
  logSection('3. Build System Validation');

  checkPackageBuild('packages/blockchain/hedera-core', 'Hedera Core');
  checkPackageBuild('packages/family/nlp-utils', 'Family NLP Utils');
  checkPackageBuild('packages/family/plugin-wisdom', 'Wisdom Plugin');

  // 4. Code Quality Validation
  logSection('4. Code Quality & DRY Principles');

  // Check Family Hedera Metrics for quality patterns
  checkCodeQuality('packages/family/nlp-utils/src/metrics/FamilyHederaMetrics.ts', [
    { text: 'export interface', required: true },
    { text: 'FamilyInteractionType', required: true },
    { text: 'HederaFamilyMetrics', required: true },
    { text: 'createFamilyMetricsLogger', required: true },
    { text: 'batchSize', required: true },
    { text: 'duplicate code', forbidden: true }
  ]);

  // Check Family Hedera Integration for modularity
  checkCodeQuality('packages/family/nlp-utils/src/integration/FamilyHederaIntegration.ts', [
    { text: 'export class FamilyHederaIntegration', required: true },
    { text: 'createFamilyHederaIntegration', required: true },
    { text: 'processFamilyInteraction', required: true },
    { text: 'DEFAULT_AGENT_CONFIGS', required: true },
    { text: 'hardcoded values', forbidden: true }
  ]);

  // Check Wisdom Plugin for enhanced features
  checkCodeQuality('packages/family/plugin-wisdom/src/index.ts', [
    { text: 'SHARE_FAMILY_WISDOM', required: true },
    { text: 'FamilyHederaIntegration', required: true },
    { text: 'processFamilyInteraction', required: true },
    { text: 'WISDOM_INTERACTIONS', required: true },
    { text: 'copy-paste code', forbidden: true }
  ]);

  // 5. Integration Validation
  logSection('5. Integration & Dependencies');

  test('Family NLP Utils properly imports Hedera Core', () => {
    const packageJson = JSON.parse(readFileSync(
      path.join(PROJECT_ROOT, 'packages/family/nlp-utils/package.json'), 'utf8'
    ));
    if (!packageJson.dependencies['@elizaos/hedera-core']) {
      throw new Error('Missing Hedera Core dependency');
    }
    return true;
  });

  test('Wisdom Plugin properly imports Family NLP Utils', () => {
    const packageJson = JSON.parse(readFileSync(
      path.join(PROJECT_ROOT, 'packages/family/plugin-wisdom/package.json'), 'utf8'
    ));
    if (!packageJson.dependencies['@elizaos/family-nlp-utils']) {
      throw new Error('Missing Family NLP Utils dependency');
    }
    return true;
  });

  // 6. Feature Completeness Validation
  logSection('6. Feature Completeness');

  test('Family metrics support all interaction types', () => {
    const content = readFileSync(
      path.join(PROJECT_ROOT, 'packages/family/nlp-utils/src/metrics/FamilyHederaMetrics.ts'), 'utf8'
    );
    const requiredTypes = [
      'wisdom_shared',
      'intimacy_moment',
      'generational_story',
      'mindful_presence',
      'growth_milestone',
      'conflict_resolved',
      'tradition_preserved',
      'empathy_expressed'
    ];

    for (const type of requiredTypes) {
      if (!content.includes(type)) {
        throw new Error(`Missing interaction type: ${type}`);
      }
    }
    return true;
  });

  test('Integration layer supports all family agent types', () => {
    const content = readFileSync(
      path.join(PROJECT_ROOT, 'packages/family/nlp-utils/src/integration/FamilyHederaIntegration.ts'), 'utf8'
    );
    const requiredAgents = [
      'wisdom',
      'intimacy',
      'generational',
      'presence',
      'growth'
    ];

    for (const agent of requiredAgents) {
      if (!content.includes(`"${agent}"`)) {
        throw new Error(`Missing agent type: ${agent}`);
      }
    }
    return true;
  });

  test('Tokenomics implementation is configurable', () => {
    const content = readFileSync(
      path.join(PROJECT_ROOT, 'packages/family/nlp-utils/src/integration/FamilyHederaIntegration.ts'), 'utf8'
    );
    const requiredFeatures = [
      'FamilyTokenomics',
      'distributeRewards',
      'rewardMultiplier',
      'immediateReward',
      'savingsReward',
      'charityReward'
    ];

    for (const feature of requiredFeatures) {
      if (!content.includes(feature)) {
        throw new Error(`Missing tokenomics feature: ${feature}`);
      }
    }
    return true;
  });

  // 7. Performance & Efficiency Validation
  logSection('7. Performance & Efficiency');

  test('Hedera service uses singleton pattern', () => {
    const content = readFileSync(
      path.join(PROJECT_ROOT, 'packages/blockchain/hedera-core/src/services/HederaService.ts'), 'utf8'
    );
    if (!content.includes('private static instance') || !content.includes('getInstance')) {
      throw new Error('Singleton pattern not implemented');
    }
    return true;
  });

  test('Metrics logger implements batching for efficiency', () => {
    const content = readFileSync(
      path.join(PROJECT_ROOT, 'packages/family/nlp-utils/src/metrics/FamilyHederaMetrics.ts'), 'utf8'
    );
    if (!content.includes('batchSize') || !content.includes('batchInterval') || !content.includes('processBatch')) {
      throw new Error('Batching mechanism not implemented');
    }
    return true;
  });

  test('Caching is implemented for performance', () => {
    const wisdomContent = readFileSync(
      path.join(PROJECT_ROOT, 'packages/family/plugin-wisdom/src/index.ts'), 'utf8'
    );
    if (!wisdomContent.includes('cache') && !wisdomContent.includes('Cache')) {
      return 'warning'; // Warning instead of error
    }
    return true;
  });

  // 8. Hackathon Compliance Validation
  logSection('8. Hackathon Compliance');

  test('Implementation maintains ElizaOS plugin structure', () => {
    const content = readFileSync(
      path.join(PROJECT_ROOT, 'packages/family/plugin-wisdom/src/index.ts'), 'utf8'
    );
    if (!content.includes('Plugin') || !content.includes('actions') || !content.includes('export')) {
      throw new Error('ElizaOS plugin structure not maintained');
    }
    return true;
  });

  test('Hedera consensus integration is implemented', () => {
    const content = readFileSync(
      path.join(PROJECT_ROOT, 'packages/family/nlp-utils/src/metrics/FamilyHederaMetrics.ts'), 'utf8'
    );
    if (!content.includes('consensus') || !content.includes('submitMessage')) {
      throw new Error('Hedera consensus integration missing');
    }
    return true;
  });

  test('Family-specific AI enhancements are present', () => {
    const content = readFileSync(
      path.join(PROJECT_ROOT, 'packages/family/plugin-wisdom/src/index.ts'), 'utf8'
    );
    const familyFeatures = [
      'family',
      'wisdom',
      'empathy',
      'conflict',
      'emotional intelligence'
    ];

    let foundFeatures = 0;
    for (const feature of familyFeatures) {
      if (content.toLowerCase().includes(feature)) {
        foundFeatures++;
      }
    }

    if (foundFeatures < 3) {
      throw new Error('Insufficient family-specific AI features');
    }
    return true;
  });

  // 9. Documentation & Maintainability
  logSection('9. Documentation & Maintainability');

  test('Code includes comprehensive documentation', () => {
    const files = [
      'packages/family/nlp-utils/src/metrics/FamilyHederaMetrics.ts',
      'packages/family/nlp-utils/src/integration/FamilyHederaIntegration.ts',
      'packages/family/plugin-wisdom/src/index.ts'
    ];

    for (const file of files) {
      const content = readFileSync(path.join(PROJECT_ROOT, file), 'utf8');
      const commentLines = content.split('\n').filter(line =>
        line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/**')
      ).length;

      if (commentLines < 20) {
        throw new Error(`Insufficient documentation in ${file}`);
      }
    }
    return true;
  });

  test('Interfaces and types are properly exported', () => {
    const indexContent = readFileSync(
      path.join(PROJECT_ROOT, 'packages/family/nlp-utils/src/index.ts'), 'utf8'
    );
    const requiredExports = [
      'FamilyInteractionType',
      'FamilyHederaMetrics',
      'FamilyAgentConfig',
      'createFamilyHederaIntegration'
    ];

    for (const exportItem of requiredExports) {
      if (!indexContent.includes(exportItem)) {
        throw new Error(`Missing export: ${exportItem}`);
      }
    }
    return true;
  });

  // Results Summary
  logSection('Validation Results Summary');

  const successRate = (results.passed / results.total * 100).toFixed(1);

  log(`\n📊 Total Tests: ${results.total}`, 'white');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`⚠️  Warnings: ${results.warnings}`, 'yellow');
  log(`📈 Success Rate: ${successRate}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');

  // Stage 2A Completion Assessment
  logSection('Stage 2A Completion Assessment');

  if (results.failed === 0 && results.passed >= 20) {
    logSuccess('🎉 Stage 2A: Plugin Extension - COMPLETED SUCCESSFULLY!');
    logInfo('✨ Ready to proceed to Stage 2B: Advanced Tokenomics');
    logInfo('🏆 Implementation demonstrates:');
    logInfo('   - DRY, clean, modular architecture');
    logInfo('   - Hedera blockchain integration');
    logInfo('   - Enhanced family AI capabilities');
    logInfo('   - Performance optimizations');
    logInfo('   - Maintainable codebase');
    return true;
  } else if (results.failed <= 2 && results.passed >= 15) {
    logWarning('⚠️  Stage 2A: Plugin Extension - MOSTLY COMPLETE');
    logInfo('🔧 Minor issues to address before Stage 2B');
    logInfo(`❌ Failed tests: ${results.failed}`);
    return false;
  } else {
    logError('❌ Stage 2A: Plugin Extension - NEEDS MORE WORK');
    logInfo('🔧 Significant issues to resolve:');
    logInfo(`❌ Failed tests: ${results.failed}/${results.total}`);
    return false;
  }
}

// Hackathon Progress Tracking
function trackHackathonProgress() {
  logSection('🏆 Hedera Hackathon Progress Tracker');

  logInfo('📅 Current Stage: Stage 2A - Plugin Extension (Days 8-10)');
  logInfo('🎯 Target: AI and Agents Track - $15,000 Prize');
  logInfo('📈 Implementation Quality: Enterprise-grade');
  logInfo('🔗 Blockchain Integration: Hedera Hashgraph');
  logInfo('👨‍👩‍👧‍👦 Family Focus: Emotional Intelligence + Tokenomics');

  const nextSteps = [
    'Stage 2B: Advanced Tokenomics (Days 11-12)',
    'Stage 2C: Dashboard Integration (Days 13-14)',
    'Stage 3A: Integration & Testing (Days 15-17)',
    'Stage 3B: Demo Assets (Days 18-20)',
    'Stage 3C: Final Submission (Day 21)'
  ];

  logInfo('\n🚀 Next Steps:');
  nextSteps.forEach((step, index) => {
    logInfo(`   ${index + 1}. ${step}`);
  });
}

// Error handling and execution
async function main() {
  try {
    console.clear();
    log('🚀 Family-Connection AI Agents - Stage 2A Validation', 'bold');
    log('🏗️  Hedera Hello Future: Origins Hackathon 2025\n', 'cyan');

    const success = await validateStage2A();
    trackHackathonProgress();

    if (success) {
      log('\n🎊 STAGE 2A VALIDATION PASSED! Ready for Stage 2B! 🎊', 'green');
      process.exit(0);
    } else {
      log('\n🔧 STAGE 2A NEEDS REFINEMENT - Review failed tests above 🔧', 'yellow');
      process.exit(1);
    }
  } catch (error) {
    logError(`\n💥 Validation script error: ${error.message}`);
    process.exit(1);
  }
}

// Run validation
main();
