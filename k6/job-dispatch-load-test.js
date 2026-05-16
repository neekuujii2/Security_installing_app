import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const jobDispatchDuration = new Trend('job_dispatch_duration');
const jobDispatchErrors = new Rate('job_dispatch_errors');
const jobDispatchSuccess = new Rate('job_dispatch_success');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ADMIN_COUNT = 50;

const adminTokens = [];

export const options = {
  scenarios: {
    job_dispatch: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '3m', target: 50 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
  },
};

function loginAdmin(index) {
  const response = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: `admin${index}@smartsecurity.in`,
      password: 'admin123',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (response.status === 200) {
    const body = JSON.parse(response.body);
    return body.accessToken;
  }
  return null;
}

function createJob() {
  const jobTypes = ['installation', 'maintenance', 'survey', 'repair'];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const clients = ['client-1', 'client-2', 'client-3'];
  const sites = ['site-1', 'site-2', 'site-3'];

  return {
    clientId: clients[Math.floor(Math.random() * clients.length)],
    siteId: sites[Math.floor(Math.random() * sites.length)],
    jobType: jobTypes[Math.floor(Math.random() * jobTypes.length)],
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    description: `Load test job - ${Math.random().toString(36).substring(7)}`,
    scheduledAt: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

export function setup() {
  console.log(`Logging in ${ADMIN_COUNT} admin users...`);
  
  for (let i = 1; i <= ADMIN_COUNT; i++) {
    const token = loginAdmin(i);
    if (token) {
      adminTokens.push(token);
    }
    sleep(0.2);
  }

  console.log(`Successfully logged in ${adminTokens.length} admin users`);
  return { tokens: adminTokens };
}

export default function (data) {
  if (!data.tokens || data.tokens.length === 0) {
    console.error('No tokens available');
    return;
  }

  const token = data.tokens[Math.floor(Math.random() * data.tokens.length)];
  const jobData = createJob();

  const startTime = new Date();
  
  const createResponse = http.post(
    `${BASE_URL}/api/jobs`,
    JSON.stringify(jobData),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  jobDispatchDuration.add(new Date() - startTime);

  const createSuccess = check(createResponse, {
    'job created': (r) => r.status === 201,
    'has jobId': (r) => {
      try {
        return JSON.parse(r.body).id !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (createSuccess) {
    const body = JSON.parse(createResponse.body);
    
    if (Math.random() > 0.5) {
      const autoAssignStart = new Date();
      
      const assignResponse = http.post(
        `${BASE_URL}/api/jobs/${body.id}/auto-assign`,
        JSON.stringify({}),
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      jobDispatchDuration.add(new Date() - autoAssignStart);

      check(assignResponse, {
        'auto-assign success': (r) => r.status === 200,
      });
    }
  } else {
    jobDispatchErrors.add(1);
  }

  if (createSuccess) {
    jobDispatchSuccess.add(1);
  }

  sleep(Math.random() * 2 + 1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data),
    './job-dispatch-results.json': JSON.stringify(data),
  };
}

function textSummary(data) {
  const totalRequests = data.metrics.http_reqs.values.count;
  const failedRequests = data.metrics.http_req_failed.values.passes;
  const successRate = totalRequests > 0 ? ((totalRequests - failedRequests) / totalRequests * 100).toFixed(2) : 0;

  return `
    === Job Dispatch Load Test Results ===
    
    Total Requests: ${totalRequests}
    Failed Requests: ${failedRequests}
    Success Rate: ${successRate}%
    
    Response Times:
    - Avg: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
    - p95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
    - p99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms
    
    Job Dispatch Duration:
    - Avg: ${data.metrics.job_dispatch_duration.values.avg.toFixed(2)}ms
    - p95: ${data.metrics.job_dispatch_duration.values['p(95)'].toFixed(2)}ms
    
    VUs Peak: ${data.state?.vus || 'N/A'}
  `;
}