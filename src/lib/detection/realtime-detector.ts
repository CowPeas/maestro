import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { db } from '@/lib/db/client';
import { threats, threatAlerts, detectionRules } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

const model = google('gemini-2.5-flash', {
  safetySettings: [
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  ],
});

export interface DetectionResult {
  alertId: number;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  layer: string;
  confidence: number;
}

/**
 * Calculate threat severity score based on likelihood and impact
 */
export function calculateSeverity(likelihood: number, impact: number): 'Critical' | 'High' | 'Medium' | 'Low' {
  const score = likelihood * impact;
  if (score >= 20) return 'Critical';
  if (score >= 12) return 'High';
  if (score >= 6) return 'Medium';
  return 'Low';
}

/**
 * Scan recent threats for anomalies using AI
 */
export async function scanForAnomalies(userId: number): Promise<DetectionResult[]> {
  // Get recent high-risk threats
  const recentThreats = await db.query.threats.findMany({
    where: eq(threats.userId, userId),
    orderBy: [desc(threats.createdAt)],
    limit: 10,
  });

  if (recentThreats.length === 0) {
    return [];
  }

  // Analyze for patterns using Gemini
  const prompt = `Analyze these recent security threats and identify any anomalies or escalating patterns:

${JSON.stringify(recentThreats.map(t => ({
  description: t.description,
  layer: t.layer,
  likelihood: t.likelihood,
  impact: t.impact,
  classification: t.classification,
})), null, 2)}

Identify:
1. Sudden spikes in threat severity
2. Multiple threats in same layer (potential systemic issue)
3. Escalating attack patterns
4. Critical combinations of threats

Return JSON array with fields: title, description, severity (Critical/High/Medium/Low), layer, confidence (1-100).`;

  try {
    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.4,
      maxTokens: 2048,
    });

    let anomalies: any[];
    try {
      anomalies = JSON.parse(text);
      if (!Array.isArray(anomalies)) {
        anomalies = [anomalies];
      }
    } catch {
      return [];
    }

    // Create alerts for detected anomalies
    const results: DetectionResult[] = [];

    for (const anomaly of anomalies) {
      const [alert] = await db.insert(threatAlerts).values({
        userId,
        title: anomaly.title || 'Anomaly Detected',
        description: anomaly.description || text.substring(0, 500),
        severity: anomaly.severity || 'Medium',
        layer: anomaly.layer || 'Security',
        source: 'auto-scan',
        status: 'Active',
        metadata: JSON.stringify({ confidence: anomaly.confidence || 70 }),
      }).returning();

      results.push({
        alertId: alert.id,
        title: alert.title,
        description: alert.description,
        severity: alert.severity as any,
        layer: alert.layer,
        confidence: anomaly.confidence || 70,
      });
    }

    return results;
  } catch (error) {
    console.error('Anomaly scan error:', error);
    return [];
  }
}

/**
 * Check if new threat matches any detection rules
 */
export async function checkDetectionRules(userId: number, threatId: number): Promise<DetectionResult[]> {
  const threat = await db.query.threats.findFirst({
    where: and(eq(threats.id, threatId), eq(threats.userId, userId)),
  });

  if (!threat) return [];

  const rules = await db.query.detectionRules.findMany({
    where: and(eq(detectionRules.userId, userId), eq(detectionRules.isActive, 1)),
  });

  const results: DetectionResult[] = [];

  for (const rule of rules) {
    // Check if pattern matches
    const pattern = rule.pattern.toLowerCase();
    const description = threat.description.toLowerCase();
    const layer = threat.layer.toLowerCase();

    if (description.includes(pattern) || layer.includes(pattern)) {
      const [alert] = await db.insert(threatAlerts).values({
        userId,
        title: `Rule Triggered: ${rule.name}`,
        description: `Detection rule "${rule.name}" was triggered. ${rule.description}`,
        severity: rule.severity,
        layer: rule.layer,
        source: 'detection-rule',
        status: 'Active',
        relatedThreatId: threatId,
        metadata: JSON.stringify({ ruleId: rule.id }),
      }).returning();

      results.push({
        alertId: alert.id,
        title: alert.title,
        description: alert.description,
        severity: alert.severity as any,
        layer: alert.layer,
        confidence: 95,
      });

      // TODO: Send notifications if configured
      if (rule.notifyEmail) {
        // Send email notification
      }
      if (rule.notifyWebhook && rule.webhookUrl) {
        // Send webhook notification
      }
    }
  }

  return results;
}

/**
 * Get active alerts for user
 */
export async function getActiveAlerts(userId: number): Promise<any[]> {
  return await db.query.threatAlerts.findMany({
    where: and(eq(threatAlerts.userId, userId), eq(threatAlerts.status, 'Active')),
    orderBy: [desc(threatAlerts.detectedAt)],
    limit: 20,
  });
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(alertId: number, userId: number): Promise<void> {
  await db.update(threatAlerts)
    .set({
      status: 'Acknowledged',
      acknowledgedAt: new Date(),
    })
    .where(and(eq(threatAlerts.id, alertId), eq(threatAlerts.userId, userId)));
}

/**
 * Resolve an alert
 */
export async function resolveAlert(alertId: number, userId: number): Promise<void> {
  await db.update(threatAlerts)
    .set({
      status: 'Resolved',
      resolvedAt: new Date(),
    })
    .where(and(eq(threatAlerts.id, alertId), eq(threatAlerts.userId, userId)));
}

/**
 * Get detection statistics
 */
export async function getDetectionStats(userId: number): Promise<{
  activeAlerts: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  todayCount: number;
}> {
  const alerts = await db.query.threatAlerts.findMany({
    where: eq(threatAlerts.userId, userId),
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    activeAlerts: alerts.filter(a => a.status === 'Active').length,
    criticalCount: alerts.filter(a => a.severity === 'Critical' && a.status === 'Active').length,
    highCount: alerts.filter(a => a.severity === 'High' && a.status === 'Active').length,
    mediumCount: alerts.filter(a => a.severity === 'Medium' && a.status === 'Active').length,
    lowCount: alerts.filter(a => a.severity === 'Low' && a.status === 'Active').length,
    todayCount: alerts.filter(a => a.detectedAt >= today).length,
  };
}
