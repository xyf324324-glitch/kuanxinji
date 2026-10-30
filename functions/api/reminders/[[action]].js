export async function onRequest({ request, env }) {
  const headers = { 'Cache-Control': 'no-store' }
  if (!env.REMINDER_SERVICE) return Response.json({ ok: true, enabled: false }, { headers })
  const url = new URL(request.url)
  // Same-origin JSON requests only; service binding has no public URL.
  if (request.method !== 'GET' && (request.headers.get('origin') !== url.origin || !request.headers.get('content-type')?.includes('application/json'))) {
    return Response.json({ ok: false }, { status: 403, headers })
  }
  return env.REMINDER_SERVICE.fetch(request)
}
