// PLACEHOLDER — overwritten at build time.
//
// A single Vercel serverless function. The `rewrites` rule in vercel.json
// funnels every `/api/*` request (at any path depth) here while preserving the
// original URL, so the bundled Hono app routes on the full path (e.g.
// `/api/auth/sign-in/email`). This is the standard "Node server on Vercel"
// pattern and avoids the zero-config catch-all's single-segment limitation.
//
// The real handler is produced by the `buildCommand` in vercel.json, which
// esbuild-bundles `vercel-entry.ts` into this exact file.
//
// If you are seeing this response in production, the build step did not run.
module.exports = (req, res) => {
  res.statusCode = 500
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify({ error: 'build_step_did_not_run' }))
}
