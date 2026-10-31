/**
 * Test Suite for Bazzar AI Chatbot API
 */

import { POST } from '../src/app/api/chat/route';

async function testChatApi() {
  console.log('================================================================');
  console.log('            BAZZAR AI CHATBOT API VERIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(desc: string, condition: boolean, extra?: any) {
    if (condition) {
      console.log(`  [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${desc}`, extra !== undefined ? extra : '');
      failed++;
    }
  }

  const queries = [
    { label: 'Greeting', input: 'Hello Bazzar AI' },
    { label: 'Find Products', input: 'Find Products' },
    { label: 'Bulk Order Enquiry', input: 'Bulk Order Enquiry' },
    { label: 'Get a Quotation', input: 'Get a Quotation' },
    { label: 'Contact Support', input: 'Contact Support' },
    { label: 'Product Search (JK Copier)', input: 'JK Copier paper' },
    { label: 'Product Search (Taski)', input: 'Taski cleaning chemicals' },
  ];

  for (const q of queries) {
    console.log(`\nTesting Query: "${q.input}" (${q.label})`);
    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: q.input }),
    });

    const res = await POST(req);
    assert(`Response status is 200 for "${q.input}"`, res.status === 200);

    const data = await res.json();
    assert(`Response contains reply text for "${q.input}"`, Boolean(data.reply && data.reply.length > 20));
    assert(`Response contains suggestedActions for "${q.input}"`, Array.isArray(data.suggestedActions) && data.suggestedActions.length > 0);

    if (q.label.startsWith('Product Search')) {
      assert(`Product search returns productCards for "${q.input}"`, Array.isArray(data.productCards) && data.productCards.length > 0);
      console.log(`  -> Found ${data.productCards?.length} product cards. Top: ${data.productCards?.[0]?.name}`);
    } else {
      console.log(`  -> Reply: ${data.reply.slice(0, 80).replace(/\n/g, ' ')}...`);
    }
  }

  console.log('\n================================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

testChatApi().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
