export type UserRole =
  | "super_admin"
  | "dispatcher"
  | "technician"
  | "client"
  | "site_manager";

export type TechnicianAvailability = "available" | "busy" | "off_duty";
export type ClientType = "bank" | "hotel" | "airport" | "corporate" | "other";
export type JobType = "installation" | "maintenance" | "survey" | "fault_repair";
export type JobStatus =
  | "pending"
  | "assigned"
  | "en_route"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled";
export type JobPriority = "low" | "normal" | "high" | "urgent";
export type InventoryCategory = "camera" | "dvr" | "cable" | "connector" | "power" | "other";

export interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Technician {
  id: string;
  userId: string;
  employeeId: string;
  skills: string[];
  availabilityStatus: TechnicianAvailability;
  currentLat: number;
  currentLng: number;
  locationUpdatedAt: string;
  totalJobsDone: number;
  rating: number;
  currentJobId?: string;
}

export interface Client {
  id: string;
  organizationName: string;
  clientType: ClientType;
  isHighSecurity: boolean;
}

export interface Site {
  id: string;
  clientId: string;
  siteName: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  geofenceRadius: number;
  siteManagerName: string;
}

export interface ServiceRequest {
  id: string;
  clientId: string;
  siteId: string;
  requestType: JobType;
  description: string;
  status: "open" | "converted" | "closed";
  createdAt: string;
}

export interface JobSurvey {
  cameraCount: number;
  dvrModel: string;
  cableLengthMeters: number;
  powerPoints: number;
  networkPoints: number;
  technicianNotes: string;
  beforePhotos: string[];
  afterPhotos: string[];
  clientSignatureUrl?: string;
}

export interface Job {
  id: string;
  jobNumber: string;
  clientId: string;
  siteId: string;
  assignedTechnicianId?: string;
  createdBy: string;
  jobType: JobType;
  status: JobStatus;
  priority: JobPriority;
  description: string;
  scheduledAt: string;
  checkinAt?: string;
  checkoutAt?: string;
  otpVerified: boolean;
  clientSigned: boolean;
  reportUrl?: string;
  survey?: JobSurvey;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: InventoryCategory;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  costPrice?: number;
  sellPrice?: number;
  lastUsedAt?: string;
}

export interface DashboardSummary {
  activeJobs: number;
  availableTechnicians: number;
  pendingRequests: number;
  lowStockAlerts: number;
  dispatchTimeMinutes: number;
  utilizationRate: number;
  clientSatisfaction: number;
}
