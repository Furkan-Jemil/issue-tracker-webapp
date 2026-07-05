// Vercel serverless entrypoint for the Hono API (Root Directory = repo root).
// Standard single-bracket catch-all so bare Vercel (framework: null) routes all
// /api/* requests here. No `config` export (Node is the default runtime).
//
// Robust to BOTH Vercel calling conventions (Web `Request` and Node `(req,res)`)
// and never throws before its own try/catch, so any init failure (bad
// DATABASE_URL, bundling, Prisma engine, ...) comes back as readable JSON.
export default async function handler(req, res) {
  try {
    const { handle } = await import('hono/vercel')
    const { default: app } = await import('../apps/web/server/app.mjs')
    return await handle(app)(req, res)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error && err.stack ? err.stack.split('\n').slice(0, 15) : []
    const payload = JSON.stringify({ error: 'init_failed', message, stack }, null, 2)

    if (res && typeof res.end === 'function') {
      res.statusCode = 500
      if (typeof res.setHeader === 'function') res.setHeader('content-type', 'application/json')
      res.end(payload)
      return
    }
    return new Response(payload, { status: 500, headers: { 'content-type': 'application/json' } })
  }
}
