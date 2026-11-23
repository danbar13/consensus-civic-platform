import app from '../server/index.js';
import http from 'http';

const server = http.createServer(app);
server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = 'http://localhost:' + port;
  console.log('Test server running on', baseUrl);

  try {
    // 1. GET topics
    const r1 = await fetch(baseUrl + '/api/topics');
    console.log('1. GET /api/topics status:', r1.status);
    if (r1.status !== 200) throw new Error('r1 failed');

    // 2. Unauthenticated admin call
    const r2 = await fetch(baseUrl + '/api/admin/ai-stats');
    console.log('2. GET /api/admin/ai-stats (no auth) status:', r2.status);
    if (r2.status !== 401) throw new Error('r2 should be 401');

    // 3. Failed admin login
    const r3 = await fetch(baseUrl + '/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong-password' })
    });
    console.log('3. POST /api/admin/verify (wrong pass) status:', r3.status);
    if (r3.status !== 401) throw new Error('r3 should be 401');

    // 4. Successful admin login
    const r4 = await fetch(baseUrl + '/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'eilat-admin-2025' })
    });
    const d4 = await r4.json();
    console.log('4. POST /api/admin/verify (correct pass) status:', r4.status, 'got token:', Boolean(d4.token));
    if (r4.status !== 200 || !d4.token) throw new Error('r4 failed');

    // 5. Authenticated admin call
    const r5 = await fetch(baseUrl + '/api/admin/ai-stats', {
      headers: { 'Authorization': 'Bearer ' + d4.token }
    });
    const d5 = await r5.json();
    console.log('5. GET /api/admin/ai-stats (with Bearer token) status:', r5.status, 'totalCalls:', d5.totalCalls);
    if (r5.status !== 200) throw new Error('r5 failed');

    console.log('>>> ALL API SECURITY & LOGGING TESTS PASSED! <<<');
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  } finally {
    server.close(() => process.exit(0));
  }
});
