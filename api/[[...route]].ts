// Vercel serverless entrypoint for the Hono API (Root Directory = repo root).
//
// Written to be robust to BOTH Vercel calling conventions (Web `Request` and
// Node `(req, res)`) and to never throw before its own try/catch, so that any
// initialization failure (bad DATABASE_URL, bundling, Prisma engine, ...) is
// returned as readable JSON instead of an opaque FUNCTION_INVOCATION_FAILED.
export const config = {
  runtime: 'nodejs',
}

export default async function handler(req: any, res?: any): Promise<Response | void> {
  try {
    const { handle } = await import('hono/vercel')
    const { default: app } = await import('../apps/web/server/app')
    // hono/vercel's handle is (req) => app.fetch(req); passing res too is harmless.
    return await (handle(app) as any)(req, res)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error && err.stack ? err.stack.split('\n').slice(0, 15) : []
    const payload = JSON.stringify({ error: 'init_failed', message, stack }, null, 2)

    // Node-style response object present -> write to it.
    if (res && typeof res.end === 'function') {
      res.statusCode = 500
      if (typeof res.setHeader === 'function') res.setHeader('content-type', 'application/json')
      res.end(payload)
      return
    }
    // Otherwise assume Web handler.
    return new Response(payload, { status: 500, headers: { 'content-type': 'application/json' } })
  }
}
