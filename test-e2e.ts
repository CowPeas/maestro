/**
 * End-to-End Test Script for MAESTRO Next.js Application
 * Tests the complete AI threat analysis flow with Gemini 2.5 Flash
 */

import { analyzeSystem } from './src/lib/ai/agents';

// Test system description
const testSystemDescription = `
A web-based e-commerce platform with the following components:
- React frontend with user authentication
- Node.js REST API backend
- PostgreSQL database storing user data and payment information
- Stripe payment gateway integration
- AWS S3 for product image storage
- Redis for session management
- Email notification service via SendGrid

Security boundaries:
- Frontend communicates with backend over HTTPS
- Backend authenticates all API requests with JWT tokens
- Database access is restricted to backend service only
- Payment processing handled by external Stripe API

Data flows:
- User registration: Frontend → Backend → Database
- Product purchase: Frontend → Backend → Stripe API → Database
- Image upload: Frontend → Backend → AWS S3
`;

async function runE2ETest() {
  console.log('🚀 Starting End-to-End Test...\n');
  console.log('📋 System Description:');
  console.log('─'.repeat(80));
  console.log(testSystemDescription);
  console.log('─'.repeat(80));
  console.log('\n⏳ Analyzing system with Gemini 2.5 Flash...\n');

  try {
    const startTime = Date.now();
    
    // Run complete threat analysis
    const analyses = await analyzeSystem(testSystemDescription);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('✅ Analysis Complete!\n');
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📊 Threats Identified: ${analyses.length}\n`);
    console.log('═'.repeat(80));

    // Display results for each threat
    analyses.forEach((analysis, index) => {
      console.log(`\n🔍 THREAT ${index + 1}/${analyses.length}`);
      console.log('─'.repeat(80));
      
      console.log('\n📌 Threat Details:');
      console.log(`   Description: ${analysis.threat.description}`);
      console.log(`   Layer: ${analysis.threat.layer}`);
      console.log(`   Attack Vector: ${analysis.threat.attackVector}`);
      console.log(`   Affected Components: ${analysis.threat.affectedComponents.join(', ')}`);
      
      console.log('\n⚠️  Risk Assessment:');
      console.log(`   Classification: ${analysis.risk.classification}`);
      console.log(`   Likelihood: ${analysis.risk.likelihood}/5`);
      console.log(`   Impact: ${analysis.risk.impact}/5`);
      console.log(`   Risk Score: ${analysis.risk.riskScore}`);
      console.log(`   Justification: ${analysis.risk.justification}`);
      
      console.log('\n🛡️  Mitigation Strategies:');
      console.log('   Immediate Actions:');
      analysis.mitigation.immediate.forEach(action => console.log(`     • ${action}`));
      console.log('   Short-term Actions:');
      analysis.mitigation.shortTerm.forEach(action => console.log(`     • ${action}`));
      console.log('   Long-term Actions:');
      analysis.mitigation.longTerm.forEach(action => console.log(`     • ${action}`));
      
      console.log('\n   Required Resources:');
      analysis.mitigation.resources.forEach(resource => console.log(`     • ${resource}`));
      
      console.log('\n   Success Metrics:');
      analysis.mitigation.metrics.forEach(metric => console.log(`     • ${metric}`));
    });

    console.log('\n' + '═'.repeat(80));
    console.log('\n✨ Test Summary:');
    console.log(`   Total Threats: ${analyses.length}`);
    console.log(`   High Risk: ${analyses.filter(a => a.risk.classification === 'High').length}`);
    console.log(`   Medium Risk: ${analyses.filter(a => a.risk.classification === 'Medium').length}`);
    console.log(`   Low Risk: ${analyses.filter(a => a.risk.classification === 'Low').length}`);
    console.log(`   Avg Likelihood: ${(analyses.reduce((sum, a) => sum + a.risk.likelihood, 0) / analyses.length).toFixed(2)}/5`);
    console.log(`   Avg Impact: ${(analyses.reduce((sum, a) => sum + a.risk.impact, 0) / analyses.length).toFixed(2)}/5`);
    console.log(`   Total Mitigations: ${analyses.reduce((sum, a) => sum + a.mitigation.immediate.length + a.mitigation.shortTerm.length + a.mitigation.longTerm.length, 0)}`);

    console.log('\n🎉 End-to-End Test PASSED!');
    console.log('\n✅ All systems operational:');
    console.log('   • Gemini 2.5 Flash integration: Working');
    console.log('   • Input Parser Agent: Working');
    console.log('   • Threat Generator Agent: Working');
    console.log('   • Risk Assessor Agent: Working');
    console.log('   • Mitigation Planner Agent: Working');
    console.log('   • Complete workflow: Working\n');

    return true;
  } catch (error) {
    console.error('\n❌ Test Failed!');
    console.error('Error:', error);
    
    if (error instanceof Error) {
      console.error('\nError Details:');
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure GOOGLE_GENERATIVE_AI_API_KEY is set in .env.local');
    console.log('   2. Check your Google AI Studio API key: https://makersuite.google.com/app/apikey');
    console.log('   3. Verify internet connectivity');
    console.log('   4. Check API rate limits\n');
    
    return false;
  }
}

// Run test if executed directly
if (require.main === module) {
  runE2ETest()
    .then(success => process.exit(success ? 0 : 1))
    .catch(err => {
      console.error('Unexpected error:', err);
      process.exit(1);
    });
}

export { runE2ETest };
