import { Organization, IOrganization } from "./organization.model";
import { OrganizationCreateInput, OrganizationUpdateInput } from "./organization.schema";
import { isDbConnected } from "../../config/db";

// In-memory seed for zero-cloud local dev
const inMemoryOrganizations: IOrganization[] = [
  {
    _id: "org_default_1",
    name: "National Logistics Hub",
    slug: "national-logistics-hub",
    enabledModules: ["vehicles", "drivers", "maintenance", "telematics", "ai"],
    contactEmail: "ops@nationalhub.co.ke",
    phone: "+254 700 123 456",
    country: "Kenya",
    fleetSize: 47,
    plan: "pro",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export class OrganizationService {
  /**
   * Internal API contract: Find all organizations
   */
  public static async findAll(): Promise<IOrganization[]> {
    if (isDbConnected()) {
      const docs = await Organization.find().sort({ createdAt: -1 }).lean();
      return docs as unknown as IOrganization[];
    }
    return inMemoryOrganizations;
  }

  /**
   * Internal API contract: Find by ID
   */
  public static async findById(id: string): Promise<IOrganization | null> {
    if (isDbConnected()) {
      const doc = await Organization.findById(id).lean();
      return doc as unknown as IOrganization | null;
    }
    return inMemoryOrganizations.find((o) => String(o._id) === id) || null;
  }

  /**
   * Internal API contract: Find by slug (used for per-org module gating)
   */
  public static async findBySlug(slug: string): Promise<IOrganization | null> {
    if (isDbConnected()) {
      const doc = await Organization.findOne({ slug }).lean();
      return doc as unknown as IOrganization | null;
    }
    return inMemoryOrganizations.find((o) => o.slug === slug) || null;
  }

  /**
   * Internal API contract: Check if a module is enabled for an org
   */
  public static async isModuleEnabled(
    orgId: string,
    module: string
  ): Promise<boolean> {
    const org = await this.findById(orgId);
    if (!org) return false;
    return org.enabledModules.includes(module as IOrganization["enabledModules"][number]);
  }

  /**
   * Internal API contract: Create organization
   */
  public static async create(input: OrganizationCreateInput): Promise<IOrganization> {
    if (isDbConnected()) {
      const doc = new Organization(input);
      return doc.save() as unknown as Promise<IOrganization>;
    }
    const newOrg: IOrganization = {
      _id: `org_mem_${Date.now()}`,
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryOrganizations.push(newOrg);
    return newOrg;
  }

  /**
   * Internal API contract: Update organization (e.g., toggle modules)
   */
  public static async update(
    id: string,
    input: OrganizationUpdateInput
  ): Promise<IOrganization | null> {
    if (isDbConnected()) {
      const doc = await Organization.findByIdAndUpdate(
        id,
        { $set: input },
        { new: true }
      ).lean();
      return doc as unknown as IOrganization | null;
    }
    const idx = inMemoryOrganizations.findIndex((o) => String(o._id) === id);
    if (idx === -1) return null;
    inMemoryOrganizations[idx] = {
      ...inMemoryOrganizations[idx],
      ...input,
      updatedAt: new Date(),
    };
    return inMemoryOrganizations[idx];
  }
}
