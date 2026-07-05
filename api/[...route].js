// Vercel serverless entrypoint for the Hono API
// Uses tsx to run TypeScript directly, avoiding transpilation issues.

const { createServer } = require('node:http');
const { once } = require('node:events');

// Lazy-load tsx and the app to surface init errors as JSON
let handlerPromise = null;

async function loadHandler() {
  if (!handlerPromise) {
    handlerPromise = (async () => {
      const { handle } = require('hono/vercel');
      const { default: app } = await import('../apps/web/server/app.ts');
      return handle(app);
    })();
  }
  return handlerPromise;
}

module.exports = async function handler(req, res) {
  try {
    const h = await loadHandler();
    return await h(req, res);
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
