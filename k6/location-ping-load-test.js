import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const locationPingDuration = new Trend('location_ping_duration');
const locationPingErrors = new Rate('location_ping_errors');
const locationPingSuccess = new Rate('location_ping_success');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TECHNICIAN_COUNT = 100;
const DURATION_MINUTES = 5;

const technicianTokens = [];

export const options = {
  scenarios: {
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },
        { duration: '3m', target: 100 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
    websocket_admin: {
      executor: 'constant-vus',
      vus: 10,
      duration: `${DURATION_MINUTES}m`,
      startTime: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.01'],
  },
};

function loginTechnician(index) {
  const response = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      phone: `+91${String(9000000000 + index).slice(-10)}`,
      password: 'test123',
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

function generateRandomLocation() {
  const delhiLat = 28.6139;
  const delhiLng = 77.209;
  return {
    lat: delhiLat + (Math.random() - 0.5) * 0.1,
    lng: delhiLng + (Math.random() - 0.5) * 0.1,
  };
}

export function setup() {
  console.log(`Logging in ${TECHNICIAN_COUNT} technicians...`);
  
  for (let i = 0; i < TECHNICIAN_COUNT; i++) {
    const token = loginTechnician(i);
    if (token) {
      technicianTokens.push(token);
    }
    sleep(0.1);
  }

  console.log(`Successfully logged in ${technicianTokens.length} technicians`);
  return { tokens: technicianTokens };
}

export default function (data) {
  if (!data.tokens || data.tokens.length === 0) {
    console.error('No tokens available');
    return;
  }

  const token = data.tokens[Math.floor(Math.random() * data.tokens.length)];
  const location = generateRandomLocation();

  const startTime = new Date();
  const response = http.post(
    `${BASE_URL}/api/location/ping`,
    JSON.stringify({
      latitude: location.lat,
      longitude: location.lng,
      accuracy: 10,
      timestamp: new Date().toISOString(),
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  locationPingDuration.add(new Date() - startTime);

  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response has locationId': (r) => {
      try {
        return JSON.parse(r.body).locationId !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (success) {
    locationPingSuccess.add(1);
  } else {
    locationPingErrors.add(1);
  }

  sleep(30);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data),
    './k6-results.json': JSON.stringify(data),
  };
}

function textSummary(data) {
  return `
    === Location Ping Load Test Results ===
    
    Total Requests: ${data.metrics.http_reqs.values.count}
    Failed Requests: ${data.metrics.http_req_failed.values.passes - data.metrics.http_reqs.values.passes}
    Success Rate: ${((data.metrics.http_req_failed.values.passes / data.metrics.http_reqs.values.count) * 100).toFixed(2)}%
    
    Response Times:
    - Avg: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
    - p95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
    - p99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms
    
    Location Ping Duration:
    - Avg: ${data.metrics.location_ping_duration.values.avg.toFixed(2)}ms
    - p95: ${data.metrics.location_ping_duration.values['p(95)'].toFixed(2)}ms
  `;
}