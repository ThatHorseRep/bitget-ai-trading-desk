const { test } = require('node:test');
const assert = require('node:assert');
const { BitgetUsEquityMcpProvider } = require('../dist-core/src/adapters/research/bitgetUsEquityMcpProvider.js');

test('BitgetUsEquityMcpProvider graceful degradation on unreachable endpoint', async () => {
  const provider = new BitgetUsEquityMcpProvider();
  
  const status = await provider.getStatus();
  assert.strictEqual(status, 'UNAVAILABLE');

  const observations = await provider.getObservations('AAPL');
  assert.deepStrictEqual(observations, []);
});
