import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const root = new URL('../', import.meta.url)
const rows = JSON.parse(await readFile(new URL('design/zen/assets/music-analysis/public-manifest.json', root), 'utf8'))
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
for (const row of rows) {
  if (!/^design\/zen\/assets\/music-analysis\/track-0[1-6]\.bin$/.test(row.path)) throw new Error('Invalid analysis asset path')
  const target = new URL(row.path, root)
  const matches = data => data.length === row.bytes && digest(data) === row.sha256
  try { if (matches(await readFile(target))) continue } catch { /* Restore from its already-public source. */ }
  const path = new URL(row.publicUrl).pathname
  let restored = false
  for (const origin of ['https://eef5edbc.kuanxinji.pages.dev', 'https://kuanxinji.pages.dev']) {
    try {
      const response = await fetch(origin + path, { signal: AbortSignal.timeout(20000) })
      if (!response.ok) throw new Error('Asset unavailable')
      const bytes = new Uint8Array(await response.arrayBuffer())
      if (!matches(bytes)) throw new Error('Public asset integrity mismatch')
      await mkdir(new URL('./', target), { recursive: true })
      await writeFile(target, bytes)
      restored = true
      break
    } catch { /* Retry only the other pinned, public source; never accept different bytes. */ }
  }
  if (!restored) throw new Error(`Unable to restore verified public asset: ${row.path}`)
}
