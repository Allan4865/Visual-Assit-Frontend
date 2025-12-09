const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const TIMEOUT = 10000;

const client = axios.create({
    baseURL: BASE_URL,
    timeout: TIMEOUT,
    headers: { 'Content-Type': 'application/json' }
});

// Colors for output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

function printSuccess(msg) { console.log(`${GREEN}✓ ${msg}${RESET}`); }
function printError(msg) { console.log(`${RED}✗ ${msg}${RESET}`); }
function printInfo(msg) { console.log(`${BLUE}ℹ ${msg}${RESET}`); }

async function runTests() {
    console.log('Starting Frontend Integration Tests...\n');
    let passed = 0;
    let failed = 0;

    // 1. Test Connectivity (Health/Root)
    try {
        printInfo('Testing Backend Connectivity...');
        // The root endpoint is at http://localhost:5000/, not /api/
        const rootRes = await axios.get('http://localhost:5000/');
        if (rootRes.status === 200) {
            printSuccess(`Backend is reachable: ${rootRes.data.name} v${rootRes.data.version}`);
            passed++;
        } else {
            throw new Error(`Status ${rootRes.status}`);
        }
    } catch (error) {
        printError(`Backend connectivity failed: ${error.message}`);
        failed++;
        console.log('  Make sure the backend server is running on port 5000');
        process.exit(1); // Cannot proceed
    }

    // 2. Test Users Endpoint
    try {
        printInfo('\nTesting Users Endpoint...');
        const res = await client.get('/users/');
        if (res.status === 200) {
            printSuccess(`Successfully retrieved users. Count: ${res.data.count}`);
            if (res.data.users && res.data.users.length > 0) {
                console.log(`  First user: ${res.data.users[0].username}`);
            }
            passed++;
        }
    } catch (error) {
        printError(`Users endpoint failed: ${error.message}`);
        failed++;
    }

    // 3. Test Cameras Endpoint
    try {
        printInfo('\nTesting Cameras Endpoint...');
        const res = await client.get('/cameras/');
        if (res.status === 200) {
            printSuccess(`Successfully retrieved cameras. Count: ${res.data.count}`);
            passed++;
        }
    } catch (error) {
        printError(`Cameras endpoint failed: ${error.message}`);
        failed++;
    }

    // 4. Test Sessions Endpoint
    try {
        printInfo('\nTesting Sessions Endpoint...');
        const res = await client.get('/sessions/');
        if (res.status === 200) {
            printSuccess(`Successfully retrieved sessions. Count: ${res.data.count}`);
            passed++;
        }
    } catch (error) {
        printError(`Sessions endpoint failed: ${error.message}`);
        failed++;
    }

    // Summary
    console.log('\n' + '='.repeat(30));
    console.log(`Tests Completed`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log('='.repeat(30));

    if (failed > 0) process.exit(1);
}

runTests();
