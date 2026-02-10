
import { GoogleGenAI, Type } from "@google/genai";
import { JobInput, AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeJobPosting(input: JobInput): Promise<Partial<AnalysisResult>> {
  const prompt = `
    Act as a fraud detection analyst specializing in Indian job scams (e.g., fake internships, WhatsApp-based scams, payment frauds).
    Analyze the following job details for authenticity:
    
    Company: ${input.company}
    Title: ${input.title}
    Email/Contact: ${input.email}
    Platform: ${input.platform}
    Description: ${input.description}
    
    Identify semantic red flags such as:
    1. Unrealistic pay for the role.
    2. Vague responsibilities.
    3. Requests for personal data early.
    4. Language patterns common in scams (fake formal tone).
    5. Suspicious recruitment processes (e.g., immediate WhatsApp interview).

    Return your analysis as a JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aiScore: { type: Type.NUMBER, description: 'Score from 0-100 where 100 is perfectly genuine and 0 is definitely a scam.' },
            reasoning: { type: Type.STRING, description: 'Detailed explainable reasoning for the score.' },
            semanticFlags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: 'Specific phrases or patterns that looked suspicious.'
            }
          },
          required: ['aiScore', 'reasoning', 'semanticFlags']
        }
      }
    });

    const data = JSON.parse(response.text);
    return {
      aiReasoning: data.reasoning,
      trustScore: data.aiScore,
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}
