#!/usr/bin/env bun
/**
 * Image Intelligence Test Script
 * Tests Gemini 2.0 Flash multimodal image analysis capabilities
 * Run: bun run test-image-intelligence.ts
 */

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const model = google('gemini-2.0-flash-exp', {
  safetySettings: [
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  ],
});

// Test cases with public, well-known landmark images
const testImages = [
  {
    name: 'Eiffel Tower Test',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/800px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg',
    expectedLocation: 'Paris, France',
    expectedLandmarks: ['Eiffel Tower'],
  },
  {
    name: 'Statue of Liberty Test',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Statue_of_Liberty_7.jpg/800px-Statue_of_Liberty_7.jpg',
    expectedLocation: 'New York, USA',
    expectedLandmarks: ['Statue of Liberty'],
  },
  {
    name: 'Big Ben Test',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Clock_Tower_-_Palace_of_Westminster%2C_London_-_May_2007.jpg/800px-Clock_Tower_-_Palace_of_Westminster%2C_London_-_May_2007.jpg',
    expectedLocation: 'London, UK',
    expectedLandmarks: ['Big Ben', 'Elizabeth Tower'],
  },
];

const prompt = `You are an expert intelligence analyst specializing in image geolocation and threat assessment.

Analyze this image carefully and provide:

1. **Location Identification**:
   - Country, region, city (be as specific as possible)
   - GPS coordinates if identifiable from landmarks
   - Confidence level (1-100)

2. **Landmark Recognition**:
   - Identify any visible landmarks, buildings, monuments
   - Street signs, business names, or location markers
   - Architectural styles that indicate region

3. **Environmental Context**:
   - Weather conditions
   - Time of day (based on shadows/lighting)
   - Season indicators
   - Terrain and vegetation type

4. **Security Assessment**:
   - Any security concerns visible in the image
   - Military or strategic infrastructure
   - Crowds, protests, or unusual activity
   - Surveillance equipment or security presence

5. **Reasoning**:
   - Explain how you identified the location
   - Key visual clues used
   - Confidence reasoning

Return your analysis as JSON with these exact fields:
{
  "location": "Specific location identified",
  "coordinates": "Lat, Long (or null if not identifiable)",
  "landmarks": ["landmark1", "landmark2"],
  "confidence": 85,
  "environmentalContext": "Description of environment",
  "securityIndicators": ["indicator1", "indicator2"],
  "fullAnalysis": "Complete detailed analysis",
  "reasoning": "How location was determined"
}`;

async function analyzeImage(testCase: typeof testImages[0]) {
  console.log('\n' + '='.repeat(80));
  console.log(`🧪 Test: ${testCase.name}`);
  console.log('='.repeat(80));
  console.log(`📷 Image URL: ${testCase.url}`);
  console.log(`🎯 Expected Location: ${testCase.expectedLocation}`);
  console.log(`🏛️  Expected Landmarks: ${testCase.expectedLandmarks.join(', ')}`);
  console.log('');

  const startTime = Date.now();

  try {
    const { text, usage } = await generateText({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image', image: testCase.url },
          ],
        },
      ],
      temperature: 0.3,
      maxTokens: 4096,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`⏱️  Analysis completed in ${elapsed}s`);
    console.log(`📊 Token usage: ${usage?.totalTokens || 'N/A'} tokens`);
    console.log('');

    // Parse response
    let result;
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;
      result = JSON.parse(jsonText);
    } catch (parseError) {
      console.log('⚠️  Could not parse as JSON, showing raw response:');
      console.log(text);
      return { success: false, elapsed };
    }

    // Display results
    console.log('📍 RESULTS:');
    console.log('━'.repeat(80));
    console.log(`🌍 Location: ${result.location}`);
    console.log(`📌 Coordinates: ${result.coordinates || 'Not specified'}`);
    console.log(`🎯 Confidence: ${result.confidence}%`);
    console.log(`🏛️  Landmarks: ${result.landmarks?.join(', ') || 'None identified'}`);
    console.log(`🌤️  Environment: ${result.environmentalContext}`);
    console.log(`🛡️  Security: ${result.securityIndicators?.join(', ') || 'None'}`);
    console.log('');
    console.log('💡 Reasoning:');
    console.log(result.reasoning);
    console.log('');
    console.log('📄 Full Analysis:');
    console.log(result.fullAnalysis);
    console.log('');

    // Validation
    const locationMatch = result.location.toLowerCase().includes(testCase.expectedLocation.toLowerCase().split(',')[0]);
    const landmarkFound = testCase.expectedLandmarks.some(landmark => 
      result.landmarks?.some((l: string) => l.toLowerCase().includes(landmark.toLowerCase()))
    );

    console.log('✅ VALIDATION:');
    console.log(`  Location match: ${locationMatch ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Landmark found: ${landmarkFound ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Confidence: ${result.confidence >= 70 ? '✅ HIGH' : '⚠️  LOW'}`);

    return {
      success: locationMatch && landmarkFound && result.confidence >= 70,
      elapsed,
      confidence: result.confidence,
    };
  } catch (error) {
    console.error('❌ ERROR:', error);
    return { success: false, elapsed: ((Date.now() - startTime) / 1000).toFixed(2) };
  }
}

async function runAllTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
  console.log('║  🌍 PAWAEYE IMAGE INTELLIGENCE TEST SUITE                                 ║');
  console.log('║  Testing Gemini 2.0 Flash Multimodal Geolocation                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝');

  const results = [];

  for (const testCase of testImages) {
    const result = await analyzeImage(testCase);
    results.push({ name: testCase.name, ...result });
    
    // Add delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));

  let passCount = 0;
  results.forEach(r => {
    const status = r.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${r.name} (${r.elapsed}s, ${r.confidence || 0}% confidence)`);
    if (r.success) passCount++;
  });

  const totalTime = results.reduce((sum, r) => sum + parseFloat(r.elapsed), 0).toFixed(2);
  const passRate = ((passCount / results.length) * 100).toFixed(0);

  console.log('');
  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${passCount} (${passRate}%)`);
  console.log(`Total time: ${totalTime}s`);
  console.log('');

  if (passCount === results.length) {
    console.log('🎉 ALL TESTS PASSED! Image intelligence is working perfectly!');
  } else {
    console.log('⚠️  Some tests failed. Review the results above.');
  }

  console.log('\n' + '='.repeat(80));
}

// Run tests
runAllTests().catch(console.error);
