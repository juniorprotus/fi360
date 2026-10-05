import dotenv from "dotenv";
import { AIService } from "../modules/ai/ai.service";

dotenv.config();

async function testAI() {
  console.log("🤖 Testing AI Predictive Maintenance Forecast...");
  
  if (!process.env.GEMINI_API_KEY) {
      console.warn("⚠️  GEMINI_API_KEY is not set. You will see heuristic fallback results.");
  } else {
      console.log("✅ Using Gemini API for predictions.");
  }

  const mockVehicleData = {
    vehicleId: "mock_test_123",
    telematicsData: {
      make: "Volvo",
      model: "FH16",
      year: 2021,
      odometerKm: 420500, // High mileage
      engineHours: 12500,
      batteryVoltage: 11.2, // Low battery
      recentFaultCodes: ["P0300", "P0420"], // Misfire and Catalyst system efficiency
    },
  };

  console.log("\n📊 Mock Telematics Input:");
  console.log(JSON.stringify(mockVehicleData, null, 2));

  try {
    const analysis = await AIService.predictMaintenance(mockVehicleData);
    
    console.log("\n✨ AI Analysis Output:");
    console.log(JSON.stringify(analysis, null, 2));
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testAI();
