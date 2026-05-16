import request from 'supertest';
import { describe, it, expect, beforeAll, afterEach, jest, beforeEach } from '@jest/globals';
import { app } from '../index';
import { prisma } from '../lib/prisma';

jest.mock('../lib/fcm', () => ({
  sendPushNotification: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../lib/twilio', () => ({
  sendOTP: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../lib/postgis', () => ({
  findNearestTechnician: jest.fn().mockResolvedValue({
    id: 'tech-1',
    distance: 5.2,
    currentJobs: 2,
    skills: ['installation', 'maintenance'],
  }),
}));

const mockAdminToken = 'Bearer admin-jwt-token';
const mockTechnicianToken = 'Bearer tech-jwt-token';

describe('Job Service API Tests', () => {
  let adminToken: string;
  let technicianToken: string;

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: {} });
    await prisma.job.deleteMany({ where: {} });
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        fullName: 'Admin User',
        role: 'super_admin',
        phone: '+1234567890',
      },
    });
    
    const technician = await prisma.user.create({
      data: {
        email: 'tech@test.com',
        fullName: 'Test Technician',
        role: 'technician',
        phone: '+1234567891',
        technicianProfile: {
          create: {
            status: 'available',
            skills: ['installation', 'maintenance'],
          },
        },
      },
    });

    adminToken = `Bearer mock-admin-token-${admin.id}`;
    technicianToken = `Bearer mock-tech-token-${technician.id}`;
  });

  afterEach(async () => {
    await prisma.job.deleteMany({ where: {} });
  });

  describe('Job Creation', () => {
    it('should create job with valid data and correct job_number format', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', adminToken)
        .send({
          clientId: 'client-1',
          siteId: 'site-1',
          jobType: 'installation',
          priority: 'high',
          description: 'Install 4 CCTV cameras',
          scheduledAt: new Date().toISOString(),
        });

      expect(response.status).toBe(201);
      expect(response.body.jobNumber).toMatch(/^SS-\d{4}-\d+$/);
    });

    it('should return 400 with Zod error details for missing required fields', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', adminToken)
        .send({
          clientId: 'client-1',
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Auto-Assignment', () => {
    it('should auto-assign to correct technician based on proximity and workload', async () => {
      const job = await prisma.job.create({
        data: {
          jobNumber: 'SS-2024-0001',
          clientId: 'client-1',
          siteId: 'site-1',
          jobType: 'installation',
          priority: 'high',
          description: 'Test job',
          status: 'pending',
          scheduledAt: new Date(),
        },
      });

      const response = await request(app)
        .post(`/api/jobs/${job.id}/auto-assign`)
        .set('Authorization', adminToken);

      expect(response.status).toBe(200);
      expect(response.body.technicianId).toBeDefined();
      expect(response.body.technicianId).toBe('tech-1');
    });

    it('should send FCM notification on assignment', async () => {
      const job = await prisma.job.create({
        data: {
          jobNumber: 'SS-2024-0002',
          clientId: 'client-1',
          siteId: 'site-1',
          jobType: 'maintenance',
          priority: 'medium',
          description: 'Test maintenance job',
          status: 'pending',
          scheduledAt: new Date(),
        },
      });

      const response = await request(app)
        .post(`/api/jobs/${job.id}/auto-assign`)
        .set('Authorization', adminToken);

      expect(response.status).toBe(200);
    });
  });

  describe('Check-in Validation', () => {
    it('should allow check-in when coordinates are within 100m', async () => {
      const job = await prisma.job.create({
        data: {
          jobNumber: 'SS-2024-0003',
          clientId: 'client-1',
          siteId: 'site-1',
          jobType: 'installation',
          priority: 'high',
          description: 'Test job',
          status: 'assigned',
          site: { create: { siteName: 'Test Site', address: 'Test', latitude: 28.6139, longitude: 77.209 } },
          scheduledAt: new Date(),
        },
      });

      const response = await request(app)
        .post(`/api/jobs/${job.id}/check-in`)
        .set('Authorization', technicianToken)
        .send({
          latitude: 28.6139,
          longitude: 77.209,
        });

      expect(response.status).toBe(200);
    });

    it('should reject check-in when coordinates are outside 100m', async () => {
      const job = await prisma.job.create({
        data: {
          jobNumber: 'SS-2024-0004',
          clientId: 'client-1',
          siteId: 'site-1',
          jobType: 'installation',
          priority: 'high',
          description: 'Test job',
          status: 'assigned',
          site: { create: { siteName: 'Test Site', address: 'Test', latitude: 28.6139, longitude: 77.209 } },
          scheduledAt: new Date(),
        },
      });

      const response = await request(app)
        .post(`/api/jobs/${job.id}/check-in`)
        .set('Authorization', technicianToken)
        .send({
          latitude: 28.7,
          longitude: 77.3,
        });

      expect(response.status).toBe(403);
      expect(response.body.distance).toBeGreaterThan(100);
    });

    it('should generate OTP for high-security sites', async () => {
      const job = await prisma.job.create({
        data: {
          jobNumber: 'SS-2024-0005',
          clientId: 'client-1',
          siteId: 'site-1',
          jobType: 'installation',
          priority: 'high',
          description: 'High security job',
          status: 'assigned',
          isHighSecurity: true,
          site: { create: { siteName: 'Bank Site', address: 'Test', latitude: 28.6139, longitude: 77.209 } },
          scheduledAt: new Date(),
        },
      });

      const response = await request(app)
        .post(`/api/jobs/${job.id}/check-in`)
        .set('Authorization', technicianToken)
        .send({
          latitude: 28.6139,
          longitude: 77.209,
        });

      expect(response.status).toBe(200);
      expect(response.body.otpRequired).toBe(true);
    });
  });

  describe('Job Completion Flow', () => {
    it('should complete full job flow: check-in -> OTP verify -> survey -> complete', async () => {
      let job = await prisma.job.create({
        data: {
          jobNumber: 'SS-2024-0006',
          clientId: 'client-1',
          siteId: 'site-1',
          jobType: 'installation',
          priority: 'high',
          description: 'Full flow test job',
          status: 'assigned',
          site: { create: { siteName: 'Test Site', address: 'Test', latitude: 28.6139, longitude: 77.209 } },
          scheduledAt: new Date(),
        },
      });

      const checkInResponse = await request(app)
        .post(`/api/jobs/${job.id}/check-in`)
        .set('Authorization', technicianToken)
        .send({ latitude: 28.6139, longitude: 77.209 });
      
      expect(checkInResponse.status).toBe(200);

      job = await prisma.job.findUnique({ where: { id: job.id } });
      expect(job?.status).toBe('in_progress');

      const surveyResponse = await request(app)
        .post(`/api/jobs/${job!.id}/survey`)
        .set('Authorization', technicianToken)
        .send({
          cameraCount: 4,
          cameraModels: ['Hikvision 2MP', 'Hikvision 4MP'],
          dvrModel: 'DS-7608NI',
          cableLength: 100,
          powerPoints: 2,
          notes: 'Installation completed',
        });

      expect(surveyResponse.status).toBe(200);

      const completeResponse = await request(app)
        .post(`/api/jobs/${job!.id}/complete`)
        .set('Authorization', technicianToken)
        .send({ signature: 'data:image/png;base64,test' });

      expect(completeResponse.status).toBe(200);

      const completedJob = await prisma.job.findUnique({ where: { id: job!.id } });
      expect(completedJob?.status).toBe('completed');
      expect(completedJob?.completedAt).not.toBeNull();
    });
  });

  describe('State Machine Violations', () => {
    it('should return 400 when trying to complete a pending job', async () => {
      const job = await prisma.job.create({
        data: {
          jobNumber: 'SS-2024-0007',
          clientId: 'client-1',
          siteId: 'site-1',
          jobType: 'installation',
          priority: 'medium',
          description: 'Test job',
          status: 'pending',
          scheduledAt: new Date(),
        },
      });

      const response = await request(app)
        .post(`/api/jobs/${job.id}/complete`)
        .set('Authorization', technicianToken)
        .send({ signature: 'data:image/png;base64,test' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot complete');
    });

    it('should return 400 when trying to check-in a cancelled job', async () => {
      const job = await prisma.job.create({
        data: {
          jobNumber: 'SS-2024-0008',
          clientId: 'client-1',
          siteId: 'site-1',
          jobType: 'installation',
          priority: 'medium',
          description: 'Test job',
          status: 'cancelled',
          scheduledAt: new Date(),
        },
      });

      const response = await request(app)
        .post(`/api/jobs/${job.id}/check-in`)
        .set('Authorization', technicianToken)
        .send({ latitude: 28.6139, longitude: 77.209 });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('cancelled');
    });
  });
});

export {};