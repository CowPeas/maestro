import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { db } from '@/lib/db/client';
import { threats, threatPredictions, analyticsSnapshots } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

// Gemini 2.5 Flash for predictive analytics
const model = google('gemini-2.5-flash', {
  safetySettings: [
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  ],
});

export interface ThreatPattern {
  layer: string;
  count: number;
  avgLikelihood: number;
  avgImpact: number;
  avgRiskScore: number;
  commonDescriptions: string[];
}

export interface PredictionResult {
  predictedThreat: string;
  layer: string;
  confidence: number;
  predictedLikelihood: number;
  predictedImpact: number;
  reasoning: string;
  recommendedActions: string[];
}

export interface AnalyticsData {
  totalThreats: number;
  riskDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  layerDistribution: Record<string, number>;
  avgRiskScore: number;
  trends: {
    date: string;
    threatCount: number;
    avgRisk: number;
  }[];
  predictions: PredictionResult[];
}

/**
 * Analyze historical threat patterns for a user
 */
export async function analyzePatterns(userId: number): Promise<ThreatPattern[]> {
  const userThreats = await db.query.threats.findMany({
    where: eq(threats.userId, userId),
  });

  if (userThreats.length === 0) {
    return [];
  }

  // Group by layer and calculate statistics
  const layerMap = new Map<string, typeof userThreats>();
  
  userThreats.forEach((threat) => {
    if (!layerMap.has(threat.layer)) {
      layerMap.set(threat.layer, []);
    }
    layerMap.get(threat.layer)!.push(threat);
  });

  const patterns: ThreatPattern[] = [];

  layerMap.forEach((layerThreats, layer) => {
    const avgLikelihood = layerThreats.reduce((sum, t) => sum + t.likelihood, 0) / layerThreats.length;
    const avgImpact = layerThreats.reduce((sum, t) => sum + t.impact, 0) / layerThreats.length;
    const avgRiskScore = avgLikelihood * avgImpact;

    // Get top 3 most common description patterns
    const descriptions = layerThreats
      .map(t => t.description)
      .slice(0, 3);

    patterns.push({
      layer,
      count: layerThreats.length,
      avgLikelihood: Math.round(avgLikelihood * 10) / 10,
      avgImpact: Math.round(avgImpact * 10) / 10,
      avgRiskScore: Math.round(avgRiskScore * 10) / 10,
      commonDescriptions: descriptions,
    });
  });

  return patterns.sort((a, b) => b.avgRiskScore - a.avgRiskScore);
}

/**
 * Generate AI-powered predictions based on historical patterns
 */
export async function generatePredictions(
  userId: number,
  patterns: ThreatPattern[]
): Promise<PredictionResult[]> {
  if (patterns.length === 0) {
    return [];
  }

  const prompt = `As a cybersecurity AI analyst, analyze these historical threat patterns and predict 3-5 likely future security threats:

Historical Patterns:
${JSON.stringify(patterns, null, 2)}

Based on these patterns, predict future threats that are likely to emerge. For each prediction:
1. Describe the predicted threat clearly
2. Identify which PAWAEYE layer it affects (Foundation Models, Data Operations, Agent Frameworks, Deployment, Evaluation, Security, or Ecosystem)
3. Estimate likelihood (1-5) and impact (1-5)
4. Provide confidence level (1-100)
5. Explain your reasoning
6. Suggest 2-3 specific recommended actions

Format as JSON array with fields: predictedThreat, layer, confidence, predictedLikelihood, predictedImpact, reasoning, recommendedActions (array).`;

  try {
    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.6,
      maxTokens: 4096,
    });

    let predictions: PredictionResult[];
    try {
      predictions = JSON.parse(text);
      if (!Array.isArray(predictions)) {
        predictions = [predictions];
      }
    } catch {
      // Fallback: create a basic prediction from the response
      predictions = [{
        predictedThreat: text.substring(0, 200),
        layer: patterns[0].layer,
        confidence: 70,
        predictedLikelihood: Math.round(patterns[0].avgLikelihood),
        predictedImpact: Math.round(patterns[0].avgImpact),
        reasoning: 'Based on historical threat patterns',
        recommendedActions: ['Review historical patterns', 'Implement security controls'],
      }];
    }

    // Store predictions in database
    for (const prediction of predictions) {
      await db.insert(threatPredictions).values({
        userId,
        predictedThreat: prediction.predictedThreat,
        layer: prediction.layer,
        confidence: prediction.confidence,
        predictedLikelihood: prediction.predictedLikelihood,
        predictedImpact: prediction.predictedImpact,
        reasoning: prediction.reasoning,
        recommendedActions: JSON.stringify(prediction.recommendedActions),
        basedOnThreatsCount: patterns.reduce((sum, p) => sum + p.count, 0),
      });
    }

    return predictions;
  } catch (error) {
    console.error('Prediction generation error:', error);
    throw new Error('Failed to generate predictions');
  }
}

/**
 * Get comprehensive analytics for a user
 */
export async function getAnalytics(userId: number): Promise<AnalyticsData> {
  const userThreats = await db.query.threats.findMany({
    where: eq(threats.userId, userId),
    orderBy: [desc(threats.createdAt)],
  });

  const totalThreats = userThreats.length;

  // Risk distribution
  const riskDistribution = {
    high: userThreats.filter(t => t.classification === 'High').length,
    medium: userThreats.filter(t => t.classification === 'Medium').length,
    low: userThreats.filter(t => t.classification === 'Low').length,
  };

  // Layer distribution
  const layerDistribution: Record<string, number> = {};
  userThreats.forEach(threat => {
    layerDistribution[threat.layer] = (layerDistribution[threat.layer] || 0) + 1;
  });

  // Average risk score
  const avgRiskScore = userThreats.length > 0
    ? userThreats.reduce((sum, t) => sum + (t.likelihood * t.impact), 0) / userThreats.length
    : 0;

  // Get historical snapshots
  const snapshots = await db.query.analyticsSnapshots.findMany({
    where: eq(analyticsSnapshots.userId, userId),
    orderBy: [desc(analyticsSnapshots.createdAt)],
    limit: 7,
  });

  const trends = snapshots.reverse().map(snapshot => ({
    date: snapshot.createdAt.toISOString().split('T')[0],
    threatCount: snapshot.totalThreats,
    avgRisk: snapshot.avgRiskScore / 10,
  }));

  // Get recent predictions
  const recentPredictions = await db.query.threatPredictions.findMany({
    where: eq(threatPredictions.userId, userId),
    orderBy: [desc(threatPredictions.createdAt)],
    limit: 5,
  });

  const predictions: PredictionResult[] = recentPredictions.map(p => ({
    predictedThreat: p.predictedThreat,
    layer: p.layer,
    confidence: p.confidence,
    predictedLikelihood: p.predictedLikelihood,
    predictedImpact: p.predictedImpact,
    reasoning: p.reasoning,
    recommendedActions: JSON.parse(p.recommendedActions),
  }));

  return {
    totalThreats,
    riskDistribution,
    layerDistribution,
    avgRiskScore: Math.round(avgRiskScore * 10) / 10,
    trends,
    predictions,
  };
}

/**
 * Create analytics snapshot for tracking over time
 */
export async function createSnapshot(userId: number): Promise<void> {
  const userThreats = await db.query.threats.findMany({
    where: eq(threats.userId, userId),
  });

  const highRiskCount = userThreats.filter(t => t.classification === 'High').length;
  const mediumRiskCount = userThreats.filter(t => t.classification === 'Medium').length;
  const lowRiskCount = userThreats.filter(t => t.classification === 'Low').length;

  const avgRiskScore = userThreats.length > 0
    ? Math.round((userThreats.reduce((sum, t) => sum + (t.likelihood * t.impact), 0) / userThreats.length) * 10)
    : 0;

  const layerDistribution: Record<string, number> = {};
  userThreats.forEach(threat => {
    layerDistribution[threat.layer] = (layerDistribution[threat.layer] || 0) + 1;
  });

  await db.insert(analyticsSnapshots).values({
    userId,
    totalThreats: userThreats.length,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    avgRiskScore,
    layerDistribution: JSON.stringify(layerDistribution),
  });
}
