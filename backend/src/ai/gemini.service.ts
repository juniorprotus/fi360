/**
 * Gemini AI Telematics and Predictive Maintenance Service
 * Follows strict modular isolation: failures or rate limits in AI never crash caller modules.
 */

export interface MaintenancePredictionInput {
  vehicleId: string;
  plateNumber: string;
  odometerKm: number;
  engineHours: number;
  recentIssues?: string[];
  workshopNotes?: string;
}

export interface MaintenancePredictionResult {
  predictedFailureRisk: "low" | "medium" | "high" | "critical";
  componentRisk: string[];
  estimatedDaysToService: number;
  recommendations: string[];
  confidenceScore: number;
  aiSource: "gemini-api" | "heuristic-fallback";
}

export class GeminiService {
  private static apiKey = process.env.GEMINI_API_KEY || "";

  /**
   * Predict vehicle wear-and-tear and upcoming maintenance needs
   */
  public static async predictMaintenance(input: MaintenancePredictionInput): Promise<MaintenancePredictionResult> {
    try {
      if (!this.apiKey) {
        return this.heuristicFallback(input, "Gemini API key is not configured.");
      }

      // In Phase 4, we will use the official Google Gen AI SDK.
      // For Phase 1 foundational setup, return robust heuristic baseline with safety isolation.
      return this.heuristicFallback(input, "Using initial heuristic baseline.");
    } catch (error) {
      console.warn("⚠️  Gemini AI API failure (isolated gracefully):", error instanceof Error ? error.message : error);
      return this.heuristicFallback(input, "Fallback invoked due to AI API error.");
    }
  }

  private static heuristicFallback(input: MaintenancePredictionInput, reason: string): MaintenancePredictionResult {
    const isHighMileage = input.odometerKm > 80000;
    const isHighHours = input.engineHours > 2500;

    let risk: MaintenancePredictionResult["predictedFailureRisk"] = "low";
    const componentRisk: string[] = [];

    if (isHighMileage) {
      risk = "medium";
      componentRisk.push("Brake pads", "Tyre tread wear");
    }

    if (isHighHours) {
      risk = "high";
      componentRisk.push("Transmission fluid", "Coolant system");
    }

    return {
      predictedFailureRisk: risk,
      componentRisk: componentRisk.length > 0 ? componentRisk : ["Routine inspection due"],
      estimatedDaysToService: risk === "high" ? 7 : risk === "medium" ? 21 : 60,
      recommendations: [
        `Automated check for vehicle ${input.plateNumber} (${input.odometerKm} km).`,
        reason,
      ],
      confidenceScore: 0.88,
      aiSource: "heuristic-fallback",
    };
  }
}
