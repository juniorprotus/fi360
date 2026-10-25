import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { Organization } from "./organization.model";
import { OrganizationUpdateSchema } from "./organization.schema";
import { authorize } from "../auth/authorization.middleware";
import { requireDatabase, requireOrganization } from "../auth/tenant.middleware";

const router = Router();

router.use(requireDatabase, requireOrganization, authorize("vehicles", "read"));

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const organization = await Organization.findById(req.user!.organizationId).lean();
    if (!organization) {
      res.status(404).json({ success: false, message: "Organization not found." });
      return;
    }
    res.json({ success: true, count: 1, data: [organization] });
  } catch {
    res.status(500).json({ success: false, message: "Failed to retrieve organization." });
  }
});

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id) || req.params.id !== req.user!.organizationId) {
    res.status(404).json({ success: false, message: "Organization not found." });
    return;
  }
  try {
    const organization = await Organization.findById(req.params.id).lean();
    if (!organization) {
      res.status(404).json({ success: false, message: "Organization not found." });
      return;
    }
    res.json({ success: true, data: organization });
  } catch {
    res.status(500).json({ success: false, message: "Failed to retrieve organization." });
  }
});

router.get("/slug/:slug", async (req: Request, res: Response): Promise<void> => {
  try {
    const organization = await Organization.findOne({
      _id: req.user!.organizationId,
      slug: req.params.slug,
    }).lean();
    if (!organization) {
      res.status(404).json({ success: false, message: "Organization not found." });
      return;
    }
    res.json({ success: true, data: organization });
  } catch {
    res.status(500).json({ success: false, message: "Failed to retrieve organization." });
  }
});

router.post("/", (_req: Request, res: Response): void => {
  res.status(403).json({
    success: false,
    message: "Organizations can only be created through account registration.",
  });
});

router.patch("/:id", authorize("vehicles", "update"), async (req: Request, res: Response): Promise<void> => {
  if (req.user?.role !== "owner") {
    res.status(403).json({ success: false, message: "Only the organization owner may update organization settings." });
    return;
  }
  if (!mongoose.isValidObjectId(req.params.id) || req.params.id !== req.user.organizationId) {
    res.status(404).json({ success: false, message: "Organization not found." });
    return;
  }
  const parsed = OrganizationUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }
  try {
    const updated = await Organization.findOneAndUpdate(
      { _id: req.params.id },
      { $set: parsed.data },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) {
      res.status(404).json({ success: false, message: "Organization not found." });
      return;
    }
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update organization." });
  }
});

export const organizationRoutes = router;
