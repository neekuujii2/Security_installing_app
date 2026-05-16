import type {
  Client,
  InventoryItem,
  Job,
  ServiceRequest,
  Site,
  Technician,
  User,
} from "./types.js";

const now = new Date();

export const users: User[] = [
  {
    id: "user-admin",
    email: "admin@smartsecurity.in",
    phone: "+919900000001",
    fullName: "Aarav Mehta",
    role: "super_admin",
  },
  {
    id: "user-dispatcher",
    email: "dispatcher@smartsecurity.in",
    phone: "+919900000002",
    fullName: "Riya Khanna",
    role: "dispatcher",
  },
  {
    id: "user-tech-1",
    email: "tech1@smartsecurity.in",
    phone: "+919900000003",
    fullName: "Imran Sheikh",
    role: "technician",
  },
  {
    id: "user-tech-2",
    email: "tech2@smartsecurity.in",
    phone: "+919900000004",
    fullName: "Neha Bist",
    role: "technician",
  },
  {
    id: "user-client",
    email: "client@smartsecurity.in",
    phone: "+919900000005",
    fullName: "Bank Ops Desk",
    role: "client",
  }
];

export const technicians: Technician[] = [
  {
    id: "tech-1",
    userId: "user-tech-1",
    employeeId: "SSE-T001",
    skills: ["CCTV", "Networking", "DVR"],
    availabilityStatus: "available",
    currentLat: 28.6139,
    currentLng: 77.209,
    locationUpdatedAt: now.toISOString(),
    totalJobsDone: 186,
    rating: 4.7,
  },
  {
    id: "tech-2",
    userId: "user-tech-2",
    employeeId: "SSE-T002",
    skills: ["CCTV", "Maintenance"],
    availabilityStatus: "busy",
    currentLat: 28.5355,
    currentLng: 77.391,
    locationUpdatedAt: now.toISOString(),
    totalJobsDone: 143,
    rating: 4.5,
    currentJobId: "job-2",
  }
];

export const clients: Client[] = [
  {
    id: "client-1",
    organizationName: "National Trust Bank",
    clientType: "bank",
    isHighSecurity: true,
  },
  {
    id: "client-2",
    organizationName: "Skyline Hotels",
    clientType: "hotel",
    isHighSecurity: false,
  }
];

export const sites: Site[] = [
  {
    id: "site-1",
    clientId: "client-1",
    siteName: "Connaught Place Branch",
    address: "Block A, Connaught Place, New Delhi",
    city: "New Delhi",
    latitude: 28.6315,
    longitude: 77.2167,
    geofenceRadius: 100,
    siteManagerName: "Rahul Sethi",
  },
  {
    id: "site-2",
    clientId: "client-2",
    siteName: "Skyline Airport Hotel",
    address: "Hospitality District, IGI Airport, Delhi",
    city: "New Delhi",
    latitude: 28.5562,
    longitude: 77.1,
    geofenceRadius: 100,
    siteManagerName: "Sonia Kapoor",
  }
];

export const jobs: Job[] = [
  {
    id: "job-1",
    jobNumber: "SSE-20260514-001",
    clientId: "client-1",
    siteId: "site-1",
    assignedTechnicianId: "tech-1",
    createdBy: "user-dispatcher",
    jobType: "installation",
    status: "assigned",
    priority: "urgent",
    description: "Install 12-camera branch surveillance refresh with DVR migration.",
    scheduledAt: new Date(now.getTime() + 1000 * 60 * 45).toISOString(),
    otpVerified: false,
    clientSigned: false,
  },
  {
    id: "job-2",
    jobNumber: "SSE-20260514-002",
    clientId: "client-2",
    siteId: "site-2",
    assignedTechnicianId: "tech-2",
    createdBy: "user-admin",
    jobType: "maintenance",
    status: "in_progress",
    priority: "high",
    description: "Troubleshoot lobby NVR connectivity and replace failing connectors.",
    scheduledAt: new Date(now.getTime() - 1000 * 60 * 75).toISOString(),
    checkinAt: new Date(now.getTime() - 1000 * 60 * 40).toISOString(),
    otpVerified: true,
    clientSigned: false,
    survey: {
      cameraCount: 8,
      dvrModel: "Hikvision DS-7608NXI",
      cableLengthMeters: 45,
      powerPoints: 3,
      networkPoints: 4,
      technicianNotes: "Two connectors replaced. One camera needs procurement review.",
      beforePhotos: [
        "https://images.unsplash.com/photo-1516321497487-e288fb19713f",
        "https://images.unsplash.com/photo-1558002038-1055907df827"
      ],
      afterPhotos: [
        "https://images.unsplash.com/photo-1563013544-824ae1b704d3",
        "https://images.unsplash.com/photo-1580894732444-8ecded7900cd"
      ],
    },
  }
];

export const inventoryItems: InventoryItem[] = [
  {
    id: "inv-1",
    sku: "CAM-DOME-4MP",
    name: "4MP Dome Camera",
    category: "camera",
    unit: "pcs",
    currentStock: 84,
    minStockLevel: 20,
    lastUsedAt: now.toISOString(),
  },
  {
    id: "inv-2",
    sku: "CABLE-CAT6-305",
    name: "Cat6 Cable Roll",
    category: "cable",
    unit: "rolls",
    currentStock: 9,
    minStockLevel: 12,
    lastUsedAt: now.toISOString(),
  },
  {
    id: "inv-3",
    sku: "CONN-RJ45-SH",
    name: "Shielded RJ45 Connector",
    category: "connector",
    unit: "boxes",
    currentStock: 31,
    minStockLevel: 10,
  }
];

export const serviceRequests: ServiceRequest[] = [
  {
    id: "req-1",
    clientId: "client-1",
    siteId: "site-1",
    requestType: "maintenance",
    description: "Vault hallway camera is intermittently offline after business hours.",
    status: "open",
    createdAt: new Date(now.getTime() - 1000 * 60 * 180).toISOString(),
  }
];
