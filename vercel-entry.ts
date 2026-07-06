// esbuild entry for the Vercel serverless function (bundled to api/[...route].js).
//
// Vercel's Node.js runtime invokes the default export with the classic Node
// signature `(req: IncomingMessage, res: ServerResponse)`, NOT the Web
// `(Request) => Response` signature. `@hono/node-server`'s `getRequestListener`
// produces exactly that Node listener from a Hono `fetch` handler — the same
// adapter the local server (server/index.ts) uses under the hood.
import { getRequestListener } from '@hono/node-server'
import app from './apps/web/server/app'

export default getRequestListener(app.fetch)
