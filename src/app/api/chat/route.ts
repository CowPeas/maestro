import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { analyzeSystem } from '@/lib/ai/agents';
import { analyzeImageGeolocation } from '@/lib/intelligence/image-analyzer';
import { generatePredictions, analyzePatterns } from '@/lib/analytics/predictor';
import { scanForAnomalies } from '@/lib/detection/realtime-detector';
import { auth } from '@/lib/auth';

// Gemini 2.5 Flash for orchestration
const model = google('gemini-2.5-flash', {
  safetySettings: [
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  ],
});

export const runtime = 'edge';
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const { messages } = await req.json();

  const result = await streamText({
    model,
    system: `You are PawaEye AI, an expert threat intelligence assistant.

You help users with:
1. 🛡️ **Threat Analysis** - Analyze systems for security threats using the PAWAEYE framework
2. 🌍 **Image Intelligence** - Geolocate images and identify landmarks with 95%+ confidence
3. 🔮 **Predictive Analytics** - Forecast future threats based on historical patterns
4. 🚨 **Anomaly Detection** - Scan for unusual threat patterns in real-time

When users ask questions:
- For threat analysis: Use the analyzeThreat tool
- For image location: Use the analyzeImage tool  
- For predictions: Use the predictThreats tool
- For anomaly scanning: Use the detectAnomalies tool

Be concise, professional, and security-focused. Always explain your findings clearly.`,
    messages,
    tools: {
      analyzeThreat: tool({
        description: 'Analyze a system for security threats using AI. Returns comprehensive threat analysis with risk scores and mitigation strategies.',
        parameters: z.object({
          systemDescription: z.string().describe('Description of the system to analyze (e.g., "web app with authentication and payment processing")'),
        }),
        execute: async ({ systemDescription }) => {
          try {
            const analyses = await analyzeSystem(systemDescription);
            
            return {
              success: true,
              threatCount: analyses.length,
              threats: analyses.map(a => ({
                description: a.threat.description,
                layer: a.threat.layer,
                attackVector: a.threat.attackVector,
                affectedComponents: a.threat.affectedComponents,
                riskScore: a.risk.riskScore,
                classification: a.risk.classification,
                likelihood: a.risk.likelihood,
                impact: a.risk.impact,
                justification: a.risk.justification,
                mitigation: {
                  immediate: a.mitigation.immediate,
                  shortTerm: a.mitigation.shortTerm,
                  longTerm: a.mitigation.longTerm,
                },
              })),
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Analysis failed',
            };
          }
        },
      }),

      analyzeImage: tool({
        description: 'Analyze an image for geolocation, landmarks, and security indicators using multimodal AI. Achieves 95%+ confidence in many cases.',
        parameters: z.object({
          imageUrl: z.string().describe('URL of the image to analyze'),
          fileName: z.string().optional().describe('Optional filename'),
        }),
        execute: async ({ imageUrl, fileName }) => {
          try {
            const result = await analyzeImageGeolocation(imageUrl, userId, fileName);
            
            return {
              success: true,
              location: result.location,
              coordinates: result.coordinates,
              landmarks: result.landmarks,
              confidence: result.confidence,
              environmentalContext: result.environmentalContext,
              securityIndicators: result.securityIndicators,
              reasoning: result.reasoning,
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Image analysis failed',
            };
          }
        },
      }),

      predictThreats: tool({
        description: 'Generate threat predictions based on historical patterns. Analyzes trends and forecasts future risks.',
        parameters: z.object({
          dummyParam: z.string().optional().describe('Optional parameter - not used'),
        }),
        execute: async () => {
          try {
            const patterns = await analyzePatterns(userId);
            const predictions = await generatePredictions(userId, patterns);
            
            return {
              success: true,
              predictionCount: predictions.length,
              predictions: predictions.map(p => ({
                predictedThreat: p.predictedThreat,
                layer: p.layer,
                confidence: p.confidence,
                likelihood: p.predictedLikelihood,
                impact: p.predictedImpact,
                reasoning: p.reasoning,
                recommendedActions: p.recommendedActions,
              })),
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Prediction failed',
            };
          }
        },
      }),

      detectAnomalies: tool({
        description: 'Scan recent threats for anomalies and escalating patterns. Identifies systemic issues and critical combinations.',
        parameters: z.object({
          userId: z.number().optional().describe('User ID for anomaly detection'),
        }),
        execute: async ({ userId: paramUserId }) => {
          try {
            const anomalies = await scanForAnomalies(paramUserId || userId);
            
            return {
              success: true,
              anomalyCount: anomalies.length,
              anomalies: anomalies.map(a => ({
                title: a.title,
                description: a.description,
                severity: a.severity,
                layer: a.layer,
                confidence: a.confidence,
              })),
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Detection failed',
            };
          }
        },
      }),
    },
    temperature: 0.7,
    maxTokens: 4096,
  });

  return result.toDataStreamResponse();
}
