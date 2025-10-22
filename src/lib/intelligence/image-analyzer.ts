import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { db } from '@/lib/db/client';
import { imageIntelligence } from '@/lib/db/schema';

const model = google('gemini-2.0-flash-exp', {
  safetySettings: [
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  ],
});

export interface GeolocationResult {
  location: string;
  coordinates: string | null;
  landmarks: string[];
  confidence: number;
  environmentalContext: string;
  securityIndicators: string[];
  fullAnalysis: string;
  reasoning: string;
}

/**
 * Analyze image for geolocation and threat intelligence using Gemini 2.0 Flash
 * Supports: URLs, base64 data URIs, Buffer
 */
export async function analyzeImageGeolocation(
  imageUrl: string,
  userId: number,
  fileName?: string
): Promise<GeolocationResult> {
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

  try {
    const { text } = await generateText({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image', image: imageUrl },
          ],
        },
      ],
      temperature: 0.3,
      maxTokens: 4096,
    });

    // Parse the response
    let result: GeolocationResult;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;
      
      result = JSON.parse(jsonText);
    } catch (parseError) {
      // Fallback: create structured result from text
      result = {
        location: 'Unable to determine precise location',
        coordinates: null,
        landmarks: [],
        confidence: 50,
        environmentalContext: 'Analysis pending',
        securityIndicators: [],
        fullAnalysis: text,
        reasoning: 'Could not parse structured response',
      };
    }

    // Store in database
    await db.insert(imageIntelligence).values({
      userId,
      imageUrl,
      fileName: fileName || 'Unknown',
      analysisType: 'geolocation',
      location: result.location,
      coordinates: result.coordinates,
      landmarks: JSON.stringify(result.landmarks),
      confidence: result.confidence,
      environmentalContext: result.environmentalContext,
      securityIndicators: JSON.stringify(result.securityIndicators),
      fullAnalysis: result.fullAnalysis,
      metadata: JSON.stringify({ reasoning: result.reasoning }),
    });

    return result;
  } catch (error) {
    console.error('Image analysis error:', error);
    throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get image analysis history for user
 */
export async function getImageAnalysisHistory(userId: number, limit: number = 10) {
  return await db.query.imageIntelligence.findMany({
    where: (imageIntelligence, { eq }) => eq(imageIntelligence.userId, userId),
    orderBy: (imageIntelligence, { desc }) => [desc(imageIntelligence.createdAt)],
    limit,
  });
}

/**
 * Get specific image analysis by ID
 */
export async function getImageAnalysis(id: number, userId: number) {
  const result = await db.query.imageIntelligence.findFirst({
    where: (imageIntelligence, { eq, and }) => 
      and(
        eq(imageIntelligence.id, id),
        eq(imageIntelligence.userId, userId)
      ),
  });

  if (!result) return null;

  return {
    ...result,
    landmarks: JSON.parse(result.landmarks || '[]'),
    securityIndicators: JSON.parse(result.securityIndicators || '[]'),
    metadata: JSON.parse(result.metadata || '{}'),
  };
}

/**
 * Analyze multiple images in batch
 */
export async function batchAnalyzeImages(
  imageUrls: string[],
  userId: number
): Promise<GeolocationResult[]> {
  const results: GeolocationResult[] = [];
  
  for (const url of imageUrls) {
    try {
      const result = await analyzeImageGeolocation(url, userId);
      results.push(result);
    } catch (error) {
      console.error(`Failed to analyze ${url}:`, error);
      // Continue with other images
    }
  }
  
  return results;
}
