// Vercel serverless entrypoint for the Hono API
// Uses CommonJS (no type annotations) so Node can run it directly.
// Dynamically imports the Hono app to surface init errors as JSON.

module.exports = async function handler(req, res) {
  try {
    const { handle } = require('hono/vercel');
    const { default: app } = require('../apps/web/server/app');
    return await handle(app)(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error && err.stack ? err.stack.split('\n').slice(0, 15) : [];
    const payload = JSON.stringify({ error: 'init_failed', message, stack }, null, 2);

    if (res && typeof res.end === 'function') {
      res.statusCode = 500;
      if (typeof res.setHeader === 'function') res.setHeader('content-type', 'application/json');
      res.end(payload);
      return;
    }
    return new Response(payload, { status: 500, headers: { 'content-type': 'application/json' } });
  }
};
