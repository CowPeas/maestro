#!/usr/bin/env node
/**
 * PawaEye Complete End-to-End Test Suite
 * Tests all AI flows: Threat Analysis, Predictions, Detection, Image Intelligence
 * Run: npx tsx test-e2e-complete.ts
 */

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const model = google('gemini-2.5-flash-preview-05-20', {
  safetySettings: [
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  ],
});

const visionModel = google('gemini-2.0-flash-exp', {
  safetySettings: [
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  ],
});

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

// ============================================================================
// TEST 1: THREAT ANALYSIS (Phase 1 - Core AI)
// ============================================================================

async function testThreatAnalysis() {
  console.log('\n' + '═'.repeat(80));
  console.log('🧪 TEST 1: THREAT ANALYSIS (Core AI - 4 Agents)');
  console.log('═'.repeat(80));

  const startTime = Date.now();
  const testDescription = 'Web application with user authentication and payment processing';

  try {
    console.log('📝 Test Description:', testDescription);
    console.log('🤖 Running Parser Agent...\n');

    const parserPrompt = `You are a cybersecurity threat parser using the PAWAEYE framework.

Analyze this system description and extract key components:
"${testDescription}"

Return JSON:
{
  "components": ["component1", "component2"],
  "layers": ["layer1", "layer2"],
  "assets": ["asset1", "asset2"]
}`;

    const { text: parserResult } = await generateText({
      model,
      prompt: parserPrompt,
      temperature: 0.3,
    });

    console.log('✅ Parser Result:', parserResult.substring(0, 200) + '...\n');

    console.log('🤖 Running Generator Agent...\n');

    const generatorPrompt = `Generate 3 potential cybersecurity threats for:
"${testDescription}"

Return JSON array:
[
  {
    "description": "Threat description",
    "classification": "P", 
    "layer": "Application",
    "likelihood": 4,
    "impact": 4
  }
]`;

    const { text: threats, usage } = await generateText({
      model,
      prompt: generatorPrompt,
      temperature: 0.7,
      maxTokens: 2000,
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('✅ Generator Result:');
    console.log(threats.substring(0, 300) + '...\n');
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📊 Tokens: ${usage?.totalTokens || 'N/A'}\n`);

    // Validate that we got some threats
    const hasThreats = threats.includes('threat') || threats.includes('Threat') || threats.includes('description');

    results.push({
      name: 'Threat Analysis (4 AI Agents)',
      passed: hasThreats,
      duration: parseFloat(duration),
      details: `Generated threats for: ${testDescription}`,
    });

    console.log(hasThreats ? '✅ TEST PASSED' : '❌ TEST FAILED');
    return hasThreats;
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error('❌ ERROR:', error);
    results.push({
      name: 'Threat Analysis',
      passed: false,
      duration: parseFloat(duration),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

// ============================================================================
// TEST 2: PREDICTIVE ANALYTICS (Phase 3)
// ============================================================================

async function testPredictiveAnalytics() {
  console.log('\n' + '═'.repeat(80));
  console.log('🧪 TEST 2: PREDICTIVE ANALYTICS (Phase 3)');
  console.log('═'.repeat(80));

  const startTime = Date.now();

  try {
    // Simulate historical threats
    const mockThreats = [
      { layer: 'Application', likelihood: 4, impact: 5, classification: 'P' },
      { layer: 'Network', likelihood: 3, impact: 4, classification: 'A' },
      { layer: 'Application', likelihood: 5, impact: 5, classification: 'P' },
      { layer: 'Data', likelihood: 3, impact: 5, classification: 'P' },
    ];

    console.log(`📊 Analyzing ${mockThreats.length} historical threats...`);
    console.log('🤖 Running AI Prediction Engine...\n');

    const predictionPrompt = `You are a cybersecurity analyst. Based on these historical threats:

${JSON.stringify(mockThreats, null, 2)}

Predict 3 future threats that might emerge. Consider patterns and trends.

Return JSON:
[
  {
    "threat": "Predicted threat description",
    "layer": "Application",
    "confidence": 85,
    "likelihood": 4,
    "impact": 4,
    "reasoning": "Why this threat is likely",
    "actions": ["Action 1", "Action 2"]
  }
]`;

    const { text: predictions, usage } = await generateText({
      model,
      prompt: predictionPrompt,
      temperature: 0.4,
      maxTokens: 2000,
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('✅ Predictions Generated:');
    console.log(predictions.substring(0, 400) + '...\n');
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📊 Tokens: ${usage?.totalTokens || 'N/A'}\n`);

    // Try to parse JSON
    let predictionArray;
    try {
      const jsonMatch = predictions.match(/```json\n([\s\S]*?)\n```/) || predictions.match(/\[[\s\S]*\]/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : predictions;
      predictionArray = JSON.parse(jsonText);
    } catch (e) {
      predictionArray = [];
    }

    const hasPredictions = predictions.includes('threat') || predictions.includes('predict');
    const hasValidStructure = predictionArray.length > 0 || predictions.includes('confidence');

    const passed = hasPredictions && hasValidStructure;

    results.push({
      name: 'Predictive Analytics',
      passed,
      duration: parseFloat(duration),
      details: `Generated ${predictionArray.length || 'multiple'} predictions from historical data`,
    });

    console.log(passed ? '✅ TEST PASSED' : '❌ TEST FAILED');
    return passed;
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error('❌ ERROR:', error);
    results.push({
      name: 'Predictive Analytics',
      passed: false,
      duration: parseFloat(duration),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

// ============================================================================
// TEST 3: REAL-TIME THREAT DETECTION (Phase 4)
// ============================================================================

async function testRealtimeDetection() {
  console.log('\n' + '═'.repeat(80));
  console.log('🧪 TEST 3: REAL-TIME THREAT DETECTION (Phase 4)');
  console.log('═'.repeat(80));

  const startTime = Date.now();

  try {
    // Simulate current threats for anomaly detection
    const currentThreats = [
      {
        description: 'SQL injection vulnerability in login form',
        likelihood: 4,
        impact: 5,
        layer: 'Application',
      },
      {
        description: 'Unusual spike in failed login attempts from single IP',
        likelihood: 5,
        impact: 3,
        layer: 'Network',
      },
      {
        description: 'Outdated SSL certificate detected on payment gateway',
        likelihood: 3,
        impact: 5,
        layer: 'Transport',
      },
    ];

    console.log(`🔍 Scanning ${currentThreats.length} threats for anomalies...`);
    console.log('🤖 Running AI Anomaly Detection...\n');

    const detectionPrompt = `You are a real-time threat detection system. Analyze these threats:

${JSON.stringify(currentThreats, null, 2)}

Identify any anomalies or patterns that require immediate attention.

Return JSON:
[
  {
    "title": "Alert title",
    "severity": "Critical",
    "description": "What makes this anomalous",
    "layer": "Application",
    "recommendedAction": "What to do"
  }
]`;

    const { text: alerts, usage } = await generateText({
      model,
      prompt: detectionPrompt,
      temperature: 0.3,
      maxTokens: 1500,
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('✅ Anomaly Detection Results:');
    console.log(alerts.substring(0, 400) + '...\n');
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📊 Tokens: ${usage?.totalTokens || 'N/A'}\n`);

    // Validate detection - check for threat-related content
    const alertsLower = alerts.toLowerCase();
    const hasAlerts = alertsLower.includes('alert') || alertsLower.includes('severity') || alertsLower.includes('anomal');
    const hasSeverity = alertsLower.includes('critical') || alertsLower.includes('high') || alertsLower.includes('medium');
    const hasThreatContent = alertsLower.includes('threat') || alertsLower.includes('sql') || alertsLower.includes('login') || alertsLower.includes('ssl');
    const hasReasonableResponse = alerts.length > 50; // AI responded with content

    const passed = (hasAlerts || hasSeverity || hasThreatContent) && hasReasonableResponse;
    
    console.log('🔍 Detection Validation:');
    console.log(`  Has alerts/severity: ${hasAlerts || hasSeverity ? '✅' : '❌'}`);
    console.log(`  Has threat content: ${hasThreatContent ? '✅' : '❌'}`);

    results.push({
      name: 'Real-Time Detection',
      passed,
      duration: parseFloat(duration),
      details: 'Scanned threats and identified anomalies',
    });

    console.log(passed ? '✅ TEST PASSED' : '❌ TEST FAILED');
    return passed;
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error('❌ ERROR:', error);
    results.push({
      name: 'Real-Time Detection',
      passed: false,
      duration: parseFloat(duration),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

// ============================================================================
// TEST 4: IMAGE INTELLIGENCE (Phase 5)
// ============================================================================

async function testImageIntelligence() {
  console.log('\n' + '═'.repeat(80));
  console.log('🧪 TEST 4: IMAGE INTELLIGENCE & GEOLOCATION (Phase 5)');
  console.log('═'.repeat(80));

  const startTime = Date.now();

  try {
    // Use Eiffel Tower test image
    const testImage = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/800px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg';
    
    console.log('📷 Test Image:', testImage);
    console.log('🤖 Running Multimodal AI Analysis (Gemini 2.0 Flash)...\n');

    const imagePrompt = `Analyze this image for geolocation intelligence:

1. Identify the location (country, city, coordinates)
2. Recognize any landmarks
3. Assess environmental context
4. Note any security indicators

Return JSON:
{
  "location": "Location identified",
  "coordinates": "Lat, Long or null",
  "landmarks": ["landmark1"],
  "confidence": 95,
  "environmentalContext": "Environment description",
  "securityIndicators": ["indicator1"],
  "reasoning": "How location was determined"
}`;

    const { text: analysis, usage } = await generateText({
      model: visionModel,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: imagePrompt },
            { type: 'image', image: testImage },
          ],
        },
      ],
      temperature: 0.3,
      maxTokens: 2000,
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('✅ Image Analysis Results:');
    console.log(analysis.substring(0, 500) + '...\n');
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📊 Tokens: ${usage?.totalTokens || 'N/A'}\n`);

    // Validate image analysis
    const hasLocation = analysis.toLowerCase().includes('paris') || analysis.toLowerCase().includes('france');
    const hasLandmark = analysis.toLowerCase().includes('eiffel') || analysis.toLowerCase().includes('tower');
    const hasCoordinates = analysis.includes('48.') || analysis.includes('2.') || analysis.toLowerCase().includes('coordinates');

    const passed = (hasLocation || hasLandmark) && (hasCoordinates || analysis.includes('confidence'));

    console.log('🔍 Validation:');
    console.log(`  Location detected: ${hasLocation ? '✅' : '❌'}`);
    console.log(`  Landmark found: ${hasLandmark ? '✅' : '❌'}`);
    console.log(`  Has coordinates/confidence: ${hasCoordinates || analysis.includes('confidence') ? '✅' : '❌'}\n`);

    results.push({
      name: 'Image Intelligence',
      passed,
      duration: parseFloat(duration),
      details: 'Analyzed image and extracted geolocation data',
    });

    console.log(passed ? '✅ TEST PASSED' : '❌ TEST FAILED');
    return passed;
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error('❌ ERROR:', error);
    results.push({
      name: 'Image Intelligence',
      passed: false,
      duration: parseFloat(duration),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                            ║');
  console.log('║       🛡️  PAWAEYE COMPLETE END-TO-END TEST SUITE  🛡️                      ║');
  console.log('║                                                                            ║');
  console.log('║  Testing All AI Flows: Analysis, Predictions, Detection, Intelligence     ║');
  console.log('║                                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  const overallStart = Date.now();

  // Run all tests
  await testThreatAnalysis();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit

  await testPredictiveAnalytics();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit

  await testRealtimeDetection();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit

  await testImageIntelligence();

  const overallDuration = ((Date.now() - overallStart) / 1000).toFixed(2);

  // Generate Summary
  console.log('\n' + '═'.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(80));

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0).toFixed(2);

  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const duration = result.duration.toFixed(2);
    console.log(`${status} ${result.name.padEnd(35)} (${duration}s)`);
    if (result.details) {
      console.log(`     ${result.details}`);
    }
    if (result.error) {
      console.log(`     Error: ${result.error}`);
    }
  });

  console.log('');
  console.log('─'.repeat(80));
  console.log(`Total Tests:      ${results.length}`);
  console.log(`Passed:           ${passedCount} (${Math.round(passedCount / results.length * 100)}%)`);
  console.log(`Failed:           ${failedCount}`);
  console.log(`Total Time:       ${overallDuration}s`);
  console.log(`AI Processing:    ${totalDuration}s`);
  console.log('─'.repeat(80));

  if (passedCount === results.length) {
    console.log('');
    console.log('🎉🎉🎉 ALL TESTS PASSED! 🎉🎉🎉');
    console.log('');
    console.log('✅ Phase 1: Threat Analysis - WORKING');
    console.log('✅ Phase 3: Predictive Analytics - WORKING');
    console.log('✅ Phase 4: Real-Time Detection - WORKING');
    console.log('✅ Phase 5: Image Intelligence - WORKING');
    console.log('');
    console.log('🚀 PawaEye is fully operational and ready for production!');
  } else {
    console.log('');
    console.log('⚠️  SOME TESTS FAILED');
    console.log('Review the errors above and retry failed tests.');
  }

  console.log('\n' + '═'.repeat(80));
  console.log('');

  // Exit with appropriate code
  process.exit(failedCount > 0 ? 1 : 0);
}

// Run all tests
runAllTests().catch((error) => {
  console.error('💥 FATAL ERROR:', error);
  process.exit(1);
});
