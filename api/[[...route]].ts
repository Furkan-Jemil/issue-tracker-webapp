// Vercel serverless entrypoint for the Hono API (Root Directory = repo root).
//
// Diagnostics while stabilizing the deploy:
//   GET /api/ping   -> proves the function RUNTIME works (touches nothing).
//   anything else   -> lazily loads the Hono app; any init failure (bad
//                      DATABASE_URL, bundling, Prisma engine, ...) is caught
//                      and returned as JSON instead of FUNCTION_INVOCATION_FAILED.
export const config = {
  runtime: 'nodejs',
}

type FetchHandler = (req: Request) => Response | Promise<Response>

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)

  // Runtime smoke test — no imports, no app, no DB.
  if (url.pathname === '/api/ping') {
    return json({ pong: true, node: process.version, hasDbUrl: Boolean(process.env.DATABASE_URL) })
  }

  try {
    const { handle } = await import('hono/vercel')
    const { default: app } = await import('../apps/web/server/app')
    const h = handle(app) as FetchHandler
    return await h(req)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error && err.stack ? err.stack.split('\n').slice(0, 12) : []
    return json({ error: 'init_failed', message, stack }, 500)
  }
}
