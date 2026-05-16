export type UserRole = "super_admin" | "dispatcher" | "technician" | "client" | "site_manager";

export interface AuthUser {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: UserRole;
}

export interface Summary {
  activeJobs: number;
  availableTechnicians: number;
  pendingRequests: number;
  lowStockAlerts: number;
  dispatchTimeMinutes: number;
  utilizationRate: number;
  clientSatisfaction: number;
}
