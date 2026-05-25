/**
 * ⚡ ZAPPI MICROSERVICES HIGH-PERFORMANCE STRESS TEST SUITE
 * 
 * This is a highly optimized, concurrent, self-contained stress testing harness
 * designed using native Node.js HTTP/HTTPS modules with socket keep-alive.
 * It simulates thousands of concurrent users executing operations against the microservices.
 * 
 * Usage:
 *   node stress-test.js [target] [concurrency] [duration_seconds]
 * 
 * Targets:
 *   - device    : Tests /V1/device/identification on Port 3001
 *   - customer  : Tests /V1/client/device/register/extension/get on Port 3002 (requires auth)
 *   - wallet    : Tests /V1/recharge/parameters/get on Port 3003 (requires auth)
 *   - all       : Run stress tests on all three services sequentially
 */

const http = require('http');
const crypto = require('crypto');

// Native dependency-free HS256 JWT generator
function signJwtNative(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const base64UrlEncode = (obj) => {
    return Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };
  
  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
    
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Colors for terminal output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
};

const DEVICE_SECRET = 'zappi-device-secret-CHANGE-IN-PROD';
const TEST_TOKEN = signJwtNative(
  { deviceId: 'stress-test-device-001', certifiedId: 3 },
  DEVICE_SECRET
);

// High-performance keep-alive agent
const keepAliveAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 1000,
  maxFreeSockets: 256,
  timeout: 10000,
});

const TARGETS = {
  device: {
    name: 'Device Service (Identification)',
    port: 3001,
    path: '/V1/device/identification',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Connection': 'keep-alive',
    },
    body: JSON.stringify({
      device_id: 'stress-test-device-001',
      device_type: 'ANDROID',
      product: 'ZappiApp',
      app_version: '2.0.0',
    }),
  },
  customer: {
    name: 'Customer Service (Document Extensions)',
    port: 3002,
    path: '/V1/client/device/register/extension/get',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Connection': 'keep-alive',
    },
    body: JSON.stringify({
      auth_token: TEST_TOKEN,
      certified_id: 3,
    }),
  },
  wallet: {
    name: 'Wallet Service (Recharge Providers)',
    port: 3003,
    path: '/V1/recharge/parameters/get',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Connection': 'keep-alive',
    },
    body: JSON.stringify({
      auth_token: TEST_TOKEN,
    }),
  },
};

// Parse command line arguments
const args = process.argv.slice(2);
const targetArg = args[0] || 'all';
const concurrency = parseInt(args[1], 10) || 100;
const duration = parseInt(args[2], 10) || 5;

console.clear();
console.log(`${COLORS.bright}${COLORS.cyan}================================================================${COLORS.reset}`);
console.log(`${COLORS.bright}${COLORS.cyan}   ⚡ ZAPPI MICROSERVICES STRESS & LOAD TEST HARNESS v1.0 ⚡   ${COLORS.reset}`);
console.log(`${COLORS.bright}${COLORS.cyan}================================================================${COLORS.reset}`);
console.log(`${COLORS.dim}Target:      ${COLORS.reset}${COLORS.bright}${targetArg.toUpperCase()}${COLORS.reset}`);
console.log(`${COLORS.dim}Concurrency: ${COLORS.reset}${COLORS.bright}${concurrency} concurrent workers${COLORS.reset}`);
console.log(`${COLORS.dim}Duration:    ${COLORS.reset}${COLORS.bright}${duration} seconds${COLORS.reset}`);
console.log(`${COLORS.bright}${COLORS.cyan}----------------------------------------------------------------${COLORS.reset}\n`);

async function runStressTest(targetKey, concurrency, durationSeconds) {
  const config = TARGETS[targetKey];
  if (!config) {
    console.error(`${COLORS.red}Error: Unknown target "${targetKey}"${COLORS.reset}`);
    return;
  }

  console.log(`${COLORS.yellow}Preparing stress test for: ${COLORS.bright}${config.name}${COLORS.reset}`);
  console.log(`${COLORS.dim}Endpoint: POST http://localhost:${config.port}${config.path}${COLORS.reset}`);
  console.log(`${COLORS.dim}Starting load generators...${COLORS.reset}\n`);

  let totalRequests = 0;
  let successRequests = 0;
  let failedRequests = 0;
  let statusCodes = {};
  let latencies = [];
  
  const stopTime = Date.now() + durationSeconds * 1000;
  let activeWorkers = 0;

  const testStartTime = Date.now();

  return new Promise((resolve) => {
    function makeRequest() {
      if (Date.now() >= stopTime) {
        activeWorkers--;
        if (activeWorkers === 0) {
          finish();
        }
        return;
      }

      totalRequests++;
      const startTime = process.hrtime();

      const options = {
        hostname: 'localhost',
        port: config.port,
        path: config.path,
        method: config.method,
        headers: config.headers,
        agent: keepAliveAgent,
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          const diff = process.hrtime(startTime);
          const latencyMs = (diff[0] * 1e9 + diff[1]) / 1e6;
          latencies.push(latencyMs);

          const code = res.statusCode;
          statusCodes[code] = (statusCodes[code] || 0) + 1;

          if (code >= 200 && code < 300) {
            successRequests++;
          } else {
            failedRequests++;
          }

          // Recurse to maintain concurrency
          process.nextTick(makeRequest);
        });
      });

      req.on('error', (err) => {
        const diff = process.hrtime(startTime);
        const latencyMs = (diff[0] * 1e9 + diff[1]) / 1e6;
        latencies.push(latencyMs);

        failedRequests++;
        statusCodes['ERROR'] = (statusCodes['ERROR'] || 0) + 1;
        
        process.nextTick(makeRequest);
      });

      if (config.body) {
        req.write(config.body);
      }
      req.end();
    }

    function finish() {
      const testEndTime = Date.now();
      const elapsedSeconds = (testEndTime - testStartTime) / 1000;
      
      // Calculate statistics
      latencies.sort((a, b) => a - b);
      const sum = latencies.reduce((a, b) => a + b, 0);
      const avg = sum / latencies.length || 0;
      const min = latencies[0] || 0;
      const max = latencies[latencies.length - 1] || 0;
      
      const p95Idx = Math.floor(latencies.length * 0.95);
      const p95 = latencies[p95Idx] || 0;
      
      const p99Idx = Math.floor(latencies.length * 0.99);
      const p99 = latencies[p99Idx] || 0;

      const rps = totalRequests / elapsedSeconds;
      const successRate = (successRequests / totalRequests) * 100 || 0;

      console.log(`${COLORS.bright}${COLORS.green}✔ Stress Test Finished for ${config.name}${COLORS.reset}`);
      console.log(`${COLORS.bright}------------------------------------------------------------${COLORS.reset}`);
      console.log(`⏱  Elapsed Time:     ${COLORS.cyan}${elapsedSeconds.toFixed(2)}s${COLORS.reset}`);
      console.log(`📊 Total Requests:   ${COLORS.cyan}${totalRequests}${COLORS.reset}`);
      console.log(`🚀 Throughput (RPS):  ${COLORS.bright}${COLORS.green}${rps.toFixed(2)} req/sec${COLORS.reset}`);
      console.log(`🎉 Success Rate:     ${successRate >= 99 ? COLORS.green : COLORS.yellow}${successRate.toFixed(2)}%${COLORS.reset} (${successRequests} OK / ${failedRequests} Fail)`);
      console.log(`📈 Response Latency:`);
      console.log(`   - Min:            ${COLORS.cyan}${min.toFixed(2)}ms${COLORS.reset}`);
      console.log(`   - Average:        ${COLORS.cyan}${avg.toFixed(2)}ms${COLORS.reset}`);
      console.log(`   - p95 (95%):      ${COLORS.bright}${COLORS.yellow}${p95.toFixed(2)}ms${COLORS.reset}`);
      console.log(`   - p99 (99%):      ${COLORS.bright}${COLORS.red}${p99.toFixed(2)}ms${COLORS.reset}`);
      console.log(`   - Max:            ${COLORS.cyan}${max.toFixed(2)}ms${COLORS.reset}`);
      
      console.log(`📊 HTTP Status Codes:`);
      for (const [code, count] of Object.entries(statusCodes)) {
        const color = code.startsWith('2') ? COLORS.green : COLORS.red;
        console.log(`   - [${color}${code}${COLORS.reset}]: ${count} times`);
      }
      console.log(`${COLORS.bright}------------------------------------------------------------${COLORS.reset}\n`);
      
      resolve({
        targetKey,
        name: config.name,
        totalRequests,
        rps,
        avg,
        p95,
        p99,
        successRate,
      });
    }

    // Spawn parallel workers
    for (let i = 0; i < concurrency; i++) {
      activeWorkers++;
      makeRequest();
    }
  });
}

async function start() {
  const results = [];
  
  if (targetArg === 'all') {
    results.push(await runStressTest('device', concurrency, duration));
    results.push(await runStressTest('customer', concurrency, duration));
    results.push(await runStressTest('wallet', concurrency, duration));
  } else {
    results.push(await runStressTest(targetArg, concurrency, duration));
  }

  // Display final comparison summary
  console.log(`${COLORS.bright}${COLORS.cyan}================================================================${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}                 FINAL STRESS TEST COMPARISON                  ${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}================================================================${COLORS.reset}`);
  
  console.log(
    ` ${COLORS.bright}${'Service'.padEnd(28)} | ${'RPS'.padStart(10)} | ${'Avg Lat'.padStart(10)} | ${'p95 Lat'.padStart(10)} | ${'Success'.padStart(8)}${COLORS.reset}`
  );
  console.log(`-`.repeat(72));
  
  for (const r of results) {
    const serviceName = r.name.split(' (')[0];
    const rpsStr = r.rps.toFixed(1);
    const avgStr = r.avg.toFixed(1) + 'ms';
    const p95Str = r.p95.toFixed(1) + 'ms';
    const successStr = r.successRate.toFixed(1) + '%';
    
    console.log(
      ` ${COLORS.cyan}${serviceName.padEnd(28)}${COLORS.reset} | ${COLORS.green}${rpsStr.padStart(10)}${COLORS.reset} | ${avgStr.padStart(10)} | ${COLORS.yellow}${p95Str.padStart(10)}${COLORS.reset} | ${COLORS.bright}${r.successRate >= 99 ? COLORS.green : COLORS.red}${successStr.padStart(8)}${COLORS.reset}`
    );
  }
  console.log(`${COLORS.bright}${COLORS.cyan}================================================================${COLORS.reset}\n`);
  console.log(`${COLORS.bright}${COLORS.green}All tests complete! If microservices are not running, run "docker compose up --build" first.${COLORS.reset}\n`);
}

start().catch(console.error);
