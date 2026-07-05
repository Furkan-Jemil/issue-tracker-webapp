// Vercel serverless entrypoint for the Hono API.
// Root Directory is the repo root, so this file lives at <root>/api/.
//
// The Hono app is loaded LAZILY inside the handler (not at module top-level) so
// that any initialization failure — a bad DATABASE_URL, a missing env var, a
// bundling problem — is caught and returned as readable JSON instead of Vercel's
// opaque FUNCTION_INVOCATION_FAILED. Once the deployment is confirmed healthy,
// this can be simplified back to `export default handle(app)`.
export const config = {
  runtime: 'nodejs',
}

type FetchHandler = (req: Request) => Response | Promise<Response>

let handlerPromise: Promise<FetchHandler> | null = null

function loadHandler(): Promise<FetchHandler> {
  if (!handlerPromise) {
    handlerPromise = (async () => {
      const { handle } = await import('hono/vercel')
      const { default: app } = await import('../apps/web/server/app')
      return handle(app) as FetchHandler
    })()
  }
  return handlerPromise
}

export default async function handler(req: Request): Promise<Response> {
  try {
    const h = await loadHandler()
    return await h(req)
  } catch (err: unknown) {
    // Reset so the next request retries initialization.
    handlerPromise = null
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error && err.stack ? err.stack.split('\n').slice(0, 10) : []
    return new Response(
      JSON.stringify({ error: 'init_failed', message, stack }, null, 2),
      { status: 500, headers: { 'content-type': 'application/json' } },
    )
  }
}
