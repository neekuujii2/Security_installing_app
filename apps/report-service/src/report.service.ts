import puppeteer, { Browser, Page } from 'puppeteer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { createQueue, Job } from 'bull';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const reportQueue = createQueue('report-generation', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

interface JobData {
  jobId: string;
}

interface JobDataComplete {
  id: string;
  jobNumber: string;
  status: string;
  client: {
    organizationName: string;
    email: string;
  };
  site: {
    siteName: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  technicianUser: {
    fullName: string;
    phone: string;
  } | null;
  survey: {
    cameraCount: number;
    cameraModels: string[];
    dvrModel: string;
    cableLength: number;
    powerPoints: number;
    notes: string | null;
  } | null;
  jobMaterials: {
    material: {
      name: string;
      sku: string;
    };
    quantity: number;
  }[];
  beforePhotos: { url: string }[];
  afterPhotos: { url: string }[];
  signatureUrl: string | null;
  completedAt: Date | null;
  createdAt: Date;
}

async function generatePDF(job: JobDataComplete): Promise<string> {
  const browser: Browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page: Page = await browser.newPage();
    
    const isHighSecurity = job.status === 'high_security';
    
    const html = generateHTMLTemplate(job, isHighSecurity);
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
    });

    const s3Key = `reports/${job.id}/${job.jobNumber}.pdf`;
    const s3Url = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${s3Key}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET || 'smart-security-reports',
        Key: s3Key,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
      })
    );

    return s3Url;
  } finally {
    await browser.close();
  }
}

function generateHTMLTemplate(job: JobDataComplete, isHighSecurity: boolean): string {
  const formatDate = (date: Date | null) => date ? new Date(date).toLocaleDateString('en-IN') : 'N/A';
  const formatDateTime = (date: Date | null) => date ? new Date(date).toLocaleString('en-IN') : 'N/A';

  const cameraModelsHtml = job.survey?.cameraModels?.map(m => `<span>${m}</span>`).join(', ') || 'N/A';
  const beforePhotosHtml = job.beforePhotos?.map(p => `<img src="${p.url}" />`).join('') || '';
  const afterPhotosHtml = job.afterPhotos?.map(p => `<img src="${p.url}" />`).join('') || '';
  const materialsHtml = job.jobMaterials?.map(m => `
    <tr>
      <td>${m.material.name}</td>
      <td>${m.material.sku}</td>
      <td>${m.quantity}</td>
    </tr>
  `).join('') || '<tr><td colspan="3">No materials used</td></tr>';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; font-size: 12px; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 3px solid #1A3C5E; }
        .logo { font-size: 24px; font-weight: 700; color: #1A3C5E; }
        .logo span { color: #0EA5E9; }
        .job-info { text-align: right; }
        .job-number { font-size: 18px; font-weight: 700; color: #1A3C5E; }
        .section { padding: 20px; border-bottom: 1px solid #e5e5e5; }
        .section-title { font-size: 14px; font-weight: 700; color: #1A3C5E; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .info-row { display: flex; }
        .info-label { font-weight: 600; color: #666; min-width: 100px; }
        .info-value { color: #1a1a1a; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 10px; text-align: left; border: 1px solid #e5e5e5; }
        th { background: #f5f5f5; font-weight: 600; }
        .photos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px; }
        .photo-item { border: 1px solid #e5e5e5; padding: 5px; }
        .photo-item img { width: 100%; height: 150px; object-fit: cover; }
        .photo-label { text-align: center; padding: 5px; font-weight: 600; color: #666; }
        .signature-box { margin-top: 20px; padding: 20px; border: 2px dashed #e5e5e5; text-align: center; }
        .signature-box img { max-width: 200px; max-height: 80px; }
        .compliance-stamp { background: #DC2626; color: white; padding: 10px 20px; display: inline-block; font-weight: 700; transform: rotate(-5deg); margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #999; font-size: 10px; border-top: 1px solid #e5e5e5; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Smart<span>Security</span></div>
        <div class="job-info">
          <div class="job-number">${job.jobNumber}</div>
          <div>Generated: ${formatDateTime(new Date())}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Job Details</div>
        <div class="info-grid">
          <div class="info-row"><span class="info-label">Client:</span><span class="info-value">${job.client?.organizationName || 'N/A'}</span></div>
          <div class="info-row"><span class="info-label">Site:</span><span class="info-value">${job.site?.siteName || 'N/A'}</span></div>
          <div class="info-row"><span class="info-label">Address:</span><span class="info-value">${job.site?.address || 'N/A'}</span></div>
          <div class="info-row"><span class="info-label">Technician:</span><span class="info-value">${job.technicianUser?.fullName || 'Unassigned'}</span></div>
          <div class="info-row"><span class="info-label">Created:</span><span class="info-value">${formatDate(job.createdAt)}</span></div>
          <div class="info-row"><span class="info-label">Completed:</span><span class="info-value">${formatDate(job.completedAt)}</span></div>
        </div>
      </div>

      ${job.survey ? `
      <div class="section">
        <div class="section-title">Site Survey Data</div>
        <div class="info-grid">
          <div class="info-row"><span class="info-label">Camera Count:</span><span class="info-value">${job.survey.cameraCount}</span></div>
          <div class="info-row"><span class="info-label">Camera Models:</span><span class="info-value">${cameraModelsHtml}</span></div>
          <div class="info-row"><span class="info-label">DVR Model:</span><span class="info-value">${job.survey.dvrModel}</span></div>
          <div class="info-row"><span class="info-label">Cable Length:</span><span class="info-value">${job.survey.cableLength}m</span></div>
          <div class="info-row"><span class="info-label">Power Points:</span><span class="info-value">${job.survey.powerPoints}</span></div>
          ${job.survey.notes ? `<div class="info-row"><span class="info-label">Notes:</span><span class="info-value">${job.survey.notes}</span></div>` : ''}
        </div>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Materials Used</div>
        <table>
          <thead><tr><th>Item</th><th>SKU</th><th>Quantity</th></tr></thead>
          <tbody>${materialsHtml}</tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Before Photos</div>
        <div class="photos-grid">${beforePhotosHtml || '<p>No before photos available</p>'}</div>
      </div>

      <div class="section">
        <div class="section-title">After Photos</div>
        <div class="photos-grid">${afterPhotosHtml || '<p>No after photos available</p>'}</div>
      </div>

      <div class="section">
        <div class="section-title">Completion Signature</div>
        <div class="signature-box">
          ${job.signatureUrl ? `<img src="${job.signatureUrl}" alt="Signature" />` : '<p>No signature available</p>'}
          <p>Signed on: ${formatDateTime(job.completedAt)}</p>
        </div>
        ${isHighSecurity ? '<div class="compliance-stamp">HIGH SECURITY COMPLIANT</div>' : ''}
      </div>

      <div class="footer">
        <p>This is a system-generated document. For queries, contact support@smartsecurity.in</p>
        <p>Page 1 of 1 | Generated by Smart Security Ecosystem</p>
      </div>
    </body>
    </html>
  `;
}

async function sendEmailWithPDF(email: string, pdfUrl: string, jobNumber: string) {
  const command = new SendEmailCommand({
    Destination: { ToAddresses: [email] },
    Message: {
      Body: {
        Html: {
          Data: `
            <h2>Job Completion Report</h2>
            <p>Your job <strong>${jobNumber}</strong> has been completed successfully.</p>
            <p>View your report: <a href="${pdfUrl}">Download PDF Report</a></p>
            <p>Thank you for choosing Smart Security.</p>
          `,
        },
      },
      Subject: { Data: `Job Completion Report - ${jobNumber}` },
    },
    Source: process.env.SES_FROM_EMAIL || 'reports@smartsecurity.in',
  });

  await sesClient.send(command);
}

async function processJob(job: Job) {
  const { jobId } = job.data as JobData;
  console.log(`Processing report for job: ${jobId}`);

  try {
    const jobData = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        client: true,
        site: true,
        technicianUser: true,
        survey: true,
        jobMaterials: { include: { material: true } },
        beforePhotos: true,
        afterPhotos: true,
      },
    });

    if (!jobData) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const jobComplete: JobDataComplete = {
      ...jobData,
      survey: jobData.survey as any,
      jobMaterials: jobData.jobMaterials as any,
      beforePhotos: jobData.beforePhotos as any,
      afterPhotos: jobData.afterPhotos as any,
    };

    const pdfUrl = await generatePDF(jobComplete);
    
    await prisma.jobReport.create({
      data: {
        jobId: jobData.id,
        pdfUrl,
        generatedAt: new Date(),
      },
    });

    if (jobData.client?.email) {
      await sendEmailWithPDF(jobData.client.email, pdfUrl, jobData.jobNumber);
    }

    console.log(`Report generated successfully for job: ${jobId}`);
  } catch (error) {
    console.error(`Failed to generate report for job ${jobId}:`, error);
    throw error;
  }
}

reportQueue.process(async (job) => {
  await processJob(job);
});

reportQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed successfully`);
});

reportQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

export async function queueReportGeneration(jobId: string) {
  await reportQueue.add({ jobId });
  console.log(`Report generation queued for job: ${jobId}`);
}

export default { queueReportGeneration, processJob };