import { Router, Request, Response } from "express";
import { AIService } from "./ai.service";
import { PredictiveMaintenanceRequestSchema } from "./ai.schema";
import { authorize } from "../auth/authorization.middleware";
import { requireDatabase, requireOrganization } from "../auth/tenant.middleware";
import mongoose from "mongoose";
import { Vehicle } from "../vehicle/vehicle.model";

const router = Router();
router.use(requireDatabase, requireOrganization);

// POST /api/ai/predict-maintenance
router.post("/predict-maintenance", authorize("ai", "create"), async (req: Request, res: Response): Promise<void> => {
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
    if (result.data.vehicleId) {
      if (!mongoose.isValidObjectId(result.data.vehicleId)) {
        res.status(400).json({ success: false, message: "Vehicle ID is invalid." });
        return;
      }
      const vehicle = await Vehicle.findOne({
        _id: result.data.vehicleId,
        organizationId: req.user!.organizationId,
      }).select("_id").lean();
      if (!vehicle) {
        res.status(404).json({ success: false, message: "Vehicle not found." });
        return;
      }
    }
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
