import { Router, Request, Response } from "express";
import { AIService } from "./ai.service";
import { PredictiveMaintenanceRequestSchema } from "./ai.schema";

const router = Router();

// POST /api/ai/predict-maintenance
router.post("/predict-maintenance", async (req: Request, res: Response): Promise<void> => {
  const result = PredictiveMaintenanceRequestSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const analysis = await AIService.predictMaintenance(result.data);
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate AI analysis",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export const aiRoutes = router;
