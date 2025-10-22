import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { AGENT_PROMPTS } from './prompts';

// Use Gemini 2.5 Flash model for all agents (stable, widely available)
// Configure safety settings to allow threat modeling content
const model = google('gemini-2.5-flash', {
  safetySettings: [
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  ],
});

export interface ParsedSystem {
  components: string[];
  dataFlows: string[];
  securityBoundaries: string[];
  externalIntegrations: string[];
  authMechanisms: string[];
}

export interface IdentifiedThreat {
  description: string;
  layer: string;
  attackVector: string;
  affectedComponents: string[];
}

export interface RiskAssessment {
  likelihood: number;
  impact: number;
  classification: 'High' | 'Medium' | 'Low';
  riskScore: number;
  justification: string;
}

export interface MitigationStrategy {
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
  resources: string[];
  metrics: string[];
}

export interface ThreatAnalysis {
  threat: IdentifiedThreat;
  risk: RiskAssessment;
  mitigation: MitigationStrategy;
}

/**
 * Input Parser Agent - Extracts system components and relationships
 * Uses Gemini 2.5 Flash for fast, accurate parsing
 */
export async function parseSystemInput(input: string): Promise<ParsedSystem> {
  try {
    const { text } = await generateText({
      model,
      system: AGENT_PROMPTS.inputParser,
      prompt: input,
      temperature: 0.3,
      maxTokens: 2048,
    });

    try {
      return JSON.parse(text);
    } catch {
      return {
        components: [input],
        dataFlows: [],
        securityBoundaries: [],
        externalIntegrations: [],
        authMechanisms: [],
      };
    }
  } catch (error) {
    console.error('Input parsing error:', error);
    throw new Error('Failed to parse system input');
  }
}

/**
 * Threat Generator Agent - Identifies potential threats across all MAESTRO layers
 * Uses Gemini 2.5 Flash with higher token limit for comprehensive threat analysis
 */
export async function generateThreats(
  parsedSystem: ParsedSystem
): Promise<IdentifiedThreat[]> {
  try {
    const { text } = await generateText({
      model,
      system: AGENT_PROMPTS.threatGenerator,
      prompt: `Analyze this system and identify threats:\n${JSON.stringify(parsedSystem, null, 2)}`,
      temperature: 0.5,
      maxTokens: 4096,
    });

    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [
        {
          description: text,
          layer: 'Security',
          attackVector: 'Unknown',
          affectedComponents: parsedSystem.components,
        },
      ];
    }
  } catch (error) {
    console.error('Threat generation error:', error);
    throw new Error('Failed to generate threats');
  }
}

/**
 * Risk Assessor Agent - Evaluates threat risk levels with precise scoring
 * Uses Gemini 2.5 Flash with low temperature for consistent risk assessment
 */
export async function assessRisk(threat: IdentifiedThreat): Promise<RiskAssessment> {
  try {
    const { text } = await generateText({
      model,
      system: AGENT_PROMPTS.riskAssessor,
      prompt: `Assess the risk for this threat:\n${JSON.stringify(threat, null, 2)}`,
      temperature: 0.2,
      maxTokens: 2048,
    });

    try {
      const parsed = JSON.parse(text);
      return {
        likelihood: parsed.likelihood || 3,
        impact: parsed.impact || 3,
        classification: parsed.classification || 'Medium',
        riskScore: parsed.riskScore || parsed.likelihood * parsed.impact || 9,
        justification: parsed.justification || 'Risk assessment based on threat analysis',
      };
    } catch {
      return {
        likelihood: 3,
        impact: 3,
        classification: 'Medium',
        riskScore: 9,
        justification: text,
      };
    }
  } catch (error) {
    console.error('Risk assessment error:', error);
    throw new Error('Failed to assess risk');
  }
}

/**
 * Mitigation Planner Agent - Develops comprehensive mitigation strategies
 * Uses Gemini 2.5 Flash with moderate temperature for creative yet practical solutions
 */
export async function planMitigation(
  threat: IdentifiedThreat,
  risk: RiskAssessment
): Promise<MitigationStrategy> {
  try {
    const { text } = await generateText({
      model,
      system: AGENT_PROMPTS.mitigationPlanner,
      prompt: `Develop mitigation strategies for:\nThreat: ${JSON.stringify(threat)}\nRisk: ${JSON.stringify(risk)}`,
      temperature: 0.4,
      maxTokens: 3072,
    });

    try {
      return JSON.parse(text);
    } catch {
      return {
        immediate: ['Review and assess the threat'],
        shortTerm: ['Implement security controls'],
        longTerm: ['Establish monitoring and continuous improvement'],
        resources: ['Security team', 'Development resources'],
        metrics: ['Reduction in threat occurrence'],
      };
    }
  } catch (error) {
    console.error('Mitigation planning error:', error);
    throw new Error('Failed to plan mitigation');
  }
}

/**
 * Complete threat analysis workflow
 * Orchestrates all four agents to provide comprehensive security analysis
 */
export async function analyzeSystem(input: string): Promise<ThreatAnalysis[]> {
  const parsedSystem = await parseSystemInput(input);
  const threats = await generateThreats(parsedSystem);

  const analyses: ThreatAnalysis[] = [];
  for (const threat of threats) {
    const risk = await assessRisk(threat);
    const mitigation = await planMitigation(threat, risk);
    analyses.push({ threat, risk, mitigation });
  }

  return analyses;
}
