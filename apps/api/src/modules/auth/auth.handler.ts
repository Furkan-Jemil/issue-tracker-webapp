import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@workspace/database';
import { auth } from '../../common/auth/better-auth';

/**
 * VERBATIM port of `authHandler` from apps/web/server/routes/auth.ts.
 *
 * The only change is the input type: the Hono handler took a Hono `Context`; this
 * takes a Web `Request` directly (the Express controller builds it via the
 * express-web-bridge). Every `c.req.*` call is mapped to its `Request` equivalent
 * (`c.req.url`→`req.url`, `c.req.header(x)`→`req.headers.get(x)`,
 * `c.req.json()`→`req.json()`, `c.req.raw`→`req`). All logic — dual bcrypt/scrypt
 * verification, session-cookie format, Better Auth fallback + prefix-strip retry —
 * is unchanged, so responses are byte-for-byte identical.
 */
export async function authHandler(req: Request): Promise<Response> {
  try {
    const url = req.url;
    const method = req.method;
    const parsed = new URL(url);
    const normalizedPath = parsed.pathname
      .replace('/api/auth/signin', '/api/auth/sign-in')
      .replace('/api/auth/signup', '/api/auth/sign-up')
      .replace('/api/auth/signout', '/api/auth/sign-out')
      .replace('/api/auth/session', '/api/auth/get-session');

    // POST /api/auth/sign-in/email -> deterministic sign-in (Prisma + bcrypt/scrypt)
    if (method === 'POST' && normalizedPath === '/api/auth/sign-in/email') {
      let body: any = {};
      const contentType = req.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        body = await req.json();
      } else {
        const formData = await req.formData();
        body = Object.fromEntries(formData);
      }

      const email = typeof body.email === 'string' ? body.email.trim() : '';
      const password = typeof body.password === 'string' ? body.password : '';
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'email and password required' }),
          { status: 400, headers: { 'content-type': 'application/json' } },
        );
      }

      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true, role: true, password: true },
      });

      let storedPassword: string | null = user?.password ?? null;
      if (!storedPassword && user?.id) {
        const acct = await prisma.account.findFirst({
          where: { userId: user.id, providerId: { in: ['credential', 'email'] } },
          select: { password: true },
        });
        storedPassword = acct?.password ?? null;
      }

      // Verify the password using the SAME scheme it was hashed with.
      let passwordOk = false;
      if (storedPassword) {
        if (storedPassword.startsWith('$2')) {
          passwordOk = await bcrypt.compare(password, storedPassword);
        } else {
          try {
            const ctx = await (auth as any).$context;
            passwordOk = await ctx.password.verify({ password, hash: storedPassword });
          } catch (err) {
            console.warn('scrypt password verify failed:', err);
            passwordOk = false;
          }
        }
      }

      if (!passwordOk) {
        return new Response(
          JSON.stringify({ error: 'Invalid email or password' }),
          { status: 401, headers: { 'content-type': 'application/json' } },
        );
      }

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Invalid email or password' }),
          { status: 401, headers: { 'content-type': 'application/json' } },
        );
      }

      const sessionToken = randomUUID().replace(/-/g, '');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await prisma.session.create({
        data: { userId: user.id, token: sessionToken, expiresAt },
      });

      const cookieParts = [
        `better-auth.session_token=${sessionToken}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
      ];
      if (process.env.NODE_ENV === 'production') {
        cookieParts.push('Secure');
      }

      return new Response(
        JSON.stringify({
          redirect: false,
          token: sessionToken,
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'set-cookie': cookieParts.join('; '),
          },
        },
      );
    }

    // POST /api/auth/sign-up/email -> use Better Auth API to register a user
    if (method === 'POST' && normalizedPath === '/api/auth/sign-up/email') {
      const contentType = req.headers.get('content-type') || '';
      let body: any = {};
      if (contentType.includes('application/json')) body = await req.json();
      else {
        const fd = await req.formData();
        body = Object.fromEntries(fd);
      }

      const res = await (auth as any).api.signUpEmail({ body });
      if (res && typeof res === 'object' && 'status' in res && 'body' in res) {
        const headers = res.headers || { 'content-type': 'application/json' };
        const bodyStr = typeof res.body === 'string' ? res.body : JSON.stringify(res.body);
        return new Response(bodyStr, { status: res.status, headers });
      }
      return new Response(JSON.stringify(res), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    // GET /api/auth/get-session
    if (method === 'GET' && normalizedPath === '/api/auth/get-session') {
      const cookieHeader = req.headers.get('cookie') || '';
      const cookies = cookieHeader.split(';').map((s) => s.trim());
      const tokenCookie = cookies.find((v) =>
        v.startsWith('better-auth.session_token='),
      );
      let token = tokenCookie ? tokenCookie.split('=')[1] : null;

      if (!token) {
        const authHeader =
          req.headers.get('authorization') || req.headers.get('Authorization') || '';
        if (authHeader.startsWith('Bearer ')) token = authHeader.slice(7);
      }

      if (!token)
        return new Response(JSON.stringify(null), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });

      const session = await prisma.session.findUnique({
        where: { token },
        select: { userId: true, expiresAt: true },
      });
      if (!session)
        return new Response(JSON.stringify(null), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      if (session.expiresAt.getTime() < Date.now())
        return new Response(JSON.stringify(null), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });

      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, email: true, name: true, role: true },
      });
      if (!user)
        return new Response(JSON.stringify(null), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });

      return new Response(JSON.stringify({ user }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    if (method === 'POST' && normalizedPath === '/api/auth/sign-out') {
      const cookieHeader = req.headers.get('cookie') || '';
      const cookies = cookieHeader.split(';').map((s) => s.trim());
      const tokenCookie = cookies.find((v) =>
        v.startsWith('better-auth.session_token='),
      );

      const tokensToDelete: string[] = [];
      if (tokenCookie) tokensToDelete.push(tokenCookie.split('=')[1]);
      const authHeader =
        req.headers.get('authorization') || req.headers.get('Authorization') || '';
      if (authHeader.startsWith('Bearer ')) tokensToDelete.push(authHeader.slice(7));

      if (tokensToDelete.length > 0) {
        await prisma.session.deleteMany({ where: { token: { in: tokensToDelete } } });
      }

      const expiresCookie = [
        'better-auth.session_token=',
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
        'Max-Age=0',
      ];
      if (process.env.NODE_ENV === 'production') {
        expiresCookie.push('Secure');
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'set-cookie': expiresCookie.join('; '),
        },
      });
    }

    const handler = 'handler' in auth ? (auth as any).handler : (auth as any);

    console.log('authHandler incoming', method, url);
    const rawReq = req;
    const forwardedHeaders = new Headers();
    try {
      for (const [k, v] of (rawReq.headers as any).entries()) {
        forwardedHeaders.set(k, v as any);
      }
    } catch (e) {
      /* ignore */
    }
    const hasBody = method !== 'GET' && method !== 'HEAD';
    const bodyText = hasBody ? await rawReq.text() : undefined;
    console.log('authHandler forwarding cookie:', forwardedHeaders.get('cookie'));
    const originalFetchReq = new Request(url, {
      method,
      headers: forwardedHeaders,
      body: bodyText,
    });
    console.log('authHandler forwarding original URL', url);
    let res = await handler(originalFetchReq as any);

    // If original returned 404, retry with stripped prefix.
    if (res && typeof res === 'object' && 'status' in res && res.status === 404) {
      const prefix = '/api/auth';
      let path = parsed.pathname;
      if (path.startsWith(prefix)) {
        path = path.slice(prefix.length) || '/';
      }
      const forwardedUrl = `${parsed.protocol}//${parsed.host}${path}${parsed.search}`;
      console.log('authHandler retrying with stripped prefix ->', forwardedUrl);
      const forwardedHeaders2 = forwardedHeaders;
      const fetchReq2 = new Request(forwardedUrl, {
        method,
        headers: forwardedHeaders2,
        body: bodyText,
      });
      console.log(
        'authHandler forwarding stripped URL with cookie:',
        forwardedHeaders2.get('cookie'),
      );
      res = await handler(fetchReq2 as any);
    }
    console.log('authHandler got response', res && res.status);

    if (res instanceof Response) {
      return res;
    }

    if (res && typeof res === 'object' && 'status' in res && 'body' in res) {
      const headers = res.headers || { 'content-type': 'application/json' };
      const bodyStr = typeof res.body === 'string' ? res.body : JSON.stringify(res.body);
      return new Response(bodyStr, { status: res.status, headers });
    }

    return new Response(String(res));
  } catch (err: any) {
    console.error('authHandler error:', err?.message ?? err, err?.stack ?? '');
    const body = { error: String(err?.message ?? err) };
    return new Response(JSON.stringify(body), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
