import { Context } from 'hono'

export async function loggingMiddleware(c: Context, next: () => Promise<void>) {
  const start = Date.now()
  console.log(`${c.req.method} ${c.req.url}`)
  await next()
  const ms = Date.now() - start
  console.log(`${c.req.method} ${c.req.url} -> ${c.res.status} ${ms}ms`)
}
