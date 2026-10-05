import { GoogleGenAI } from "@google/genai";
import { getEnv } from "../../config/env";
import { PredictiveMaintenanceRequest } from "./ai.schema";

let aiClient: GoogleGenAI | null = null;

function getAIClient() {
  const env = getEnv();
  if (!env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return aiClient;
}

export class AIService {
  /**
   * Internal API contract: Analyze vehicle telematics to predict maintenance needs
   */
  public static async predictMaintenance(input: PredictiveMaintenanceRequest) {
    const client = getAIClient();
    
    if (!client) {
      // Fallback mode if API key is not provided
      console.warn("⚠️  GEMINI_API_KEY not set. Using heuristic fallback for predictive maintenance.");
      return this.heuristicFallback(input);
    }

    const { telematicsData } = input;
    
    const prompt = `
You are an expert AI Fleet Maintenance Analyst for "Fleet Intelligence 360 (FI360)".
Analyze the following vehicle telematics data and predict potential maintenance issues.

Vehicle: ${telematicsData.year} ${telematicsData.make} ${telematicsData.model}
Odometer: ${telematicsData.odometerKm} km
Engine Hours: ${telematicsData.engineHours} hrs
Battery Voltage: ${telematicsData.batteryVoltage ?? "Unknown"} V
Recent Fault Codes: ${telematicsData.recentFaultCodes?.length ? telematicsData.recentFaultCodes.join(", ") : "None"}

Provide your analysis in the following strict JSON format, without markdown block wrappers or extra text:
{
  "healthScore": 0-100,
  "predictedIssues": [
    {
      "component": "string",
      "probability": "Low|Medium|High",
      "timeToFailureDays": number,
      "recommendation": "string"
    }
  ],
  "summary": "string"
}
`;

    try {
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            temperature: 0.2,
        }
      });

      const text = response.text || "";
      
      // Attempt to parse JSON from the response. We handle potential markdown wrappers just in case.
      let jsonString = text;
      if (text.includes("```json")) {
        const matches = text.match(/```json\n([\s\S]*?)\n```/);
        if (matches && matches[1]) {
          jsonString = matches[1];
        }
      } else if (text.includes("```")) {
        const matches = text.match(/```\n([\s\S]*?)\n```/);
        if (matches && matches[1]) {
          jsonString = matches[1];
        }
      }

      return JSON.parse(jsonString.trim());
    } catch (error) {
      console.error("❌ Gemini API Error:", error);
      // Fallback gracefully on API failure
      return this.heuristicFallback(input);
    }
  }

  private static heuristicFallback(input: PredictiveMaintenanceRequest) {
    const { telematicsData } = input;
    
    let healthScore = 95;
    const issues = [];

    // Simple mock logic for fallback testing
    if (telematicsData.odometerKm > 80000) {
      healthScore -= 15;
      issues.push({
        component: "Timing Belt",
        probability: "Medium",
        timeToFailureDays: 30,
        recommendation: "Inspect and likely replace timing belt due to high mileage.",
      });
    }

    if (telematicsData.batteryVoltage && telematicsData.batteryVoltage < 11.5) {
      healthScore -= 20;
      issues.push({
        component: "Battery",
        probability: "High",
        timeToFailureDays: 5,
        recommendation: "Battery voltage is critically low. Replace immediately to prevent stranding.",
      });
    }

    return {
      healthScore: Math.max(0, healthScore),
      predictedIssues: issues,
      summary: issues.length > 0 
        ? "Heuristic analysis indicates potential issues based on thresholds." 
        : "Vehicle appears healthy based on basic heuristic checks.",
      isFallback: true,
    };
  }
}
