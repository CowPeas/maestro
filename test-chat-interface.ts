/**
 * Comprehensive E2E Test Suite for Unified Chat Interface
 * Tests all 4 AI tools via chat API
 */

interface TestResult {
  name: string;
  status: 'PASSED' | 'FAILED';
  duration: number;
  details?: any;
  error?: string;
}

const TEST_SCENARIOS = [
  {
    name: 'Threat Analysis via Chat',
    userMessage: 'Analyze the security threats for a web application with user authentication, payment processing, and file uploads',
    expectedTool: 'analyzeThreat',
    expectedFields: ['success', 'threatCount', 'threats'],
  },
  {
    name: 'Image Intelligence via Chat',
    userMessage: 'Analyze this image: https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/800px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg',
    expectedTool: 'analyzeImage',
    expectedFields: ['success', 'location', 'confidence'],
  },
  {
    name: 'Predictive Analytics via Chat',
    userMessage: 'Predict future threats based on my historical data and patterns',
    expectedTool: 'predictThreats',
    expectedFields: ['success', 'predictionCount', 'predictions'],
  },
  {
    name: 'Anomaly Detection via Chat',
    userMessage: 'Scan my recent threats for anomalies and unusual patterns',
    expectedTool: 'detectAnomalies',
    expectedFields: ['success', 'anomalyCount', 'anomalies'],
  },
  {
    name: 'Conversational Flow',
    userMessage: 'What can you help me with?',
    expectedTool: null, // No tool should be called
    expectedFields: ['content'],
  },
];

async function runChatTest(scenario: typeof TEST_SCENARIOS[0]): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log(`\n🧪 Testing: ${scenario.name}`);
    console.log(`📝 User Message: "${scenario.userMessage}"`);
    
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test-token', // Mock auth
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: scenario.userMessage }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Parse streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let toolCalls: any[] = [];

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        fullResponse += chunk;
        
        // Parse tool invocations from stream
        const lines = chunk.split('\n').filter(l => l.trim());
        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const data = JSON.parse(line.substring(2));
              if (data.toolInvocations) {
                toolCalls.push(...data.toolInvocations);
              }
            } catch (e) {
              // Not JSON, continue
            }
          }
        }
      }
    }

    const duration = Date.now() - startTime;

    // Validate response
    if (scenario.expectedTool) {
      const toolUsed = toolCalls.find(t => t.toolName === scenario.expectedTool);
      
      if (!toolUsed) {
        throw new Error(`Expected tool '${scenario.expectedTool}' was not called`);
      }

      if (!toolUsed.result) {
        throw new Error(`Tool '${scenario.expectedTool}' did not return a result`);
      }

      // Validate expected fields
      for (const field of scenario.expectedFields) {
        if (!(field in toolUsed.result)) {
          throw new Error(`Missing expected field: ${field}`);
        }
      }

      console.log(`✅ Tool Called: ${scenario.expectedTool}`);
      console.log(`📊 Result:`, JSON.stringify(toolUsed.result, null, 2).substring(0, 200));
    } else {
      console.log(`💬 Conversational response received`);
    }

    console.log(`⏱️  Duration: ${duration}ms`);

    return {
      name: scenario.name,
      status: 'PASSED',
      duration,
      details: toolCalls.length > 0 ? toolCalls[0] : { response: fullResponse.substring(0, 100) },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ Test Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return {
      name: scenario.name,
      status: 'FAILED',
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                            ║');
  console.log('║       💬 UNIFIED CHAT INTERFACE - COMPREHENSIVE E2E TESTS 💬               ║');
  console.log('║                                                                            ║');
  console.log('║  Testing intelligent tool routing and conversation flow                   ║');
  console.log('║                                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  const results: TestResult[] = [];

  for (const scenario of TEST_SCENARIOS) {
    const result = await runChatTest(scenario);
    results.push(result);
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Print summary
  console.log('\n');
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('');

  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  results.forEach(result => {
    const icon = result.status === 'PASSED' ? '✅' : '❌';
    const duration = `${(result.duration / 1000).toFixed(2)}s`;
    console.log(`${icon} ${result.name.padEnd(40)} ${duration.padStart(8)}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('');
  console.log('────────────────────────────────────────────────────────────────────────────────');
  console.log(`Total Tests:        ${results.length}`);
  console.log(`Passed:             ${passed} ✅`);
  console.log(`Failed:             ${failed} ${failed > 0 ? '❌' : ''}`);
  console.log(`Pass Rate:          ${Math.round((passed / results.length) * 100)}%`);
  console.log(`Total Duration:     ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`Average Response:   ${(totalDuration / results.length / 1000).toFixed(2)}s`);
  console.log('────────────────────────────────────────────────────────────────────────────────');
  console.log('');

  if (failed === 0) {
    console.log('╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                            ║');
    console.log('║  🎉 ALL TESTS PASSED! UNIFIED CHAT INTERFACE IS PRODUCTION READY! 🎉       ║');
    console.log('║                                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  } else {
    console.log('⚠️  Some tests failed. Please review and fix issues before deployment.');
  }

  console.log('');

  return {
    passed,
    failed,
    totalDuration,
    results,
  };
}

// Run tests
runAllTests().catch(console.error);
