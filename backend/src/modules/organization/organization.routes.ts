import { Router, Request, Response } from "express";
import { OrganizationService } from "./organization.service";
import {
  OrganizationCreateSchema,
  OrganizationUpdateSchema,
} from "./organization.schema";

const router = Router();

// GET /api/organizations
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const orgs = await OrganizationService.findAll();
    res.json({ success: true, count: orgs.length, data: orgs });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch organizations",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/organizations/:id
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const org = await OrganizationService.findById(req.params.id);
    if (!org) {
      res.status(404).json({ success: false, message: "Organization not found" });
      return;
    }
    res.json({ success: true, data: org });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve organization",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/organizations/slug/:slug
router.get("/slug/:slug", async (req: Request, res: Response): Promise<void> => {
  try {
    const org = await OrganizationService.findBySlug(req.params.slug);
    if (!org) {
      res.status(404).json({ success: false, message: "Organization not found" });
      return;
    }
    res.json({ success: true, data: org });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve organization",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/organizations
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const result = OrganizationCreateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }
  try {
    const created = await OrganizationService.create(result.data);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create organization",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PATCH /api/organizations/:id
router.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  const result = OrganizationUpdateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }
  try {
    const updated = await OrganizationService.update(req.params.id, result.data);
    if (!updated) {
      res.status(404).json({ success: false, message: "Organization not found" });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update organization",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export const organizationRoutes = router;
